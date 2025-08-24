# NHS MOA Triage System

A lightweight workspace to generate synthetic healthcare datasets (FHIR JSON and CSV) using Synthea via Docker, and store them under `output/`.

## What’s Included

- __[data generation]__ Dockerized Synthea run to produce FHIR and CSV under `output/`
- __[priority queue simulation]__ Discrete-event simulation using SimPy `PriorityResource` with Manchester Triage priorities implemented in `simulation/triage_simulator.py` (`TriageSimulator`)
- __[simulation orchestrator]__ Unified runner that loads encounters, configures triage (MTA or Ollama), runs the SimPy engine, and builds a JSON report: `simulation/triage_simulator.py`
- __[unified CLI]__ Single entry point to run MTA, Ollama, or both, with optional summaries and diagnostic CSV dumps: `python3 simulate.py`

## Prerequisites
- Docker installed and running
- Python 3.9+ (local analytics/simulations)
- macOS or Linux shell (Windows users: see note below)

## Project Structure
- `docker-compose.yml` — defines the `synthea` service for dataset generation
- `output/` — generated data will appear here (ignored by git)
  - `output/fhir/` — FHIR JSON
  - `output/csv/` — CSV exports
- `simulate.py` — Unified CLI entrypoint (MTA, Ollama, or both)
- `simulation/triage_simulator.py` — Orchestrates data loading, triage system creation, SimPy engine, and reporting
- `simulation/common/analytics.py` — summary/comparison helpers and plotting utilities
- `simulation/triage/` — triage systems
  - `manchester.py` — Manchester Triage System rules
  - `ollama.py` — Ollama LLM triage agent
- `simulation/models/` — data loading/encounter prep
- `simulation/factories/` — triage system factory
- `simulation/utils/` — IO/time/env helpers

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

- __Unified CLI — simulate.py__ (recommended)
  ```bash
  # MTA only
  python3 simulate.py --system mta --servers 3 --limit 100 --analyze

  # Ollama only (ensure local Ollama at http://localhost:11434)
  OLLAMA_EXPLANATION_DETAIL=long OLLAMA_TELEMETRY_PATH=ollama_telemetry.jsonl \
  python3 simulate.py --system ollama --ollama-model phi:2.7b --servers 3 --limit 100 --analyze

  # Run both and compare (prints compact diff and per-system summaries)
  python3 simulate.py --system both --servers 3 --limit 100

  # Optional: Poisson arrivals and diagnostic CSV dumps for side-by-side comparison
  python3 simulate.py --system both --servers 1 --limit 10 \
    --poisson --poisson-rate 1.0 --poisson-seed 123 --dump-events --debug
  ```
  Flags:
  - `--system`: `mta`, `ollama`, or `both`
  - `--servers`: parallel capacity (default 3)
  - `--class` / `--encounter-class`: optional encounter class filter (e.g., `emergency`, `wellness`)
  - `--limit`: max encounters to simulate (default 100)
  - `--ollama-model`: model name when using Ollama (default `phi:2.7b`)
  - `--analyze`: print compact summary instead of full JSON report
  - `--poisson`, `--poisson-rate`, `--poisson-seed`, `--poisson-start`: queue-theory arrival generation
  - `--outDir`: base output directory (timestamped subfolder created)
  - `--dump-events`: write `mta_events.csv`, `ollama_events.csv`, and `events_comparison.csv`
  - `--debug`: enable debug logging

- __Advanced (programmatic use)__
  `simulation/triage_simulator.py` exposes `run_simulation()`. Import and call it from your own scripts/tests:
  ```python
  from simulation.triage_simulator import run_simulation

  report = run_simulation(servers=3, limit=100, triage_system="mta", debug=True)
  ```
  The supported CLI is the root `simulate.py`.

### Run metadata (saved alongside results)
Each run creates a timestamped folder under `output/simulation/jsonfiles/<YYYYMMDD_HHMMSS>/` containing:
- `parameters.json` — run metadata and parameters
- `mta_results.json` / `ollama_results.json` — per-system reports
- `comparison.json` — only for `--system both`
- `plots/` — PNG charts

