#!/usr/bin/env python3
"""
Single entrypoint to run analytics dashboard and then the time-compressed simulation.
- Runs comprehensive analysis (prints insights and writes summary JSON)
- Picks recommended simulation parameters
- Runs simulation and prints the final JSON report
"""

from pathlib import Path
import argparse
import json

from simulation.dashboard import NHSTriageAnalytics
from simulation.utils.format_utils import print_section, NpEncoder
from simulation.simulation import run_simulation


def main():
    parser = argparse.ArgumentParser(description="Run analytics dashboard then simulation")
    parser.add_argument('--class', dest='encounter_class', type=str, default='', help='Filter by encounter class')
    parser.add_argument('--limit', type=int, default=100, help='Limit number of encounters for simulation')
    parser.add_argument('--compressTo', type=str, default='8hours', help='Compress timeline to: Nhours, Ndays')
    parser.add_argument('--servers', type=int, default=None, help='Override server count (if omitted, uses recommended)')
    parser.add_argument('--debug', action='store_true', help='Show debug information for simulation')
    args = parser.parse_args()

    # Locate CSV used by both analytics and simulation
    script_dir = Path(__file__).parent
    csv_path = script_dir.parent / 'output' / 'csv' / 'encounters.csv'

    # 1) Run analytics dashboard (prints sections and returns summary dict)
    analytics = NHSTriageAnalytics(str(csv_path))
    summary = analytics.generate_comprehensive_report()

    # Persist summary next to repo root for external consumption
    summary_path = script_dir.parent / 'analytics_summary.json'
    summary_path.write_text(json.dumps(summary, indent=2, cls=NpEncoder))

    # 2) Decide simulation parameters
    recommended_servers = None
    try:
        recommended_servers = int(summary.get('recommendations', {}).get('recommended_servers'))
    except Exception:
        recommended_servers = None

    servers = args.servers if args.servers is not None else (recommended_servers or 3)

    print_section("▶ RUNNING SIMULATION WITH RECOMMENDED SETTINGS")
    print(f"Servers: {servers}")
    if args.encounter_class:
        print(f"Class filter: {args.encounter_class}")
    print(f"CompressTo: {args.compressTo} | Limit: {args.limit}")

    # 3) Run simulation
    report = run_simulation(
        servers=servers,
        encounter_class=args.encounter_class,
        limit=args.limit,
        compress_to=args.compressTo,
        debug=args.debug,
    )

    # Print final simulation JSON
    print_section("✅ SIMULATION REPORT (JSON)")
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
