# Langflow Integration – Mixture-of-Agents Triage

Date: 2025-08-19

## Overview
We run a Langflow instance alongside the NHS MOA Triage stack to design, orchestrate, and test mixture-of-agents (MoA) flows that can:
- Ingest streamed triage events (full nested patient entries) from the API server (SSE)
- Route to specialized agents (e.g., Condition Summarizer, Risk Scorer, Disposition Recommender)
- Return structured responses back to the client or store them for review

## Services and Ports
- Langflow UI: `http://localhost:${LANGFLOW_PORT:-7860}`
- API Server (SSE for triage): `http://localhost:${API_PORT:-4001}`
- HAPI FHIR (R4): `http://localhost:8080/hapi/fhir`

## Environment
Root `.env` additions:
```
LANGFLOW_PORT=7860
REACT_APP_LANGFLOW_BASE=http://localhost:7860
```
Compose injects these automatically.

## Starting Langflow
- `docker compose up -d` (or `./start-dev.sh`)
- Visit Langflow at `http://localhost:7860`
- Data persists to the `langflow-data` volume (SQLite DB)

## Suggested MoA Architecture
1. Input Node (HTTP/SSE):
   - Connect to `/api/triage/simulate` or your SSE stream endpoint
   - Receive full nested entries `{ patient, resources, simulationTimestamp }`
2. Parsing & Normalization:
   - Extract key dot-paths from entries (e.g., `patient.name`, `resources.Encounter`, `resources.Condition`)
   - Optionally summarize arrays (e.g., latest encounter, active problems)
3. Specialized Agents:
   - Condition Summarizer Agent: produce patient-friendly summaries
   - Risk Scoring Agent: compute simple risk scores from vitals/encounters
   - Disposition Agent: recommend queue routing or flags
4. Aggregator/Router:
   - Merge agent responses into a single JSON payload
5. Output Node:
   - Webhook back to the client (or store in DB)
   - Optionally publish events for UI overlays

## Client Integration Options
- Direct Fetch from Langflow REST endpoints using `REACT_APP_LANGFLOW_BASE`
- Webhooks from Langflow -> `api-server` custom route -> broadcast to the client
- Poll or subscribe from the client depending on the use case

## Security & Ops Notes
- Langflow is dev-only by default. Do not expose to public networks without auth.
- Consider API keys and gateway in production.
- Back up `langflow-data` volume if flows are important.

## Next Steps
- Add a simple example flow to transform a triage SSE event into a structured summary
- Provide a sample client hook to post rows to Langflow and render responses
- Add auth in front of Langflow (OIDC proxy) if needed
