from dataclasses import dataclass
import random
from typing import Dict, List, Any, Optional
from pathlib import Path

from rapidfuzz import fuzz

from simulation.utils.io_utils import read_yaml
from simulation.common.paths import get_config_path
from .base import TriageSystem


@dataclass(frozen=True)
class PriorityInfo:
    name: str
    color: str
    max_wait_min: int
    weight: float


class ManchesterTriageSystem(TriageSystem):
    """Manchester Triage System priority levels and wait times, configured via YAML.

    Config file: config/mts_config.yaml
    """

    # These will be populated from YAML at import time
    PRIORITIES: Dict[int, PriorityInfo] = {}
    ENCOUNTER_PRIORITY_MAP: Dict[str, List[int]] = {}
    DEFAULT_PRIORITY: int = 4
    KEYWORD_RULES: Dict[str, Dict] = {}

    @classmethod
    def _load_config(cls) -> None:
        # Load ONLY from centralized config
        cfg_path = get_config_path("mts_config.yaml")
        if not cfg_path.exists():
            raise FileNotFoundError(f"Expected config at '{cfg_path}' but it was not found.")
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
        """Return a priority if reason matches configured keyword rules, else None.
        Evaluates levels in order 'high' then 'medium' using RapidFuzz partial_ratio.
        """
        if not reason:
            return None
        text = reason.lower()
        for level in ("high", "medium"):
            rule = cls.KEYWORD_RULES.get(level)
            if not rule:
                continue
            terms: List[str] = [t.lower() for t in rule.get("terms", [])]
            threshold: int = int(rule.get("threshold", 90))
            assign: List[int] = [int(p) for p in rule.get("assign", [])]
            for term in terms:
                if fuzz.partial_ratio(term, text) >= threshold:
                    return random.choice(assign) if assign else None
        return None

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
            # Choose priority using provided weights
            return random.choices(priorities, weights=weights)[0]

        # 3) Default
        return self.DEFAULT_PRIORITY
        
    def get_priority_info(self, priority: int) -> Dict[str, Any]:
        """Delegate to base class implementation backed by shared config."""
        return super().get_priority_info(priority)

    def estimate_service_min(self, encounter_data: Dict[str, Any], priority: int) -> Optional[float]:
        """Return a standard service time in minutes for a given priority.

        Simple deterministic defaults (can be externalized later):
          P1:90, P2:60, P3:40, P4:20, P5:10
        """
        std_map = {
            1: 90.0,   # P1: resus-level, multi-team, imaging, procedures
            2: 60.0,   # P2: urgent diagnostics, possible admission
            3: 40.0,   # P3: fractures, moderate illness
            4: 20.0,   # P4: minor but needs assessment
            5: 10.0    # P5: admin / trivial complaints
        }
        return std_map.get(int(priority))
