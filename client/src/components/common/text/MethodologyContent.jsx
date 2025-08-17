import React from 'react';

export default function MethodologyContent() {
  return (
    <div className="nhsuk-card nhsuk-u-margin-bottom-4">
      <div className="nhsuk-card__content">
        <h2 className="nhsuk-heading-m">Methodology using synthetic patient data</h2>
        <p className="nhsuk-body">For early prototyping we use Synthea (UK module) to generate representative, privacy-safe patient journeys. This lets us iterate on triage logic, UI, and safety checks without handling real patient-identifiable data.</p>

        <h3 className="nhsuk-heading-s">Experimental approaches evaluated</h3>
        <ul className="nhsuk-list nhsuk-list--bullet">
          <li>
            <strong>Rule-first baseline:</strong> Deterministic rules derived from simple clinical heuristics (e.g., NEWS2-like thresholds, red-flag symptoms) to route to Urgent/Soon/Routine. Pros: transparent, predictable. Cons: brittle, limited coverage.
          </li>
          <li>
            <strong>Single-agent LLM triage:</strong> One agent reads structured patient summary and produces disposition + rationale. Pros: flexible. Cons: prompt brittleness, variability, limited auditability without strict scaffolding.
          </li>
          <li>
            <strong>Retrieval-augmented LLM:</strong> LLM reasons with retrieved guidance (local triage SOPs, NHS pathways) to ground outputs. Pros: improved faithfulness. Cons: requires curation and versioning of guidance corpus.
          </li>
          <li>
            <strong>Mixture-of-Agents (MoA):</strong> Multiple specialised agents (symptom classifier, risk screener, guideline checker) produce opinions that are fused by an adjudicator with safety bias. Pros: modular, traceable rationales per subtask. Cons: orchestration complexity.
          </li>
        </ul>

        <h3 className="nhsuk-heading-s">Key issues found</h3>
        <ul className="nhsuk-list nhsuk-list--bullet">
          <li><strong>Safety vs. specificity:</strong> Naïve LLMs over-escalate or under-specify without structured checks.</li>
          <li><strong>Determinism:</strong> Variance in outputs under small prompt/input changes without guardrails.</li>
          <li><strong>Auditability:</strong> Clinicians need reasoned, referenceable justifications and a record of which rules/guidelines were applied.</li>
          <li><strong>Data drift:</strong> Synthetic distributions can diverge from local case mix; needs scenario coverage and calibration phase before real data.</li>
        </ul>

        <h3 className="nhsuk-heading-s">Proposed approach that should work</h3>
        <ol className="nhsuk-list nhsuk-list--number">
          <li>
            <strong>Hybrid pipeline:</strong> Apply a <em>rule-first safety screen</em> (hard red flags), then a <em>MoA layer</em>:
            <ul className="nhsuk-list nhsuk-list--bullet">
              <li><strong>Agent A — Symptom/Risk classifier:</strong> maps complaints + vitals to syndromic categories and initial risk band.</li>
              <li><strong>Agent B — Guideline checker:</strong> retrieves relevant NHS guidance and validates recommended disposition.</li>
              <li><strong>Agent C — Consistency/audit agent:</strong> assembles a concise rationale with citations and flags conflicts.</li>
            </ul>
          </li>
          <li>
            <strong>Adjudicator:</strong> deterministic fusion with safety weighting (safety screen &gt; guideline check &gt; classifier). Any disagreement escalates to the safer disposition and surfaces reasons.
          </li>
          <li>
            <strong>Traceability:</strong> store inputs, intermediate agent outputs, retrieved guidance IDs/versions, and final rationale for audit and QA.
          </li>
          <li>
            <strong>Calibration on synthetic data:</strong> scenario-led tests (chest pain, sepsis flags, frailty falls, paediatrics fever, mental health crisis) with pass/fail criteria before any real-data pilot.
          </li>
        </ol>

        <h3 className="nhsuk-heading-s">Evaluation plan (synthetic stage)</h3>
        <ul className="nhsuk-list nhsuk-list--bullet">
          <li><strong>Safety metrics:</strong> under-triage rate (must be near-zero), over-triage rate, red-flag capture, guideline adherence.</li>
          <li><strong>Quality metrics:</strong> rationale completeness, citation presence, determinism across seeds, latency per case.</li>
          <li><strong>Coverage:</strong> scenario set completion and edge-case handling; regression tests for new prompts/agents.</li>
        </ul>

        <h3 className="nhsuk-heading-s">Another approach: training a reasoning model (step-wise fine-tuning)</h3>
        <p className="nhsuk-body">
          We can train a model to <strong>explain its reasoning first</strong>, then produce the final queue. The idea is to supervise each
          intermediate reasoning step so the model learns safe, auditable decision-making, and then optionally distil this into a
          <em>direct queue predictor</em> for faster runtime.
        </p>
        <ol className="nhsuk-list nhsuk-list--number">
          <li>
            <strong>Define states and queues:</strong> enumerate queues (Urgent, Soon, Routine, Self-care, etc.) and the
            <em>initiated → end</em> queue journey for a case, including red flags, risk bands, and guideline checks.
          </li>
          <li>
            <strong>Instrument the pipeline:</strong> log structured <em>reasoning steps</em> during triage (symptom/risk assessment,
            red-flag screen, guideline retrieval/match, conflict checks, final disposition).
          </li>
          <li>
            <strong>Create step-level labels:</strong> curate training data with ground-truth for each step (for synthetic: rules + clinician
            templates; for real retrospective: annotated traces in a secure environment).
          </li>
          <li>
            <strong>Train a reasoning model:</strong> fine-tune to predict the next step given inputs and prior steps, enforcing
            safety-first constraints and citation of guidance IDs/versions.
          </li>
          <li>
            <strong>Attach a policy head for the queue:</strong> map the full reasoning trace to the final queue label. Optimise for
            under-triage minimisation and guideline adherence.
          </li>
          <li>
            <strong>Distil to a direct model (optional):</strong> compress the step-wise model into a smaller model that
            predicts the <em>queue directly</em> without emitting steps, using distillation or preference optimisation while keeping
            guardrails (rules/red flags) externally enforced.
          </li>
          <li>
            <strong>Evaluate and calibrate:</strong> run the same safety and quality metrics, plus <em>trace faithfulness</em> checks
            (do the steps align with referenced guidance?).
          </li>
        </ol>

        <div className="nhsuk-inset-text">
          <span className="nhsuk-u-visually-hidden">Information: </span>
          <p className="nhsuk-body">Once the synthetic evaluation passes thresholds, we will run a staffed shadow deployment with retrospective, de-identified cases in a secure environment before any live use.</p>
        </div>
      </div>
    </div>
  );
}
