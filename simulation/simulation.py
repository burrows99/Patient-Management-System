#!/usr/bin/env python3
"""
Time-compressed Manchester Triage System simulation for sparse encounter data.
Compresses long time periods into shorter simulation periods for realistic queue analysis.

Usage:
    python utils/compressed_mts_simulation.py --compressTo=8hours --servers=3 --debug
"""

import argparse
import json
import os
import sys
import random
from pathlib import Path
from datetime import datetime, timedelta
import pandas as pd
import simpy
from typing import List, Dict, Optional, Tuple
import numpy as np


class ManchesterTriageSystem:
    """Manchester Triage System priority levels and wait times"""
    
    PRIORITIES = {
        1: {"name": "Immediate", "color": "Red", "max_wait_min": 0, "weight": 0.05},
        2: {"name": "Very Urgent", "color": "Orange", "max_wait_min": 10, "weight": 0.15}, 
        3: {"name": "Urgent", "color": "Yellow", "max_wait_min": 60, "weight": 0.30},
        4: {"name": "Standard", "color": "Green", "max_wait_min": 120, "weight": 0.35},
        5: {"name": "Non-urgent", "color": "Blue", "max_wait_min": 240, "weight": 0.15}
    }
    
    ENCOUNTER_PRIORITY_MAP = {
        'emergency': [1, 2, 3],
        'ambulatory': [3, 4, 5],
        'wellness': [4, 5],
        'outpatient': [3, 4, 5],
        'inpatient': [2, 3, 4],
        'urgentcare': [2, 3, 4],
    }
    
    @classmethod
    def assign_priority(cls, encounter_class: str, reason_description: str = "") -> int:
        """Assign MTS priority based on encounter type and clinical reason"""
        encounter_class = encounter_class.lower()
        reason = reason_description.lower()
        
        # High priority clinical indicators
        high_priority_terms = [
            'cardiac arrest', 'stroke', 'trauma', 'bleeding', 'fracture',
            'chest pain', 'difficulty breathing', 'unconscious', 'emergency'
        ]
        
        medium_priority_terms = [
            'pain', 'infection', 'fever', 'injury', 'acute', 'urgent'
        ]
        
        if any(term in reason for term in high_priority_terms):
            return random.choice([1, 2, 2])  # Bias toward P2
        
        if any(term in reason for term in medium_priority_terms):
            return random.choice([2, 3, 3])  # Bias toward P3
        
        # Use encounter class mapping
        if encounter_class in cls.ENCOUNTER_PRIORITY_MAP:
            priorities = cls.ENCOUNTER_PRIORITY_MAP[encounter_class]
            weights = [cls.PRIORITIES[p]['weight'] for p in priorities]
            return random.choices(priorities, weights=weights)[0]
        
        return 4  # Default


class PriorityStats:
    """Statistics for each priority level"""
    def __init__(self):
        self.wait_times = []
        self.service_times = []
        self.breached_targets = 0
        
    def add_patient(self, wait_time: float, service_time: float, max_wait: float):
        self.wait_times.append(wait_time)
        self.service_times.append(service_time)
        if wait_time > max_wait:
            self.breached_targets += 1
    
    @property
    def count(self) -> int:
        return len(self.wait_times)
    
    @property
    def breach_rate(self) -> float:
        return (self.breached_targets / self.count * 100) if self.count > 0 else 0
    
    @property
    def avg_wait(self) -> float:
        return np.mean(self.wait_times) if self.wait_times else 0
    
    @property
    def p95_wait(self) -> float:
        return np.percentile(self.wait_times, 95) if self.wait_times else 0