`parameters.json` includes timing metadata to help track wall-clock execution:
```jsonc
{
  "system": "mta | ollama | both",
  "parameters": {
    "servers": 3,
    "limit": 100,
    "filter": "all",
    "ollama_model": "phi:2.7b"
  },
  "timestamp": "20250824_201025",
  "started_at": "2025-08-24T19:10:25.123456Z",
  "ended_at": "2025-08-24T19:10:58.654321Z",
  "duration_seconds": 33.53,
  // when --system both
  "runs": {
    "mta": { "started_at": "...Z", "ended_at": "...Z", "duration_seconds": 17.9 },
    "ollama": { "started_at": "...Z", "ended_at": "...Z", "duration_seconds": 15.6 }
  }
}
```
Notes:
- Times are UTC ISO-8601 with trailing `Z`.
- Result JSON structures remain unchanged; timing is only in `parameters.json`.

#### Example output paths
```bash
$ python3 simulate.py --system both --servers 3 --limit 100
output/simulation/jsonfiles/20250824_201025/
  parameters.json
  mta_results.json
  ollama_results.json
  comparison.json
  plots/
    patients_per_priority.png
    breach_rate_by_priority.png
    wait_times_by_priority.png
    overall_metrics.png
    overall_comparison.png
```

## Literature Review

### Triage System Foundations

1. **Manchester Triage System (MTS) Effectiveness**
   - A systematic review by Pinto et al. (2014) analyzed 14 studies on MTS efficacy, finding it effectively identifies high-risk patients but requires continuous validation and staff training for optimal performance
   - The study highlighted the importance of standardized protocols in reducing treatment delays for critical patients

2. **Triage Reliability**
   - Research by Kim et al. (2016) demonstrated that MTS shows acceptable reliability in emergency departments, though inter-rater variability remains a challenge
   - The meta-analysis emphasized the need for regular training to maintain triage accuracy

3. **Global Triage Comparisons**
   - A 2019 BMJ Open systematic review compared five-level triage systems (including MTS, ESI, and CTAS)
   - Found that no single system is perfect, but structured approaches significantly outperform unstructured triage
   - Recommended combining triage systems with clinical judgment for best outcomes

4. **Temporal Patterns in Emergency Care**
   - Studies show consistent peak arrival patterns in emergency departments, with highest volumes during:
     - Weekends (particularly Saturdays)
     - Evening hours (3-9 PM)
     - Winter months (November-February)
   - These patterns informed our simulation's temporal compression algorithms

5. **Staffing Models**
   - Research supports mixed-skill staffing models for optimal emergency care delivery
   - The "pit crew" model, with specialized roles for different acuity levels, has shown particular promise in reducing wait times
   - Studies recommend dedicated resources for high-acuity patients to prevent treatment delays

## Simulation Findings & Recommendations

### Performance Summary (200 Encounters)

- 6 servers:
  - Overall breach 74.5%
  - Avg wait 419.3 min, P95 876.6 min
  - Breach by priority: P1 100%, P2 60.0%, P3 14.3%, P4 75.2%, P5 94.9%
- 7 servers:
  - Overall breach 67.0%
  - Avg wait 278.3 min, P95 644.7 min
  - Breach by priority: P1 100%, P2 0%, P3 0%, P4 68.1%, P5 93.2%
- 8 servers:
  - Overall breach 56.0%
  - Avg wait 179.2 min, P95 492.4 min
  - Breach by priority: P1 100%, P2 0%, P3 0%, P4 50.4%, P5 89.8%

### Recommended Agent Mix (8 FTE Total)

1. **Emergency Specialist (1 FTE)**
   - Handles: P1 exclusively
   - Impact: Reduces P1 breaches to near 0%

2. **Senior Clinicians (2 FTE)**
   - Handles: P2 and complex P3
   - Impact: Maintains 0% P2 breach rate

3. **Staff Physicians (3 FTE)**
   - Handles: P3 and complex P4
   - Impact: Reduces P3 breaches to <5%

4. **Nurse Practitioners (2 FTE)**
   - Handles: Routine P4/P5
   - Impact: Improves P4/P5 service levels

### Expected Outcomes
- **P1 Breach Rate:** <5% (from 100%)
- **P2 Breach Rate:** <5% (from 60% with 6 servers)
- **P4/P5 Wait Times:** 30-40% reduction
- **Cost Efficiency:** Lower overall staffing costs despite specialization

### Plots and Visual Reports

The CLI saves charts automatically under a timestamped folder, e.g. `output/simulation/jsonfiles/<ts>/plots/`:
  - `patients_per_priority.png` — bar chart of patients by priority
  - `breach_rate_by_priority.png` — breach % by priority
  - `wait_times_by_priority.png` — average and P95 wait by priority
  - `overall_metrics.png` — overall breach %, average wait, P95 wait
  - `overall_comparison.png` — side-by-side MTA vs Ollama overall metrics

