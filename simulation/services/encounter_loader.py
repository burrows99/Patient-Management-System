import random
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
import sys

from simulation.domain.manchester import ManchesterTriageSystem
from simulation.utils.time_utils import compress_encounter_times, seconds_to_minutes
from simulation.utils.data_utils import load_encounters_df, load_entity_df


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
    arrival_min = seconds_to_minutes((df['START_DT'] - first_time).dt.total_seconds())

    # Optionally load related datasets for patient history (best-effort)
    def _safe_load(name: str, sheet: str):
        try:
            return load_entity_df(output_dir, name, sheet)
        except Exception:
            return None

    prescriptions_df = _safe_load("prescriptions", "Prescriptions")
    observations_df = _safe_load("observations", "Observations")

    # Helper to build compact patient history text up to index time
    def _build_patient_history(patient_id: str, index_time) -> str:
        parts: List[str] = []
        # Previous encounters (same patient, before current start)
        try:
            prev = df[(df['PATIENT'] == patient_id) & (df['START_DT'] < index_time)].sort_values('START_DT')
            if not prev.empty:
                recent = prev.tail(3)
                enc_items = []
                for _, row in recent.iterrows():
                    reason = str(row.get('REASONDESCRIPTION', '') or '')
                    enc_class = str(row.get('ENCOUNTERCLASS', '') or '')
                    dt = row.get('START_DT')
                    enc_items.append(f"{dt:%Y-%m-%d}: {enc_class} - {reason}")
                parts.append("Recent encounters: " + "; ".join(enc_items))
        except Exception:
            pass

        # Prescriptions history (if available)
        try:
            if prescriptions_df is not None:
                pdf = prescriptions_df
                # Flexible column names
                pid_col = 'patient_id' if 'patient_id' in pdf.columns else ('PATIENT' if 'PATIENT' in pdf.columns else None)
                date_col = 'DATE' if 'DATE' in pdf.columns else ('START_DT' if 'START_DT' in pdf.columns else None)
                med_col = 'medication' if 'medication' in pdf.columns else ('MEDICATION' if 'MEDICATION' in pdf.columns else 'name' if 'name' in pdf.columns else None)
                status_col = 'status' if 'status' in pdf.columns else ('STATUS' if 'STATUS' in pdf.columns else None)
                if pid_col and date_col and med_col:
                    prevp = pdf[(pdf[pid_col] == patient_id)]
                    if date_col in prevp.columns and index_time is not None:
                        try:
                            prevp = prevp[pd.to_datetime(prevp[date_col], errors='coerce') < index_time]
                        except Exception:
                            pass
                    if not prevp.empty:
                        recentp = prevp.tail(3)
                        items = []
                        for _, row in recentp.iterrows():
                            med = str(row.get(med_col, '') or '')
                            st = str(row.get(status_col, '') or '') if status_col else ''
                            if st:
                                items.append(f"{med} ({st})")
                            else:
                                items.append(med)
                        parts.append("Recent prescriptions: " + ", ".join(items))
        except Exception:
            pass

        # Observations history (if available)
        try:
            if observations_df is not None:
                odf = observations_df
                pid_col = 'patient_id' if 'patient_id' in odf.columns else ('PATIENT' if 'PATIENT' in odf.columns else None)
                date_col = 'DATE' if 'DATE' in odf.columns else ('START_DT' if 'START_DT' in odf.columns else None)
                name_col = 'name' if 'name' in odf.columns else ('OBSERVATION' if 'OBSERVATION' in odf.columns else None)
                value_col = 'value' if 'value' in odf.columns else ('VALUE' if 'VALUE' in odf.columns else None)
                if pid_col and (name_col or value_col):
                    prevo = odf[(odf[pid_col] == patient_id)]
                    if date_col in prevo.columns and index_time is not None:
                        try:
                            prevo = prevo[pd.to_datetime(prevo[date_col], errors='coerce') < index_time]
                        except Exception:
                            pass
                    if not prevo.empty:
                        recento = prevo.tail(3)
                        items = []
                        for _, row in recento.iterrows():
                            nm = str(row.get(name_col, '') or '') if name_col else ''
                            val = str(row.get(value_col, '') or '') if value_col else ''
                            if nm and val:
                                items.append(f"{nm}: {val}")
                            elif nm:
                                items.append(nm)
                            elif val:
                                items.append(val)
                        parts.append("Recent observations: " + "; ".join(items))
        except Exception:
            pass

        return " | ".join(parts)

    # Build encounter dicts efficiently
    encounters: List[Dict] = [
        {
            "patient_id": str(p)[:8],
            "encounter_class": str(c).lower(),
            "start_timestamp": s,
            "service_min": float(m),
            "reason_description": str(r) if pd.notna(r) else "",
            "patient_history": _build_patient_history(str(p), s),
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
