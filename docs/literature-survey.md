# Literature Survey

This survey summarises relevant work in emergency triage, queueing, healthcare operations, and AI/agent systems for clinical support. It is a living document.

## Emergency triage systems
- Manchester Triage System (MTS), Canadian Triage & Acuity Scale (CTAS), Australasian Triage Scale (ATS), Emergency Severity Index (ESI).
  - Common principles: category dominance (1–5), target times per category, reassessment, clinical discriminators.
  - Key references:
    - Mackway-Jones K, et al. Emergency Triage. BMJ Books.
    - Gilboy N, et al. Emergency Severity Index (ESI) Implementation Handbook. AHRQ.

## Operational research & queueing in EDs
- Queueing models for ED flow, wait-time prediction, and capacity planning.
  - References: Green LV. Queueing analysis in healthcare. Handbook of Healthcare System Scheduling; Hoot NR, Aronsky D. Systematic review of ED crowding.

## Early warning scores and risk
- NEWS2 and vital-sign–based risk stratification; paediatric modifiers; time-to-target adherence.
  - Royal College of Physicians. National Early Warning Score (NEWS2) Standardising the assessment of acute-illness severity.

## Synthetic data and privacy
- Synthea and open FHIR test servers for research without patient data exposure.
  - Walonoski J, et al. Synthea: An approach, method, and software mechanism for generating synthetic patients.

## AI assistants and multi-agent systems (MAS)
- Orchestration patterns: tool use, planning-execution loops, debate, and specialist ensembles (mixture-of-agents).
  - OpenAI toolformer/agents, AutoGen (Microsoft), CAMEL, Reflexion, ReAct.
  - Use cases: data wrangling, retrieval-augmented generation, decision support adjuncts, simulation control.

## Safety, governance, and clinical decision support (CDS)
- Human-in-the-loop design, auditability, and transparency; not a replacement for clinical judgement.
  - EU MDR, UK MHRA guidance for SaMD; NICE evidence standards framework.

## Implications for this project
- Our simulator should preserve category dominance, use target-based time pressure, and support re-triage.
- MAS can be applied to data exploration (open data APIs), summarisation, and hypothesis generation—not final triage decisions.
