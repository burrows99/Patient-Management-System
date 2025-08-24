#!/usr/bin/env python3
"""
Unified CLI entry point for NHS-MOA triage simulations.

Examples:
  # Run MTA only
  python simulate.py --system mta --limit 100 --servers 3

  # Run Ollama only with telemetry path and long explanations
  OLLAMA_EXPLANATION_DETAIL=long OLLAMA_TELEMETRY_PATH=ollama_telemetry.jsonl \
  python simulate.py --system ollama --ollama-model phi:2.7b --limit 100 --servers 3

  # Run both and compare, plus simple analysis summary
  python simulate.py --system both --limit 100 --servers 3 --analyze
"""
import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict
from datetime import datetime
import pandas as pd

# Ensure project root on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from simulation.triage_simulator import run_simulation  # type: ignore
from simulation.utils.env_utils import get_sim_defaults, get_ollama_settings
from simulation.common.analytics import summarize_report, compare_reports, save_system_plots, plot_overall_comparison


# Compare helpers now imported from simulation.analytics.core.compare


def main():
    parser = argparse.ArgumentParser(description='Unified triage simulation CLI')
    env_defaults = get_sim_defaults()
    parser.add_argument('--system', choices=['mta', 'ollama', 'both'], default='mta', help='Which triage system to run')
    parser.add_argument('--servers', type=int, default=env_defaults.get('servers', 3), help='Number of servers')
    # Support both --class and --encounter-class (compose uses the latter)
    parser.add_argument('--class', dest='encounter_class', default=env_defaults.get('encounter_class', ''), help='Filter by encounter class')
    parser.add_argument('--encounter-class', dest='encounter_class', help=argparse.SUPPRESS)
    parser.add_argument('--limit', type=int, default=env_defaults.get('limit', 100), help='Max number of encounters')
    ollama_env = get_ollama_settings()
    parser.add_argument('--ollama-model', default=ollama_env.get('model', 'phi:2.7b'), help='Ollama model, when system=ollama/both')
    parser.add_argument('--analyze', action='store_true', help='Print compact analysis summary to stdout')
    parser.add_argument('--dump-events', action='store_true', help='When running both, dump per-patient events CSVs and comparison table')
    # Queue-theory arrivals (Poisson/exponential inter-arrival)
    parser.add_argument('--poisson', action='store_true', default=env_defaults.get('poisson', False), help='Use Poisson arrivals (exponential inter-arrival times)')
    parser.add_argument('--poisson-rate', type=float, default=env_defaults.get('poisson_rate', None), help='Arrival rate λ in arrivals per minute (required with --poisson)')
    parser.add_argument('--poisson-seed', type=int, default=env_defaults.get('poisson_seed', None), help='Random seed for Poisson arrivals')
    parser.add_argument('--poisson-start', type=str, default=env_defaults.get('poisson_start', None), help='Base timestamp for first arrival (e.g., 2025-08-24T09:00:00Z)')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging in underlying simulation')
    parser.add_argument('--outDir', default='output/simulation/jsonfiles', help='Directory to save simulation JSON outputs')
    args = parser.parse_args()

    # Prepare output directory (timestamped run folder)
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    base_outdir = Path(args.outDir)
    run_outdir = base_outdir / ts
    run_outdir.mkdir(parents=True, exist_ok=True)

    def _dump(obj: Dict[str, Any], name: str) -> Path:
        p = run_outdir / name
        p.write_text(json.dumps(obj, indent=2))
        return p

    # Always place Ollama telemetry alongside results for ollama runs, unless pre-set in env
    if args.system in ('ollama', 'both'):
        if not os.getenv('OLLAMA_TELEMETRY_PATH'):
            os.environ['OLLAMA_TELEMETRY_PATH'] = str(run_outdir / 'ollama_telemetry.jsonl')

    # MTA only
    if args.system == 'mta':
        mta_start = datetime.utcnow()
        mta_report = run_simulation(
            servers=args.servers,
            encounter_class=args.encounter_class,
            limit=args.limit,
            debug=args.debug,
            triage_system='mta',
            disable_fallback=True,
            use_poisson=args.poisson,
            poisson_rate_per_min=args.poisson_rate,
            poisson_seed=args.poisson_seed,
            poisson_start_at=args.poisson_start,
        )
        if not mta_report:
            sys.exit(1)
        mta_end = datetime.utcnow()
        # Persist results
        meta = {
            'system': 'mta',
            'parameters': {
                'servers': args.servers,
                'limit': args.limit,
                'filter': args.encounter_class or 'all',
            },
            'timestamp': ts,
            'started_at': mta_start.isoformat() + 'Z',
            'ended_at': mta_end.isoformat() + 'Z',
            'duration_seconds': (mta_end - mta_start).total_seconds(),
        }
        _dump(meta, 'parameters.json')
        mta_path = _dump(mta_report, 'mta_results.json')
        # Plots
        plots_dir = run_outdir / 'plots' / 'mta'
        save_system_plots(mta_report, plots_dir)
        if args.analyze:
            print(json.dumps(summarize_report('mta', mta_report), indent=2))
        else:
            print(json.dumps(mta_report, indent=2))
        print(f"\nSaved: {mta_path}")
        return

    # Ollama only
    if args.system == 'ollama':
        ollama_start = datetime.utcnow()
        ollama_report = run_simulation(
            servers=args.servers,
            encounter_class=args.encounter_class,
            limit=args.limit,
            debug=args.debug,
            triage_system='ollama',
            ollama_model=args.ollama_model,
            disable_fallback=True,
            use_poisson=args.poisson,
            poisson_rate_per_min=args.poisson_rate,
            poisson_seed=args.poisson_seed,
            poisson_start_at=args.poisson_start,
        )
        if not ollama_report:
            sys.exit(1)
        ollama_end = datetime.utcnow()
        # Persist results
        meta = {
            'system': 'ollama',
            'parameters': {
                'servers': args.servers,
                'limit': args.limit,
                'filter': args.encounter_class or 'all',
                'ollama_model': args.ollama_model,
            },
            'timestamp': ts,
            'started_at': ollama_start.isoformat() + 'Z',
            'ended_at': ollama_end.isoformat() + 'Z',
            'duration_seconds': (ollama_end - ollama_start).total_seconds(),
        }
        _dump(meta, 'parameters.json')
        ollama_path = _dump(ollama_report, 'ollama_results.json')
        # Plots
        plots_dir = run_outdir / 'plots' / 'ollama'
        save_system_plots(ollama_report, plots_dir)
        if args.analyze:
            print(json.dumps(summarize_report('ollama', ollama_report), indent=2))
        else:
            print(json.dumps(ollama_report, indent=2))
        print(f"\nSaved: {ollama_path}")
        return

    # Both: run MTA then Ollama and provide a comparison wrapper
    overall_start = datetime.utcnow()
    mta_start = datetime.utcnow()
    mta_report = run_simulation(
        servers=args.servers,
        encounter_class=args.encounter_class,
        limit=args.limit,
        debug=args.debug,
        triage_system='mta',
        disable_fallback=True,
        use_poisson=args.poisson,
        poisson_rate_per_min=args.poisson_rate,
        poisson_seed=args.poisson_seed,
        poisson_start_at=args.poisson_start,
    )
    if not mta_report:
        sys.exit(1)
    mta_end = datetime.utcnow()

    ollama_start = datetime.utcnow()
    ollama_report = run_simulation(
        servers=args.servers,
        encounter_class=args.encounter_class,
        limit=args.limit,
        debug=args.debug,
        triage_system='ollama',
        ollama_model=args.ollama_model,
        disable_fallback=True,
        use_poisson=args.poisson,
        poisson_rate_per_min=args.poisson_rate,
        poisson_seed=args.poisson_seed,
        poisson_start_at=args.poisson_start,
    )
    if not ollama_report:
        sys.exit(1)
    overall_end = datetime.utcnow()

    comparison = {
        'mta': summarize_report('mta', mta_report),
        'ollama': summarize_report('ollama', ollama_report),
        'diff_ollama_minus_mta': compare_reports(mta_report, ollama_report),
        'parameters': {
            'servers': args.servers,
            'limit': args.limit,
            'filter': args.encounter_class or 'all',
            'ollama_model': args.ollama_model,
        }
    }
    # Persist results
    meta = {
        'system': 'both',
        'parameters': {
            'servers': args.servers,
            'limit': args.limit,
            'filter': args.encounter_class or 'all',
            'ollama_model': args.ollama_model,
        },
        'timestamp': ts,
        'started_at': overall_start.isoformat() + 'Z',
        'ended_at': overall_end.isoformat() + 'Z',
        'duration_seconds': (overall_end - overall_start).total_seconds(),
        'runs': {
            'mta': {
                'started_at': mta_start.isoformat() + 'Z',
                'ended_at': mta_end.isoformat() + 'Z',
                'duration_seconds': (mta_end - mta_start).total_seconds(),
            },
            'ollama': {
                'started_at': ollama_start.isoformat() + 'Z',
                'ended_at': overall_end.isoformat() + 'Z',
                'duration_seconds': (overall_end - ollama_start).total_seconds(),
            },
        },
    }
    _dump(meta, 'parameters.json')
    mta_path = _dump(mta_report, 'mta_results.json')
    ollama_path = _dump(ollama_report, 'ollama_results.json')
    comparison_path = _dump(comparison, 'comparison.json')

    # Plots for both systems
    mta_plots_dir = run_outdir / 'plots' / 'mta'
    ollama_plots_dir = run_outdir / 'plots' / 'ollama'
    save_system_plots(mta_report, mta_plots_dir)
    save_system_plots(ollama_report, ollama_plots_dir)

    # Comparative overall metrics plot
    comp_plots_dir = run_outdir / 'plots'
    plot_overall_comparison(mta_report, ollama_report, comp_plots_dir)

    # Optional: dump detailed events for diagnostics
    if args.dump_events:
        ev_mta = pd.DataFrame(mta_report.get('events', []))
        ev_oll = pd.DataFrame(ollama_report.get('events', []))
        ev_mta_path = run_outdir / 'mta_events.csv'
        ev_oll_path = run_outdir / 'ollama_events.csv'
        ev_mta.to_csv(ev_mta_path, index=False)
        ev_oll.to_csv(ev_oll_path, index=False)

        # Build a side-by-side comparison by arrival_time ordering index
        def with_idx(df: 'pd.DataFrame', label: str) -> 'pd.DataFrame':
            if df.empty:
                return df
            d = df.copy()
            d = d.sort_values(['arrival_min', 'service_min']).reset_index(drop=True)
            d['sim_index'] = d.index
            cols = ['sim_index', 'arrival_min', 'service_min', 'priority', 'wait_min']
            return d[cols].rename(columns={
                'priority': f'priority_{label}',
                'wait_min': f'wait_min_{label}',
            })

        left = with_idx(ev_mta, 'mta')
        right = with_idx(ev_oll, 'ollama')
        comp = pd.merge(left, right, on=['sim_index', 'arrival_min', 'service_min'], how='outer', suffixes=('_mta', '_ollama'))
        comp_path = run_outdir / 'events_comparison.csv'
        comp.to_csv(comp_path, index=False)

    print(json.dumps(comparison, indent=2))
    print(f"\nSaved: {mta_path}\nSaved: {ollama_path}\nSaved: {comparison_path}")


if __name__ == '__main__':
    main()
