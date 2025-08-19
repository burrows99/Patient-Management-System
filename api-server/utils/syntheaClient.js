// Lightweight Synthea HTTP client utilities
// Centralizes base URL resolution for Synthea service

import { getSyntheaBase } from './environment.js';

export const syntheaBase = () => getSyntheaBase();

function buildUrl(path = '') {
  const base = getSyntheaBase();
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function syntheaFetch(path = '', options = {}) {
  const url = buildUrl(path);
  const resp = await fetch(url, { method: 'GET', ...options });
  return resp;
}

export async function health() {
  const resp = await syntheaFetch('');
  return resp;
}

// Triggers generation via synthea's HTTP interface (R4-only)
// Params: { p: number }
export async function generate({ p, signal } = {}) {
  if (!p || p < 1) throw new Error('generate requires p >= 1');
  const url = buildUrl(`/?p=${encodeURIComponent(p)}&stu=4`);
  const resp = await fetch(url, { method: 'GET', signal });
  return resp;
}
