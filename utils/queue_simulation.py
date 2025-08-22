#!/usr/bin/env python3
"""
Queueing simulation using SimPy over Synthea encounters.
- Arrivals: derived from sorted START timestamps in output/csv/encounters.csv
- Service times: STOP-START (minutes), fallback to configurable default if missing
- Servers: Resource capacity (default 1), configurable via --servers
- Filter: by ENCOUNTERCLASS via --class (e.g., emergency, ambulatory, wellness). If omitted, uses all.

Usage examples:
  python utils/queue_simulation.py --servers=2 --class=emergency --limit=1000
  python utils/queue_simulation.py --servers=4
"""

import argparse
import csv
import json
import math
from dataclasses import dataclass
from pathlib import Path
from datetime import datetime
import simpy

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / 'output' / 'csv' / 'encounters.csv'


def to_ms(iso_str: str) -> float:
    if not iso_str:
        return math.nan
    try:
        # Handle both 'Z' and offset-less
        if iso_str.endswith('Z'):
            # Remove 'Z' and parse as UTC naive
            iso_str = iso_str[:-1]
        # Try with full datetime including seconds
        dt = datetime.fromisoformat(iso_str)
        return dt.timestamp() * 1000.0
    except Exception:
        try:
            # Fallback generic parse
            return datetime.strptime(iso_str, '%Y-%m-%dT%H:%M:%S').timestamp() * 1000.0
        except Exception:
            return math.nan


def minutes_between(start_iso: str, stop_iso: str, default_service_min: float) -> float:
    a = to_ms(start_iso)
    b = to_ms(stop_iso)
    if math.isnan(a) or math.isnan(b) or b <= a:
        return default_service_min
    return (b - a) / 60000.0


@dataclass
class Encounter:
    patient_id: str
    klass: str
    start_ms: float
    stop_ms: float
    service_min: float


def load_encounters(encounter_class: str, limit: int, default_service_min: float) -> list[Encounter]:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Encounters CSV not found at {CSV_PATH}")

    encs: list[Encounter] = []
    with CSV_PATH.open(newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            klass = (row.get('ENCOUNTERCLASS') or '').strip().lower()
            if encounter_class and klass != encounter_class:
                continue
            start_ms = to_ms(row.get('START') or '')
            stop_ms = to_ms(row.get('STOP') or '')
            if math.isnan(start_ms):
                continue
            service_min = minutes_between(row.get('START') or '', row.get('STOP') or '', default_service_min)
            encs.append(Encounter(
                patient_id=row.get('PATIENT') or '',
                klass=klass,
                start_ms=start_ms,
                stop_ms=stop_ms,
                service_min=service_min,
            ))
            if limit and len(encs) >= limit:
                break

    encs.sort(key=lambda e: e.start_ms)
    return encs


class Stats:
    def __init__(self):
        self.n = 0
        self.sum = 0.0
        self.max = 0.0

    def add(self, x: float):
        self.n += 1
        self.sum += x
        if x > self.max:
            self.max = x

    @property
    def mean(self) -> float:
        return (self.sum / self.n) if self.n else 0.0


def simulate(encounters: list[Encounter], servers: int) -> dict:
    env = simpy.Environment()
    resource = simpy.Resource(env, capacity=max(1, servers))

    t0 = encounters[0].start_ms
    arrivals = [((e.start_ms - t0) / 60000.0, e.service_min, e.patient_id) for e in encounters]

    wait_stats = Stats()
    sys_stats = Stats()
    service_stats = Stats()
    completed = 0
    last_completion = 0.0

    def patient_process(arrival_min: float, service_min: float, pid: str):
        nonlocal completed, last_completion
        # Wait until arrival
        yield env.timeout(max(0.0, arrival_min - env.now))
        t_arr = env.now

        with resource.request() as req:
            yield req
            wait = env.now - t_arr
            if wait < 0:
                wait = 0.0
            wait_stats.add(wait)

            # Service
            service_stats.add(service_min)
            yield env.timeout(max(0.0, service_min))

            t_done = env.now
            sys_stats.add(t_done - t_arr)
            completed += 1
            if t_done > last_completion:
                last_completion = t_done

    # Start all patients immediately; they self-delay to arrival times
    for a_min, s_min, pid in arrivals:
        env.process(patient_process(a_min, s_min, pid))

    env.run()  # until all processes finish

    # Utilization approx: total service time / (servers * makespan)
    total_service = completed * service_stats.mean
    makespan = last_completion if last_completion > 0 else (arrivals[-1][0] + 1)
    util = min(1.0, total_service / (servers * makespan)) if makespan > 0 else 0.0

    return {
        'servers': servers,
        'arrivals': len(arrivals),
        'completed': completed,
        'avg_wait_min': round(wait_stats.mean, 2),
        'max_wait_min': round(wait_stats.max, 2),
        'avg_service_min': round(service_stats.mean, 2),
        'avg_time_in_system_min': round(sys_stats.mean, 2),
        'utilization': round(util, 4),
        'horizon_min': round(makespan, 2),
    }


def main():
    p = argparse.ArgumentParser(description='SimPy queue simulation for encounters.csv')
    p.add_argument('--servers', type=int, default=1, help='Number of parallel servers (capacity)')
    p.add_argument('--class', dest='klass', type=str, default='', help='Encounter class filter (e.g., emergency)')
    p.add_argument('--limit', type=int, default=0, help='Limit number of encounters read')
    p.add_argument('--defaultServiceMin', type=float, default=15.0, help='Fallback service duration in minutes')
    args = p.parse_args()

    encounters = load_encounters(args.klass.strip().lower(), args.limit, args.defaultServiceMin)
    if not encounters:
        print(json.dumps({'error': 'No encounters matched the filter', 'filter': args.klass or 'all'}))
        return

    report = simulate(encounters, max(1, args.servers))
    report['filter'] = (args.klass or 'all')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
