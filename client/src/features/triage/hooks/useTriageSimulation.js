import { useEffect, useMemo, useState, useActionState, startTransition } from 'react';
import { simulateTriage } from '../../../services/triageApi';

/**
 * useTriageSimulation
 * - Encapsulates triage simulation form state and submission
 * - Uses React 19 actions via useActionState
 */
export function useTriageSimulation(initial = {}) {
  const [dept, setDept] = useState(initial.dept || 'ED');
  const [count, setCount] = useState(Number(initial.count ?? 30));
  const [datasetId, setDatasetId] = useState(initial.datasetId || 'dd5f0174-575f-4f4c-a4fc-b406aab953d9');
  const [method, setMethod] = useState(initial.method || 'rules');
  const [patientId, setPatientId] = useState(initial.patientId || '');

  const [formState, formAction, pending] = useActionState(
    async (prev, formData) => {
      const deptF = formData?.get?.('dept') || dept;
      const countF = Number(formData?.get?.('count') || count || 0);
      const datasetIdF = formData?.get?.('datasetId') || datasetId;
      const methodF = formData?.get?.('method') || method;
      const patientIdF = formData?.get?.('patientId') || patientId;
      try {
        const { items, warning } = await simulateTriage({ dept: deptF, n: countF, datasetId: datasetIdF, method: methodF, patientId: patientIdF });
        return { data: items, error: '', notice: warning || '' };
      } catch (e) {
        return { data: prev?.data || [], error: e.message || 'Failed to fetch', notice: e.warning || '' };
      }
    },
    { data: [], error: '', notice: '' }
  );

  // Initial load
  useEffect(() => {
    startTransition(() => {
      const fd = new FormData();
      fd.set('dept', dept);
      fd.set('count', String(count));
      fd.set('datasetId', datasetId);
      fd.set('method', method);
      if (patientId) fd.set('patientId', patientId);
      formAction(fd);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(
    () => [
      { key: 'method', label: 'Method' },
      { key: 'priorityScore', label: 'Priority' },
      { key: 'triageCategory', label: 'Triage' },
      { key: 'waitMins', label: 'Wait (min)' },
      { key: 'age', label: 'Age' },
      { key: 'arrivalTime', label: 'Arrived' },
    ],
    []
  );

  return {
    // state
    dept,
    setDept,
    count,
    setCount,
    datasetId,
    setDatasetId,
    method,
    setMethod,
    patientId,
    setPatientId,
    // action
    formState,
    formAction,
    pending,
    // view model
    columns,
  };
}
