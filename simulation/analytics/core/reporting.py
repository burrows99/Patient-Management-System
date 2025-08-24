from __future__ import annotations
from datetime import datetime
from typing import Any, Dict
import pandas as pd


def build_summary_report(df: pd.DataFrame,
                         temporal_analysis: Dict[str, Any],
                         capacity_analysis: Dict[str, Any],
                         simulation_recommendations: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'generated_at': datetime.now().isoformat(),
        'dataset_size': int(len(df)),
        'date_range': {
            'start': str(df['YEAR'].min()) if 'YEAR' in df.columns else '',
            'end': str(df['YEAR'].max()) if 'YEAR' in df.columns else '',
        },
        'key_metrics': {
            'peak_hour': temporal_analysis.get('peak_hour'),
            'busiest_day': temporal_analysis.get('busiest_day'),
            'recommended_servers': capacity_analysis.get('recommended_servers'),
            'daily_max_volume': capacity_analysis.get('daily_max'),
            'avg_service_time_min': round(capacity_analysis.get('avg_service_time', 0.0), 1),
        },
        'recommendations': {
            'optimal_simulation_date': str(simulation_recommendations.get('optimal_date', '')),
            'recommended_servers': simulation_recommendations.get('recommended_servers'),
        },
    }

__all__ = ["build_summary_report"]
