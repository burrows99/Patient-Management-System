import { getApiBase } from '../utils/environment';

// Simple HTTP helper mirroring existing style
async function request(path, opts = {}) {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(json?.error || `Request failed: ${res.status}`);
    err.detail = json;
    throw err;
  }
  return json;
}

export async function syntheaGenerate({ p = 5 } = {}) {
  // Triggers generation (R4-only) and returns diagnostics payload
  return request(`/synthea/generate?p=${encodeURIComponent(p)}`);
}

export async function syntheaGetPatients({ n = 50, elementsPreset } = {}) {
  const params = new URLSearchParams();
  if (n) params.set('n', String(n));
  if (elementsPreset) params.set('elementsPreset', String(elementsPreset));
  return request(`/synthea/patients?${params.toString()}`);
}
