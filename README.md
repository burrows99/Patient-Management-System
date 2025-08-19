# NHS MOA Triage System

A React-based NHS.UK-styled client with an OAuth 2.1 (OIDC) provider for authentication. This repo includes:

- `client/`: React app styled with NHS.UK frontend design system.
- `oauth-server/` – Koa + oidc-provider auth server (auth-only)
- `api-server/` – Express API server (HRDC proxy + triage simulator)
- `docker-compose.yml` includes `oauth-server`, `api-server`, and `client` services (with hot reload mounted volumes).

Environment configuration is centralized in the root `./.env` and injected into all services by Docker Compose.

- `NHS_API_KEY` – used by `api-server` to proxy HRDC (server-side secret)

Client env (public, must be prefixed with `REACT_APP_`):

- `REACT_APP_OAUTH_BASE=http://localhost:3001`
- `REACT_APP_API_BASE=http://localhost:4001`

## Quick start

Prereqs: Docker Desktop (or Docker Engine) and Node 18+ if running locally.

### Running with Docker (recommended):

- `docker compose up --build`
- Open http://localhost:3000

- Client only (local):
  - `cd client && npm ci && npm start`
  - Open http://localhost:3000 (make sure OAuth server is running at 3001)

- OAuth server only (local):
  - `cd oauth-server && npm ci && npm start`
  - OIDC issuer at http://localhost:3001

- API server only (local):
  - `cd api-server && npm ci && npm start`
  - API server at http://localhost:4001


## Architecture

- `client/src/components/` implements SOLID:
  - `Header.jsx`: NHS header + logo
  - `Layout.jsx`: Wrapper for NHS.UK page structure and main spacing
  - `Footer.jsx`: NHS.UK footer with support links
- `client/src/App.js` composes the above and mounts auth-related UI and callbacks.
- `client/src/index.js` imports `nhsuk-frontend/dist/nhsuk.css`.
- `oauth-server/index.js` configures an OIDC provider with:
  - `authorization_code` + `refresh_token`
  - PKCE S256 required
  - `post_logout_redirect_uris` to return users to the client after sign-out
- `api-server/index.js` serves HRDC proxy and triage simulator endpoints


## Synthea Integration & JSON Viewer

- **Purpose**: Generate synthetic patients and fetch triage-focused FHIR data using `$everything` with curated defaults.
- **Client**: `client/src/pages/SyntheaPage.jsx` for controls/table, `client/src/pages/SyntheaJsonViewPage.jsx` for focused JSON viewing.
- **API client**: `client/src/services/syntheaApi.js`
- **Viewer**: `client/src/components/common/JsonViewer.jsx` (NHS-styled, native `<details>`, toolbar for copy/expand/collapse)

### Usage
- Generate patients: click "Generate" or call `syntheaGenerate({ p })` (R4 only).
- Fetch patients: choose count and `elementsPreset` (Rich or Lean), click "Fetch Patients".
- View JSON: in the table, open the JSON action to launch the dedicated viewer tab. Data is passed via `localStorage`.

### Backend endpoint
`GET /synthea/patients`

Query params:
- `n` (1..100) – number of recent patients when `patientId` omitted
- `patientId` – fetch a specific patient
- `elementsPreset` – `lean | rich` (default `rich`)
- Advanced: `_count`, `types`, `typeFilter`, `elements`, `_summary`, `start`, `end`, `_since`

Defaults and presets are defined in `api-server/constants/fhir.js` and applied by `api-server/controllers/syntheaController.js`.

### HAPI and defaults (quick notes)
- HAPI FHIR R4 behind our API; client never calls HAPI directly.
- Patient `$everything` with pagination; we follow `link[rel="next"].url`.
- Defaults focus on triage: restricted `_type`, vital-signs `_typeFilter`, and element presets (`rich` default, `lean` minimal). Override with explicit `elements` if needed.


## Environment & config

- Single source of truth: root `./.env` (loaded by Docker Compose for all services).
- Servers read only `process.env` (no per-service dotenv files).
- Client (CRA) exposes only variables prefixed with `REACT_APP_`.

Example `./.env`:

