# Triage Simulator (Description Page)

The Triage Simulator Description page documents the datasets considered, methodology, and baseline triage approaches used for prototyping.

- Page: `client/src/pages/TriageSimulatorDescriptionPage.jsx`
- Text components:
  - `client/src/components/common/text/DatasetsContent.jsx`
  - `client/src/components/common/text/MethodologyContent.jsx`
  - `client/src/components/common/text/BaselineContent.jsx`

## Contents

- Available datasets: compares Synthea (UK module), HES/SUS, CPRD/OPCRD, OpenSAFELY, and public NHS RTT datasets for suitability.
- Methodology: outlines synthetic-data prototyping, intended evaluation, and how real data can be introduced later.
- Current triage methodologies: summarizes current clinical/operational approaches as a baseline to measure against.

## Links (from the page)

- Synthea (UK module): https://synthetichealth.github.io/synthea/
- Synthea GitHub: https://github.com/synthetichealth/synthea
- Synthea Docker image (Docker Hub): https://hub.docker.com/r/smartonfhir/synthea
- Synthea paper (JAMIA, 2018): https://academic.oup.com/jamia/article/25/3/230/4098271
- HES/SUS: https://digital.nhs.uk/data-and-information/data-tools-and-services/data-services/hospital-episode-statistics
- DARS Access: https://digital.nhs.uk/services/data-access-request-service-dars
- CPRD: https://www.cprd.com/
- OPCRD: https://opcrd.co.uk/
- OpenSAFELY: https://www.opensafely.org/
- NHS RTT waiting times: https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/

## Relationship to Synthea integration

- The Synthea-backed simulator UI is documented in `docs/synthea-integration.md`.
- The JSON exploration uses `JsonViewer` documented in `docs/json-viewer.md`.
 - The dataset comparison table in the page includes enriched links to the Synthea GitHub/Website/Docker image/Paper and this project's Synthea docs.

## Docker notes

- Project Docker quickstart: `README-Docker.md` in the repository root.
- For development, the client can also run standalone (`client/README.md`), while server and auxiliary services can be containerized as needed.
