from __future__ import annotations
import sys
from typing import Dict, List


def parse_duration_to_hours(spec: str, default_hours: int = 8) -> int:
    """Parse duration strings like '8hours', '12h', '2days', '1d' into hours.
    Falls back to default_hours if parsing fails.
    """
    if not spec:
        return default_hours
    s = spec.strip().lower()
    # Extract leading integer
    num_str = "".join(ch for ch in s if ch.isdigit())
    if not num_str:
        return default_hours
    value = int(num_str)
    if "day" in s or s.endswith("d"):
        return value * 24
    # default treat as hours if contains 'hour' or 'h' or unqualified
    return value


def minutes_to_hours(mins: float) -> float:
    return mins / 60.0


def hours_to_minutes(hours: float) -> float:
    return hours * 60.0


def seconds_to_minutes(seconds: float) -> float:
    return seconds / 60.0


def seconds_to_hours(seconds: float) -> float:
    return seconds / 3600.0


def humanize_minutes(mins: float) -> str:
    return f"{mins:.1f} minutes ({minutes_to_hours(mins):.1f} hours)"


def compute_horizon(encounters: List[Dict]) -> float:
    """Compute a safe simulation horizon based on encounters: last arrival + 2x max service.
    Returns minutes.
    """
    if not encounters:
        return 0.0
    last_arrival = encounters[-1]["arrival_min"]
    max_service = max(e["service_min"] for e in encounters)
    return float(last_arrival + 2 * max_service)


def compress_encounter_times(
    encounters: List[Dict], compression_hours: int = 8, debug: bool = False
) -> List[Dict]:
    """Compress encounter arrival times into a shorter period while maintaining relative timing.
    Mutates arrival_min in-place and returns the list. Uses minutes and hours helpers for debug.
    """
    if len(encounters) <= 1:
        return encounters

    original_span_min = encounters[-1]["arrival_min"] - encounters[0]["arrival_min"]
    target_span_min = compression_hours * 60

    if debug:
        print("Time compression:", file=sys.stderr)
        print(
            f"  Original span: {original_span_min:.1f} minutes ({original_span_min/60/24:.1f} days)",
            file=sys.stderr,
        )
        print(
            f"  Target span: {target_span_min} minutes ({compression_hours} hours)",
            file=sys.stderr,
        )

    if original_span_min <= target_span_min:
        if debug:
            print("  No compression needed", file=sys.stderr)
        return encounters

    compression_factor = target_span_min / original_span_min

    for encounter in encounters:
        original_arrival = encounter["arrival_min"]
        encounter["arrival_min"] = original_arrival * compression_factor

    if debug:
        print(f"  Compression factor: {compression_factor:.4f}", file=sys.stderr)
        print(f"  New span: {encounters[-1]['arrival_min']:.1f} minutes", file=sys.stderr)

    return encounters
