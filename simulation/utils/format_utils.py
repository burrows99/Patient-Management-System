from __future__ import annotations
from typing import Any, Dict
import pandas as pd
import json


def print_section(title: str) -> None:
    line = "=" * 60
    print(f"\n{line}")
    print(title)
    print(line)


def print_kv(key: str, value: Any) -> None:
    print(f"{key}: {value}")


def series_to_dict(series: pd.Series) -> Dict[Any, Any]:
    """Safely convert a pandas Series (possibly with PeriodIndex) to a JSON-serializable dict."""
    if series is None:
        return {}
    # Convert Period objects and other non-JSON types to string
    out: Dict[Any, Any] = {}
    for k, v in series.items():
        key = str(k)
        try:
            # Convert numpy/pandas scalars to Python scalars
            if hasattr(v, 'item'):
                v = v.item()
        except Exception:
            pass
        out[key] = v
    return out


class NpEncoder(json.JSONEncoder):
    """JSON encoder that converts numpy types to native Python types."""
    def default(self, obj):
        import numpy as _np
        if isinstance(obj, _np.integer):
            return int(obj)
        if isinstance(obj, _np.floating):
            return float(obj)
        if isinstance(obj, _np.bool_):
            return bool(obj)
        if isinstance(obj, _np.ndarray):
            return obj.tolist()
        return super().default(obj)


def print_sim_commands():
    print(f"\n🚀 READY-TO-USE SIMULATION COMMANDS:")
    print(f"   # Standard simulation")
    print(f"   python simulation/simulation.py --servers=3 --compressTo=8hours --limit=100")
    print(f"   # Emergency-only simulation")
    print(f"   python simulation/simulation.py --servers=2 --class=emergency --compressTo=4hours")
    print(f"   # High-capacity stress test")
    print(f"   python simulation/simulation.py --servers=6 --limit=200 --compressTo=12hours")
