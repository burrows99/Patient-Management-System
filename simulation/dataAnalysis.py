"""
Module helpers for data analysis (no CLI).
"""

from pathlib import Path
import json

from simulation.analytics.engine.analytics_dashboard import NHSTriageAnalytics
from simulation.utils.format_utils import NpEncoder


def run_analysis(csv_path: Path) -> dict:
    analytics = NHSTriageAnalytics(str(csv_path))
    return analytics.generate_comprehensive_report()


def save_analysis(summary: dict, out_path: Path) -> None:
    out_path.write_text(json.dumps(summary, indent=2, cls=NpEncoder))
