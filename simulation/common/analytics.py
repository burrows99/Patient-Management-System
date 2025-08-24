from __future__ import annotations
from pathlib import Path
from typing import Any, Dict, List
from datetime import datetime

import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from simulation.triage.manchester import ManchesterTriageSystem
from simulation.utils.time_utils import minutes_to_hours


# ===== Summary and comparison helpers =====

def summarize_report(name: str, report: Dict[str, Any]) -> Dict[str, Any]:
    perf = report.get('system_performance', {}) or {}
    pb = report.get('priority_breakdown', {}) or {}
    return {
        'name': name,
        'total_patients': perf.get('total_patients'),
        'overall_breach_rate_percent': perf.get('overall_breach_rate_percent'),
        'overall_avg_wait_min': perf.get('overall_avg_wait_min'),
        'overall_p95_wait_min': perf.get('overall_p95_wait_min'),
        'priority_breakdown': pb,
    }


def compare_reports(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    def get_perf(r):
        return r.get('system_performance', {}) or {}
    pa, pb = get_perf(a), get_perf(b)
    return {
        'overall_breach_rate_delta_pct': (
            (pb.get('overall_breach_rate_percent') or 0) - (pa.get('overall_breach_rate_percent') or 0)
        ),
        'overall_avg_wait_delta_min': (
            (pb.get('overall_avg_wait_min') or 0) - (pa.get('overall_avg_wait_min') or 0)
        ),
        'overall_p95_wait_delta_min': (
            (pb.get('overall_p95_wait_min') or 0) - (pa.get('overall_p95_wait_min') or 0)
        ),
    }


# ===== Plotting helpers =====


def _ensure_outdir(outdir: Path) -> None:
    outdir.mkdir(parents=True, exist_ok=True)


def plot_priority_breakdown(report: Dict, outdir: str | Path) -> list[Path]:
    """Generate plots for per-priority metrics from simulation report.
    Saves PNG files and returns their paths.
    """
    out: list[Path] = []
    outdir = Path(outdir)
    _ensure_outdir(outdir)

    pb = report.get('priority_breakdown') or {}
    if not pb:
        return out

    df = (
        pd.DataFrame.from_dict(pb, orient='index')
        .rename_axis('priority')
        .reset_index()
    )
    # Ensure numeric
    for col in ['patients', 'avg_wait_min', 'p95_wait_min', 'breach_rate_percent', 'target_max_wait_min']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    sns.set_theme(style="whitegrid")

    # 1) Patients per priority
    fig, ax = plt.subplots(figsize=(6, 4))
    sns.barplot(data=df, x='priority', y='patients', ax=ax, palette='Blues_d')
    ax.set_title('Patients per Priority')
    ax.set_xlabel('Priority (P1–P5)')
    ax.set_ylabel('Patients')
    path = outdir / 'patients_per_priority.png'
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)
    out.append(path)

    # 2) Breach rate by priority
    if 'breach_rate_percent' in df.columns:
        fig, ax = plt.subplots(figsize=(6, 4))
        sns.barplot(data=df, x='priority', y='breach_rate_percent', ax=ax, palette='Reds')
        ax.set_title('Breach Rate by Priority')
        ax.set_xlabel('Priority (P1–P5)')
        ax.set_ylabel('Breach Rate (%)')
        path = outdir / 'breach_rate_by_priority.png'
        fig.tight_layout()
        fig.savefig(path, dpi=150)
        plt.close(fig)
        out.append(path)

    # 3) Avg and P95 wait by priority (side-by-side)
    if {'avg_wait_min', 'p95_wait_min'} <= set(df.columns):
        df_m = df.melt(id_vars=['priority', 'name'], value_vars=['avg_wait_min', 'p95_wait_min'],
                       var_name='metric', value_name='minutes')
        fig, ax = plt.subplots(figsize=(7, 4))
        sns.barplot(data=df_m, x='priority', y='minutes', hue='metric', ax=ax, palette='Set2')
        ax.set_title('Wait Times by Priority')
        ax.set_xlabel('Priority (P1–P5)')
        ax.set_ylabel('Minutes')
        path = outdir / 'wait_times_by_priority.png'
        fig.tight_layout()
        fig.savefig(path, dpi=150)
        plt.close(fig)
        out.append(path)

    return out


# ===== Reporting utilities (moved from simulation/utils/reporting.py) =====


def build_summary_report(df: pd.DataFrame,
                         temporal_analysis: Dict[str, Any],
                         capacity_analysis: Dict[str, Any],
                         simulation_recommendations: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'generated_at': datetime.now().isoformat(),
        'dataset_size': int(len(df)),
        'date_range': {
            'start': str(df['YEAR'].min()) if 'YEAR' in df.columns else '',
            'end': str(df['YEAR'].max()) if 'YEAR' in df.columns else '',
        },
        'key_metrics': {
            'peak_hour': temporal_analysis.get('peak_hour'),
            'busiest_day': temporal_analysis.get('busiest_day'),
            'recommended_servers': capacity_analysis.get('recommended_servers'),
            'daily_max_volume': capacity_analysis.get('daily_max'),
            'avg_service_time_min': round(capacity_analysis.get('avg_service_time', 0.0), 1),
        },
        'recommendations': {
            'optimal_simulation_date': str(simulation_recommendations.get('optimal_date', '')),
            'recommended_servers': simulation_recommendations.get('recommended_servers'),
        },
    }


