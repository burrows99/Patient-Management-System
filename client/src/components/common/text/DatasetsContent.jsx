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
              </tr>
            </thead>
            <tbody className="nhsuk-table__body">
              <tr className="nhsuk-table__row">
                <th scope="row" className="nhsuk-table__header">
                  <ExternalLink href="https://synthetichealth.github.io/synthea/">Synthea (UK module)</ExternalLink>
                </th>
                <td className="nhsuk-table__cell">Simulated patient histories</td>
                <td className="nhsuk-table__cell">Prescriptions, diagnoses, visits, encounters</td>
                <td className="nhsuk-table__cell">Simulated; can inject realistic waits</td>
                <td className="nhsuk-table__cell">
                  <ExternalLink href="https://github.com/synthetichealth/synthea">Fully free</ExternalLink>
                </td>
              </tr>
              <tr className="nhsuk-table__row">
                <th scope="row" className="nhsuk-table__header">
                  <ExternalLink href="https://digital.nhs.uk/data-and-information/data-tools-and-services/data-services/hospital-episode-statistics">HES / SUS</ExternalLink>
                </th>
                <td className="nhsuk-table__cell">Hospital episodes</td>
                <td className="nhsuk-table__cell">Diagnoses, procedures</td>
                <td className="nhsuk-table__cell">Partial wait-time info</td>
                <td className="nhsuk-table__cell">
                  Not free; <ExternalLink href="https://digital.nhs.uk/services/data-access-request-service-dars">DARS approval</ExternalLink>
                </td>
              </tr>
              <tr className="nhsuk-table__row">
                <th scope="row" className="nhsuk-table__header">
                  <ExternalLink href="https://www.cprd.com/">CPRD</ExternalLink> / {""}
                  <ExternalLink href="https://opcrd.co.uk/">OPCRD</ExternalLink>
                </th>
                <td className="nhsuk-table__cell">GP records (longitudinal)</td>
                <td className="nhsuk-table__cell">Prescriptions, labs, diagnoses</td>
                <td className="nhsuk-table__cell">Implicit waits (timestamps)</td>
                <td className="nhsuk-table__cell">
                  Not free; ethics + <ExternalLink href="https://digital.nhs.uk/services/data-access-request-service-dars">DARS</ExternalLink>
                </td>
              </tr>
              <tr className="nhsuk-table__row">
                <th scope="row" className="nhsuk-table__header">
                  <ExternalLink href="https://www.opensafely.org/">OpenSAFELY</ExternalLink> / TRE
                </th>
                <td className="nhsuk-table__cell">Aggregated patient events</td>
                <td className="nhsuk-table__cell">Prescriptions, diagnoses, labs</td>
                <td className="nhsuk-table__cell">Event timestamps; inferred waits</td>
                <td className="nhsuk-table__cell">Controlled access</td>
              </tr>
              <tr className="nhsuk-table__row">
                <th scope="row" className="nhsuk-table__header">
                  <ExternalLink href="https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/">Public NHS datasets (RTT)</ExternalLink>
                </th>
                <td className="nhsuk-table__cell">Aggregate, not patient-level</td>
                <td className="nhsuk-table__cell">Not applicable</td>
                <td className="nhsuk-table__cell">
                  <ExternalLink href="https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/">Official wait times (aggregate)</ExternalLink>
                </td>
                <td className="nhsuk-table__cell">Free</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="nhsuk-inset-text nhsuk-u-margin-top-3">
          <span className="nhsuk-u-visually-hidden">Information: </span>
          <p><strong>Bottom line:</strong> No free dataset combines real patient-level clinical history, prescriptions/symptoms, and NHS wait times. Closest: Synthea UK (synthetic) + public NHS RTT for statistics.</p>
          <p>We will proceed with Synthea-based synthetic data and inject realistic referral-to-treatment waits. Later, we can integrate controlled-access sources where appropriate.</p>
        </div>
      </div>
    </div>
  );
}
