from __future__ import annotations
from typing import Any, Dict, List
import pandas as pd

from simulation.domain.manchester import ManchesterTriageSystem
from simulation.utils.time_utils import minutes_to_hours


def aggregate_priority_breakdown(events: List[Dict[str, Any]]) -> Dict[int, Dict[str, Any]]:
    """Build per-priority breakdown from simulation events.

    Expects events with columns: priority, wait_min, max_wait_min, patient_id
    """
    df = pd.DataFrame(events)
    if df.empty:
        return {}

    breached = (df['wait_min'] > df['max_wait_min']).astype(int)
    grp = df.assign(breached=breached).groupby('priority', as_index=True)

    stats = grp.agg(
        patients=('patient_id', 'count'),
        avg_wait_min=('wait_min', 'mean'),
        p95_wait_min=('wait_min', lambda x: x.quantile(0.95)),
        breaches=('breached', 'sum'),
    )

    # Ensure Manchester config is loaded so PRIORITIES has metadata
    if not ManchesterTriageSystem.PRIORITIES:
        try:
            ManchesterTriageSystem._load_config()
        except Exception:
            # If config can't be loaded, we'll derive what we can from events
            pass

    mts_meta = pd.DataFrame(
        {
            p: {
                'color': info.color,
                'target_max_wait_min': info.max_wait_min,
            }
            for p, info in ManchesterTriageSystem.PRIORITIES.items()
        }
    ).T if ManchesterTriageSystem.PRIORITIES else pd.DataFrame(index=stats.index)

    merged = stats.join(mts_meta, how='left')
    # If target is missing from metadata, derive from events per priority
    if 'target_max_wait_min' not in merged.columns or merged['target_max_wait_min'].isna().any():
        derived_target = grp['max_wait_min'].max().rename('target_max_wait_min')
        merged = merged.join(derived_target, how='left', rsuffix='_derived')
        if 'target_max_wait_min_x' in merged.columns and 'target_max_wait_min_y' in merged.columns:
            merged['target_max_wait_min'] = merged['target_max_wait_min_x'].fillna(merged['target_max_wait_min_y'])
            merged = merged.drop(columns=['target_max_wait_min_x', 'target_max_wait_min_y'])
    # Ensure color present for name formatting
    if 'color' not in merged.columns:
        merged['color'] = 'Unknown'
    else:
        merged['color'] = merged['color'].fillna('Unknown')
    merged['breach_rate_percent'] = (merged['breaches'] / merged['patients'] * 100).round(1)
    merged['avg_wait_min'] = merged['avg_wait_min'].round(1)
    merged['p95_wait_min'] = merged['p95_wait_min'].round(1)
    merged['name'] = merged.index.map(lambda p: f"P{int(p)} ({merged.loc[p, 'color']})")

    result = (
        merged[
            ['name', 'target_max_wait_min', 'patients', 'avg_wait_min', 'p95_wait_min', 'breach_rate_percent', 'breaches']
        ]
        .astype({'patients': 'int64', 'breaches': 'int64'})
        .to_dict(orient='index')
    )
    return result


def compute_system_metrics(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    df = pd.DataFrame(events)
    if df.empty:
        return {
            'total_patients': 0,
            'overall_breach_rate_percent': 0.0,
            'overall_avg_wait_min': 0.0,
            'overall_p95_wait_min': 0.0,
        }
    return {
        'total_patients': int(len(df)),
        'overall_breach_rate_percent': float(((df['wait_min'] > df['max_wait_min']).mean() * 100).round(1)),
        'overall_avg_wait_min': float(df['wait_min'].mean().round(1)),
        'overall_p95_wait_min': float(df['wait_min'].quantile(0.95).round(1)),
    }


def build_simulation_report(
    parameters: Dict[str, Any],
    results: Dict[str, Any],
    horizon_minutes: float,
) -> Dict[str, Any]:
    events = results.get('events', [])
    priority_breakdown = aggregate_priority_breakdown(events)
    system_metrics = compute_system_metrics(events)

    return {
        'simulation_type': 'time_compressed_manchester_triage',
        'parameters': parameters,
        'completed': results.get('completed', 0),
        'system_performance': system_metrics,
        'priority_breakdown': priority_breakdown,
        # Include raw events for downstream diagnostics (e.g., comparing systems)
        'events': events,
        'simulation_time_hours': round(minutes_to_hours(horizon_minutes), 1),
    }
