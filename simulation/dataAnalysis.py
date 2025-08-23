#!/usr/bin/env python3
"""
Analyze Synthea encounters data to understand the distribution and time spans
"""

import pandas as pd
from datetime import datetime
import sys
from pathlib import Path
from simulation.utils.data_utils import load_encounters_df
from simulation.utils.analytics import (
    temporal_patterns,
    capacity_planning,
    simulation_optimization,
)
from simulation.utils.format_utils import print_section, print_sim_commands

def analyze_encounters(csv_path: str):
    """Analyze the encounters dataset"""
    
    try:
        # Reuse standardized loader (parsing timestamps and features)
        output_dir = Path(csv_path).parent.parent  # .../output
        df = load_encounters_df(output_dir)
        print(f"Total encounters loaded: {len(df)}")
        print(f"Columns: {list(df.columns)}")
        
        print_section("🗓️  DATE & TEMPORAL OVERVIEW")
        print(f"Date range: {df['START_DT'].min()} to {df['START_DT'].max()}")
        print(f"Time span (days): {(df['START_DT'].max() - df['START_DT'].min()).days}")

        tp = temporal_patterns(df)
        print(f"Peak hour: {tp['peak_hour']}:00")
        print(f"Busiest day: {tp['busiest_day']}")
        print(f"Peak month: {tp['peak_month']}")

        print_section("🏷️  ENCOUNTER TYPES (top)")
        class_counts = df['ENCOUNTERCLASS'].value_counts().head(10)
        for enc_class, count in class_counts.items():
            print(f"{enc_class}: {count}")

        print_section("⏱️  SERVICE TIME SUMMARY")
        print(f"Avg: {df['SERVICE_MIN'].mean():.1f} min | Median: {df['SERVICE_MIN'].median():.1f} min | Range: {df['SERVICE_MIN'].min():.1f}-{df['SERVICE_MIN'].max():.1f} min")

        # Daily encounter patterns (kept for simulation suggestions)
        daily_counts = df['START_DT'].dt.date.value_counts()
        print(f"Days with encounters: {len(daily_counts)} | Max/day: {daily_counts.max()} | Avg/day: {daily_counts.mean():.2f}")
        
        # Patient distribution
        print_section("🧍 PATIENT ANALYSIS")
        print(f"Unique patients: {df['PATIENT'].nunique()}")
        patient_encounters = df['PATIENT'].value_counts()
        print(f"Avg encounters per patient: {patient_encounters.mean():.1f}")
        print(f"Max encounters per patient: {patient_encounters.max()}")
        
        return df, daily_counts
        
    except Exception as e:
        print(f"Error analyzing data: {e}")
        return None, None

def suggest_simulation_parameters(df, daily_counts):
    """Suggest good parameters for simulation based on data analysis"""
    
    if df is None or daily_counts.empty:
        return
    
    print_section("🚀 SIMULATION RECOMMENDATIONS")
    
    # Quick busiest day signal
    busiest_day = daily_counts.index[0]
    max_daily = daily_counts.iloc[0]
    print(f"📅 Busiest day: {busiest_day} ({max_daily} encounters)")

    # Augment with shared analytics recommendations
    print_section("➕ ADDITIONAL CAPACITY & OPTIMIZATION")
    cap = capacity_planning(df)
    print(f"Peak daily/hourly: {cap['daily_max']}/{cap['hourly_max']} | Avg svc: {cap['avg_service_time']:.1f} min")
    print(f"Servers -> min: {cap['min_servers']} | rec: {cap['recommended_servers']}")
    if cap.get('growth_rate') is not None:
        print(f"Growth: {cap['growth_rate']:.1f}% | 1yr: {cap['projected_1yr']:.0f} | 3yr: {cap['projected_3yr']:.0f}")

    sim = simulation_optimization(df)
    if sim.get('optimal_date') is not None:
        print(f"Optimal date: {sim['optimal_date']} | span: {sim.get('time_span_hours', 0.0):.1f}h | servers rec: {sim.get('recommended_servers', 2)}")
        print_sim_commands()


if __name__ == '__main__':
    script_dir = Path(__file__).parent
    csv_path = script_dir.parent / 'output' / 'csv' / 'encounters.csv'
    
    df, daily_counts = analyze_encounters(str(csv_path))
    suggest_simulation_parameters(df, daily_counts)