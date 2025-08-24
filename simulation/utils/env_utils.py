import os
from typing import Optional

def get_env_str(name: str, default: Optional[str] = None) -> Optional[str]:
    val = os.getenv(name)
    return val if (val is not None and str(val).strip() != "") else default


def get_env_int(name: str, default: Optional[int] = None) -> Optional[int]:
    val = get_env_str(name)
    if val is None:
        return default
    try:
        return int(val)
    except Exception:
        return default


def get_env_float(name: str, default: Optional[float] = None) -> Optional[float]:
    val = get_env_str(name)
    if val is None:
        return default
    try:
        return float(val)
    except Exception:
        return default


def get_env_bool(name: str, default: bool = False) -> bool:
    val = get_env_str(name)
    if val is None:
        return default
    return str(val).strip().lower() in ("1", "true", "yes", "on")


def get_sim_defaults() -> dict:
    """Centralized defaults for simulation CLI sourced from environment.
    These are used as argparse defaults in simulate.py.
    """
    return {
        "servers": get_env_int("SIM_SERVERS", 3) or 3,
        "limit": get_env_int("SIM_LIMIT", 100) or 100,
        "encounter_class": get_env_str("SIM_CLASS", "") or "",
        "debug": get_env_bool("SIM_DEBUG", False),
        "poisson": get_env_bool("SIM_POISSON", False),
        "poisson_rate": get_env_float("SIM_RATE", None),
        "poisson_seed": get_env_int("SIM_SEED", None),
        "poisson_start": get_env_str("SIM_START_AT", None),
    }


def get_ollama_settings() -> dict:
    """Centralized Ollama settings from environment.
    Code can still fall back to config file values where appropriate.
    """
    return {
        "model": get_env_str("OLLAMA_MODEL", None),
        "host": get_env_str("OLLAMA_HOST", None),
        "telemetry_path": get_env_str("OLLAMA_TELEMETRY_PATH", None),
    }