```
NHS_API_KEY=... # secret, server-only
PORT=4001
REACT_APP_OAUTH_BASE=http://localhost:3001
REACT_APP_API_BASE=http://localhost:4001
REACT_APP_CLIENT_ID=9c7c344a-51e3-41c0-a655-a3467f2aca57
REACT_APP_REDIRECT_URI=http://localhost:3000/callback
REACT_APP_SCOPE=openid basic_demographics email phone
```

- OAuth server client config (in `oauth-server/index.js`):
  - `redirect_uris: ["http://localhost:3000/callback"]`
  - `post_logout_redirect_uris: ["http://localhost:3000/"]`

- API server config (in `api-server/index.js`):
  - HRDC proxy endpoints
  - Triage simulator endpoint


## Development workflow

- Start everything: `docker compose up --build`
- Iterate on client: hot reload at http://localhost:3000
- Iterate on OAuth server: nodemon-style restart if configured; otherwise re-run container
- Iterate on API server: nodemon-style restart if configured; otherwise re-run container


## UI, layout, and accessibility

This project follows the NHS.UK Design System for accessibility and consistency.

- Styles are imported from `nhsuk-frontend/dist/nhsuk.css`
- Body has `nhsuk-template__body` class for template spacing
- `Layout.jsx` applies `nhsuk-main-wrapper nhsuk-main-wrapper--auto-spacing` and `nhsuk-width-container`
- Footer uses the recommended structure (`nhsuk-footer`, `nhsuk-footer__meta`, and `nhsuk-footer__list--three-columns`) so links render left-to-right on desktop and stack on mobile

Reference: NHS Design System components
- https://service-manual.nhs.uk/design-system/components/

## Frontend triage description refactor

We refactored the Triage Simulator Description page to improve modularity, accessibility, and maintainability.

- **Tabs (NHS.UK pattern):** `TriageSimulatorDescriptionPage.jsx` uses `nhsuk-tabs` with correct ARIA attributes. Three tabs: Datasets, Methodology, Baseline.
- **Topic components:** Large text blocks are split into reusable components under `client/src/components/common/text/`:
  - `DatasetsContent.jsx`
  - `MethodologyContent.jsx`
  - `BaselineContent.jsx`
- **Accessibility:** Panels use `nhsuk-tabs__panel` and `nhsuk-tabs__panel--hidden` plus `aria-hidden`/`hidden` to ensure only the active panel is visible.
- **NHS styling:** Content follows NHS.UK classes for headings, lists, inset text, and tables.

See the ongoing engineering narrative in `docs/frontend-triage-refactor.md` for history, rationale, and next steps.


## Common issues & fixes

- Webpack "Can't resolve 'nhsuk-frontend/dist/nhsuk.css'" inside Docker:
  - Ensure the client service does NOT mount `/app/node_modules` as a bind mount (it hides installed deps). This compose file already removes it.

- Logout does not redirect to client home:
  - Confirm `post_logout_redirect_uris` is set in `oauth-server/index.js` and that the client calls `signoutRedirect({ post_logout_redirect_uri: window.location.origin })`.

- Footer items stack vertically:
  - Ensure correct NHS.UK footer structure and React `className` attributes, and include `nhsuk-footer__list--three-columns`.


## Scripts

- Client: `npm start`, `npm run build`, `npm test`
- OAuth Server: `npm start`, `npm run dev`
- API Server: `npm start`, `npm run dev`


## Documentation

High-level docs live in `docs/`:

- `docs/abstract.md` — project abstract
- `docs/literature-survey.md` — related work and references
- `docs/approaches.md` — architectural approaches, incl. mixture-of-agents
- `docs/methodology.md` — methods, evaluation plan, datasets
- `docs/future-scope.md` — roadmap and extensions
- `docs/frontend-triage-refactor.md` — story document of the triage description refactor (motivation, changes, insights, next steps)


## Data sources (single source of truth)

This section documents all current data sources used by the project. This README is the single source of truth; other READMEs simply point here.

- **NHS Health Research Data Catalogue (HRDC) Sandbox**
  - Base URL: `https://sandbox.api.service.nhs.uk/health-research-data-catalogue`
  - Auth: API key via header `apikey`
  - Env var: set `NHS_API_KEY` in root `./.env` (injected into `api-server` by Compose)
  - Access via API server proxy endpoints (client-safe; API key not exposed):
    - `GET http://localhost:4001/api/hrdc/datasets` (list)
    - `GET http://localhost:4001/api/hrdc/datasets/:id` (detail)
  - Note: HRDC provides dataset metadata suitable for simulation parameters; it is not a live patient queue.

