from typing import Any, List

import pandas as pd

from simulation.utils.data_utils import (
    resolve_encounter_patient_column,
)


def get_distinct_patient_ids(df: pd.DataFrame) -> List[Any]:
    """Return distinct patient IDs present in the encounters dataframe.

    Uses `resolve_encounter_patient_column(df)` to locate the patient identifier
    column across possible schemas.
    """
    if df is None or df.empty:
        return []
    pid_col = resolve_encounter_patient_column(df)
    if not pid_col or pid_col not in df.columns:
        return []
    return (
        df[pid_col]
        .dropna()
        .drop_duplicates()
        .tolist()
    )


def latest_encounters_by_patient(df: pd.DataFrame) -> pd.DataFrame:
    """Select the most recent encounter per patient.

    Assumes the dataframe has a `START_DT` column (already standardized) and
    uses the resolved patient id column. If columns are missing, returns the
    input dataframe unchanged.
    """
    if df is None or df.empty:
        return df
    pid_col = resolve_encounter_patient_column(df)
    if not pid_col or pid_col not in df.columns:
        return df
    # Ensure we have a sortable datetime column; prefer existing START_DT, else parse temporary
    has_start_dt = 'START_DT' in df.columns
    if not has_start_dt and 'START' in df.columns:
        sdf = df.copy()
        sdf['_TMP_START_DT'] = pd.to_datetime(sdf['START'], errors='coerce')
        sort_col = '_TMP_START_DT'
    else:
        sdf = df
        sort_col = 'START_DT'
    # Sort by start ascending, then keep the last per patient id
    sdf = sdf.sort_values(sort_col, kind='mergesort')
    latest = sdf.drop_duplicates(subset=[pid_col], keep='last')
    # Preserve a consistent ordering (newest first) for downstream limiting if needed
    latest = latest.sort_values(sort_col, ascending=False, kind='mergesort')
    # Drop temp column if created
    if sort_col == '_TMP_START_DT':
        latest = latest.drop(columns=['_TMP_START_DT'])
    return latest
