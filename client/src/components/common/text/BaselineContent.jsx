import React from 'react';
import ExternalLink from '../links/ExternalLink';

export default function BaselineContent() {
  return (
    <div className="nhsuk-card nhsuk-u-margin-bottom-4">
      <div className="nhsuk-card__content">
        <h2 className="nhsuk-heading-m">Current triage methodologies (baseline)</h2>
        <ul className="nhsuk-list nhsuk-list--bullet">
          <li>
            <strong>NHS Pathways / NHS 111:</strong> telephone triage driven by structured clinical decision support with trained call handlers and clinicians. Proven safety at national scale but can be conservative and resource-intensive.
            <br />
            <ExternalLink href="https://digital.nhs.uk/services/nhs-pathways">NHS Pathways</ExternalLink>
          </li>
          <li>
            <strong>Manchester Triage System (MTS):</strong> ED triage categories using flowcharts and discriminators. Widely used but variable inter-rater reliability and limited personalisation.
            <br />
            <ExternalLink href="https://www.elsevier.com/books-and-journals/manchester-triage">Manchester Triage</ExternalLink>
          </li>
          <li>
            <strong>NEWS2:</strong> physiological early warning score used to identify acute deterioration. Excellent for vital-sign risk but not a full triage for all presentations.
            <br />
            <ExternalLink href="https://www.rcplondon.ac.uk/projects/outputs/national-early-warning-score-news-2">NEWS2</ExternalLink>
          </li>
          <li>
            <strong>Local SOPs and referral criteria:</strong> trust-specific rules and guideline documents used by advice and guidance, referral centres, and specialty pathways.
          </li>
        </ul>

        <h3 className="nhsuk-heading-s">Current bottlenecks</h3>
        <ul className="nhsuk-list nhsuk-list--bullet">
          <li><strong>Capacity/latency:</strong> human-in-the-loop for every step increases wait times and staffing pressure.</li>
          <li><strong>Variability:</strong> inter-rater differences and uneven application of guidance.</li>
          <li><strong>Fragmented knowledge:</strong> SOPs/guidelines live in PDFs and intranets; hard to keep current at point of triage.</li>
          <li><strong>Limited personalisation:</strong> static rules struggle with complex multimorbidity and medication context.</li>
          <li><strong>Audit burden:</strong> extracting rationales and citations for QA is manual and time-consuming.</li>
        </ul>

        <h3 className="nhsuk-heading-s">How the proposed hybrid MoA helps</h3>
        <ul className="nhsuk-list nhsuk-list--bullet">
          <li><strong>Safety guardrails first:</strong> rule-based red-flag screen ensures critical cases escalate immediately.</li>
          <li><strong>Grounded reasoning:</strong> retrieval of NHS guidance and local SOPs anchors LLM outputs to verifiable sources.</li>
          <li><strong>Specialisation:</strong> agents focus on sub-problems (risk, guideline match, consistency), improving accuracy and explainability.</li>
          <li><strong>Deterministic fusion:</strong> adjudicator applies a reproducible policy with safety weighting and conflict resolution.</li>
          <li><strong>Built-in audit:</strong> outputs include citations, intermediate rationales, and versioned guideline IDs.</li>
        </ul>

        <h3 className="nhsuk-heading-s">Alternative direction: learning health system</h3>
        <p className="nhsuk-body">
          In parallel, a <em>learning</em> approach can continuously evaluate triage decisions against outcomes (synthetic first, retrospective next), updating prompts, guidance corpora, and rule thresholds via governance. This emphasises
          measurement and iterative improvement over static rules alone.
        </p>

        <h3 className="nhsuk-heading-s">Selected references</h3>
        <ul className="nhsuk-list nhsuk-list--bullet">
          <li><ExternalLink href="https://digital.nhs.uk/services/nhs-pathways">NHS Pathways overview</ExternalLink></li>
          <li><ExternalLink href="https://www.rcplondon.ac.uk/projects/outputs/national-early-warning-score-news-2">NEWS2 (RCP)</ExternalLink></li>
          <li><ExternalLink href="https://www.nice.org.uk/">NICE Guidance library</ExternalLink></li>
          <li><ExternalLink href="https://www.elsevier.com/books-and-journals/manchester-triage">Manchester Triage System</ExternalLink></li>
          <li><ExternalLink href="https://synthetichealth.github.io/synthea/">Synthea documentation</ExternalLink></li>
          <li><ExternalLink href="https://www.opensafely.org/">OpenSAFELY</ExternalLink></li>
        </ul>
      </div>
    </div>
  );
}
