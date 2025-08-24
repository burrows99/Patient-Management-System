#!/usr/bin/env python3
"""
CLI for the analytics dashboard (namespaced under simulation/analytics/cli/)
"""
from pathlib import Path
import sys
import json

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from simulation.analytics.engine.analytics_dashboard import NHSTriageAnalytics
from simulation.utils.format_utils import NpEncoder


def main():
    try:
        script_dir = Path(__file__).parent
        csv_path = PROJECT_ROOT / 'output' / 'csv' / 'encounters.csv'
        if not csv_path.exists():
            print(f"❌ CSV file not found: {csv_path}")
            return

        analytics = NHSTriageAnalytics(str(csv_path))
        summary = analytics.generate_comprehensive_report()

        output_path = PROJECT_ROOT / 'analytics_summary.json'
        with open(output_path, 'w') as f:
            json.dump(summary, f, indent=2, cls=NpEncoder)

        print(f"\n💾 Summary report saved: {output_path}")
        print("\n✅ Analysis complete! Use the recommendations above to optimize your triage system.")

    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == '__main__':
    main()
