// Triage simulation API service
import { getApiBase } from '../utils/environment';

const API_BASE = getApiBase();

export async function simulateTriage({ dept, n, datasetId }) {
  const url = `${API_BASE}/triage/simulate?dept=${encodeURIComponent(dept)}&n=${encodeURIComponent(n)}&datasetId=${encodeURIComponent(datasetId)}`;
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
