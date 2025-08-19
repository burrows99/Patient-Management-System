# Synthea Integration Overview

This document explains how the NHS MOA Triage System integrates SyntheticHealth Synthea to generate and inspect synthetic patient data, and how the backend limits FHIR data to triage-relevant fields.

## What’s included

- __Synthea API client__ `client/src/services/syntheaApi.js`:
  - `syntheaGenerate({ p })` – request generation of synthetic patients (R4-only).
  - `syntheaGetPatients({ n, elementsPreset })` – fetch recent Patients and their `$everything` resources from HAPI.
- __Synthea page__ `client/src/pages/SyntheaPage.jsx`:
  - Parameter controls (generate count, fetch count, elements preset) and actions (Generate, Fetch Patients).
  - Patients table with counts by resource type and an action to open raw JSON.
- __Dedicated JSON viewer page__ `client/src/pages/SyntheaJsonViewPage.jsx`:
  - Opens in a new tab for a focused view using the reusable `JsonViewer`.
  - Uses `localStorage` key passing to avoid blob URLs and keep consistent app layout.

## Backend filtering for triage

The controller `api-server/controllers/syntheaController.js` calls `fetchEverythingForPatient()` with filter options to focus on triage-relevant resources:

- Types (default): `Condition, Observation, MedicationRequest, MedicationStatement, Procedure, Encounter, AllergyIntolerance, Immunization` (`TRIAGE_DEFAULT_TYPES`).
- Per-type filter (default): vital-signs only Observations (`TRIAGE_DEFAULT_TYPE_FILTER`).
- Element presets:
  - `lean` → `TRIAGE_ELEMENTS_LEAN` (minimal; omits narrative)
  - `rich` → `TRIAGE_ELEMENTS_RICH` (includes `text`, `note`, code displays, etc.)

Constants live in `api-server/constants/fhir.js`.

### Query parameters

`GET /synthea/patients`

- `n` (1..100): number of recent patients when `patientId` omitted.
- `patientId`: fetch a specific patient.
- `elementsPreset`: `lean | rich` (default `rich`).
- Advanced (optional): `_count`, `types`, `typeFilter`, `elements`, `_summary`, `start`, `end`, `_since`.

Notes:
- Providing `elements` overrides the preset.
- Avoid `_summary=true|data` if you want narrative; presets use `_elements` for precise control.

## UI/UX principles

- NHS.UK design system classes for a11y and consistency.
- Minimal UI; SOLID component structure.
- JSON is viewed on a dedicated route to keep layout, auth, and controls consistent.

## Key files

- Page: `client/src/pages/SyntheaPage.jsx`
- JSON viewer: `client/src/pages/SyntheaJsonViewPage.jsx`
- API service: `client/src/services/syntheaApi.js`
- Viewer component: `client/src/components/common/JsonViewer.jsx`
- Controller: `api-server/controllers/syntheaController.js`
- Service: `api-server/services/patientService.js`
- Constants: `api-server/constants/fhir.js`

## See also

- Triage Simulator: `./triage-simulator.md`
- JsonViewer: `./json-viewer.md`
- Sources and References: `./sources.md`

---

## HAPI FHIR server details

- __Server__: HAPI FHIR R4 (public/demo instance) behind the API server; all client calls go via our backend.
- __Operation__: `$everything` on Patient with server-side pagination. We follow `link[rel="next"].url` until exhausted.
- __Filtering support__:
  - `_type` and `_typeFilter` supported by HAPI are forwarded.
  - `_elements` supported for response element selection; used for triage presets.
  - `_summary` is optional and generally avoided when using presets (to retain narrative in `rich`).
- __Performance__: Defaults restrict resource types and elements to keep bundles small and responsive.

## Assumptions & defaults

- __FHIR version__: R4 only (Synthea generation and HAPI queries). No STU3/US Core branching in this app.
- __Resource scope (defaults)__: `TRIAGE_DEFAULT_TYPES` focuses on Condition, Observation (vitals), MedicationRequest, MedicationStatement, Procedure, Encounter, AllergyIntolerance, Immunization.
- __Observation filter__: `TRIAGE_DEFAULT_TYPE_FILTER` narrows Observations to vital signs to reduce noise.
- __Elements presets__:
  - `rich` (default): includes `text`, `note`, human-readable code displays, identifiers, dates, and key clinical fields.
  - `lean`: excludes narrative/notes; retains identifiers, status, category, code, subject, effective/issued, value, and minimal references.
- __Overrides__: Providing explicit `elements` in the query bypasses the preset. Other advanced params (`types`, `typeFilter`, `_summary`, `start`, `end`, `_since`) are passed through.
- __Counts__: UI patient table shows counts by included resource arrays only (based on filters/presets used for the fetch).
- __Security__: API keys stay server-side; the client never calls HAPI directly.
