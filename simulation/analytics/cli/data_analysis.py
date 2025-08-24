#!/usr/bin/env python3
"""
Thin data analysis wrapper (namespaced) that generates analytics_summary.json
"""
from pathlib import Path
import sys
import json

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from simulation.analytics.engine.analytics_dashboard import NHSTriageAnalytics
from simulation.utils.format_utils import print_section, NpEncoder


def main():
    script_dir = Path(__file__).parent
    csv_path = PROJECT_ROOT / 'output' / 'csv' / 'encounters.csv'

    analytics = NHSTriageAnalytics(str(csv_path))
    summary = analytics.generate_comprehensive_report()

    out_path = PROJECT_ROOT / 'analytics_summary.json'
    out_path.write_text(json.dumps(summary, indent=2, cls=NpEncoder))

    print_section("✅ Analysis summary saved")
    print(str(out_path))


if __name__ == '__main__':
    main()
