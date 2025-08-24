"""
Manchester Triage System simulation orchestrator.

Design notes (SOLID):
- SRP: This module orchestrates the simulation run only. Aggregation/report building lives in
  `simulation/common/analytics.py`. Data loading is delegated to `simulation/models/encounter.py`.
- DIP: Dependencies like CSV path and loader function are injected via `run_simulation(...)` args.
- OCP: New triage systems can be introduced via `create_triage_system(...)` factory without changing core logic.
"""

import logging
import random
import math
from pathlib import Path
from typing import List, Dict, Optional, Any, Tuple, Union, Callable

import simpy

from simulation.models.encounter import (
    load_and_prepare_encounters as svc_load_and_prepare_encounters,
)
from simulation.factories.triage_factory import create_triage_system, TriageSystemType
from simulation.triage.base import TriageSystem
from simulation.triage.manchester import ManchesterTriageSystem
from simulation.utils.time_utils import (
    compute_horizon,
    humanize_minutes,
)
from simulation.common.analytics import build_simulation_report
from simulation.common.paths import get_project_root
from simulation.common.constants import (
    DEFAULT_SERVERS,
    DEFAULT_LIMIT,
    DEFAULT_SEED,
)


class TriageSimulator:
    """Priority-based triage simulation using SimPy.
    Logs per-patient events; leaves aggregation/reporting to callers.
    """

    def __init__(self, servers: int = 1, triage_system: Optional[TriageSystem] = None):
        self.env = simpy.Environment()
        self.facility = simpy.PriorityResource(self.env, capacity=servers)
        self.servers = servers
        self.completed = 0
        self.events: List[Dict] = []
        self.triage_system = triage_system or ManchesterTriageSystem()

    def patient_process(self, patient_id: str, arrival_time: float, priority: Optional[int], 
                       service_time: float, encounter_data: Optional[Dict] = None):
        """Patient process with priority-based treatment
        
        Args:
            patient_id: Unique identifier for the patient
            arrival_time: Time when patient arrives in the simulation
            priority: Pre-assigned priority (if None, will be determined by triage system)
            service_time: Time required to service the patient
            encounter_data: Additional data about the encounter for triage
        """
        yield self.env.timeout(arrival_time)

        arrival_timestamp = self.env.now
        
        # Always use the configured triage system to determine priority at runtime
        # to keep behavior identical across MTA and Ollama flows.
        if encounter_data is None:
            encounter_data = {}
        priority = self.triage_system.assign_priority(encounter_data)
            
        # Get priority info including max wait time
        priority_info = self.triage_system.get_priority_info(priority)
        max_wait = priority_info['max_wait_min']

        # Determine service time: prefer triage system estimate; if None, use encounter-provided
        service_est = self.triage_system.estimate_service_min(encounter_data, priority)
        final_service_time = float(service_est) if service_est is not None else float(service_time)

        with self.facility.request(priority=priority) as request:
            yield request

            service_start = self.env.now
            wait_time = service_start - arrival_timestamp

            yield self.env.timeout(final_service_time)

            # Log the completed patient event for downstream aggregation
            self.events.append(
                {
                    "patient_id": patient_id,
                    "priority": priority,
                    "arrival_min": arrival_time,
                    "wait_min": wait_time,
                    "service_min": final_service_time,
                    "max_wait_min": max_wait,
                }
            )
            self.completed += 1

    def run_simulation(self, encounters: List[Dict], horizon: float):
        """Run the triage simulation
        
        Args:
            encounters: List of encounter dictionaries. Each should contain at least:
                       - patient_id: str
                       - arrival_min: float
                       - service_min: float
                       - priority: Optional[int] (if None, will use triage system)
                       - Additional fields may be used by the triage system
            horizon: Simulation end time
            
        Returns:
            Dict containing simulation results including 'completed' count and 'events' list
        """
        for encounter in encounters:
            self.env.process(
                self.patient_process(
                    patient_id=encounter.get("patient_id", str(id(encounter))),
                    arrival_time=encounter["arrival_min"],
                    priority=encounter.get("priority"),
                    service_time=encounter["service_min"],
                    encounter_data=encounter
                )
            )

        # Compute a conservative horizon to ensure completion even with large service estimates
        try:
            last_arrival = max(float(e.get("arrival_min", 0.0) or 0.0) for e in encounters) if encounters else 0.0
            n = len(encounters)
            batches = math.ceil(n / max(self.servers, 1))
            # Cap service per patient at 480 min to build an upper bound; add 60 min slack
            conservative = last_arrival + batches * 480.0 + 60.0
            safe_horizon = max(float(horizon or 0.0), conservative)
        except Exception:
            safe_horizon = float(horizon or 0.0)

        self.env.run(until=safe_horizon)

        return {"completed": self.completed, "events": self.events}


