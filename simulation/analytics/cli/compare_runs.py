#!/usr/bin/env python3
"""
Compare saved simulation runs without re-running simulations.
Usage examples:
  python -m simulation.analytics.cli.compare_runs --a output/simulation/jsonfiles/20250823_124620/mta_results.json \
      --b output/simulation/jsonfiles/20250824_091015/mta_results.json

  # Compare latest two runs automatically (same file name, e.g., mta_results.json)
  python -m simulation.analytics.cli.compare_runs --latest --file mta_results.json
"""
from __future__ import annotations
from pathlib import Path
import sys
import json
import argparse
from typing import Any, Dict, Tuple

# Ensure project root on sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from simulation.analytics.core.compare import summarize_report, compare_reports


def load_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text())


def find_latest_two(base: Path, filename: str) -> Tuple[Path, Path]:
    if not base.exists():
        raise FileNotFoundError(f"Base dir not found: {base}")
    runs = sorted([p for p in base.iterdir() if p.is_dir()], key=lambda p: p.name)
    if len(runs) < 2:
        raise RuntimeError(f"Need at least two runs in {base}")
    return runs[-2] / filename, runs[-1] / filename


def main():
    parser = argparse.ArgumentParser(description="Compare saved simulation runs")
    parser.add_argument('--a', type=str, help='Path to first JSON (older)')
    parser.add_argument('--b', type=str, help='Path to second JSON (newer)')
    parser.add_argument('--latest', action='store_true', help='Compare the latest two timestamped runs')
    parser.add_argument('--base', default='output/simulation/jsonfiles', help='Base directory of saved runs')
    parser.add_argument('--file', default='mta_results.json', help='Filename within each run folder when using --latest')
    args = parser.parse_args()

    if args.latest:
        path_a, path_b = find_latest_two(Path(args.base), args.file)
    else:
        if not args.a or not args.b:
            parser.error("Provide --a and --b paths, or use --latest with --file")
        path_a, path_b = Path(args.a), Path(args.b)

    report_a = load_json(path_a)
    report_b = load_json(path_b)

    name_a = path_a.stem.replace('_results', '')
    name_b = path_b.stem.replace('_results', '')

    summary = {
        'a': summarize_report(name_a, report_a),
        'b': summarize_report(name_b, report_b),
        'diff_b_minus_a': compare_reports(report_a, report_b),
        'files': {
            'a': str(path_a),
            'b': str(path_b),
        }
    }
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
