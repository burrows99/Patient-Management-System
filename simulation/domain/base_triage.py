from abc import ABC, abstractmethod
from typing import Dict, Any
from pathlib import Path
from simulation.utils.io_utils import read_yaml

class TriageSystem(ABC):
    """Abstract base class for triage systems."""
    
    # Cached MTS priority map loaded once per process
    _PRIORITY_MAP: Dict[int, Dict[str, Any]] | None = None

    @classmethod
    def _load_priority_map(cls) -> Dict[int, Dict[str, Any]]:
        if cls._PRIORITY_MAP is not None:
            return cls._PRIORITY_MAP
        # Prefer root-level config folder, fallback to legacy local file
        project_root = Path(__file__).resolve().parents[2]
        cfg_candidates = [
            project_root / "config" / "mts_config.yaml",
            Path(__file__).with_name("mts_config.yaml"),
        ]
        for candidate in cfg_candidates:
            if candidate.exists():
                cfg = read_yaml(candidate)
                break
        else:
            raise FileNotFoundError(
                f"mts_config.yaml not found. Looked in: {', '.join(str(p) for p in cfg_candidates)}"
            )
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
    def estimate_service_min(self, encounter_data: Dict[str, Any], priority: int) -> float | None:
        return None
