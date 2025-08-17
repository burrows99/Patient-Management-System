import React, { useEffect, useMemo, useState, useActionState, startTransition } from 'react';
import TriageControls from './triage/TriageControls';
import TriageTable from './triage/TriageTable';
import useDatasets from '../hooks/useDatasets';
import { simulateTriage } from '../services/triageApi';

export default function TriageSimulator() {
  const [dept, setDept] = useState('ED');
  const [count, setCount] = useState(30);
  const { items: datasets, notice: datasetsNotice } = useDatasets();
  const [datasetId, setDatasetId] = useState('dd5f0174-575f-4f4c-a4fc-b406aab953d9');

  const [formState, formAction, pending] = useActionState(
    async (prev, formData) => {
      const deptF = (formData?.get?.('dept') || dept);
      const countF = Number(formData?.get?.('count') || count || 0);
      const datasetIdF = (formData?.get?.('datasetId') || datasetId);
      try {
        const { items, warning } = await simulateTriage({ dept: deptF, n: countF, datasetId: datasetIdF });
        return { data: items, error: '', notice: warning || '' };
      } catch (e) {
        return { data: prev?.data || [], error: e.message || 'Failed to fetch', notice: e.warning || '' };
      }
    },
    { data: [], error: '', notice: '' }
  );

  useEffect(() => {
    if (datasets && datasets.length > 0) {
      const first = datasets[0];
      const id = first.persistentId || first.id;
      if (id) setDatasetId(id);
    }
  }, [datasets]);

  useEffect(() => {
    // Trigger initial load using current controlled values inside a transition
    startTransition(() => {
      const fd = new FormData();
      fd.set('dept', dept);
      fd.set('count', String(count));
      fd.set('datasetId', datasetId);
      formAction(fd);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(
    () => [
      { key: 'priorityScore', label: 'Priority' },
      { key: 'triageCategory', label: 'Triage' },
      { key: 'waitMins', label: 'Wait (min)' },
      { key: 'age', label: 'Age' },
      { key: 'arrivalTime', label: 'Arrived' },
    ],
    []
  );

  return (
    <div className="nhsuk-card nhsuk-u-margin-top-5">
      <div className="nhsuk-card__content">
        <h2 className="nhsuk-heading-l">Triage Simulator</h2>

        {(datasetsNotice || formState.notice) && (
          <div className="nhsuk-inset-text nhsuk-u-margin-bottom-3">
            <span className="nhsuk-u-visually-hidden">Information: </span>
            <p>{datasetsNotice || formState.notice}</p>
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
