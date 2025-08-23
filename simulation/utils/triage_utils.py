from __future__ import annotations
from typing import Dict, List, Optional
import random
from rapidfuzz import fuzz

from .io_utils import read_yaml


def load_mts_config(cfg_path: str) -> Dict:
    """Load MTS YAML configuration file."""
    return read_yaml(cfg_path)


def assign_by_keywords(reason: str, keyword_rules: Dict) -> Optional[int]:
    """Return a priority if reason matches configured keyword rules, else None.

    Evaluates levels in order 'high' then 'medium' if present.
    Uses RapidFuzz partial_ratio with configured threshold.
    """
    if not reason:
        return None
    text = reason.lower()

    for level in ("high", "medium"):
        rule = keyword_rules.get(level)
        if not rule:
            continue
        terms: List[str] = [t.lower() for t in rule.get("terms", [])]
        threshold: int = int(rule.get("threshold", 90))
        assign: List[int] = [int(p) for p in rule.get("assign", [])]
        for term in terms:
            if fuzz.partial_ratio(term, text) >= threshold:
                return random.choice(assign) if assign else None
    return None


def weighted_priority_choice(priorities: List[int], weights: List[float]) -> int:
    """Choose a priority using the provided weights."""
    return random.choices(priorities, weights=weights)[0]
