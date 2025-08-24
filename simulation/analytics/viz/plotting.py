from __future__ import annotations
from pathlib import Path
from typing import Dict
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt


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

    # Overall metrics expect a 'system_performance' dict
    overall = {
        'system_performance': {
            'overall_breach_rate_percent': system_report.get('overall_breach_rate_percent', 0.0),
            'overall_avg_wait_min': system_report.get('overall_avg_wait_min', 0.0),
            'overall_p95_wait_min': system_report.get('overall_p95_wait_min', 0.0),
        }
    }
    out_paths += plot_overall_metrics(overall, outdir)

    return out_paths


def plot_overall_comparison(mta_report: Dict, ollama_report: Dict, outdir: str | Path) -> Path:
    """Save a comparative bar chart for overall metrics (breach %, avg, p95)."""
    outdir = Path(outdir)
    _ensure_outdir(outdir)

    comp_df = pd.DataFrame([
        {'metric': 'breach_%', 'value': mta_report.get('overall_breach_rate_percent', 0.0), 'system': 'mta'},
        {'metric': 'avg_wait_min', 'value': mta_report.get('overall_avg_wait_min', 0.0), 'system': 'mta'},
        {'metric': 'p95_wait_min', 'value': mta_report.get('overall_p95_wait_min', 0.0), 'system': 'mta'},
        {'metric': 'breach_%', 'value': ollama_report.get('overall_breach_rate_percent', 0.0), 'system': 'ollama'},
        {'metric': 'avg_wait_min', 'value': ollama_report.get('overall_avg_wait_min', 0.0), 'system': 'ollama'},
        {'metric': 'p95_wait_min', 'value': ollama_report.get('overall_p95_wait_min', 0.0), 'system': 'ollama'},
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
