import React from 'react';

// Temporary stub for dataset detail. Replace with real implementation later.
const DatasetDetailPanel = ({ datasetId, datasetSelf }) => {
  return (
    <div className="nhsuk-card nhsuk-u-margin-bottom-3">
      <div className="nhsuk-card__content">
        <h3 className="nhsuk-heading-m">Dataset Details</h3>
        <p className="nhsuk-body">Using mock dataset details. Replace with live details later.</p>
        <dl className="nhsuk-summary-list">
          <div className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">Dataset ID</dt>
            <dd className="nhsuk-summary-list__value">{datasetId || 'N/A'}</dd>
          </div>
          <div className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">Self Link</dt>
            <dd className="nhsuk-summary-list__value">{datasetSelf || 'N/A'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default DatasetDetailPanel;