def aggregate_priority_breakdown(events: List[Dict[str, Any]]) -> Dict[int, Dict[str, Any]]:
    """Build per-priority breakdown from simulation events.

    Expects events with keys: priority, wait_min, max_wait_min, patient_id
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


def _extract_overall_metrics(report: Dict) -> Dict[str, float]:
    """Return a dict with overall metrics regardless of schema shape.

    Supports either:
    - flat keys on the report
    - nested under report['system_performance']
    """
    sp = report.get('system_performance') or {}
    if sp:
        return {
            'overall_breach_rate_percent': float(sp.get('overall_breach_rate_percent', 0.0) or 0.0),
            'overall_avg_wait_min': float(sp.get('overall_avg_wait_min', 0.0) or 0.0),
            'overall_p95_wait_min': float(sp.get('overall_p95_wait_min', 0.0) or 0.0),
        }
    # Fallback to flat keys
    return {
        'overall_breach_rate_percent': float(report.get('overall_breach_rate_percent', 0.0) or 0.0),
        'overall_avg_wait_min': float(report.get('overall_avg_wait_min', 0.0) or 0.0),
        'overall_p95_wait_min': float(report.get('overall_p95_wait_min', 0.0) or 0.0),
    }


def save_system_plots(system_report: Dict, outdir: str | Path) -> list[Path]:
    """Save standard plots for a single system report.

    Generates:
    - Patients per priority
    - Breach rate by priority
    - Wait times by priority (avg vs p95)
    - Overall metrics (breach %, avg wait, p95 wait)
    """
    out_paths: list[Path] = []
    outdir = Path(outdir)
    _ensure_outdir(outdir)

    # Per-priority plots
    out_paths += plot_priority_breakdown(system_report, outdir)

    # Build overall metrics dict using extractor
    overall = {
        'system_performance': _extract_overall_metrics(system_report)
    }
    out_paths += plot_overall_metrics(overall, outdir)

    return out_paths


def plot_overall_comparison(mta_report: Dict, ollama_report: Dict, outdir: str | Path) -> Path:
    """Save a comparative bar chart for overall metrics (breach %, avg, p95)."""
    outdir = Path(outdir)
    _ensure_outdir(outdir)

    mta_overall = _extract_overall_metrics(mta_report)
    oll_overall = _extract_overall_metrics(ollama_report)

    comp_df = pd.DataFrame([
        {'metric': 'breach_%', 'value': mta_overall['overall_breach_rate_percent'], 'system': 'mta'},
        {'metric': 'avg_wait_min', 'value': mta_overall['overall_avg_wait_min'], 'system': 'mta'},
        {'metric': 'p95_wait_min', 'value': mta_overall['overall_p95_wait_min'], 'system': 'mta'},
        {'metric': 'breach_%', 'value': oll_overall['overall_breach_rate_percent'], 'system': 'ollama'},
        {'metric': 'avg_wait_min', 'value': oll_overall['overall_avg_wait_min'], 'system': 'ollama'},
        {'metric': 'p95_wait_min', 'value': oll_overall['overall_p95_wait_min'], 'system': 'ollama'},
    ])

    sns.set_theme(style='whitegrid')
    fig, ax = plt.subplots(figsize=(8, 4))
    sns.barplot(data=comp_df, x='metric', y='value', hue='system', ax=ax, palette='Paired')
    ax.set_title('Overall Metrics Comparison')
    ax.set_xlabel('Metric')
    ax.set_ylabel('Value')
    fig.tight_layout()
    path = outdir / 'overall_metrics_comparison.png'
    fig.savefig(path, dpi=150)
    plt.close(fig)
    return path


def plot_overall_metrics(report: Dict, outdir: str | Path) -> list[Path]:
    """Plot simple overall metrics (breach rate, avg wait, p95 wait)."""
    out = []
    outdir = Path(outdir)
    _ensure_outdir(outdir)

    sm = report.get('system_performance') or {}
    if not sm:
        return out

    df = pd.DataFrame([
        {'metric': 'overall_breach_rate_percent', 'value': sm.get('overall_breach_rate_percent', 0.0)},
        {'metric': 'overall_avg_wait_min', 'value': sm.get('overall_avg_wait_min', 0.0)},
        {'metric': 'overall_p95_wait_min', 'value': sm.get('overall_p95_wait_min', 0.0)},
    ])
    sns.set_theme(style="whitegrid")

    fig, ax = plt.subplots(figsize=(7, 4))
    sns.barplot(data=df, x='metric', y='value', ax=ax, palette='viridis')
    ax.set_title('Overall System Metrics')
    ax.set_xlabel('Metric')
    ax.set_ylabel('Value')
    ax.set_xticklabels(['Breach %', 'Avg Wait (min)', 'P95 Wait (min)'], rotation=0)
    path = outdir / 'overall_metrics.png'
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)
    out.append(path)

    return out
