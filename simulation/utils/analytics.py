from __future__ import annotations
from typing import Dict, Any
import pandas as pd
import numpy as np


def temporal_patterns(df: pd.DataFrame) -> Dict[str, Any]:
    hourly_dist = df['HOUR'].value_counts().sort_index()
    weekly_dist = df['DAY_OF_WEEK'].value_counts()
    monthly_dist = df['MONTH'].value_counts().sort_index()

    peak_hour = int(hourly_dist.idxmax()) if len(hourly_dist) else 0
    busiest_day = str(weekly_dist.idxmax()) if len(weekly_dist) else ''
    peak_month = int(monthly_dist.idxmax()) if len(monthly_dist) else 1

    return {
        'peak_hour': peak_hour,
        'busiest_day': busiest_day,
        'peak_month': peak_month,
        'hourly_distribution': hourly_dist,
        'weekly_distribution': weekly_dist,
        'monthly_distribution': monthly_dist,
    }


def service_patterns(df: pd.DataFrame) -> pd.DataFrame:
    stats = (
        df.groupby('ENCOUNTERCLASS')['SERVICE_MIN']
        .agg(['count', 'mean', 'median', 'std', lambda x: x.quantile(0.95)])
        .round(1)
    )
    stats.columns = ['Count', 'Mean', 'Median', 'StdDev', 'P95']
    return stats


def detect_bottlenecks(service_stats: pd.DataFrame) -> Dict[str, pd.DataFrame]:
    """Identify high-variance and long-tail encounter types."""
    if service_stats.empty:
        return {'high_variance': service_stats, 'long_tail': service_stats}
    hv = service_stats[service_stats['StdDev'] > service_stats['StdDev'].median() * 1.5]
    lt = service_stats[service_stats['P95'] > service_stats['P95'].median() * 1.5]
    return {'high_variance': hv, 'long_tail': lt}


def capacity_planning(df: pd.DataFrame) -> Dict[str, Any]:
    recent_years = df[df['YEAR'] >= 2020]
    yearly_growth = recent_years.groupby('YEAR').size() if len(recent_years) > 0 else pd.Series(dtype=int)

    growth_rate = None
    if len(yearly_growth) > 1 and yearly_growth.iloc[0] > 0:
        growth_rate = (yearly_growth.iloc[-1] - yearly_growth.iloc[0]) / len(yearly_growth) / yearly_growth.iloc[0] * 100

    current_annual = yearly_growth.iloc[-1] if len(yearly_growth) > 0 else len(recent_years)
    projected_1yr = current_annual * (1 + (growth_rate or 0)/100)
    projected_3yr = current_annual * ((1 + (growth_rate or 0)/100) ** 3)

    if 'START_DT' in df.columns and not df['START_DT'].isna().all():
        daily_max = df.groupby(df['START_DT'].dt.date).size().max()
        hourly_max = df.groupby([df['START_DT'].dt.date, df['START_DT'].dt.hour]).size().max()
    else:
        daily_max = 0
        hourly_max = 0

    avg_service_time = float(df['SERVICE_MIN'].mean()) if 'SERVICE_MIN' in df.columns else 0.0
    peak_arrival_rate = (hourly_max or 0) / 60
    utilization_target = 0.80
    min_servers = max(1, int(np.ceil(peak_arrival_rate * avg_service_time / utilization_target))) if avg_service_time > 0 else 1
    recommended_servers = max(1, min_servers + 1)

    return {
        'growth_rate': float(growth_rate) if growth_rate is not None else None,
        'current_annual': int(current_annual) if current_annual is not None else 0,
        'projected_1yr': float(projected_1yr),
        'projected_3yr': float(projected_3yr),
        'daily_max': int(daily_max) if pd.notna(daily_max) else 0,
        'hourly_max': int(hourly_max) if pd.notna(hourly_max) else 0,
        'avg_service_time': float(round(avg_service_time, 1)),
        'min_servers': int(min_servers),
        'recommended_servers': int(recommended_servers),
    }


def priority_mapping(df: pd.DataFrame) -> pd.DataFrame:
    urgent_count = df['REASONDESCRIPTION'].str.contains(
        'emergency|urgent|acute|pain|bleeding', case=False, na=False
    ) if 'REASONDESCRIPTION' in df.columns else pd.Series(False, index=df.index)

    encounter_analysis = df.groupby('ENCOUNTERCLASS').agg({
        'SERVICE_MIN': ['count', 'mean', 'std'],
        'REASONDESCRIPTION': lambda x: x.str.contains('emergency|urgent|acute|pain|bleeding', case=False, na=False).sum()
    }).round(2)

    encounter_analysis.columns = ['Count', 'Avg_Service', 'Service_StdDev', 'Urgent_Keywords']
    encounter_analysis['Urgent_Ratio'] = (encounter_analysis['Urgent_Keywords'] / encounter_analysis['Count']).round(3)
    return encounter_analysis


def simulation_optimization(df: pd.DataFrame) -> Dict[str, Any]:
    result: Dict[str, Any] = {}
    if 'START_DT' not in df.columns or df['START_DT'].isna().all():
        result.update({'optimal_date': None, 'busy_day_count': 0, 'recommended_servers': 3})
        return result

    df = df.copy()
    df['DATE'] = df['START_DT'].dt.date
    daily_counts = df['DATE'].value_counts()
    busy_days = daily_counts[daily_counts > 2]

    optimal_date = busy_days.index[0] if len(busy_days) > 0 else None
    result['optimal_date'] = optimal_date
    result['busy_day_count'] = int(len(busy_days))

    if optimal_date is not None:
        day_encounters = df[df['DATE'] == optimal_date]
        time_span = (day_encounters['START_DT'].max() - day_encounters['START_DT'].min()).total_seconds() / 3600
        result['optimal_count'] = int(len(day_encounters))
        result['time_span_hours'] = float(time_span)
        result['type_distribution'] = day_encounters['ENCOUNTERCLASS'].value_counts().to_dict()

        avg_service = float(day_encounters['SERVICE_MIN'].mean()) if 'SERVICE_MIN' in df.columns else 0.0
        max_concurrent = min(len(day_encounters), max(1, int(len(day_encounters) * (avg_service or 0) / (max(time_span, 1e-9) * 60))))
        result['min_servers'] = int(max(1, max_concurrent))
        result['recommended_servers'] = int(max(2, max_concurrent + 1))
        result['stress_test_servers'] = int(max(1, max_concurrent - 1))
    else:
        result['recommended_servers'] = 3

    return result
