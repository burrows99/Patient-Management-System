# Approaches (incl. Mixture-of-Agents)

This document outlines architectural approaches we consider for data exploration and triage simulation assistance, including multi-agent strategies.

## Baseline (current)
- Client-side UI calls API server for:
  - HRDC proxy: server holds `NHS_API_KEY` and fetches sandbox datasets.
  - Triage simulator: synthetic queue generation based on parameters.
- No patient data; demo-only.

## Enhanced simulator (target-based)
- Category-dominant sorting.
- Time-pressure relative to target per category with breach flags.
- Optional NEWS2-lite proxy as a risk term.

## Data exploration workflow
- API orchestrates calls to open data sources (e.g., OpenPrescribing, HRDC), caches results, and serves normalized responses.
- Client renders filters, facets, and visualisations.

## Mixture-of-Agents (MoA)
- **Planner Agent**: decomposes a user goal (e.g., “compare prescribing of X across CCGs”).
- **Retriever Agent**: fetches data from open APIs with schema/tool awareness.
- **Analyst Agent**: validates data ranges, detects anomalies, and suggests transformations.
- **Explainer Agent**: generates succinct summaries and limitations.
- **Guardrail Agent**: checks governance constraints (no PHI, licensing).

Coordination patterns:
- Plan–act–reflect loop (ReAct/Reflexion).
- Debate or self-consistency for non-deterministic tasks.
- Tool schemas for safe API usage and rate-limit handling.

## Safety and governance
- Server-only secrets; signed audit logs for agent actions.
- Deterministic execution paths with timeouts and cost caps.
- Human-in-the-loop approvals for destructive or privacy-sensitive steps.

## Evaluation
- Task suites: retrieval accuracy, latency, robustness to schema changes.
- Offline benchmarks for agent planning success vs baselines.

## Frontend application approach

- **Design system**: Use NHS.UK components and classes to ensure accessible, consistent UI.
- **Tabs pattern**: `TriageSimulatorDescriptionPage.jsx` implements `nhsuk-tabs` with correct ARIA, `hidden`, and `aria-hidden` to keep inactive panels out of the accessibility tree.
- **Componentization**: Large narrative blocks are split into topic components in `client/src/components/common/text/`:
  - `DatasetsContent.jsx`
  - `MethodologyContent.jsx`
  - `BaselineContent.jsx`
- **Shared link helper**: `client/src/components/common/links/ExternalLink.jsx` centralises external link markup/attributes.
- **SOLID alignment**: Content components have single responsibility and are easy to maintain/extend.

See `docs/frontend-triage-refactor.md` for the ongoing engineering story.
