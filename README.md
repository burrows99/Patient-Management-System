# NHS MOA Triage System

A lightweight workspace to generate synthetic healthcare datasets (FHIR JSON and CSV) using Synthea via Docker, and store them under `output/`.

## What’s Included

- __[data generation]__ Dockerized Synthea run to produce FHIR and CSV under `output/`
- __[queue simulation]__ Discrete-event simulations using `simpy` over real encounter timelines: `utils/queue_simulation.py`
- __[time-compressed MTS sim]__ Manchester Triage System-based priority queue with time compression for sparse data: `simulation/simulation.py`
- __[analytics dashboard]__ Comprehensive analysis and recommendations for capacity planning: `simulation/dashboard.py`

## Prerequisites
- Docker installed and running
- Python 3.9+ (local analytics/simulations)
- macOS or Linux shell (Windows users: see note below)

## Project Structure
- `docker-compose.yml` — defines the `synthea` service for dataset generation
- `output/` — generated data will appear here
  - `output/fhir/` — FHIR JSON
  - `output/csv/` — CSV exports
- `utils/queue_simulation.py` — basic SimPy queue model over encounters
- `simulation/simulation.py` — time-compressed MTS priority simulation
- `simulation/dataAnalysis.py` — dataset exploration helpers
- `simulation/dashboard.py` — end-to-end analytics and recommendations

## Generate Dataset with Synthea (Docker Compose)
From the project root (`NHS-MOA-Triage-System/`). The compose file is configured to generate 5 patients and export both FHIR and CSV into `output/`.

```bash
# One-off run (recommended)
docker compose run --rm synthea

# Alternatively, start the service (it will run then exit when finished)
docker compose up synthea
```

### Notes
- Default patient count is set via `.env` -> `PATIENT_COUNT=5` and read by `docker-compose.yml`.
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

## Simulations & Analytics (Local Python)

Install Python dependencies:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

- __[Queue simulation]__ using encounter arrival times and service durations:
  ```bash
  python utils/queue_simulation.py --servers=3 --class=emergency --limit=500 --defaultServiceMin=15
  ```
  Outputs JSON with `avg_wait_min`, `avg_time_in_system_min`, `utilization`, etc. See `utils/queue_simulation.py`.

- __[Time-compressed MTS simulation]__ priority queue with Manchester Triage weights and timelines compressed to a target window:
  ```bash
  python simulation/simulation.py --servers=3 --compressTo=8hours --limit=100 --debug
  ```
  Reads `output/csv/encounters.csv`, assigns MTS priorities based on encounter class and reason, compresses long time spans to simulate denser queues, and reports priority-level breach rates and P95 waits. See `simulation/simulation.py` (`ManchesterTriageSystem`, `CompressedMTSSimulation`).

- __[Dataset analysis helpers]__ overview stats and parameter suggestions:
  ```bash
  python simulation/dataAnalysis.py
  ```

- __[Comprehensive analytics dashboard]__ prints a full report and writes `analytics_summary.json`:
  ```bash
  python simulation/dashboard.py
  ```

## Troubleshooting
- "permission denied" on bind mount: ensure the `output/` folder exists and you have write permissions. If missing, create it:
  ```bash
  mkdir -p output
  ```
- Docker cannot find image: ensure you’re online; Docker will pull `intersystemsdc/irisdemo-base-synthea:version-1.3.4` automatically.

## References (selected)

- __SimPy documentation__ — Discrete‑event simulation framework with process interaction and resources: https://simpy.readthedocs.io/en/latest/ 
- __Manchester Triage System (MTS)__ — Peer‑reviewed discussions of waiting times and urgency levels: 
  - BMJ Emergency Medicine Journal: https://emj.bmj.com/content/31/1/13 
  - BMC Emergency Medicine (performance in older patients): https://bmcemergmed.biomedcentral.com/articles/10.1186/s12873-018-0217-y 
- __M/M/c queue (queueing theory)__ — Background on multi‑server queues used for staffing/utilization reasoning: https://en.wikipedia.org/wiki/M/M/c_queue 
- __Synthea__ — Synthetic patient generator used for data: https://github.com/synthetichealth/synthea 

## Next Steps
- Adjust patient count (`-p N`) to scale datasets.
- Explore additional Synthea flags/modules as needed.
 - Extend priority mapping and calibration in `simulation/simulation.py` using your local clinical policies.
 - Parameterize staffing rules and utilization targets in `simulation/dashboard.py` for scenario testing.
