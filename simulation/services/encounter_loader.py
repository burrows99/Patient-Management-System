from pathlib import Path
from typing import Dict, List, Optional, Any

import pandas as pd
import sys

from simulation.utils.data_utils import (
    load_encounters_df,
    compute_arrival_minutes,
    filter_by_class,
    sort_and_limit,
    resolve_encounter_patient_column,
    get_default_related_frames,
    build_structured_encounter,
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
    if not pid_col or pid_col not in df.columns or 'START_DT' not in df.columns:
        return df
    # Sort by START_DT ascending, then keep the last per patient id
    sdf = df.sort_values('START_DT', kind='mergesort')
    latest = sdf.drop_duplicates(subset=[pid_col], keep='last')
    # Preserve a consistent ordering (newest first) for downstream limiting if needed
    latest = latest.sort_values('START_DT', ascending=False, kind='mergesort')
    return latest

def _assign_priorities(encounters: List[Dict[str, Any]], debug: bool = False) -> None:
    """
    Deprecated: Keep for backward compatibility. No-op to ensure
    neutral data preparation across triage systems. Priority assignment
    now happens uniformly at runtime inside the simulator via the selected
    triage system (MTA or Ollama).
    """
    if debug:
        print("[encounter_loader] _assign_priorities is a no-op; priorities assigned at runtime.", file=sys.stderr)


def load_and_prepare_encounters(
    csv_path: str,
    class_filter: Optional[str] = None,
    limit: int = 0,
    debug: bool = False,
) -> List[Dict]:
    """Load encounters and prepare for compressed simulation.

    Fresh implementation:
    - Includes structured patient demographics
    - Includes structured related history (recent encounters, prescriptions, observations)
    - Preserves simulator-required fields: arrival_min, service_min, encounter_class, reason_description
    - Neutral across triage systems: does NOT pre-assign priority or mutate service time
    """

    output_dir = Path(csv_path).parent.parent  # .../output

    # Core encounters dataframe
    df = load_encounters_df(output_dir)
    if debug:
        print(f"Loaded {len(df)} standardized encounters", file=sys.stderr)

    # Optional class filter
    df = filter_by_class(df, class_filter, col='ENCOUNTERCLASS')

    if df.empty:
        return []

    # Reduce to latest encounter per distinct patient to avoid redundancy in history
    if debug:
        total_before = len(df)
    df = latest_encounters_by_patient(df)
    if debug:
        print(f"Reduced to latest encounters per patient: {len(df)} from {total_before}", file=sys.stderr)

    # Sort and limit on the reduced set
    df = sort_and_limit(df, date_col='START_DT', limit=limit)

    arrival_min_series = compute_arrival_minutes(df, start_col='START_DT')

    # Related frames
    frames = get_default_related_frames(output_dir)

    # Column resolution
    enc_pid_col = resolve_encounter_patient_column(df)

    # Build structured encounter objects
    encounters: List[Dict[str, Any]] = []
    for idx, row in df.iterrows():
        encounter = build_structured_encounter(
            row=row,
            idx=idx,
            df=df,
            enc_pid_col=enc_pid_col,
            arrival_min_series=arrival_min_series,
            frames=frames,
            history_limit=5,
        )
        encounters.append(encounter)

    # Do not assign priorities here. Priorities are assigned uniformly at runtime by the chosen triage system.
    # _assign_priorities(encounters, debug)  # intentionally not called

    if debug:
        print("\nFinal dataset:", file=sys.stderr)
        print(f"  Encounters: {len(encounters)}", file=sys.stderr)
        # Priority distribution is determined at runtime by the simulator's triage system.

    return encounters
