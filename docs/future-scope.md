# Future Scope

This roadmap outlines potential extensions for the NHS MOA Triage & Data Explorer.

## Short-term
- Implement target-based triage ordering alongside current heuristic (feature flag).
- Expand open-data integrations (OpenPrescribing drill-downs, additional NHS datasets) with caching.
- Add charts and comparative visualisations to the client.
- Harden error handling with structured logs and retries; expose warnings in UI.

## Medium-term
- Agentic data exploration: enable Planner/Retriever/Analyst/Explainer agents with server-side orchestration.
- Add simple sandboxed transformation DSL (filters, joins) with provenance logging.
- Role-based UI for clinicians vs analysts; exportable reports.

## Long-term
- Evaluate on realistic synthetic scenarios; compare heuristics with target-based model.
- Integrate with public FHIR test servers (SMART, HAPI) and Synthea for richer synthetic cases.
- Governance guardrails for agents (approval workflows, audit trails, policy checks).
- Explore privacy-preserving techniques (DP summaries, federated queries) for future research settings.

## Non-goals / constraints
- No use in real clinical settings; this remains a research/prototype.
- Server-only secrets; never expose in client.
