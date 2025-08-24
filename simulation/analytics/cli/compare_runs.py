"""
Compare saved simulation runs without re-running simulations.

This module provides helpers that can be imported and invoked from the root CLI
(`simulate.py`) or other modules. It no longer exposes a command-line interface.
"""
from __future__ import annotations
from pathlib import Path
import sys
import json
from typing import Any, Dict, Tuple

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


def compare_two_reports(path_a: Path, path_b: Path) -> Dict[str, Any]:
    """Return a summary/diff dict comparing two saved report JSON files."""
    report_a = load_json(path_a)
    report_b = load_json(path_b)
    name_a = path_a.stem.replace('_results', '')
    name_b = path_b.stem.replace('_results', '')
    return {
        'a': summarize_report(name_a, report_a),
        'b': summarize_report(name_b, report_b),
        'diff_b_minus_a': compare_reports(report_a, report_b),
        'files': {'a': str(path_a), 'b': str(path_b)},
    }


def compare_latest_two(base: Path, filename: str = 'mta_results.json') -> Dict[str, Any]:
    """Find the latest two runs and return the comparison summary/diff."""
    a, b = find_latest_two(base, filename)
    return compare_two_reports(a, b)

