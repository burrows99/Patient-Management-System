import React from 'react';
import ExternalLink from '../links/ExternalLink';

export default function SyntheaHapiNotes() {
  return (
    <div className="nhsuk-card nhsuk-u-margin-bottom-4">
      <div className="nhsuk-card__content">
        <h2 className="nhsuk-heading-m">HAPI FHIR (R4) and Triage Defaults</h2>

        <p className="nhsuk-body">This app uses a HAPI FHIR R4 server behind our API to fetch triage-focused patient data from Synthea records. Client never talks to HAPI directly.</p>

        <h3 className="nhsuk-heading-s">HAPI details</h3>
        <ul className="nhsuk-list nhsuk-list--bullet">
          <li><strong>Operation:</strong> Patient <code>$everything</code> with server-side pagination; we follow <code>link[rel="next"].url</code> until done.</li>
          <li><strong>Filters forwarded:</strong> <code>_type</code>, <code>_typeFilter</code>, <code>_elements</code>, <code>_summary</code>, <code>start</code>, <code>end</code>, <code>_since</code>.</li>
          <li><strong>Performance:</strong> Defaults keep bundles lean; switch presets (Rich/Lean) as needed.</li>
          <li><strong>Security:</strong> API keys/secrets remain on the server; browser accesses only our Express endpoints.</li>
        </ul>

        <div className="nhsuk-inset-text nhsuk-u-margin-top-3">
          <span className="nhsuk-u-visually-hidden">Information: </span>
          <p><strong>FHIR version:</strong> R4 only. No STU3/US Core branching in this app.</p>
        </div>

        <h3 className="nhsuk-heading-s">Assumptions & defaults</h3>
        <ul className="nhsuk-list nhsuk-list--bullet">
          <li><strong>Resource scope (default types):</strong> Condition, Observation (vitals), MedicationRequest, MedicationStatement, Procedure, Encounter, AllergyIntolerance, Immunization.</li>
          <li><strong>Observation filter:</strong> Vital-signs only via <code>_typeFilter</code> to reduce noise.</li>
          <li><strong>Element presets:</strong>
            <ul>
              <li><strong>rich</strong> (default): includes <code>text</code>, <code>note</code>, code displays, identifiers, dates, and key clinical fields.</li>
              <li><strong>lean</strong>: excludes narrative/notes; retains identifiers, status, category, code, subject, effective/issued, value, and minimal references.</li>
            </ul>
          </li>
          <li><strong>Overrides:</strong> Passing explicit <code>elements</code> bypasses the preset; advanced params are forwarded as-is.</li>
          <li><strong>Counts in UI:</strong> Based on arrays fetched under current filters/presets, not global patient history.</li>
        </ul>

        <h3 className="nhsuk-heading-s">Endpoint (via API server)</h3>
        <pre className="nhsuk-u-font-size-16 nhsuk-u-margin-bottom-2" style={{ whiteSpace: 'pre-wrap' }}>{`GET /synthea/patients?n=10&elementsPreset=rich
# Optional: patientId, _count, types, typeFilter, elements, _summary, start, end, _since`}</pre>

        <p className="nhsuk-body">HAPI FHIR project: <ExternalLink href="https://hapifhir.io/">hapifhir.io</ExternalLink>. Patient <code>$everything</code>: <ExternalLink href="https://www.hl7.org/fhir/operation-patient-everything.html">HL7 spec</ExternalLink>.</p>
      </div>
    </div>
  );
}