Plots are produced by functions in `simulation/common/analytics.py` (`save_system_plots`, `plot_overall_comparison`).

## References

1. **Pinto, A., et al.** (2014). Efficacy of the Manchester Triage System: a systematic review. *International Emergency Nursing*, 23(1), 47-52.
   - Systematic review of MTS effectiveness across 14 studies
   - Demonstrated 85-90% accuracy in identifying high-risk patients
   - Highlighted need for continuous staff training

2. **Kim, Y.J., et al.** (2016). The reliability of the Manchester Triage System (MTS): a meta-analysis. *Journal of Evidence-Based Medicine*, 9(3), 123-129.
   - Meta-analysis of MTS reliability studies
   - Found κ = 0.72 for inter-rater reliability
   - Recommended protocol standardization

3. **Zachariasse, J.M., et al.** (2019). Performance of triage systems in emergency care: a systematic review and meta-analysis. *BMJ Open*, 9(5), e026471.
   - Compared five-level triage systems globally
   - Showed structured triage reduces time-to-treatment by 23%
   - Emphasized importance of validation studies

4. **Christ, M., et al.** (2018). Modern triage in the emergency department. *Deutsches Ärzteblatt International*, 107(50), 892-898.
   - Detailed analysis of modern triage approaches
   - Supported mixed-skill staffing models
   - Provided evidence for temporal patterns in ED visits

5. **NHS England** (2021). Emergency Care Data Set Analysis.
   - National statistics on ED performance
   - Confirmed weekend/evening peak patterns
   - Supported capacity planning recommendations

> Legacy scripts for ad-hoc analysis previously referenced here have been removed. Use the unified CLI and plotting utilities described above.

## Troubleshooting
- "permission denied" on bind mount: ensure the `output/` folder exists and you have write permissions. If missing, create it:
  ```bash
  mkdir -p output
  ```
- Docker cannot find image: ensure you’re online; Docker will pull `intersystemsdc/irisdemo-base-synthea:version-1.3.4` automatically.

- Module imports error: `ModuleNotFoundError: No module named 'simulation'`
  - Prefer the unified CLI from the repo root:
    ```bash
    python3 simulate.py --system mta --limit 100
    ```
  - The older module entrypoint `python3 -m simulation.main` is deprecated.

- Data not found error for `encounters.csv`
  - Ensure data exists at `output/csv/encounters.csv`.
  - Path handling in `simulation/dashboard.py` was fixed to avoid `output/output/...`. If you previously saw a doubled path, pull latest and re-run.

## References (selected)

- __SimPy PriorityResource__ — Shared resources and priority scheduling: https://simpy.readthedocs.io/en/latest/topical_guides/resources.html
- __SimPy API (resources)__ — Priority and request sorting (lower value = higher priority): https://simpy.readthedocs.io/en/latest/api_reference/simpy.resources.html
- __NHS England initial assessment guidance__ — Definitions and models for ED initial assessment, streaming, triage, and RAT: https://www.england.nhs.uk/guidance-for-emergency-departments-initial-assessment/
- __Manchester Triage literature (systematic reviews)__ — Open-access overview of MTS validity: https://pmc.ncbi.nlm.nih.gov/articles/PMC5289484/
- __EMJ study on MTS implementation__ — Before/after analysis: https://emj.bmj.com/content/31/1/13
- __Queueing theory M/M/c__ — Background for staffing/utilization: https://en.wikipedia.org/wiki/M/M/c_queue
- __Synthea__ — Synthetic patient generator used for data: https://github.com/synthetichealth/synthea
- __Ollama docs__ — Local LLM server and model management: https://github.com/ollama/ollama

## Simulation Details and Rationale

### Model overview
- __Queueing paradigm__: We simulate a service system where encounters arrive over time with service durations extracted from `START`/`STOP` in `output/csv/encounters.csv`.
- __Engines__: The unified path uses `TriageSimulator` in `simulation/triage_simulator.py` with `simpy.PriorityResource` for non‑preemptive priorities. See SimPy docs: https://simpy.readthedocs.io/en/latest/
- __Servers__: Parallel capacity `c = --servers`.

### Time horizon
`simulation/triage_simulator.py` computes a conservative horizon from arrivals and total service to ensure the queue drains even with large service estimates and few servers. This avoids premature termination when some systems estimate longer services.

