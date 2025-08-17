import React from 'react';
import TriageControls from './TriageControls';
import TriageTable from './TriageTable';
import { useTriageSimulation } from '../hooks/useTriageSimulation';

export default function TriageSimulator() {
  const {
    dept, setDept,
    count, setCount,
    datasetId, setDatasetId,
    formState, formAction, pending,
    columns,
  } = useTriageSimulation();

  const datasets = [];

  return (
    <div className="nhsuk-card nhsuk-u-margin-top-5">
      <div className="nhsuk-card__content">
        {/* <h2 className="nhsuk-heading-l">Triage Simulator</h2> */}

        {formState.notice && (
          <div className="nhsuk-inset-text nhsuk-u-margin-bottom-3">
            <span className="nhsuk-u-visually-hidden">Information: </span>
            <p>{formState.notice}</p>
          </div>
        )}

        <TriageControls
          dept={dept}
          onDeptChange={setDept}
          datasetId={datasetId}
          onDatasetChange={setDatasetId}
          datasets={datasets}
          count={count}
          onCountChange={setCount}
          action={formAction}
          pending={pending}
        />

        {formState.error && (
          <div className="nhsuk-error-summary nhsuk-u-margin-top-3" role="alert" aria-labelledby="error-summary-title" tabIndex={-1}>
            <h2 className="nhsuk-error-summary__title" id="error-summary-title">Error</h2>
            <div className="nhsuk-error-summary__body">
              <p>{formState.error}</p>
            </div>
          </div>
        )}

        <TriageTable dept={dept} columns={columns} data={formState.data} loading={pending} />
      </div>
    </div>
  );
}
