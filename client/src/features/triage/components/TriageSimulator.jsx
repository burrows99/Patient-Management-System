import React from 'react';
import TriageControls from './TriageControls';
import TriageTable from './TriageTable';
import { useTriageSimulation } from '../hooks/useTriageSimulation';

export default function TriageSimulator() {
  const {
    dept,
    formState, formAction, pending,
    rows,
    streaming, metaInfo, eventCount,
    columns,
    controls,
  } = useTriageSimulation();

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

        <TriageControls controls={controls} action={formAction} pending={pending || streaming} />

        {formState.error && (
          <div className="nhsuk-error-summary nhsuk-u-margin-top-3" role="alert" aria-labelledby="error-summary-title" tabIndex={-1}>
            <h2 className="nhsuk-error-summary__title" id="error-summary-title">Error</h2>
            <div className="nhsuk-error-summary__body">
              <p>{formState.error}</p>
            </div>
          </div>
        )}

        {/* Debug/diagnostics panel */}
        <div className="nhsuk-inset-text nhsuk-u-margin-top-3 nhsuk-u-margin-bottom-3">
          <p>
            <strong>Status:</strong> {streaming ? 'Streaming' : 'Idle'} · <strong>Events:</strong> {eventCount}
            {metaInfo && (
              <>
                {' '}· <strong>Range:</strong> {metaInfo.historicalRange?.start} → {metaInfo.historicalRange?.end}
                {' '}· <strong>Scale:</strong> {metaInfo.simScale}
              </>
            )}
          </p>
        </div>

        <TriageTable dept={dept} columns={columns} data={rows} loading={streaming && rows.length === 0} />
      </div>
    </div>
  );
}
