from __future__ import annotations
from pathlib import Path
from typing import Optional, Any, Dict, List
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


# ---------------------------------------------------------------------------
# Reusable generic utilities for loaders/analytics
# ---------------------------------------------------------------------------

def resolve_column(df: Optional[pd.DataFrame], *candidates: str) -> Optional[str]:
    """Return the first existing column name from candidates, or None."""
    if df is None:
        return None
    for c in candidates:
        if c in df.columns:
            return c
    return None


def compute_arrival_minutes(df: pd.DataFrame, start_col: str = "START_DT") -> pd.Series:
    """Compute minutes from first timestamp; returns zero series if unavailable."""
    if start_col not in df.columns or df.empty:
        return pd.Series([0 for _ in range(len(df))])
    first_time = df[start_col].iloc[0]
    return seconds_to_minutes((df[start_col] - first_time).dt.total_seconds())


def safe_load_entity(output_dir: Path | str, name: str, sheet: str) -> Optional[pd.DataFrame]:
    """Load an entity file, returning None on any error."""
    try:
        return load_entity_df(output_dir, name, sheet)
    except Exception:
        return None


def load_frames(output_dir: Path | str, specs: dict[str, dict]) -> dict[str, Optional[pd.DataFrame]]:
    """Load multiple frames by spec.

    specs example:
    {
      'patients': { 'primary': ('patients', 'Patients') },
      'prescriptions': { 'primary': ('medications','Medications'), 'fallbacks': [('prescriptions','Prescriptions')] },
    }
    """
    loaded: dict[str, Optional[pd.DataFrame]] = {}
    for key, conf in specs.items():
        name, sheet = conf.get('primary', (None, None))
        df = safe_load_entity(output_dir, name, sheet) if name else None
        if df is None:
            for fb_name, fb_sheet in conf.get('fallbacks', []) or []:
                df = safe_load_entity(output_dir, fb_name, fb_sheet)
                if df is not None:
                    break
        loaded[key] = df
    return loaded


def filter_by_class(df: pd.DataFrame, class_filter: Optional[str], col: str = 'ENCOUNTERCLASS') -> pd.DataFrame:
    if class_filter and col in df.columns:
        cls = str(class_filter).lower()
        return df[df[col].astype(str).str.lower() == cls]
    return df


def sort_and_limit(df: pd.DataFrame, date_col: str = 'START_DT', limit: int = 0) -> pd.DataFrame:
    if date_col in df.columns:
        df = df.sort_values(date_col)
    if limit > 0:
        df = df.head(limit)
    return df


def row_by_value(df: Optional[pd.DataFrame], value: str, *id_col_candidates: str) -> Optional[pd.Series]:
    """Return first matching row for a value using candidate id columns."""
    if df is None:
        return None
    col = resolve_column(df, *id_col_candidates)
    if not col:
        return None
    subset = df[df[col] == value]
    if subset.empty:
        return None
    return subset.iloc[0]


def select_fields(row: Optional[pd.Series], field_candidates: dict[str, tuple[str, ...]]) -> dict:
    """From a row, build dict for keys using first available candidate column per key."""
    if row is None:
        return {}
    result: dict = {}
    for key, candidates in field_candidates.items():
        for c in candidates:
            if c in row.index:
                result[key] = row.get(c)
                break
    return result


def recent_records(
    df: Optional[pd.DataFrame],
    pid_value: str,
    pid_col_candidates: tuple[str, ...],
    date_col_candidates: tuple[str, ...],
    before_dt,
    limit: int,
    field_candidates: dict[str, tuple[str, ...]],
) -> list[dict]:
    """Return last N records for a patient before a datetime, projecting fields.

    field_candidates maps output field -> tuple of candidate column names.
    """
    if df is None or not pid_value:
        return []
    pid_col = resolve_column(df, *pid_col_candidates)
    if not pid_col:
        return []
    subset = df[df[pid_col] == pid_value]
    date_col = resolve_column(subset, *date_col_candidates) if subset is not None else None
    if date_col and before_dt is not None and date_col in subset.columns:
        with pd.option_context('mode.chained_assignment', None):
            try:
                subset['_dt'] = pd.to_datetime(subset[date_col], errors='coerce')
                subset = subset[subset['_dt'] < before_dt]
            except Exception:
                pass
    items: list[dict] = []
    if subset is not None and not subset.empty:
        for _, r in subset.tail(limit).iterrows():
            items.append(select_fields(r, field_candidates))
    return items


# ---------------------------------------------------------------------------
# Higher-level helpers for encounter-centric loading
# ---------------------------------------------------------------------------

def resolve_encounter_patient_column(df: pd.DataFrame) -> str:
    """Return patient id column used in encounters df."""
    if 'PATIENT' in df.columns:
        return 'PATIENT'
    return resolve_column(df, 'patient_id', 'PATIENT_ID') or 'PATIENT'


