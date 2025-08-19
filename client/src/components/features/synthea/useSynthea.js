import { useMemo, useState } from 'react';
import { syntheaGenerate, syntheaGetPatients } from '../../../services/syntheaApi';

// Hook: encapsulates state and side-effects for Synthea interactions
export default function useSynthea(initial = { p: 5, n: 25, elementsPreset: 'rich' }) {
  const [loading, setLoading] = useState(false);
  const [genInfo, setGenInfo] = useState(null);
  const [patientsResp, setPatientsResp] = useState(null);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initial);

  const patients = useMemo(() => patientsResp?.patients || [], [patientsResp]);

  const setParam = (key, value) => setParams((prev) => ({ ...prev, [key]: value }));

  const onGenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await syntheaGenerate({ p: params.p });
      setGenInfo(res);
    } catch (e) {
      setError(e?.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const onFetch = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await syntheaGetPatients({ n: params.n, elementsPreset: params.elementsPreset });
      setPatientsResp(res);
    } catch (e) {
      setError(e?.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  return {
    // state
    loading,
    genInfo,
    patientsResp,
    error,
    params,
    patients,

    // actions
    setParam,
    onGenerate,
    onFetch,
    setError,
  };
}
