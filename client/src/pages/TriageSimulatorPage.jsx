import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import TriageSimulator from '../components/TriageSimulator';
import DatasetDetailPanel from '../components/DatasetDetailPanel';

const TriageSimulatorPage = () => {
  const [params] = useSearchParams();
  const datasetId = params.get('datasetId') || '';
  const hasDataset = Boolean(datasetId);
  const buttonLabel = hasDataset ? 'Back to Data Explorers' : 'Browse Data Explorers';
  const helperText = hasDataset
    ? 'Choose a different dataset or explore others.'
    : 'No dataset selected. Choose a dataset in Data Explorers to enable the Triage Simulator.';
  return (
    <>
      <h1 className="nhsuk-heading-l">Triage Simulator</h1>
      <p className="nhsuk-body">Simulate triage scenarios with selected dataset context.</p>
      <div className="nhsuk-u-margin-bottom-3">
        <Link className="nhsuk-button" to="/data-explorers">{buttonLabel}</Link>
        <p className="nhsuk-hint" style={{ marginTop: '8px' }}>{helperText}</p>
      </div>
      {hasDataset ? (
        <>
          <DatasetDetailPanel datasetId={datasetId} />
          <TriageSimulator />
        </>
      ) : (
        <div className="nhsuk-inset-text"><p className="nhsuk-body">Select a dataset to view its details and run the simulator.</p></div>
      )}
    </>
  );
};

export default TriageSimulatorPage;