def demographics_for(patients_df: Optional[pd.DataFrame], patient_id: str) -> dict:
    """Return standardized demographics dict for a patient id."""
    row = row_by_value(patients_df, patient_id, 'Id', 'ID', 'PATIENT', 'patient_id', 'PATIENT_ID')
    return select_fields(row, {
        'gender': ('GENDER', 'gender', 'sex'),
        'birthdate': ('BIRTHDATE', 'birthDate', 'birthdate'),
        'race': ('RACE', 'race'),
        'ethnicity': ('ETHNICITY', 'ethnicity'),
        'address': ('ADDRESS', 'address'),
        'city': ('CITY', 'city'),
        'state': ('STATE', 'state'),
        'zip': ('ZIP', 'zip'),
    })


def recent_encounters_for(df: pd.DataFrame, enc_pid_col: str, patient_id: str, before_dt, limit: int = 5) -> list[dict]:
    return recent_records(
        df,
        patient_id,
        (enc_pid_col,),
        ('START_DT', 'START'),
        before_dt,
        limit,
        {
            'date': ('START_DT', 'START'),
            'encounter_class': ('ENCOUNTERCLASS',),
            'reason_description': ('REASONDESCRIPTION',),
            'service_min': ('SERVICE_MIN',),
        },
    )


def get_default_related_frames(output_dir: Path | str) -> dict[str, Optional[pd.DataFrame]]:
    """Load default related frames used during encounter enrichment."""
    return load_frames(output_dir, {
        'patients': {'primary': ('patients', 'Patients')},
        'prescriptions': {
            'primary': ('medications', 'Medications'),
            'fallbacks': [('prescriptions', 'Prescriptions')],
        },
        'observations': {'primary': ('observations', 'Observations')},
        'conditions': {'primary': ('conditions', 'Conditions')},
        'procedures': {'primary': ('procedures', 'Procedures')},
        'immunizations': {'primary': ('immunizations', 'Immunizations')},
        'allergies': {'primary': ('allergies', 'Allergies')},
        'careplans': {'primary': ('careplans', 'CarePlans')},
        'imaging_studies': {'primary': ('imaging_studies', 'ImagingStudies')},
    })


def build_structured_encounter(
    row: pd.Series,
    idx: Any,
    df: pd.DataFrame,
    enc_pid_col: str,
    arrival_min_series: pd.Series,
    frames: dict[str, Optional[pd.DataFrame]],
    history_limit: int = 5,
) -> Dict[str, Any]:
    """Assemble a single structured encounter dict from inputs."""
    pid_full = str(row.get(enc_pid_col, ''))
    start_dt = row.get('START_DT')
    svc_min = float(row.get('SERVICE_MIN', 15.0) or 15.0)
    enc_class = str(row.get('ENCOUNTERCLASS', '') or '').lower()
    reason = str(row.get('REASONDESCRIPTION', '') or '')
    # Use label-based access; idx is the row label from df.iterrows()
    try:
        arr_min = float(arrival_min_series.loc[idx])
    except Exception:
        arr_min = 0.0

    patients_df = frames.get('patients')
    prescriptions_df = frames.get('prescriptions')
    observations_df = frames.get('observations')
    conditions_df = frames.get('conditions')
    procedures_df = frames.get('procedures')
    immunizations_df = frames.get('immunizations')
    allergies_df = frames.get('allergies')
    careplans_df = frames.get('careplans')
    imaging_df = frames.get('imaging_studies')

    demographics = demographics_for(patients_df, pid_full)
    recent_encs = recent_encounters_for(df, enc_pid_col, pid_full, start_dt, limit=history_limit)
    recent_rx = recent_prescriptions_for(prescriptions_df, pid_full, start_dt, limit=history_limit)
    recent_obs = recent_observations_for(observations_df, pid_full, start_dt, limit=history_limit)
    recent_conds = recent_conditions_for(conditions_df, pid_full, start_dt, limit=history_limit)
    recent_procs = recent_procedures_for(procedures_df, pid_full, start_dt, limit=history_limit)
    recent_imm = recent_immunizations_for(immunizations_df, pid_full, start_dt, limit=history_limit)
    recent_allg = recent_allergies_for(allergies_df, pid_full, start_dt, limit=history_limit)
    recent_care = recent_careplans_for(careplans_df, pid_full, start_dt, limit=history_limit)
    recent_img = recent_imaging_studies_for(imaging_df, pid_full, start_dt, limit=history_limit)

    return {
        'encounter_class': enc_class,
        'reason_description': reason,
        'start_timestamp': start_dt,
        'service_min': svc_min,
        'arrival_min': arr_min,
        'patient_id': pid_full,
        'patient_id_short': pid_full[:8] if pid_full else '',
        'patient': {
            'demographics': demographics,
        },
        'history': {
            'recent_encounters': recent_encs,
            'recent_prescriptions': recent_rx,
            'recent_observations': recent_obs,
            'recent_conditions': recent_conds,
            'recent_procedures': recent_procs,
            'recent_immunizations': recent_imm,
            'recent_allergies': recent_allg,
            'recent_careplans': recent_care,
            'recent_imaging_studies': recent_img,
        },
    }


