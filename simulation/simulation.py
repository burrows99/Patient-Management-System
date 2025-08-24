#!/usr/bin/env python3
"""
Time-compressed Manchester Triage System simulation for sparse encounter data.
Compresses long time periods into shorter simulation periods for realistic queue analysis.

Usage:
    python simulation/simulation.py --compressTo=8hours --servers=3 --debug

Design notes (SOLID):
- SRP: This module orchestrates the simulation run only. Aggregation/report building lives in
  `simulation/utils/sim_reporting.py`. Data loading is delegated to `simulation/services/encounter_loader.py`.
- DIP: Dependencies like CSV path and loader function are injected via `run_simulation(...)` args.
- OCP: New triage systems can be introduced via `create_triage_system(...)` factory without changing core logic.
"""

import argparse
import json
import sys
import logging
import random
from pathlib import Path
from typing import List, Dict, Optional, Any, Tuple, Union, Callable

# Ensure project root is on sys.path when running as a script
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from simulation.services.encounter_loader import (
    load_and_prepare_encounters as svc_load_and_prepare_encounters,
)
from simulation.engine.simulator import CompressedMTSSimulation
from simulation.domain.triage_factory import create_triage_system, TriageSystemType
from simulation.utils.time_utils import (
    parse_duration_to_hours,
    compute_horizon,
    humanize_minutes,
)
from simulation.utils.sim_reporting import build_simulation_report


def run_simulation(servers: int = 3,
                   encounter_class: Optional[str] = '',
                   limit: int = 100,
                   compress_to: str = '8hours',
                   debug: bool = False,
                   triage_system: TriageSystemType = "mta",
                   ollama_model: Optional[str] = None,
                   disable_fallback: bool = True,
                   csv_path: Optional[Union[str, Path]] = None,
                   loader: Optional[Callable[[str, Optional[str], int, int, bool], List[Dict]]] = None,
                   seed: Optional[int] = 42) -> Dict:
    """Run the time-compressed MTS simulation and return the report dict.

    Dependencies are injected via parameters (csv_path, loader) to improve testability and separation of concerns.
    """

    # Parse compression parameter using utils
    compression_hours = parse_duration_to_hours(compress_to, default_hours=8)

    # Seed RNG deterministically unless caller overrides
    if seed is not None:
        random.seed(seed)

    # Resolve CSV path (injected or default)
    if csv_path is None:
        script_dir = Path(__file__).parent
        csv_path = script_dir.parent / 'output' / 'csv' / 'encounters.csv'
    else:
        csv_path = Path(csv_path)

    try:
        load_fn = loader or svc_load_and_prepare_encounters
        encounters = load_fn(
            str(csv_path),
            encounter_class or '',
            limit,
            compression_hours,
            debug,
        )

        if not encounters:
            logging.warning("No encounters found.")
            return {}

        # If using Ollama triage, ensure priorities are not pre-assigned by MTA
        if triage_system == "ollama":
            for enc in encounters:
                if "priority" in enc:
                    del enc["priority"]

        # Set simulation horizon via utils
        horizon = compute_horizon(encounters)

        logging.debug("\nSimulation parameters:")
        logging.debug(f"  Horizon: {humanize_minutes(horizon)}")
        logging.debug(f"  Servers: {servers}")

        # Initialize the appropriate triage system
        triage_kwargs = {}
        if triage_system == "ollama":
            if ollama_model:
                triage_kwargs["model_name"] = ollama_model
            # Always disable fallback for Ollama per requirement
            triage_kwargs["disable_fallback"] = True
            
        triage = create_triage_system(triage_system, **triage_kwargs)
        
        if debug:
            logging.info(f"Using {triage_system.upper()} triage system")
            if triage_system == "ollama":
                logging.info(f"Ollama model: {ollama_model}")
                logging.info(f"Ollama fallback disabled: True")
        
        # Run simulation with the selected triage system
        simulation = CompressedMTSSimulation(servers=servers, triage_system=triage)
        results = simulation.run_simulation(encounters, horizon)

        # Build final report via reporting utilities
        parameters = {
            'original_encounters': len(encounters),
            'servers': servers,
            'compression_target': compress_to,
            'filter': encounter_class or 'all',
        }
        report = build_simulation_report(parameters, results, horizon)

        return report
    except Exception:
        logging.exception("Simulation error")
        return {}


def main():
    parser = argparse.ArgumentParser(description='Run MTS simulation with time compression.')
    parser.add_argument('--servers', type=int, default=3, help='Number of servers (default: 3)')
    parser.add_argument('--class', dest='encounter_class', default='', help='Filter by encounter class')
    parser.add_argument('--limit', type=int, default=100, help='Max number of encounters (default: 100)')
    parser.add_argument('--compressTo', default='8hours', help='Compress to duration (e.g., 8hours, 1day)')
    parser.add_argument('--triage', choices=["mta", "ollama"], default="mta", 
                       help='Triage system to use (mta or ollama)')
    parser.add_argument('--ollama-model', default='phi:2.7b',
                       help='Ollama model to use (default: phi:2.7b)')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    args = parser.parse_args()

    # Configure logging here (not inside core logic) per SRP
    logging.basicConfig(
        level=logging.DEBUG if args.debug else logging.INFO,
        format='[%(levelname)s] %(message)s',
        stream=sys.stderr,
    )

    report = run_simulation(
        servers=args.servers,
        encounter_class=args.encounter_class,
        limit=args.limit,
        compress_to=args.compressTo,
        debug=args.debug,
        triage_system=args.triage,
        ollama_model=args.ollama_model if args.triage == "ollama" else None,
        disable_fallback=True if args.triage == "ollama" else True
    )

    if not report:
        sys.exit(1)

    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()