class CompressedMTSSimulation:
    """MTS simulation with time compression for sparse data"""
    
    def __init__(self, servers: int = 1):
        self.env = simpy.Environment()
        self.facility = simpy.PriorityResource(self.env, capacity=servers)
        self.servers = servers
        self.priority_stats = {p: PriorityStats() for p in range(1, 6)}
        self.completed = 0
    
    def patient_process(self, patient_id: str, arrival_time: float, priority: int, service_time: float):
        """Patient process with priority-based treatment"""
        yield self.env.timeout(arrival_time)
        
        arrival_timestamp = self.env.now
        max_wait = ManchesterTriageSystem.PRIORITIES[priority]['max_wait_min']
        
        with self.facility.request(priority=priority) as request:
            yield request
            
            service_start = self.env.now
            wait_time = service_start - arrival_timestamp
            
            yield self.env.timeout(service_time)
            
            self.priority_stats[priority].add_patient(wait_time, service_time, max_wait)
            self.completed += 1
    
    def run_simulation(self, encounters: List[Dict], horizon: float):
        """Run the compressed simulation"""
        for encounter in encounters:
            self.env.process(self.patient_process(
                encounter['patient_id'],
                encounter['arrival_min'],
                encounter['priority'],
                encounter['service_min']
            ))
        
        self.env.run(until=horizon)
        
        # Compile results
        results = {
            'completed': self.completed,
            'priority_breakdown': {},
            'system_metrics': {}
        }
        
        total_patients = 0
        total_breaches = 0
        all_wait_times = []
        
        for priority, stats in self.priority_stats.items():
            if stats.count > 0:
                mts_info = ManchesterTriageSystem.PRIORITIES[priority]
                results['priority_breakdown'][priority] = {
                    'name': f"P{priority} ({mts_info['color']})",
                    'target_max_wait_min': mts_info['max_wait_min'],
                    'patients': stats.count,
                    'avg_wait_min': round(stats.avg_wait, 1),
                    'p95_wait_min': round(stats.p95_wait, 1),
                    'breach_rate_percent': round(stats.breach_rate, 1),
                    'breaches': stats.breached_targets
                }
                total_patients += stats.count
                total_breaches += stats.breached_targets
                all_wait_times.extend(stats.wait_times)
        
        # System-wide metrics
        results['system_metrics'] = {
            'total_patients': total_patients,
            'overall_breach_rate_percent': round(total_breaches / total_patients * 100, 1) if total_patients > 0 else 0,
            'overall_avg_wait_min': round(np.mean(all_wait_times), 1) if all_wait_times else 0,
            'overall_p95_wait_min': round(np.percentile(all_wait_times, 95), 1) if all_wait_times else 0
        }
        
        return results


def compress_encounter_times(encounters: List[Dict], compression_hours: int = 8, debug: bool = False) -> List[Dict]:
    """Compress encounter times into a shorter period while maintaining relative timing"""
    
    if len(encounters) <= 1:
        return encounters
    
    # Calculate original time span
    original_span_min = encounters[-1]['arrival_min'] - encounters[0]['arrival_min']
    target_span_min = compression_hours * 60
    
    if debug:
        print(f"Time compression:", file=sys.stderr)
        print(f"  Original span: {original_span_min:.1f} minutes ({original_span_min/60/24:.1f} days)", file=sys.stderr)
        print(f"  Target span: {target_span_min} minutes ({compression_hours} hours)", file=sys.stderr)
    
    if original_span_min <= target_span_min:
        if debug:
            print(f"  No compression needed", file=sys.stderr)
        return encounters
    
    # Apply compression while maintaining relative positions
    compression_factor = target_span_min / original_span_min
    
    for encounter in encounters:
        original_arrival = encounter['arrival_min']
        encounter['arrival_min'] = original_arrival * compression_factor
    
    if debug:
        print(f"  Compression factor: {compression_factor:.4f}", file=sys.stderr)
        print(f"  New span: {encounters[-1]['arrival_min']:.1f} minutes", file=sys.stderr)
    
    return encounters


