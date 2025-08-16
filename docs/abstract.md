# Abstract

This project prototypes an NHS-style triage and data exploration system that combines:

- A React client using the NHS.UK Design System for accessible UX.
- An OAuth 2.1 / OIDC provider for login and session management.
- An API server that (a) proxies the NHS Health Research Data Catalogue (HRDC) Sandbox and (b) simulates triage queues for demonstration.
- Optional intelligent orchestration via mixture-of-agents for data retrieval, enrichment, and decision support (future work).

Goals:
- Provide a safe, synthetic environment to explore prioritisation heuristics and data UX without touching real patient data.
- Demonstrate secure patterns (server-side secrets, client-safe APIs) and clean separation of concerns.
- Enable research iterations on agent-based approaches to triage assistance and open-data exploration.

Non-goals:
- This is not a clinical decision support system and must not be used for patient care.
