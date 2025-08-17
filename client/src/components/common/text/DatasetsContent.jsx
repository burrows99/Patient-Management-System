import React from 'react';
import ExternalLink from '../links/ExternalLink';

export default function DatasetsContent() {
  return (
    <div className="nhsuk-card nhsuk-u-margin-bottom-4">
      <div className="nhsuk-card__content">
        <h2 className="nhsuk-heading-m">Reality Check</h2>
        <div
          className="nhsuk-table-responsive"
          role="region"
          aria-labelledby="dataset-comparison-caption"
          style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}
        >
          <table className="nhsuk-table" style={{ width: '100%' }}>
            <caption className="nhsuk-table__caption" id="dataset-comparison-caption">Comparison of dataset options for the simulator</caption>
            <thead className="nhsuk-table__head">
              <tr className="nhsuk-table__row">
                <th scope="col" className="nhsuk-table__header">Dataset</th>
                <th scope="col" className="nhsuk-table__header">Patient-level history</th>
                <th scope="col" className="nhsuk-table__header">Prescriptions / Symptoms / Diagnoses</th>
                <th scope="col" className="nhsuk-table__header">Wait times</th>
                <th scope="col" className="nhsuk-table__header">Free download</th>
                <th scope="col" className="nhsuk-table__header">GitHub</th>
                <th scope="col" className="nhsuk-table__header">Website</th>
                <th scope="col" className="nhsuk-table__header">Docker</th>
                <th scope="col" className="nhsuk-table__header">Paper / Docs</th>
              </tr>
            </thead>
            <tbody className="nhsuk-table__body">
              <tr className="nhsuk-table__row">
                <th scope="row" className="nhsuk-table__header">Synthea (UK module)</th>
                <td className="nhsuk-table__cell">Simulated patient histories</td>
                <td className="nhsuk-table__cell">Prescriptions, diagnoses, visits, encounters</td>
                <td className="nhsuk-table__cell">Simulated; can inject realistic waits</td>
                <td className="nhsuk-table__cell">Free</td>
                <td className="nhsuk-table__cell"><ExternalLink href="https://github.com/synthetichealth/synthea">GitHub</ExternalLink></td>
                <td className="nhsuk-table__cell"><ExternalLink href="https://synthetichealth.github.io/synthea/">Website</ExternalLink></td>
                <td className="nhsuk-table__cell"><ExternalLink href="https://hub.docker.com/r/smartonfhir/synthea">Docker Hub</ExternalLink></td>
                <td className="nhsuk-table__cell"><ExternalLink href="https://academic.oup.com/jamia/article/25/3/230/4098271">Paper</ExternalLink></td>
              </tr>
              <tr className="nhsuk-table__row">
                <th scope="row" className="nhsuk-table__header">HES / SUS</th>
                <td className="nhsuk-table__cell">Hospital episodes</td>
                <td className="nhsuk-table__cell">Diagnoses, procedures</td>
                <td className="nhsuk-table__cell">Partial wait-time info</td>
                <td className="nhsuk-table__cell">Not free; <ExternalLink href="https://digital.nhs.uk/services/data-access-request-service-dars">DARS approval</ExternalLink></td>
                <td className="nhsuk-table__cell">—</td>
                <td className="nhsuk-table__cell"><ExternalLink href="https://digital.nhs.uk/data-and-information/data-tools-and-services/data-services/hospital-episode-statistics">Website</ExternalLink></td>
                <td className="nhsuk-table__cell">—</td>
                <td className="nhsuk-table__cell">—</td>
              </tr>
              <tr className="nhsuk-table__row">
                <th scope="row" className="nhsuk-table__header">CPRD / OPCRD</th>
                <td className="nhsuk-table__cell">GP records (longitudinal)</td>
                <td className="nhsuk-table__cell">Prescriptions, labs, diagnoses</td>
                <td className="nhsuk-table__cell">Implicit waits (timestamps)</td>
                <td className="nhsuk-table__cell">Not free; ethics + <ExternalLink href="https://digital.nhs.uk/services/data-access-request-service-dars">DARS</ExternalLink></td>
                <td className="nhsuk-table__cell">—</td>
                <td className="nhsuk-table__cell">
                  <ExternalLink href="https://www.cprd.com/">CPRD</ExternalLink>{' / '}
                  <ExternalLink href="https://opcrd.co.uk/">OPCRD</ExternalLink>
                </td>
                <td className="nhsuk-table__cell">—</td>
                <td className="nhsuk-table__cell">—</td>
              </tr>
              <tr className="nhsuk-table__row">
                <th scope="row" className="nhsuk-table__header">OpenSAFELY / TRE</th>
                <td className="nhsuk-table__cell">Aggregated patient events</td>
                <td className="nhsuk-table__cell">Prescriptions, diagnoses, labs</td>
                <td className="nhsuk-table__cell">Event timestamps; inferred waits</td>
                <td className="nhsuk-table__cell">Controlled access</td>
                <td className="nhsuk-table__cell">—</td>
                <td className="nhsuk-table__cell"><ExternalLink href="https://www.opensafely.org/">Website</ExternalLink></td>
                <td className="nhsuk-table__cell">—</td>
                <td className="nhsuk-table__cell"><ExternalLink href="https://docs.opensafely.org/">Docs</ExternalLink></td>
              </tr>
              <tr className="nhsuk-table__row">
                <th scope="row" className="nhsuk-table__header">Public NHS datasets (RTT)</th>
                <td className="nhsuk-table__cell">Aggregate, not patient-level</td>
                <td className="nhsuk-table__cell">Not applicable</td>
                <td className="nhsuk-table__cell"><ExternalLink href="https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/">Official wait times (aggregate)</ExternalLink></td>
                <td className="nhsuk-table__cell">Free</td>
                <td className="nhsuk-table__cell">—</td>
                <td className="nhsuk-table__cell"><ExternalLink href="https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/">Website</ExternalLink></td>
                <td className="nhsuk-table__cell">—</td>
                <td className="nhsuk-table__cell">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="nhsuk-inset-text nhsuk-u-margin-top-3">
          <span className="nhsuk-u-visually-hidden">Information: </span>
          <p><strong>Bottom line:</strong> No free dataset combines real patient-level clinical history, prescriptions/symptoms, and NHS wait times. Closest: Synthea UK (synthetic) + public NHS RTT for statistics.</p>
          <p>We will proceed with Synthea-based synthetic data and inject realistic referral-to-treatment waits. Later, we can integrate controlled-access sources where appropriate.</p>
        </div>

        <h3 className="nhsuk-heading-s">Further reading</h3>
        <ul className="nhsuk-list nhsuk-list--bullet">
          <li>
            FHIR overview: <ExternalLink href="https://www.hl7.org/fhir/overview.html">HL7 FHIR</ExternalLink>
          </li>
          <li>
            Synthea paper: <ExternalLink href="https://academic.oup.com/jamia/article/25/3/230/4098271">JAMIA (2018)</ExternalLink>
          </li>
        </ul>
      </div>
    </div>
  );
}
