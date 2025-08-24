from __future__ import annotations
from typing import Any, Dict


def summarize_report(name: str, report: Dict[str, Any]) -> Dict[str, Any]:
    perf = report.get('system_performance', {}) or {}
    pb = report.get('priority_breakdown', {}) or {}
    return {
        'name': name,
        'total_patients': perf.get('total_patients'),
        'overall_breach_rate_percent': perf.get('overall_breach_rate_percent'),
        'overall_avg_wait_min': perf.get('overall_avg_wait_min'),
        'overall_p95_wait_min': perf.get('overall_p95_wait_min'),
        'priority_breakdown': pb,
    }


def compare_reports(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    def get_perf(r):
        return r.get('system_performance', {}) or {}
    pa, pb = get_perf(a), get_perf(b)
    return {
        'overall_breach_rate_delta_pct': (
            (pb.get('overall_breach_rate_percent') or 0) - (pa.get('overall_breach_rate_percent') or 0)
        ),
        'overall_avg_wait_delta_min': (
            (pb.get('overall_avg_wait_min') or 0) - (pa.get('overall_avg_wait_min') or 0)
        ),
        'overall_p95_wait_delta_min': (
            (pb.get('overall_p95_wait_min') or 0) - (pa.get('overall_p95_wait_min') or 0)
        ),
    }
