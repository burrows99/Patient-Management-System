#!/usr/bin/env python3
"""
Unified CLI entry point for NHS-MOA triage simulations.

Examples:
  # Run MTA only
  python simulate.py --system mta --limit 100 --servers 3 --compressTo 8hours

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

# Ensure project root on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from simulation.simulation import run_simulation  # type: ignore


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


def main():
    parser = argparse.ArgumentParser(description='Unified triage simulation CLI')
    parser.add_argument('--system', choices=['mta', 'ollama', 'both'], default='mta', help='Which triage system to run')
    parser.add_argument('--servers', type=int, default=3, help='Number of servers')
    parser.add_argument('--class', dest='encounter_class', default='', help='Filter by encounter class')
    parser.add_argument('--limit', type=int, default=100, help='Max number of encounters')
    parser.add_argument('--compressTo', default='8hours', help='Compression duration (e.g., 8hours, 1day)')
    parser.add_argument('--ollama-model', default='phi:2.7b', help='Ollama model, when system=ollama/both')
    parser.add_argument('--analyze', action='store_true', help='Print compact analysis summary to stdout')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging in underlying simulation')
    args = parser.parse_args()

    # MTA only
    if args.system == 'mta':
        mta_report = run_simulation(
            servers=args.servers,
            encounter_class=args.encounter_class,
            limit=args.limit,
            compress_to=args.compressTo,
            debug=args.debug,
            triage_system='mta',
            disable_fallback=True,
        )
        if not mta_report:
            sys.exit(1)
        if args.analyze:
            print(json.dumps(summarize_report('mta', mta_report), indent=2))
        else:
            print(json.dumps(mta_report, indent=2))
        return

    # Ollama only
    if args.system == 'ollama':
        ollama_report = run_simulation(
            servers=args.servers,
            encounter_class=args.encounter_class,
            limit=args.limit,
            compress_to=args.compressTo,
            debug=args.debug,
            triage_system='ollama',
            ollama_model=args.ollama_model,
            disable_fallback=True,
        )
        if not ollama_report:
            sys.exit(1)
        if args.analyze:
            print(json.dumps(summarize_report('ollama', ollama_report), indent=2))
        else:
            print(json.dumps(ollama_report, indent=2))
        return

    # Both: run MTA then Ollama and provide a comparison wrapper
    mta_report = run_simulation(
        servers=args.servers,
        encounter_class=args.encounter_class,
        limit=args.limit,
        compress_to=args.compressTo,
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
        compress_to=args.compressTo,
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
            'compressTo': args.compressTo,
            'filter': args.encounter_class or 'all',
            'ollama_model': args.ollama_model,
        }
    }
    print(json.dumps(comparison, indent=2))


if __name__ == '__main__':
    main()
