"""
NHS MOA Triage System Analytics Dashboard helpers (module-only, no CLI).
"""

from pathlib import Path
import json

from simulation.analytics.engine.analytics_dashboard import NHSTriageAnalytics
from simulation.utils.format_utils import NpEncoder


def make_dashboard_summary(csv_path: Path) -> dict:
    analytics = NHSTriageAnalytics(str(csv_path))
    return analytics.generate_comprehensive_report()


def write_dashboard_summary(summary: dict, output_path: Path) -> None:
    output_path.write_text(json.dumps(summary, indent=2, cls=NpEncoder))
