import { useEffect, useMemo, useRef, useState, useActionState, startTransition } from 'react';
import { openTriageSse } from '../../../services/triageApi';

/**
 * useTriageSimulation
 * - Encapsulates triage simulation form state and submission
 * - Uses React 19 actions via useActionState
 */
export function useTriageSimulation(initial = {}) {
  const [dept, setDept] = useState(initial.dept || 'ED');
  const [count, setCount] = useState(Number(initial.count ?? 30));
  const [patientId, setPatientId] = useState(initial.patientId || '');
  const [sim, setSim] = useState(initial.sim || '1s=1d');
  // Paced mode: emit each event every N seconds (default 2s)
  const [paced, setPaced] = useState(
    initial.paced !== undefined ? Boolean(initial.paced) : true
  );
  const [paceSeconds, setPaceSeconds] = useState(
    Number(initial.paceSeconds ?? 2)
  );
  const [rows, setRows] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [metaInfo, setMetaInfo] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const [patientMode, setPatientMode] = useState(false);

  const esRef = useRef(null);

  const [formState, formAction, pending] = useActionState(
    async (prev, formData) => {
      // Close any existing stream
      try { esRef.current?.close?.(); } catch {}
      esRef.current = null;

      const deptF = formData?.get?.('dept') || dept;
      const countF = Number(formData?.get?.('count') || count || 0);
      const patientIdF = formData?.get?.('patientId') || patientId;
      const simF = formData?.get?.('sim') || sim;
      const pacedRaw = formData?.get?.('paced');
      const pacedF = pacedRaw != null ? (pacedRaw === 'on' || pacedRaw === 'true' || pacedRaw === true) : paced;
      const paceF = Number(formData?.get?.('pace') ?? paceSeconds ?? 2) || 2;

      return await new Promise((resolve) => {
        setRows([]);
        setEventCount(0);
        setStreaming(true);
        const es = openTriageSse({ dept: deptF, n: countF, patientId: patientIdF, sim: simF, pace: pacedF ? paceF : undefined });
        esRef.current = es;

        const finish = (next) => {
          try { es.close(); } catch {}
          esRef.current = null;
          resolve(next);
        };

        es.addEventListener('meta', (e) => {
          try {
            const meta = JSON.parse(e.data);
            // surface meta as notice
            setMetaInfo(meta);
            // detect mode and craft notice resiliently
            const count = meta.events ?? meta.count ?? 0;
            const range = meta.historicalRange;
            const rangeText = range ? `${range.start} → ${range.end}` : 'no range';
            if (meta.note && /patient/i.test(meta.note)) setPatientMode(true);
            resolve({ data: [], error: '', notice: `Streaming ${count} ${patientMode ? 'patients' : 'events'} @ ${meta.simScale}${range ? ` (${rangeText})` : ''}` });
          } catch {}
        }, { once: true });

        // Resolve immediately so UI isn't stuck in pending if meta is delayed
        resolve({ data: [], error: '', notice: 'Connecting to stream…' });

        es.addEventListener('arrival', (e) => {
          try {
            const payload = JSON.parse(e.data);
            const id = `${payload.patientId || ''}:${payload.encounterId || payload.arrivalTime}`;
            const row = {
              id,
              encounterType: payload.encounterType,
              priorityLevel: payload.priorityLevel,
              arrivalTime: payload.arrivalTime,
              bloodPressure: payload?.vitals?.bloodPressure,
              bmi: payload?.vitals?.bmi,
              weight: payload?.vitals?.weight,
              conditions: Array.isArray(payload?.conditions) ? payload.conditions.join(', ') : undefined,
            };
            setRows((prev) => [...prev, row]);
            setEventCount((c) => c + 1);
          } catch {}
        });

        // Patient streaming: push full nested payload so table can auto-infer columns
        es.addEventListener('patient', (e) => {
          try {
            const payload = JSON.parse(e.data);
            setPatientMode(true);
            // Keep raw nested structure (Patient resource or full entry) for dynamic rendering
            setRows((prev) => [...prev, payload]);
            setEventCount((c) => c + 1);
          } catch {}
        });

        es.addEventListener('warn', (e) => {
          try { const w = JSON.parse(e.data); resolve({ data: [], error: '', notice: w.message || 'Warning' }); } catch {}
        });
        es.addEventListener('info', (e) => {
          try { const i = JSON.parse(e.data); resolve({ data: [], error: '', notice: i.message || '' }); } catch {}
        });
        es.addEventListener('error', (e) => {
          setStreaming(false);
          finish({ data: [], error: 'Stream error', notice: '' });
        });
        es.addEventListener('done', () => {
          setStreaming(false);
          finish({ data: [], error: '', notice: 'Simulation complete' });
        });
      });
    },
    { data: [], error: '', notice: '' }
  );

  // Initial load
  useEffect(() => {
    startTransition(() => {
      const fd = new FormData();
      fd.set('dept', dept);
      fd.set('count', String(count));
      fd.set('sim', sim);
      if (patientId) fd.set('patientId', patientId);
      if (paced) fd.set('paced', 'on'); else fd.set('paced', '');
      fd.set('pace', String(paceSeconds));
      formAction(fd);
    });
    return () => {
      try { esRef.current?.close?.(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(() => {
    if (patientMode) return undefined; // let TriageTable auto-infer nested columns
    return [
      { key: 'encounterType', label: 'Encounter' },
      { key: 'priorityLevel', label: 'Priority' },
      { key: 'arrivalTime', label: 'Arrived' },
      { key: 'bloodPressure', label: 'BP' },
      { key: 'bmi', label: 'BMI' },
      { key: 'weight', label: 'Weight' },
      { key: 'conditions', label: 'Conditions' },
    ];
  }, [patientMode]);

  // Modern bindings to reduce prop noise in UI components
  const controls = useMemo(() => ({
    dept: {
      name: 'dept',
      value: dept,
      onChange: (e) => setDept(e.target.value),
    },
    count: {
      name: 'count',
      value: count,
      onChange: (e) => setCount(Number(e.target.value || 0)),
    },
    patientId: {
      name: 'patientId',
      value: patientId,
      onChange: (e) => setPatientId(e.target.value),
    },
    sim: {
      name: 'sim',
      value: sim,
      onChange: (e) => setSim(e.target.value),
    },
    paced: {
      name: 'paced',
      checked: !!paced,
      onChange: (e) => setPaced(e.target.checked),
    },
    pace: {
      name: 'pace',
      value: paceSeconds,
      onChange: (e) => setPaceSeconds(Number(e.target.value || 0)),
    },
  }), [dept, count, patientId, sim, paced, paceSeconds]);

  return {
    // state
    dept,
    setDept,
    count,
    setCount,
    patientId,
    setPatientId,
    sim,
    setSim,
    paced,
    setPaced,
    paceSeconds,
    setPaceSeconds,
    streaming,
    metaInfo,
    eventCount,
    // action
    formState,
    formAction,
    pending,
    // view model
    rows,
    columns,
    controls,
  };
}

