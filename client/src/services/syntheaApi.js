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

export async function syntheaGenerate({ p = 5, stu = '4' } = {}) {
  // Triggers generation and returns diagnostics payload
  return request(`/synthea/generate?p=${encodeURIComponent(p)}&stu=${encodeURIComponent(stu)}`);
}

export async function syntheaGetPatients({ n = 50, stu } = {}) {
  const params = new URLSearchParams();
  if (n) params.set('n', String(n));
  if (stu) params.set('stu', String(stu));
  return request(`/synthea/patients?${params.toString()}`);
}