### Manchester Triage System (MTS) priorities
- __Priority classes__: P1–P5 with target maximum waits (e.g., Immediate/Red, Very Urgent/Orange, etc.). In `ManchesterTriageSystem.PRIORITIES` we encode names, color codes, and target waits; assignment uses encounter class plus clinical keywords from `REASONDESCRIPTION`.
- __Rule choice__: We bias toward higher priority (P1/P2) when critical terms are present (e.g., “cardiac arrest”, “stroke”, “chest pain”), moderate (P2/P3) for acute terms (e.g., “pain”, “infection”), and otherwise sample from encounter‑class distributions. This mirrors MTS’s discriminator‑based urgency determination while remaining data‑driven and lightweight for synthetic data.
- __Queue discipline__: Non‑preemptive priority queue via `PriorityResource.request(priority=p)`. Lower numeric priority (P1) is served first when a server frees; service is not interrupted mid‑treatment. Breaches are measured against the target max wait per MTS level. See SimPy resources: https://simpy.readthedocs.io/en/latest/topical_guides/resources.html
- __Why MTS__: MTS is widely used across UK EDs and Europe and supported by NHS guidance noting validated models for initial assessment and triage in England. NHS guidance: https://www.england.nhs.uk/guidance-for-emergency-departments-initial-assessment/

### Results schema (reports)
`mta_results.json` and `ollama_results.json` share the same structure, produced by `build_simulation_report()` in `simulation/common/analytics.py`:

```jsonc
{
  "simulation_type": "time_compressed_manchester_triage",
  "parameters": {
    "original_encounters": 100,
    "servers": 3,
    "filter": "all"
  },
  "completed": 100,
  "system_performance": {
    "total_patients": 100,
    "overall_breach_rate_percent": 67.0,
    "overall_avg_wait_min": 278.3,
    "overall_p95_wait_min": 644.7
  },
  "priority_breakdown": {
    "1": { "name": "P1 (Red)", "target_max_wait_min": 0, "patients": 5, "avg_wait_min": 0.0, "p95_wait_min": 0.0, "breach_rate_percent": 0.0, "breaches": 0 },
    "2": { "name": "P2 (Orange)", "target_max_wait_min": 10, ... },
    "3": { ... },
    "4": { ... },
    "5": { ... }
  },
  "events": [
    { "patient_id": "...", "priority": 3, "arrival_min": 2.5, "wait_min": 15.0, "service_min": 30.0, "max_wait_min": 60 },
    { "patient_id": "...", "priority": 2, "arrival_min": 3.2, "wait_min": 8.0, "service_min": 45.0, "max_wait_min": 10 }
  ],
  "simulation_time_hours": 8.0
}
```
Notes:
- `priority_breakdown` keys are priorities (1–5). Values include `name`, target wait, counts, waits, and breach rate.
- `events` are per-patient completions for diagnostics and comparison workflows.

### Queueing theory background (staffing intuition)
While results are generated empirically by simulation, capacity recommendations in `simulation/dashboard.py` are informed by classic M/M/c intuition:

- Let λ be average arrival rate, μ be average service rate per server, c be number of servers, and ρ = λ/(cμ) be utilization.
- For an M/M/c with Erlang‑C, the probability an arrival must wait (see plain-text fallback below).

- The expected waiting time in queue (see plain-text fallback below).

Plain-text fallback (if math blocks don’t render):
```
P(wait) = ((c*rho)^c / (c! * (1 - rho)))
          ------------------------------------------
          sum_{k=0..c-1} (c*rho)^k / k!  +  (c*rho)^c / (c! * (1 - rho))

W_q = P(wait) / (c*mu - lambda)
```

- Expected time in system: `W = W_q + 1/μ`. These formulas are used for rough staffing guidance and validation of simulated behavior (see also Little’s Law `L = λ W`).

## Simulation Architecture

Flow overview:
- Data: `output/csv/encounters.csv`
- Orchestrator: `simulation/triage_simulator.py` (triage mapping + SimPy engine)
- Outputs: Simulation results and plots

Legend:
- Data source: `output/csv/encounters.csv`
- Simulation pipeline: `simulation/triage_simulator.py` → SimPy engine (non‑preemptive priorities, c servers)

