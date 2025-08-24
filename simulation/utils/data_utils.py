from __future__ import annotations
from pathlib import Path
from typing import Optional
import pandas as pd
import numpy as np
from .io_utils import read_csv_or_excel
from .time_utils import seconds_to_minutes


def load_encounters_df(output_dir: Path | str) -> pd.DataFrame:
    """Load encounters and add standard time/service features.

    Returns a DataFrame with parsed times and helper columns:
    - START_DT, STOP_DT, SERVICE_MIN (clipped to [1,480])
    - HOUR, DAY_OF_WEEK, MONTH, YEAR
    """
    df = read_csv_or_excel(output_dir, "encounters.csv", "Encounters")

    # Parse times if present
    if "START" in df.columns:
        df["START_DT"] = pd.to_datetime(df["START"], errors="coerce")
    if "STOP" in df.columns:
        df["STOP_DT"] = pd.to_datetime(df["STOP"], errors="coerce")

    # Service minutes (fallback to 15 if missing/invalid)
    if "START_DT" in df.columns and "STOP_DT" in df.columns:
        svc = seconds_to_minutes((df["STOP_DT"] - df["START_DT"]).dt.total_seconds())
        df["SERVICE_MIN"] = np.clip(svc.fillna(0), 1, 480)
    elif "SERVICE_MIN" not in df.columns:
        df["SERVICE_MIN"] = 15.0

    # Time features (safe defaults if START_DT missing)
    if "START_DT" in df.columns:
        df["HOUR"] = df["START_DT"].dt.hour
        df["DAY_OF_WEEK"] = df["START_DT"].dt.day_name()
        df["MONTH"] = df["START_DT"].dt.month
        df["YEAR"] = df["START_DT"].dt.year
    else:
        df["HOUR"] = 0
        df["DAY_OF_WEEK"] = "Monday"
        df["MONTH"] = 1
        df["YEAR"] = 1970

    return df


def load_entity_df(output_dir: Path | str, name: str, sheet: str) -> pd.DataFrame:
    """Generic entity loader using the CSV/Excel fallback."""
    return read_csv_or_excel(output_dir, f"{name}.csv", sheet)
