from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pathlib import Path
from simulation.utils.io_utils import read_yaml
from simulation.common.paths import get_config_path

class TriageSystem(ABC):
    """Abstract base class for triage systems."""
    
    # Cached MTS priority map loaded once per process
    _PRIORITY_MAP: Optional[Dict[int, Dict[str, Any]]] = None

    @classmethod
    def _load_priority_map(cls) -> Dict[int, Dict[str, Any]]:
        if cls._PRIORITY_MAP is not None:
            return cls._PRIORITY_MAP
        # Centralized config path
        cfg_path = get_config_path("mts_config.yaml")
        if not cfg_path.exists():
            raise FileNotFoundError(f"mts_config.yaml not found at {cfg_path}")
        cfg = read_yaml(cfg_path)
        priorities: Dict[int, Dict[str, Any]] = {}
        for k, v in (cfg.get("priorities", {}) or {}).items():
            priorities[int(k)] = {
                "name": v.get("name"),
                "color": v.get("color"),
                "max_wait_min": int(v.get("max_wait_min", 0)),
                "weight": float(v.get("weight", 0.0)),
            }
        cls._PRIORITY_MAP = priorities
        return priorities

    @abstractmethod
    def assign_priority(self, encounter_data: Dict[str, Any]) -> int:
        """
        Assign a priority level based on the encounter data.
        
        Args:
            encounter_data: Dictionary containing encounter information including
                         'encounter_class' and 'reason_description'
        
        Returns:
            int: Priority level (1-5, where 1 is most urgent)
        """
        pass
    
    def get_priority_info(self, priority: int) -> Dict[str, Any]:
        """Return priority metadata using shared MTS configuration.
        Subclasses typically do not need to override this unless they want
        different metadata semantics.
        """
        priorities = self._load_priority_map()
        if priority not in priorities:
            raise ValueError(f"Invalid priority level: {priority}")
        return priorities[priority]

    # Optional hook: estimate service minutes for an encounter at a given priority.
    # Return None to indicate no suggestion, so callers can fall back to defaults.
    def estimate_service_min(self, encounter_data: Dict[str, Any], priority: int) -> Optional[float]:
        return None
