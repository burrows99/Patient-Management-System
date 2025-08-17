# Synthea Integration Overview

This document explains how the NHS MOA Triage System integrates SyntheticHealth Synthea to generate and inspect synthetic patient data.

## What we added

- __Synthea API client__ in `client/src/services/syntheaApi.js` with:
  - `syntheaGenerate({ p, stu })` – request generation of synthetic bundles.
  - `syntheaGetPatients({ n, stu })` – fetch recent bundles and extract Patient + related resources.
- __Synthea page__ in `client/src/pages/SyntheaPage.jsx`:
  - Parameter card (FHIR STU, counts) and actions (Generate, Fetch Patients).
  - Patients card with table of recent bundles and expandable row details.
  - Row details render JSON via the reusable `JsonViewer` component (NHS-styled, collapsible).
  - See also: `docs/triage-simulator.md` for dataset rationale and methodology context shown elsewhere in the UI.

## Data model surfaced

Each row in the table corresponds to a bundle and shows:
- __Patient__: name + `id`.
- __Bundle File__ and __Source__ directory.
 - __Counts__: number of resources returned for each category.
- __Counts__ summary tags for `conditions`, `observations`, `medicationRequests`, `medicationStatements`, `procedures`, `encounters`, `allergies`, `immunizations`.

Expanding a row reveals JSON sections for:
- Patient resource
- Conditions
- Observations
- MedicationRequests
- MedicationStatements
- Procedures
- Encounters
- Allergies
- Immunizations

All sections are rendered with the same behavior (default closed) and can be expanded per-section or via the toolbar controls.

## UI/UX principles

- NHS.UK design system components and utility classes for consistent, accessible UI.
- Simple, native `<details>` for collapsible sections.
- No third-party JSON viewer to ensure NHS styling and predictable behavior.

## Key files

- Page: `client/src/pages/SyntheaPage.jsx`
- API service: `client/src/services/syntheaApi.js`
- Component (viewer): `client/src/components/common/JsonViewer.jsx`

## Backend route (high level)

An API route returns a list of parsed patients and diagnostics from generated bundles, including resource arrays per patient. The UI consumes this to display patients and related resources.

## Notes

- The Patients table is enclosed in an NHS card (white box) similar to the Parameters card for visual parity.
- Robust error and loading states are displayed using NHS patterns.

## See also

- Triage Simulator Description: `./triage-simulator.md`
- JsonViewer component: `./json-viewer.md`
- Sources and References: `./sources.md`
