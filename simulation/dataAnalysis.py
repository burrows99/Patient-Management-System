#!/usr/bin/env python3
"""
Thin wrapper that reuses NHSTriageAnalytics from `simulation/dashboard.py`.
This avoids duplicated analytics logic and preserves a simple entrypoint.
"""

from pathlib import Path
import sys

# Ensure project root is on sys.path when running as a script
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from simulation.dashboard import NHSTriageAnalytics
from simulation.utils.format_utils import print_section, NpEncoder


def main():
    script_dir = Path(__file__).parent
    csv_path = script_dir.parent / 'output' / 'csv' / 'encounters.csv'

    analytics = NHSTriageAnalytics(str(csv_path))
    summary = analytics.generate_comprehensive_report()

    # Save summary next to repo root for consistency
    out_path = script_dir.parent / 'analytics_summary.json'
    out_path.write_text(__import__('json').dumps(summary, indent=2, cls=NpEncoder))

    print_section("✅ Analysis summary saved")
    print(str(out_path))


if __name__ == '__main__':
    main()