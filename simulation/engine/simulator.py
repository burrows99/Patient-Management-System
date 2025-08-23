from typing import Dict, List
import simpy

from simulation.domain.manchester import ManchesterTriageSystem


class CompressedMTSSimulation:
    """MTS simulation with time compression for sparse data.
    Logs per-patient events; leaves aggregation to caller (pandas).
    """

    def __init__(self, servers: int = 1):
        self.env = simpy.Environment()
        self.facility = simpy.PriorityResource(self.env, capacity=servers)
        self.servers = servers
        self.completed = 0
        self.events: List[Dict] = []

    def patient_process(self, patient_id: str, arrival_time: float, priority: int, service_time: float):
        """Patient process with priority-based treatment"""
        yield self.env.timeout(arrival_time)

        arrival_timestamp = self.env.now
        max_wait = ManchesterTriageSystem.PRIORITIES[priority].max_wait_min

        with self.facility.request(priority=priority) as request:
            yield request

            service_start = self.env.now
            wait_time = service_start - arrival_timestamp

            yield self.env.timeout(service_time)

            # Log the completed patient event for downstream aggregation
            self.events.append(
                {
                    "patient_id": patient_id,
                    "priority": priority,
                    "arrival_min": arrival_time,
                    "wait_min": wait_time,
                    "service_min": service_time,
                    "max_wait_min": max_wait,
                }
            )
            self.completed += 1

    def run_simulation(self, encounters: List[Dict], horizon: float):
        """Run the compressed simulation"""
        for encounter in encounters:
            self.env.process(
                self.patient_process(
                    encounter["patient_id"],
                    encounter["arrival_min"],
                    encounter["priority"],
                    encounter["service_min"],
                )
            )

        self.env.run(until=horizon)

        return {"completed": self.completed, "events": self.events}
