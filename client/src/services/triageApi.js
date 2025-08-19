// Triage simulation API service
import { getApiBase } from '../utils/environment';

const API_BASE = getApiBase();

export async function simulateTriage({ dept, n, datasetId, method, patientId }) {
  const params = new URLSearchParams({
    dept: String(dept),
    n: String(n),
    datasetId: String(datasetId),
  });
  if (method) params.set('method', String(method));
  if (patientId) params.set('patientId', String(patientId));
  const url = `${API_BASE}/triage/simulate?${params.toString()}`;
  const res = await fetch(url, { credentials: 'include' });
  const warning = res.headers.get('X-TriageSimulator-Warning') || '';
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const txt = await res.text();
      try {
        const json = JSON.parse(txt);
        message = json.error || message;
      } catch {
        message = txt || message;
      }
    } catch {}
    const err = new Error(message);
    err.warning = warning;
    throw err;
  }
  const json = await res.json();
  return { items: json.items || [], warning };
}

// Open SSE stream for triage simulation
export function openTriageSse({ dept, n, patientId, sim, pace }) {
  const params = new URLSearchParams();
  if (dept) params.set('dept', String(dept));
  if (n != null) params.set('n', String(n));
  if (patientId) params.set('patientId', String(patientId));
  if (sim) params.set('sim', String(sim));
  if (pace != null && Number(pace) > 0) params.set('pace', String(pace));
  const url = `${API_BASE}/triage/simulate?${params.toString()}`;
  const es = new EventSource(url, { withCredentials: true });
  return es;
}
