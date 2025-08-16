# Methodology

This document describes how we design, evaluate, and iterate on the MOA triage simulator and data exploration tooling.

## System boundaries
- No real patient data. All data are synthetic or public/open.
- Secrets (e.g., NHS API key) remain server-side.

## Simulator design (target-based direction)
1. Define category targets (e.g., Cat1=0, Cat2=10, Cat3=60, Cat4=120, Cat5=240 min).
2. Compute time pressure and breach flags relative to targets.
3. Preserve category dominance in ordering.
4. Add small risk modifiers (age, optional NEWS2-lite proxy), and resource hints.
5. Provide feature flag to switch between baseline heuristic and target-based model.

## Data pipeline
- HRDC proxy: fetch, validate HTTP status/content type, parse JSON, cache if needed.
- Open data sources (e.g., OpenPrescribing): rate-limit aware fetch with timeouts.
- Normalise schemas (ids, names, time fields) and store minimal metadata for visualisation.

## Evaluation
- Unit tests for simulator ranking monotonicity and invariants (category dominance, tie-break rules).
- Property-based tests for edge distributions (extreme waits, ages).
- Benchmark latency for API orchestration (p95, p99) and cache hit ratios.
- Agent evaluation: task success rate, tool-call accuracy, and recovery from upstream errors.

## Human-in-the-loop
- Expose intermediate reasoning (summaries/logs) for review.
- Require explicit approval for high-impact operations (writes, external posts).

## Observability
- Structured logs with request ids; severity levels for errors.
- Metrics: request counts, error rates, upstream failures, timeouts.
