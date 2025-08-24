from __future__ import annotations

# Backwards-compat: re-export analytics functions from the new structured module
from simulation.analytics.core.patterns import (
    temporal_patterns,
    service_patterns,
    capacity_planning,
    priority_mapping,
    simulation_optimization,
    detect_bottlenecks,
)

__all__ = [
    "temporal_patterns",
    "service_patterns",
    "capacity_planning",
    "priority_mapping",
    "simulation_optimization",
    "detect_bottlenecks",
]
