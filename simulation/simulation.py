"""
Manchester Triage System simulation orchestrator.

Design notes (SOLID):
- SRP: This module orchestrates the simulation run only. Aggregation/report building lives in
  `simulation/utils/sim_reporting.py`. Data loading is delegated to `simulation/services/encounter_loader.py`.
- DIP: Dependencies like CSV path and loader function are injected via `run_simulation(...)` args.
- OCP: New triage systems can be introduced via `create_triage_system(...)` factory without changing core logic.
"""

import logging
import random
from pathlib import Path
from typing import List, Dict, Optional, Any, Tuple, Union, Callable

from simulation.services.encounter_loader import (
    load_and_prepare_encounters as svc_load_and_prepare_encounters,
)
from simulation.engine.simulator import TriageSimulation
from simulation.domain.triage_factory import create_triage_system, TriageSystemType
from simulation.utils.time_utils import (
    compute_horizon,
    humanize_minutes,
)
from simulation.utils.sim_reporting import build_simulation_report


def run_simulation(servers: int = 3,
                   encounter_class: Optional[str] = '',
                   limit: int = 100,
                   debug: bool = False,
                   triage_system: TriageSystemType = "mta",
                   ollama_model: Optional[str] = None,
                   disable_fallback: bool = True,
                   csv_path: Optional[Union[str, Path]] = None,
                   loader: Optional[Callable[[str, Optional[str], int, bool], List[Dict]]] = None,
                   seed: Optional[int] = 42,
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
        script_dir = Path(__file__).parent
        csv_path = script_dir.parent / 'output' / 'csv' / 'encounters.csv'
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
        simulation = TriageSimulation(servers=servers, triage_system=triage)
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
