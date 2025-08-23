import random
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
import sys

from simulation.domain.manchester import ManchesterTriageSystem
from simulation.utils.time_utils import compress_encounter_times
from simulation.utils.data_utils import load_encounters_df


def load_and_prepare_encounters(
    csv_path: str,
    class_filter: Optional[str] = None,
    limit: int = 0,
    compression_hours: int = 8,
    debug: bool = False,
) -> List[Dict]:
    """Load encounters and prepare for compressed simulation"""
    # Standardized load using utils (parses START/STOP and computes SERVICE_MIN, time features)
    output_dir = Path(csv_path).parent.parent  # .../output
    df = load_encounters_df(output_dir)
    if debug:
        print(f"Loaded {len(df)} standardized encounters", file=sys.stderr)

    # Filter by encounter class if requested
    if class_filter:
        cls = class_filter.lower()
        df = df[df['ENCOUNTERCLASS'].str.lower() == cls]

    if df.empty:
        return []

    # Sort and limit
    df = df.sort_values('START_DT')
    if limit > 0:
        df = df.head(limit)

    # Compute arrival minutes from first START_DT
    first_time = df['START_DT'].iloc[0]
    arrival_min = (df['START_DT'] - first_time).dt.total_seconds() / 60.0

    # Build encounter dicts efficiently
    encounters: List[Dict] = [
        {
            "patient_id": str(p)[:8],
            "encounter_class": str(c).lower(),
            "start_timestamp": s,
            "service_min": float(m),
            "reason_description": str(r) if pd.notna(r) else "",
            "arrival_min": float(a),
        }
        for p, c, s, m, r, a in zip(
            df['PATIENT'].tolist(),
            df['ENCOUNTERCLASS'].tolist(),
            df['START_DT'].tolist(),
            df['SERVICE_MIN'].tolist(),
            df.get('REASONDESCRIPTION', pd.Series(["" for _ in range(len(df))])).tolist(),
            arrival_min.tolist(),
        )
    ]

    # Compress timeline for simulation horizon
    encounters = compress_encounter_times(encounters, compression_hours, debug)

    # Use an instance of the ManchesterTriageSystem to assign priorities
    triage_system = ManchesterTriageSystem()
    priority_counts = {p: 0 for p in range(1, 6)}
    for encounter in encounters:
        priority = triage_system.assign_priority(
            {
                "encounter_class": encounter["encounter_class"],
                "reason_description": encounter["reason_description"],
            }
        )
        encounter["priority"] = priority
        priority_counts[priority] += 1

        base_service = encounter["service_min"]
        if priority <= 2:
            encounter["service_min"] = base_service * random.uniform(1.2, 2.0)
        elif priority == 3:
            encounter["service_min"] = base_service * random.uniform(0.9, 1.4)
        else:
            encounter["service_min"] = base_service * random.uniform(0.6, 1.2)

    if debug:
        print("\nFinal dataset:", file=sys.stderr)
        print(f"  Encounters: {len(encounters)}", file=sys.stderr)
        print("  Priority distribution:", file=sys.stderr)
        for p, count in priority_counts.items():
            if count > 0:
                pct = count / len(encounters) * 100
                color = ManchesterTriageSystem.PRIORITIES[p].color
                print(f"    P{p} ({color}): {count} ({pct:.1f}%)", file=sys.stderr)

    return encounters