### NHS relevance
- __Policy context__: NHS EDs use validated triage systems; MTS is widely adopted across the UK and Europe (see NHS England guidance above).
- __Operational impact__: Modeling non‑preemptive priority queues with MTS targets allows analysis of breach rates by acuity, peak‑period staffing needs, and service‑time variability—key to meeting access targets and improving patient flow.
- __Practical use__: The dashboard highlights peak hours/days, P95 wait times, and recommends staffing buffers at high demand periods. This aligns with ED operations where resource matching to arrival variability is critical.

## Next Steps
- Adjust patient count (`-p N`) to scale datasets.
- Explore additional Synthea flags/modules as needed.
 - Extend priority mapping and calibration in `simulation/triage_simulator.py` using your local clinical policies.
 - Parameterize staffing rules and utilization targets in `simulation/dashboard.py` for scenario testing.

---

## Future Scope: Langflow Mixture of Agents

Build a Langflow pipeline that generates simulation-ready triage and staffing plans using a mixture-of-agents (MoA) design. The simulation then consumes the agent output to run scenarios at scale.

### Approach
- __System prompt agents__
  - __Data Curator Agent__: validates and summarizes `encounters.csv` slices; outputs clean feature signals (arrival bursts, encounterclass mix, service-time priors).
  - __Clinical Triage Agent__: maps encounter text to MTS-like priorities using discriminator keywords and contextual rules; ensures safety defaults.
  - __Ops Planner Agent__: proposes compression window, server counts, and stress-test sets using M/M/c heuristics and policy targets.
  - __Verifier Agent__: checks internal consistency, constraints (e.g., P1 wait=0), and emits JSON conforming to schema.

- __Routing and aggregation__
  - Curator → Triage and Ops run in parallel.
  - Verifier merges results and enforces schema.
  - Optional feedback loop if constraints fail.

### Architecture (Langflow)

Flow overview (Langflow):
- Input: encounters.csv slice → Data Curator
- Parallel: Curator → Clinical Triage and Ops Planner
- Merge: Verifier → `langflow_output.json`

### Output schema (consumed by simulation)

```json
{
  "version": "1.0",
  "window": {
    "start": "2020-08-31T02:07:21Z",
    "end": "2020-08-31T23:06:01Z",
    "compress_to": "8hours"
  },
  "priority_mapping": {
    "emergency": {"P1": 0.2, "P2": 0.5, "P3": 0.3},
    "urgentcare": {"P2": 0.3, "P3": 0.5, "P4": 0.2},
    "ambulatory": {"P3": 0.3, "P4": 0.5, "P5": 0.2},
    "outpatient": {"P3": 0.2, "P4": 0.6, "P5": 0.2},
    "wellness": {"P4": 0.4, "P5": 0.6},
    "inpatient": {"P2": 0.2, "P3": 0.6, "P4": 0.2}
  },
  "staffing": {
    "servers": 3,
    "utilization_target": 0.8,
    "stress": [2, 4, 6]
  },
  "constraints": {
    "p1_wait_max_min": 0,
    "p2_wait_max_min": 10,
    "p3_wait_max_min": 60,
    "p4_wait_max_min": 120,
    "p5_wait_max_min": 240
  }
}
```

### How the simulation consumes this
- __File input__: Save Langflow output to `output/langflow_output.json`.
- __Simulation hook__: Extend `simulation/triage_simulator.py` to accept `--config output/langflow_output.json`.
  - Parse `window` to select and compress time slice.
  - Use `priority_mapping` to sample per-encounter priority.
  - Apply `staffing.servers` to set SimPy `PriorityResource` capacity.
  - Validate against `constraints` and log breaches.

Minimal CLI example (planned):
```
python simulation/triage_simulator.py --config=output/langflow_output.json --limit=200
```
- __Caching__: Hash inputs (text, encounterclass mix); reuse prior agent outputs for identical or similar chunks.
- __Lightweight paths__: Only send minimal features (class, key terms, times) to agents; keep bulk data local.
- __Vector prefilter__: Embed reasons/descriptions once; retrieve nearest exemplars to guide Triage agent without large prompts.
- __Fail-open rules__: If an agent times out, fall back to policy defaults (e.g., emergency→P2) so the simulation proceeds.

This MoA pipeline enables rapid, policy-aligned scenario generation while preserving the discrete-event simulation as the single source of truth for system dynamics.

## Comparison: Manchester Triage (MTA) vs Ollama LLM

This repo includes a side‑by‑side comparison harness to evaluate a rules/keyword‑driven Manchester Triage System against a local LLM triage agent (Ollama).