- **Triage simulator API (synthetic data)**
  - Endpoint (served by `api-server/index.js`):
    - `GET http://localhost:4001/triage/simulate?dept=ED&n=30&datasetId=<persistentId>`
  - Fetches HRDC dataset live each request and uses metadata (age ranges, etc.) to parameterise a synthetic queue.
  - Response fields: `triageCategory`, `waitMins`, `age`, `arrivalTime`, `priorityScore`, `riskScore`, `capacityFactor`.
  - MoA scoring combines rule-based uplift (triage 1–2), queue-time, risk (age, acuity), and capacity.

- **Client UI for simulator**
  - Component: `client/src/components/TriageSimulator.jsx`
  - Rendered in `client/src/App.js`
  - Calls the simulator endpoint and displays a sortable table.

## Triage prioritisation model vs real-world systems

This project includes a synthetic triage simulator implemented in `api-server/controllers/triageController.js` (`simulateTriage()`). The current model is a pragmatic heuristic intended for demo purposes. Below is a concise comparison with widely used emergency triage systems and recommended improvements.

### Current model (demo heuristic)
- **Dominant terms**: linear combination of
  - Rule score by triage category (1→10, 2→6, else 0)
  - Time score: `min(waitMins/60, 4)`
  - Risk score: age ≥75 (+2) and category uplift (+4 for cat1, +2 for cat2)
  - Capacity score: `(1 - capacityFactor) * 2` (ED ~0.6, Imaging ~0.8, Outpatients ~0.9)
- **Sorting**: by total `priorityScore` (higher first)

### Real-world systems (ESI, MTS, CTAS, ATS)
- **Category first**: Triage level (1–5) is a hard priority tier; higher acuity patients are seen first.
- **Time-to-target**: Each level has a maximum waiting time (e.g., MTS: Red immediate, Orange 10m, Yellow 60m, Green 120m, Blue 240m). Breach of target increases urgency.
- **Clinical discriminators**: Vital signs, pain, presentation, mechanism of injury, paediatric modifiers, and early warning scores (e.g., NEWS2) influence level and re-triage.
- **ESI resources**: Anticipated resource use differentiates patients within the same level (labs, imaging, procedures) rather than changing categories.
- **Capacity handling**: Managed operationally (escalation, flow), not as a per-patient score that overrides clinical priority.

### Key differences
- **Triage dominance**: Our model allows lower-acuity patients to outrank higher-acuity due to time/capacity; real systems keep category dominance.
- **Time coupling**: We use linear minutes waited; real systems use target-based pressure relative to each level’s maximum.
- **Clinical depth**: Our risk uses age only; real systems use NEWS2, vitals, pain, and presentation.
- **Capacity use**: We include capacity in the patient score; real systems use it for service-level decisions, not individual priority.

### Recommended improvements (non-breaking direction)
- **Tiered sorting**: Sort by `(triageLevel asc, breachFlag desc, timePressure desc, risk desc, resources desc)` to maintain category dominance.
- **Target-based time pressure**: Use level targets (Cat1=0, Cat2=10, Cat3=60, Cat4=120, Cat5=240 min). Compute `timePressure = max(0, waitMins - target[level]) / target[level]` and `breachFlag`.
- **Risk enrichment**: Add a simple NEWS2 proxy or vitals-based risk; keep age as a small modifier.
- **ESI-style resources (optional)**: Estimate resources to order patients within the same category.
- **Remove patient-level capacity term**: Use capacity for system alerts/escalation, not to alter clinical priority per patient.
- **Re-triage**: Increase urgency or trigger reassessment as waits approach/breach targets within a level.

These changes would bring the simulator closer to clinical practice while remaining synthetic and safe for demos. If needed, we can implement a feature flag to toggle between the current heuristic and a target-based, category-dominant model for comparison.

## Data integrations (future work)

- Explore ingesting NHS England aggregate datasets (RTT, diagnostics, A&E) and/or proxy NHS Scotland open data for real-time wait times.
- Use public FHIR test servers (e.g., SMART Health IT, HAPI) or Synthea for synthetic patient records.


## License

This project may integrate NHS.UK assets subject to their terms. See NHS.UK licensing guidance.
