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
    assign_start_dt,
    assign_stop_dt,
    compute_service_min,
)
from simulation.models.patient import latest_encounters_by_patient


def load_and_prepare_encounters(
    csv_path: str,
    class_filter: Optional[str] = None,
    limit: int = 0,
    debug: bool = False,
    *,
    use_poisson: bool = False,
    poisson_rate_per_min: Optional[float] = None,
    poisson_seed: Optional[int] = None,
    poisson_start_at: Optional[str] = None,
) -> List[Dict]:
    """Load encounters and prepare for compressed simulation.

    Fresh implementation:
    - Includes structured patient demographics
    - Includes structured related history (recent encounters, prescriptions, observations)
    - Preserves simulator-required fields: arrival_min, service_min, encounter_class, reason_description
    - Neutral across triage systems: does NOT pre-assign priority or mutate service time
    """

    output_dir = Path(csv_path).parent.parent  # .../output

    # Core encounters dataframe (lightweight: no time parsing yet)
    df = load_encounters_df(output_dir, process_all=False)
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

    # Sort and limit on the reduced set (by START if START_DT missing)
    date_col = 'START_DT' if 'START_DT' in df.columns else ('START' if 'START' in df.columns else None)
    df = sort_and_limit(df, date_col=date_col or 'START_DT', limit=limit)

    # Now assign time fields only for the final selected encounters
    if use_poisson and poisson_rate_per_min and poisson_rate_per_min > 0:
        start_ts = pd.to_datetime(poisson_start_at, errors='coerce') if poisson_start_at else None
        df = assign_start_dt(
            df,
            use_poisson=True,
            rate_per_min=float(poisson_rate_per_min),
            seed=poisson_seed,
            start_at=start_ts,
        )
    else:
        df = assign_start_dt(df)
    df = assign_stop_dt(df)
    df = compute_service_min(df)

    # Arrival minutes from START_DT (present after assignment)
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