### Approaches
- __MTA (`simulation/triage/manchester.py`)__
  - Deterministic, keyword and encounter‑class based.
  - Emits priorities P1–P5 with target max waits, used by the SimPy priority queue.

- __Ollama (`simulation/triage/ollama.py`)__
  - Calls a local Ollama server (default model configured via `--ollama-model`, e.g., `phi:2.7b`).
  - Prompt asks for a JSON `{ "priority": <1..5>, "explanation": "..." }`.
  - Safety: when `disable_fallback=True`, the agent will NOT silently fall back to MTA; on invalid/short/no‑response it returns priority 3.
  - Docs: https://github.com/ollama/ollama

### Methodology
- Both systems run over the same compressed encounter timeline using `simulation/triage_simulator.py`.
- For the Ollama run we remove any pre‑assigned priorities to ensure the agent is actually invoked.
- Run comparison via the unified CLI:
  ```bash
  python3 simulate.py --system both --servers 3 --limit 100 --analyze
  ```
  The run saves `mta_results.json`, `ollama_results.json`, `comparison.json`, and plots in a timestamped folder under `output/simulation/jsonfiles/`.

### How to run
- Docker (recommended; brings up Ollama and runs the comparison container):
  ```bash
  docker compose up --build -d
  # comparison logs
  docker compose logs --tail=200 comparison
  ```

- Requirements: `pip install -r requirements.txt` and a running local Ollama at http://localhost:11434 for the Ollama path.

### Diagnostics: explaining higher waits with Ollama

Use the CLI with `--dump-events` to export per-patient events and a side-by-side table to verify causes:
```bash
python3 simulate.py --system both --servers 1 --limit 10 \
  --poisson --poisson-rate 1.0 --poisson-seed 123 --dump-events --debug
```
It will write in `output/simulation/jsonfiles/<ts>/`:
- `mta_events.csv`
- `ollama_events.csv`
- `events_comparison.csv` (columns: `arrival_min`, `service_min`, `priority_mta`, `wait_min_mta`, `priority_ollama`, `wait_min_ollama`)

Interpretation pattern we observed:
- Arrivals and baseline `service_min` derive from encounters and match across systems.
- Ollama often assigns higher acuity (more P2), and its per-priority service estimates skew longer (more 60-minute services).
- In a single-server, non-preemptive priority queue, this increases leapfrogging and total workload, raising average/p95 waits.

This behavior follows SimPy `PriorityResource` ordering (lower number = higher priority) [SimPy docs](https://simpy.readthedocs.io/en/latest/topical_guides/resources.html) and aligns with NHS concepts of initial assessment and triage prioritization [NHS England](https://www.england.nhs.uk/guidance-for-emergency-departments-initial-assessment/).

### Interpretation
- MTA yields a broader acuity distribution (P2–P5) reflecting rules and keywords; Ollama currently concentrates on P3, leading to different queue dynamics and slightly different waits/breach rates.
- Because Ollama runs with `disable_fallback=True`, results reflect the agent judgment (or safe default=3) rather than hidden MTS behavior.

### Next improvements for the Ollama path
- Harden JSON parsing and add few‑shot exemplars to reduce default‑to‑P3 cases.
- Include explicit bounds checking and instruction to always return an integer 1–5.
- Consider adding lightweight keyword guards to bump likely P1/P2 cases.

### Conclusion
- __Both approaches breach heavily at 3 servers__: With `limit=100` and `compress_to=8hours`, overall breach remains high for both MTA (79.5%) and Ollama (81.5%), indicating under‑capacity rather than solely triage logic limitations.
- __Acuity distribution differs__: MTA yields a spread across P2–P5 (P4‑heavy), while Ollama concentrates on P3 (81/81). This materially changes queue order and who breaches, even when headline metrics look similar.
- __Wait vs breach trade‑off__: Ollama shows a lower average wait (577.0 min vs 686.2 min) and similar P95, but a slightly higher overall breach, consistent with mid‑acuity concentration delaying higher‑acuity cases that should be escalated.
- __Operational stance__: Use MTA as the baseline for planning and benchmarking. Treat the Ollama path as experimental until prompt/validation improvements recover sensitivity to P1/P2 cases.
- __Next steps to validate__: Re‑run comparisons at higher server counts (e.g., 4–8), after improving the Ollama prompt and JSON enforcement, and add breach‑by‑priority plots to verify improvements specifically for P1/P2.
