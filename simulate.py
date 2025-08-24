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

# Ensure project root on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from simulation.simulation import run_simulation  # type: ignore
from simulation.analytics.core.compare import summarize_report, compare_reports


# Compare helpers now imported from simulation.analytics.core.compare


def main():
    parser = argparse.ArgumentParser(description='Unified triage simulation CLI')
    parser.add_argument('--system', choices=['mta', 'ollama', 'both'], default='mta', help='Which triage system to run')
    parser.add_argument('--servers', type=int, default=3, help='Number of servers')
    parser.add_argument('--class', dest='encounter_class', default='', help='Filter by encounter class')
    parser.add_argument('--limit', type=int, default=100, help='Max number of encounters')
    parser.add_argument('--ollama-model', default='phi:2.7b', help='Ollama model, when system=ollama/both')
    parser.add_argument('--analyze', action='store_true', help='Print compact analysis summary to stdout')
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

    # Always place Ollama telemetry alongside results for ollama runs
    if args.system in ('ollama', 'both'):
        os.environ['OLLAMA_TELEMETRY_PATH'] = str(run_outdir / 'ollama_telemetry.jsonl')

    # MTA only
    if args.system == 'mta':
        mta_report = run_simulation(
            servers=args.servers,
            encounter_class=args.encounter_class,
            limit=args.limit,
            debug=args.debug,
            triage_system='mta',
            disable_fallback=True,
        )
        if not mta_report:
            sys.exit(1)
        # Persist results
        meta = {
            'system': 'mta',
            'parameters': {
                'servers': args.servers,
                'limit': args.limit,
                'filter': args.encounter_class or 'all',
            },
            'timestamp': ts,
        }
        _dump(meta, 'parameters.json')
        mta_path = _dump(mta_report, 'mta_results.json')
        if args.analyze:
            print(json.dumps(summarize_report('mta', mta_report), indent=2))
        else:
            print(json.dumps(mta_report, indent=2))
        print(f"\nSaved: {mta_path}")
        return

    # Ollama only
    if args.system == 'ollama':
        ollama_report = run_simulation(
            servers=args.servers,
            encounter_class=args.encounter_class,
            limit=args.limit,
            debug=args.debug,
            triage_system='ollama',
            ollama_model=args.ollama_model,
            disable_fallback=True,
        )
        if not ollama_report:
            sys.exit(1)
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
        }
        _dump(meta, 'parameters.json')
        ollama_path = _dump(ollama_report, 'ollama_results.json')
        if args.analyze:
            print(json.dumps(summarize_report('ollama', ollama_report), indent=2))
        else:
            print(json.dumps(ollama_report, indent=2))
        print(f"\nSaved: {ollama_path}")
        return

    # Both: run MTA then Ollama and provide a comparison wrapper
    mta_report = run_simulation(
        servers=args.servers,
        encounter_class=args.encounter_class,
        limit=args.limit,
        debug=args.debug,
        triage_system='mta',
        disable_fallback=True,
    )
    if not mta_report:
        sys.exit(1)

    ollama_report = run_simulation(
        servers=args.servers,
        encounter_class=args.encounter_class,
        limit=args.limit,
        debug=args.debug,
        triage_system='ollama',
        ollama_model=args.ollama_model,
        disable_fallback=True,
    )
    if not ollama_report:
        sys.exit(1)

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
    }
    _dump(meta, 'parameters.json')
    mta_path = _dump(mta_report, 'mta_results.json')
    ollama_path = _dump(ollama_report, 'ollama_results.json')
    comparison_path = _dump(comparison, 'comparison.json')
    print(json.dumps(comparison, indent=2))
    print(f"\nSaved: {mta_path}\nSaved: {ollama_path}\nSaved: {comparison_path}")


if __name__ == '__main__':
    main()
