from dataclasses import dataclass
import random
from typing import Dict, List, Any, Optional
from pathlib import Path

from simulation.utils.io_utils import read_yaml
from simulation.utils.triage_utils import assign_by_keywords, weighted_priority_choice
from .base_triage import TriageSystem


@dataclass(frozen=True)
class PriorityInfo:
    name: str
    color: str
    max_wait_min: int
    weight: float


class ManchesterTriageSystem(TriageSystem):
    """Manchester Triage System priority levels and wait times, configured via YAML.

    Config file: simulation/domain/mts_config.yaml
    """

    # These will be populated from YAML at import time
    PRIORITIES: Dict[int, PriorityInfo] = {}
    ENCOUNTER_PRIORITY_MAP: Dict[str, List[int]] = {}
    DEFAULT_PRIORITY: int = 4
    KEYWORD_RULES: Dict[str, Dict] = {}

    @classmethod
    def _load_config(cls) -> None:
        cfg_path = Path(__file__).with_name("mts_config.yaml")
        cfg = read_yaml(cfg_path)

        # Priorities
        priorities: Dict[int, PriorityInfo] = {}
        for k, v in cfg.get("priorities", {}).items():
            priorities[int(k)] = PriorityInfo(
                name=v["name"],
                color=v["color"],
                max_wait_min=int(v["max_wait_min"]),
                weight=float(v["weight"]),
            )
        cls.PRIORITIES = priorities

        # Encounter mapping
        cls.ENCOUNTER_PRIORITY_MAP = {
            str(k).lower(): [int(p) for p in v]
            for k, v in cfg.get("encounter_priority_map", {}).items()
        }

        # Defaults and keyword rules
        cls.DEFAULT_PRIORITY = int(cfg.get("default_priority", 4))
        cls.KEYWORD_RULES = cfg.get("keyword_rules", {})

    @classmethod
    def _apply_keyword_rules(cls, reason: str) -> Optional[int]:
        return assign_by_keywords(reason, cls.KEYWORD_RULES)

    def assign_priority(self, encounter_data: Dict[str, Any]) -> int:
        """Assign MTS priority based on encounter type and clinical reason.
        Uses YAML-configured rules and RapidFuzz matching.
        
        Args:
            encounter_data: Dictionary containing 'encounter_class' and 'reason_description'
        
        Returns:
            int: Priority level (1-5, where 1 is most urgent)
        """
        # Ensure config is loaded
        if not self.PRIORITIES:
            self._load_config()
            
        reason_description = encounter_data.get('reason_description', '')
        encounter_class = encounter_data.get('encounter_class', '')

        # 1) Keyword-based overrides
        priority = self._apply_keyword_rules(reason_description)
        if priority is not None:
            return priority

        # 2) Encounter-class-driven sampling with configured weights
        enc_class = (encounter_class or "").lower()
        if enc_class in self.ENCOUNTER_PRIORITY_MAP:
            priorities = self.ENCOUNTER_PRIORITY_MAP[enc_class]
            weights = [self.PRIORITIES[p].weight for p in priorities]
            return weighted_priority_choice(priorities, weights)

        # 3) Default
        return self.DEFAULT_PRIORITY
        
    def get_priority_info(self, priority: int) -> Dict[str, Any]:
        """Get information about a priority level.
        
        Args:
            priority: Priority level (1-5)
            
        Returns:
            Dict with priority information (name, color, max_wait_min, weight)
        """
        if not self.PRIORITIES:
            self._load_config()
            
        if priority not in self.PRIORITIES:
            raise ValueError(f"Invalid priority level: {priority}")
            
        info = self.PRIORITIES[priority]
        return {
            'name': info.name,
            'color': info.color,
            'max_wait_min': info.max_wait_min,
            'weight': info.weight
        }
