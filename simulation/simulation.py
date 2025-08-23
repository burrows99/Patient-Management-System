#!/usr/bin/env python3
"""
Time-compressed Manchester Triage System simulation for sparse encounter data.
Compresses long time periods into shorter simulation periods for realistic queue analysis.

Usage:
    python simulation/simulation.py --compressTo=8hours --servers=3 --debug
"""

import argparse
import json
import sys
import logging
import random
from pathlib import Path
from typing import List, Dict
import pandas as pd
from simulation.services.encounter_loader import (
    load_and_prepare_encounters as svc_load_and_prepare_encounters,
)
from simulation.engine.simulator import (
    CompressedMTSSimulation as EngineCompressedMTSSimulation,
)
from simulation.domain.manchester import ManchesterTriageSystem
from simulation.utils.time_utils import (
    parse_duration_to_hours,
    compute_horizon,
    humanize_minutes,
)


def run_simulation(servers: int = 3,
                   encounter_class: str | None = '',
                   limit: int = 100,
                   compress_to: str = '8hours',
                   debug: bool = False) -> Dict:
    """Run the time-compressed MTS simulation and return the report dict."""
    # Configure logging based on debug
    logging.basicConfig(
        level=logging.DEBUG if debug else logging.INFO,
        format='[%(levelname)s] %(message)s',
        stream=sys.stderr,
    )

    # Parse compression parameter using utils
    compression_hours = parse_duration_to_hours(compress_to, default_hours=8)

    random.seed(42)  # Reproducible results

    # Find CSV
    script_dir = Path(__file__).parent
    csv_path = script_dir.parent / 'output' / 'csv' / 'encounters.csv'

    try:
        encounters = svc_load_and_prepare_encounters(
            str(csv_path),
            encounter_class or '',
            limit,
            compression_hours,
            debug,
        )

        if not encounters:
            logging.warning("No encounters found.")
            return {}

        # Set simulation horizon via utils
        horizon = compute_horizon(encounters)

        logging.debug("\nSimulation parameters:")
        logging.debug(f"  Horizon: {humanize_minutes(horizon)}")
        logging.debug(f"  Servers: {servers}")

        # Run simulation
        simulation = EngineCompressedMTSSimulation(servers)
        results = simulation.run_simulation(encounters, horizon)

        # Aggregate with pandas
        events = results.get('events', [])
        df = pd.DataFrame(events)

        priority_breakdown: Dict[int, Dict] = {}
        if not df.empty:
            # Vectorized breach calc per priority
            breached = (df['wait_min'] > df['max_wait_min']).astype(int)
            grp = df.assign(breached=breached).groupby('priority', as_index=True)

            stats = grp.agg(
                patients=('patient_id', 'count'),
                avg_wait_min=('wait_min', 'mean'),
                p95_wait_min=('wait_min', lambda x: x.quantile(0.95)),
                breaches=('breached', 'sum'),
            )

            # Manchester metadata as DataFrame for merge
            mts_meta = (
                pd.DataFrame(
                    {
                        p: {
                            'color': info.color,
                            'target_max_wait_min': info.max_wait_min,
                        }
                        for p, info in ManchesterTriageSystem.PRIORITIES.items()
                    }
                )
                .T
            )

            merged = stats.join(mts_meta, how='left')
            merged['breach_rate_percent'] = (merged['breaches'] / merged['patients'] * 100).round(1)
            merged['avg_wait_min'] = merged['avg_wait_min'].round(1)
            merged['p95_wait_min'] = merged['p95_wait_min'].round(1)
            merged['name'] = merged.index.map(lambda p: f"P{int(p)} ({merged.loc[p, 'color']})")

            # Convert to dict-of-dicts keyed by priority
            priority_breakdown = (
                merged[
                    ['name', 'target_max_wait_min', 'patients', 'avg_wait_min', 'p95_wait_min', 'breach_rate_percent', 'breaches']
                ]
                .astype({
                    'patients': 'int64',
                    'breaches': 'int64',
                })
                .to_dict(orient='index')
            )

            # System metrics via pandas
            system_metrics = {
                'total_patients': int(len(df)),
                'overall_breach_rate_percent': float(((df['wait_min'] > df['max_wait_min']).mean() * 100).round(1)),
                'overall_avg_wait_min': float(df['wait_min'].mean().round(1)),
                'overall_p95_wait_min': float(df['wait_min'].quantile(0.95).round(1)),
            }
        else:
            system_metrics = {
                'total_patients': 0,
                'overall_breach_rate_percent': 0.0,
                'overall_avg_wait_min': 0.0,
                'overall_p95_wait_min': 0.0,
            }

        # Final report
        report = {
            'simulation_type': 'time_compressed_manchester_triage',
            'parameters': {
                'original_encounters': len(encounters),
                'servers': servers,
                'compression_target': compress_to,
                'filter': encounter_class or 'all'
            },
            'completed': results['completed'],
            'system_performance': system_metrics,
            'priority_breakdown': priority_breakdown,
            'simulation_time_hours': round(horizon / 60, 1)
        }

        return report
    except Exception:
        logging.exception("Simulation error")
        return {}


def main():
    parser = argparse.ArgumentParser(description='Time-compressed Manchester Triage System simulation')
    parser.add_argument('--servers', type=int, default=3,
                       help='Number of clinical staff (default: 3)')
    parser.add_argument('--class', dest='encounter_class', type=str, default='',
                       help='Filter by encounter class')
    parser.add_argument('--limit', type=int, default=100,
                       help='Limit number of encounters (default: 100)')
    parser.add_argument('--compressTo', type=str, default='8hours',
                       help='Compress timeline to: Nhours, Ndays (default: 8hours)')
    parser.add_argument('--debug', action='store_true',
                       help='Show debug information')
    
    args = parser.parse_args()
    report = run_simulation(
        servers=args.servers,
        encounter_class=args.encounter_class,
        limit=args.limit,
        compress_to=args.compressTo,
        debug=args.debug,
    )

    if not report:
        sys.exit(1)

    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()