def recent_conditions_for(df: Optional[pd.DataFrame], patient_id: str, before_dt, limit: int = 5) -> list[dict]:
    return recent_records(
        df,
        patient_id,
        ('PATIENT', 'patient', 'patient_id', 'PATIENT_ID'),
        ('DATE', 'START', 'START_DT'),
        before_dt,
        limit,
        {
            'date': ('DATE', 'START', 'START_DT'),
            'code': ('CODE', 'code'),
            'description': ('DESCRIPTION', 'description', 'name'),
            'status': ('STATUS', 'status'),
        },
    )


def recent_procedures_for(df: Optional[pd.DataFrame], patient_id: str, before_dt, limit: int = 5) -> list[dict]:
    return recent_records(
        df,
        patient_id,
        ('PATIENT', 'patient', 'patient_id', 'PATIENT_ID'),
        ('DATE', 'START', 'START_DT'),
        before_dt,
        limit,
        {
            'date': ('DATE', 'START', 'START_DT'),
            'code': ('CODE', 'code'),
            'description': ('DESCRIPTION', 'description', 'name'),
            'reason': ('REASONDESCRIPTION', 'REASON', 'reason'),
        },
    )


def recent_immunizations_for(df: Optional[pd.DataFrame], patient_id: str, before_dt, limit: int = 5) -> list[dict]:
    return recent_records(
        df,
        patient_id,
        ('PATIENT', 'patient', 'patient_id', 'PATIENT_ID'),
        ('DATE', 'START', 'START_DT'),
        before_dt,
        limit,
        {
            'date': ('DATE', 'START', 'START_DT'),
            'code': ('CODE', 'code'),
            'description': ('DESCRIPTION', 'description', 'name'),
            'status': ('STATUS', 'status'),
        },
    )


def recent_allergies_for(df: Optional[pd.DataFrame], patient_id: str, before_dt, limit: int = 5) -> list[dict]:
    return recent_records(
        df,
        patient_id,
        ('PATIENT', 'patient', 'patient_id', 'PATIENT_ID'),
        ('DATE', 'START', 'START_DT'),
        before_dt,
        limit,
        {
            'date': ('DATE', 'START', 'START_DT'),
            'code': ('CODE', 'code'),
            'description': ('DESCRIPTION', 'description', 'name'),
            'type': ('TYPE', 'type'),
        },
    )


def recent_careplans_for(df: Optional[pd.DataFrame], patient_id: str, before_dt, limit: int = 5) -> list[dict]:
    return recent_records(
        df,
        patient_id,
        ('PATIENT', 'patient', 'patient_id', 'PATIENT_ID'),
        ('DATE', 'START', 'START_DT'),
        before_dt,
        limit,
        {
            'date': ('DATE', 'START', 'START_DT'),
            'description': ('DESCRIPTION', 'description', 'name'),
            'reason': ('REASONDESCRIPTION', 'REASON', 'reason'),
        },
    )


def recent_imaging_studies_for(df: Optional[pd.DataFrame], patient_id: str, before_dt, limit: int = 5) -> list[dict]:
    return recent_records(
        df,
        patient_id,
        ('PATIENT', 'patient', 'patient_id', 'PATIENT_ID'),
        ('DATE', 'START', 'START_DT'),
        before_dt,
        limit,
        {
            'date': ('DATE', 'START', 'START_DT'),
            'description': ('DESCRIPTION', 'description', 'modality'),
            'bodysite': ('BODYSITE_CODE', 'bodysite'),
        },
    )


def recent_prescriptions_for(rx_df: Optional[pd.DataFrame], patient_id: str, before_dt, limit: int = 5) -> list[dict]:
    return recent_records(
        rx_df,
        patient_id,
        ('PATIENT', 'patient', 'patient_id', 'PATIENT_ID'),
        ('DATE', 'START', 'START_DT', 'authoredOn'),
        before_dt,
        limit,
        {
            'date': ('DATE', 'START', 'START_DT', 'authoredOn'),
            'medication': ('DESCRIPTION', 'MEDICATION', 'medication', 'name', 'CODE'),
            'status': ('STATUS', 'status'),
        },
    )


def recent_observations_for(ob_df: Optional[pd.DataFrame], patient_id: str, before_dt, limit: int = 5) -> list[dict]:
    return recent_records(
        ob_df,
        patient_id,
        ('PATIENT', 'patient', 'patient_id', 'PATIENT_ID'),
        ('DATE', 'START', 'START_DT', 'effectiveDateTime'),
        before_dt,
        limit,
        {
            'date': ('DATE', 'START', 'START_DT', 'effectiveDateTime'),
            'name': ('DESCRIPTION', 'OBSERVATION', 'name', 'CODE'),
            'value': ('VALUE', 'value', 'VALUE_NUM', 'VALUE_STRING'),
        },
    )
