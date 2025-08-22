# NHS MOA Triage System

A lightweight workspace to generate synthetic healthcare datasets (FHIR JSON and CSV) using Synthea via Docker, and store them under `output/`.

## Prerequisites
- Docker installed and running
- macOS or Linux shell (Windows users: see note below)

## Project Structure
- `docker-compose.yml` — defines the `synthea` service for dataset generation
- `output/` — generated data will appear here
  - `output/fhir/` — FHIR JSON
  - `output/csv/` — CSV exports

## Generate Dataset with Synthea (Docker Compose)
From the project root (`NHS-MOA-Triage-System/`). The compose file is configured to generate 5 patients and export both FHIR and CSV into `output/`.

```bash
# One-off run (recommended)
docker compose run --rm synthea

# Alternatively, start the service (it will run then exit when finished)
docker compose up synthea
```

### Notes
- Default patient count is set in `docker-compose.yml` via the service `command`.
- Override the patient count without editing the file by appending args:
  ```bash
  docker compose run --rm synthea -p 100
  ```
  The CSV export flag is already enabled in the service configuration.
- CSV files will be under `output/csv/`, FHIR JSON under `output/fhir/`.
- Windows: Use the same `docker compose` commands in PowerShell or CMD.

## Verify Outputs
After the run completes, you should see files in:
- `output/csv/` (e.g., `patients.csv`, `allergies.csv`, etc.)
- `output/fhir/` (a set of `.json` bundles per patient)

## Troubleshooting
- "permission denied" on bind mount: ensure the `output/` folder exists and you have write permissions. If missing, create it:
  ```bash
  mkdir -p output
  ```
- Docker cannot find image: ensure you’re online; Docker will pull `intersystemsdc/irisdemo-base-synthea:version-1.3.4` automatically.

## Next Steps
- Adjust patient count (`-p N`) to scale datasets.
- Explore additional Synthea flags/modules as needed.