def run_simulation(servers: int = DEFAULT_SERVERS,
                   encounter_class: Optional[str] = '',
                   limit: int = DEFAULT_LIMIT,
                   debug: bool = False,
                   triage_system: TriageSystemType = "mta",
                   ollama_model: Optional[str] = None,
                   disable_fallback: bool = True,
                   csv_path: Optional[Union[str, Path]] = None,
                   loader: Optional[Callable[[str, Optional[str], int, bool], List[Dict]]] = None,
                   seed: Optional[int] = DEFAULT_SEED,
                   *,
                   use_poisson: bool = False,
                   poisson_rate_per_min: Optional[float] = None,
                   poisson_seed: Optional[int] = None,
                   poisson_start_at: Optional[str] = None) -> Dict:
    """Run the time-compressed MTS simulation and return the report dict.

    Dependencies are injected via parameters (csv_path, loader) to improve testability and separation of concerns.
    """

    # Seed RNG deterministically unless caller overrides
    if seed is not None:
        random.seed(seed)

    # Resolve CSV path (injected or default)
    if csv_path is None:
        # Use project root so it aligns with docker volume mapping ./output -> /app/output
        project_root = get_project_root()
        csv_path = project_root / 'output' / 'csv' / 'encounters.csv'
    else:
        csv_path = Path(csv_path)

    try:
        load_fn = loader or svc_load_and_prepare_encounters
        encounters = load_fn(
            str(csv_path),
            encounter_class or '',
            limit,
            debug,
            use_poisson=use_poisson,
            poisson_rate_per_min=poisson_rate_per_min,
            poisson_seed=poisson_seed,
            poisson_start_at=poisson_start_at,
        )

        if not encounters:
            logging.warning("No encounters found.")
            return {}

        # If using Ollama triage, ensure priorities are not pre-assigned by MTA
        if triage_system == "ollama":
            for enc in encounters:
                if "priority" in enc:
                    del enc["priority"]

        # Set simulation horizon (conservative so queue can drain even with 1 server)
        # Previous approach (last arrival + 2x max service) could end before any completion
        # when service estimates are large. Use a safer upper bound here.
        try:
            last_arrival = max(e.get("arrival_min", 0.0) for e in encounters)
            max_service = max(float(e.get("service_min", 0.0) or 0.0) for e in encounters)
            sum_service = sum(float(e.get("service_min", 0.0) or 0.0) for e in encounters)
            horizon = float(last_arrival + sum_service + max_service)
        except Exception:
            horizon = compute_horizon(encounters)

        logging.debug("\nSimulation parameters:")
        logging.debug(f"  Encounters: {len(encounters)}")
        logging.debug(f"  Horizon: {humanize_minutes(horizon)}")
        logging.debug(f"  Servers: {servers}")

        # Initialize the appropriate triage system
        triage_kwargs = {}
        if triage_system == "ollama":
            if ollama_model:
                triage_kwargs["model_name"] = ollama_model
            # Always disable fallback for Ollama per requirement
            triage_kwargs["disable_fallback"] = True
            
        triage = create_triage_system(triage_system, **triage_kwargs)
        
        if debug:
            logging.info(f"Using {triage_system.upper()} triage system")
            if triage_system == "ollama":
                logging.info(f"Ollama model: {ollama_model}")
                logging.info(f"Ollama fallback disabled: True")
        
        # Run simulation with the selected triage system
        simulation = TriageSimulator(servers=servers, triage_system=triage)
        results = simulation.run_simulation(encounters, horizon)

        # Build final report via reporting utilities
        parameters = {
            'original_encounters': len(encounters),
            'servers': servers,
            'filter': encounter_class or 'all',
        }
        report = build_simulation_report(parameters, results, horizon)

        return report
    except Exception:
        logging.exception("Simulation error")
        return {}
