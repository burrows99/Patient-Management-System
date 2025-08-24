"""
Analytics dashboard helpers (module-only, no CLI).

Use from the root CLI (simulate.py) or other modules.
"""
from pathlib import Path
import json

from simulation.analytics.engine.analytics_dashboard import NHSTriageAnalytics
from simulation.utils.format_utils import NpEncoder


def generate_dashboard_summary(csv_path: Path) -> dict:
    """Generate the comprehensive analytics summary from an encounters CSV path."""
    analytics = NHSTriageAnalytics(str(csv_path))
    return analytics.generate_comprehensive_report()


def save_dashboard_summary(summary: dict, output_path: Path) -> None:
    """Persist a dashboard summary to JSON."""
    output_path.write_text(json.dumps(summary, indent=2, cls=NpEncoder))