def load_and_prepare_encounters(csv_path: str, class_filter: str = None, limit: int = 0,
                               compression_hours: int = 8, debug: bool = False) -> List[Dict]:
    """Load encounters and prepare for compressed simulation"""
    
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV not found: {csv_path}")
    
    df = pd.read_csv(csv_path)
    if debug:
        print(f"Loaded {len(df)} encounters from CSV", file=sys.stderr)
    
    encounters = []
    
    for _, row in df.iterrows():
        try:
            encounter_class = str(row.get('ENCOUNTERCLASS', '')).lower()
            if class_filter and encounter_class != class_filter.lower():
                continue
            
            start_dt = pd.to_datetime(row.get('START'))
            if pd.isna(start_dt):
                continue
            
            # Calculate service time
            stop_dt = pd.to_datetime(row.get('STOP'))
            if pd.isna(stop_dt):
                service_time = 20.0  # Default
            else:
                service_time = max(5, min(480, (stop_dt - start_dt).total_seconds() / 60.0))
            
            encounters.append({
                'patient_id': str(row.get('PATIENT', ''))[:8],  # Truncate for display
                'encounter_class': encounter_class,
                'start_timestamp': start_dt,
                'service_min': service_time,
                'reason_description': str(row.get('REASONDESCRIPTION', ''))
            })
            
        except Exception as e:
            if debug:
                print(f"Skipping row: {e}", file=sys.stderr)
            continue
    
    if not encounters:
        return []
    
    # Sort by time
    encounters.sort(key=lambda x: x['start_timestamp'])
    
    # Apply limit
    if limit > 0:
        encounters = encounters[:limit]
    
    # Convert to relative times
    first_time = encounters[0]['start_timestamp']
    for encounter in encounters:
        time_diff = encounter['start_timestamp'] - first_time
        encounter['arrival_min'] = time_diff.total_seconds() / 60.0
    
    # Apply time compression
    encounters = compress_encounter_times(encounters, compression_hours, debug)
    
    # Assign MTS priorities and adjust service times
    priority_counts = {p: 0 for p in range(1, 6)}
    
    for encounter in encounters:
        priority = ManchesterTriageSystem.assign_priority(
            encounter['encounter_class'],
            encounter['reason_description']
        )
        encounter['priority'] = priority
        priority_counts[priority] += 1
        
        # Adjust service time by priority (more urgent = potentially longer/more complex)
        base_service = encounter['service_min']
        if priority <= 2:
            encounter['service_min'] = base_service * random.uniform(1.2, 2.0)
        elif priority == 3:
            encounter['service_min'] = base_service * random.uniform(0.9, 1.4)
        else:
            encounter['service_min'] = base_service * random.uniform(0.6, 1.2)
    
    if debug:
        print(f"\nFinal dataset:", file=sys.stderr)
        print(f"  Encounters: {len(encounters)}", file=sys.stderr)
        print(f"  Priority distribution:", file=sys.stderr)
        for p, count in priority_counts.items():
            if count > 0:
                pct = count / len(encounters) * 100
                color = ManchesterTriageSystem.PRIORITIES[p]['color']
                print(f"    P{p} ({color}): {count} ({pct:.1f}%)", file=sys.stderr)
    
    return encounters


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
    
    # Parse compression parameter
    compress_str = args.compressTo.lower()
    if 'hour' in compress_str:
        compression_hours = int(''.join(filter(str.isdigit, compress_str))) or 8
    elif 'day' in compress_str:
        days = int(''.join(filter(str.isdigit, compress_str))) or 1
        compression_hours = days * 24
    else:
        compression_hours = 8
    
    random.seed(42)  # Reproducible results
    
    # Find CSV
    script_dir = Path(__file__).parent
    csv_path = script_dir.parent / 'output' / 'csv' / 'encounters.csv'
    
    try:
        encounters = load_and_prepare_encounters(
            str(csv_path),
            args.encounter_class,
            args.limit,
            compression_hours,
            args.debug
        )
        
        if not encounters:
            print("No encounters found.", file=sys.stderr)
            sys.exit(1)
        
        # Set simulation horizon
        last_arrival = encounters[-1]['arrival_min']
        max_service = max(e['service_min'] for e in encounters)
        horizon = last_arrival + 2 * max_service
        
        if args.debug:
            print(f"\nSimulation parameters:", file=sys.stderr)
            print(f"  Horizon: {horizon:.1f} minutes ({horizon/60:.1f} hours)", file=sys.stderr)
            print(f"  Servers: {args.servers}", file=sys.stderr)
        
        # Run simulation
        simulation = CompressedMTSSimulation(args.servers)
        results = simulation.run_simulation(encounters, horizon)
        
        # Final report
        report = {
            'simulation_type': 'time_compressed_manchester_triage',
            'parameters': {
                'original_encounters': len(encounters),
                'servers': args.servers,
                'compression_target': args.compressTo,
                'filter': args.encounter_class or 'all'
            },
            'completed': results['completed'],
            'system_performance': results['system_metrics'],
            'priority_breakdown': results['priority_breakdown'],
            'simulation_time_hours': round(horizon / 60, 1)
        }
        
        print(json.dumps(report, indent=2))
        
    except Exception as e:
        print(f"Simulation error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()