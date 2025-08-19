# Feature Changelog – Triage Streaming & Dynamic Nested Table

Date: 2025-08-19 16:21 (local)

## Highlights
- Streaming now delivers full, nested patient entries via SSE, enabling rich UI rendering without hardcoded columns.
- Frontend table auto-infers nested columns (including resources like Encounters/Conditions) with horizontal scrolling.
- Simulator controls simplified to a single Pace input for focused testing.

## Backend (api-server)
- simulateTriage (`api-server/controllers/triageController.js`)
  - Streams full entry objects from `/synthea/patients` (e.g., `{ patient, resources }`) per SSE `patient` event.
  - Appends `simulationTimestamp` to each streamed event.
  - Supports paced streaming via `pace`/`paceMs` with timers and clean-up.
  - Sends `meta`, `info/warn/error`, and `done` events; includes keep-alive heartbeat.
  - CORS and no-buffer headers preserved for stable SSE across proxies.
- synthea patients (`api-server/controllers/syntheaController.js`)
  - Continues to provide `patients` with `patient` and triage-focused `$everything` `resources`.

## Frontend – Hook (client)
- useTriageSimulation (`client/src/features/triage/hooks/useTriageSimulation.js`)
  - On `patient` events, stores the full nested payload in `rows` (no flattening), enabling dynamic table inference.
  - In patient mode, `columns` is `undefined` to allow auto-inference of nested fields.
  - Maintains legacy arrival streaming mode with fixed columns for non-patient events.
  - React 19 action flow kept for submitting/controlling the SSE connection.

## Frontend – Table (client)
- TriageTable (`client/src/features/triage/components/TriageTable.jsx`)
  - Auto-infers columns by flattening nested data with increased limits:
    - `maxAutoColumns` default increased to 80.
    - `maxDepth` default increased to 4.
    - Array sampling increased (0..2) so keys like `resources.0..2.*` surface.
  - Interleaves keys by top-level groups (prioritises `resources.*` then `patient.*`) to ensure related resources appear early.
  - Better cell rendering:
    - Arrays of objects displayed as JSON strings (not `[object Object]`).
    - Dates and timestamps formatted for readability.
  - Horizontal scrolling container to prevent overflow (NHS-style responsive scrolling).
  - Row ID logic prefers `row.patient.id`, then `row.id`, else sensible fallbacks.
  - Table caption updated from "ED queue" to "Incoming queue".

## Frontend – Simulator & Controls (client)
- TriageSimulator (`client/src/features/triage/components/TriageSimulator.jsx`)
  - Uses the simplified controls and passes hook-managed `rows` with auto-inferred columns.
- TriageControls (`client/src/features/triage/components/TriageControls.jsx`)
  - Simplified UI: only "Pace (seconds per event)" input and an "Apply" button.
  - Removed Department, Paced checkbox, Simulation Scale, Patient ID, Count fields.
  - Pace input now only disables while pending; paced mode defaults remain managed by the hook.

## UX & Styling
- Long/wide nested tables no longer overflow; horizontal scroll enabled.
- Column inference surfaces both `patient.*` and `resources.*` for context-rich rows.
- Caption shows "Incoming queue (N shown)" for clarity.

## Developer Experience
- Dynamic inference removes the need to hand-maintain column definitions for nested FHIR structures.
- Backend streams full entries, aligning transport with the UI’s dynamic rendering approach.

## Notes / Considerations
- If deterministic columns are desired, `TriageTable` accepts `fieldPaths` to pin specific dot-paths.
- Backend pacing and SSE headers are tuned for stability; increase/decrease pace as needed from the UI.

## Next Steps (optional)
- Add reconnection logic and visible error/warn toasts for SSE reliability.
- Provide a toggle to limit/expand inference depth and max columns at runtime.
- Add summarised views for common FHIR resources (e.g., latest vitals, active conditions) alongside raw columns.
