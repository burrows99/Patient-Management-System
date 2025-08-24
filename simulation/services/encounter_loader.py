import random
from pathlib import Path
from typing import Dict, List, Optional, Any

import pandas as pd
import sys

from simulation.domain.manchester import ManchesterTriageSystem
from simulation.utils.data_utils import (
    load_encounters_df,
    compute_arrival_minutes,
    filter_by_class,
    sort_and_limit,
    resolve_encounter_patient_column,
    get_default_related_frames,
    build_structured_encounter,
)

def _assign_priorities(encounters: List[Dict[str, Any]], debug: bool = False) -> None:
    triage_system = ManchesterTriageSystem()
    for e in encounters:
        priority = triage_system.assign_priority({
            'encounter_class': e['encounter_class'],
            'reason_description': e['reason_description'],
        })
        e['priority'] = priority
        base_service = e['service_min']
        if priority <= 2:
            e['service_min'] = base_service * random.uniform(1.2, 2.0)
        elif priority == 3:
            e['service_min'] = base_service * random.uniform(0.9, 1.4)
        else:
            e['service_min'] = base_service * random.uniform(0.6, 1.2)


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
    - Preserves simulator-required fields: arrival_min, service_min, priority, encounter_class, reason_description
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

    # Sort and limit
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

    # Assign priorities and adjust service time by priority
    _assign_priorities(encounters, debug)

    if debug:
        print("\nFinal dataset:", file=sys.stderr)
        print(f"  Encounters: {len(encounters)}", file=sys.stderr)
        print("  Priority distribution:", file=sys.stderr)
        # Optionally, compute distribution if needed here (omitted for SRP)

    return encounters
