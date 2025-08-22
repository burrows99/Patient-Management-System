#!/usr/bin/env python3
"""
Analyze Synthea encounters data to understand the distribution and time spans
"""

import pandas as pd
from datetime import datetime
import sys
from pathlib import Path

def analyze_encounters(csv_path: str):
    """Analyze the encounters dataset"""
    
    try:
        df = pd.read_csv(csv_path)
        print(f"Total encounters loaded: {len(df)}")
        print(f"Columns: {list(df.columns)}")
        
        # Convert dates
        df['START_DT'] = pd.to_datetime(df['START'])
        df['STOP_DT'] = pd.to_datetime(df['STOP'])
        
        print(f"\n=== DATE ANALYSIS ===")
        print(f"Date range: {df['START_DT'].min()} to {df['START_DT'].max()}")
        print(f"Time span: {(df['START_DT'].max() - df['START_DT'].min()).days} days")
        
        # Year distribution
        df['YEAR'] = df['START_DT'].dt.year
        print(f"\n=== ENCOUNTERS BY YEAR ===")
        year_counts = df['YEAR'].value_counts().sort_index()
        for year, count in year_counts.items():
            print(f"{year}: {count} encounters")
        
        # Encounter class distribution
        print(f"\n=== ENCOUNTER TYPES ===")
        class_counts = df['ENCOUNTERCLASS'].value_counts()
        for enc_class, count in class_counts.items():
            print(f"{enc_class}: {count} encounters")
        
        # Monthly distribution (to find busy periods)
        df['YEAR_MONTH'] = df['START_DT'].dt.to_period('M')
        monthly_counts = df['YEAR_MONTH'].value_counts().sort_index()
        
        print(f"\n=== BUSIEST MONTHS (Top 10) ===")
        top_months = monthly_counts.head(10)
        for period, count in top_months.items():
            print(f"{period}: {count} encounters")
        
        # Service time analysis
        df['SERVICE_MIN'] = (df['STOP_DT'] - df['START_DT']).dt.total_seconds() / 60
        df['SERVICE_MIN'] = df['SERVICE_MIN'].clip(lower=0, upper=480)  # Cap at 8 hours
        
        print(f"\n=== SERVICE TIME ANALYSIS ===")
        print(f"Average service time: {df['SERVICE_MIN'].mean():.1f} minutes")
        print(f"Median service time: {df['SERVICE_MIN'].median():.1f} minutes")
        print(f"Service time range: {df['SERVICE_MIN'].min():.1f} - {df['SERVICE_MIN'].max():.1f} minutes")
        
        # Daily encounter patterns (find days with multiple encounters)
        df['DATE'] = df['START_DT'].dt.date
        daily_counts = df['DATE'].value_counts()
        
        print(f"\n=== DAILY PATTERNS ===")
        print(f"Days with encounters: {len(daily_counts)}")
        print(f"Average encounters per day: {daily_counts.mean():.2f}")
        print(f"Max encounters in a single day: {daily_counts.max()}")
        
        # Find days with multiple encounters (good for simulation)
        busy_days = daily_counts[daily_counts > 1].head(10)
        if not busy_days.empty:
            print(f"\n=== BUSY DAYS (Multiple Encounters) ===")
            for date, count in busy_days.items():
                encounters_that_day = df[df['DATE'] == date][['START', 'ENCOUNTERCLASS', 'DESCRIPTION']].head(5)
                print(f"\n{date}: {count} encounters")
                for _, row in encounters_that_day.iterrows():
                    print(f"  {row['START'][:19]} | {row['ENCOUNTERCLASS']} | {row['DESCRIPTION'][:50]}...")
        
        # Patient distribution
        print(f"\n=== PATIENT ANALYSIS ===")
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
    
    print(f"\n=== SIMULATION RECOMMENDATIONS ===")
    
    # Find periods with reasonable activity
    busy_days = daily_counts[daily_counts > 1]
    
    if busy_days.empty:
        print("⚠️  No days with multiple encounters found.")
        print("   Consider using --timeWindow=0 to use all data")
        print("   Or artificially compress time windows for simulation")
        
        # Find the month with most encounters
        df['YEAR_MONTH'] = df['START_DT'].dt.to_period('M')
        monthly_counts = df['YEAR_MONTH'].value_counts()
        busiest_month = monthly_counts.index[0]
        busiest_count = monthly_counts.iloc[0]
        
        print(f"\n📅 Busiest month: {busiest_month} ({busiest_count} encounters)")
        print(f"   Try: --timeWindow=0 --compressTime=daily")
        
    else:
        busiest_day = daily_counts.index[0]
        max_daily = daily_counts.iloc[0]
        
        print(f"📅 Busiest day: {busiest_day} ({max_daily} encounters)")
        
        # Get the actual datetime for that day
        encounters_that_day = df[df['START_DT'].dt.date == busiest_day]
        start_time = encounters_that_day['START_DT'].min()
        
        print(f"   Use specific date simulation starting from: {start_time}")
        
        # Time window recommendations
        if max_daily >= 5:
            print(f"✅ Good for single-day simulation: --timeWindow=1")
        elif len(busy_days) >= 3:
            print(f"✅ Use multi-day window: --timeWindow=7")
        else:
            print(f"⚠️  Limited daily activity. Consider --timeWindow=30")
    
    # Server recommendations based on encounter types
    emergency_count = len(df[df['ENCOUNTERCLASS'] == 'emergency'])
    if emergency_count > 0:
        print(f"\n🏥 Emergency encounters: {emergency_count}")
        print(f"   Recommended servers for emergency: --servers=2-4")
    
    wellness_count = len(df[df['ENCOUNTERCLASS'] == 'wellness'])
    if wellness_count > 0:
        print(f"🏥 Wellness encounters: {wellness_count}")
        print(f"   Recommended servers for wellness: --servers=3-6")


if __name__ == '__main__':
    script_dir = Path(__file__).parent
    csv_path = script_dir.parent / 'output' / 'csv' / 'encounters.csv'
    
    df, daily_counts = analyze_encounters(str(csv_path))
    suggest_simulation_parameters(df, daily_counts)