from typing import Dict, List, Optional
import simpy
import math

from simulation.domain.base_triage import TriageSystem
from simulation.domain.manchester import ManchesterTriageSystem


class TriageSimulation:
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
