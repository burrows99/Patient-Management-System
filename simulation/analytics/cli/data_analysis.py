"""
Thin analysis helpers (module-only, no CLI).
"""
from pathlib import Path
import json

from simulation.analytics.engine.analytics_dashboard import NHSTriageAnalytics
from simulation.utils.format_utils import NpEncoder


def analyze_to_summary(csv_path: Path) -> dict:
    analytics = NHSTriageAnalytics(str(csv_path))
    return analytics.generate_comprehensive_report()


def save_summary(summary: dict, out_path: Path) -> None:
    out_path.write_text(json.dumps(summary, indent=2, cls=NpEncoder))

