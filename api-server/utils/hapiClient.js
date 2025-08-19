// Lightweight HAPI FHIR client utilities
// Centralizes base URL resolution and common headers

import { getHapiBase } from './environment.js';

export const hapiBase = () => getHapiBase();

function mergeHeaders(base = {}, extra = {}) {
  return { ...base, ...(extra || {}) };
}

export async function hapiFetch(path = '', options = {}) {
  const url = `${getHapiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = mergeHeaders({ Accept: 'application/fhir+json' }, options.headers);
  const resp = await fetch(url, { ...options, headers });
  return resp;
}

export async function hapiGetJson(path = '') {
  const resp = await hapiFetch(path, { method: 'GET' });
  if (!resp.ok) {
    let detail = '';
    try {
      const body = await resp.json();
      if (body?.resourceType === 'OperationOutcome') {
        const issues = (body.issue || []).map(i => `${i.severity}:${i.code}${i.diagnostics ? ` ${i.diagnostics}` : ''}`).join('; ');
        detail = issues ? ` (${issues})` : '';
      }
    } catch {}
    throw new Error(`GET ${path} -> ${resp.status}${detail}`);
  }
  return resp.json();
}

export async function putResource(resource) {
  const rt = resource?.resourceType;
  const id = resource?.id;
  if (!rt || !id) throw new Error('putResource requires resourceType and id');
  const resp = await hapiFetch(`/${rt}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/fhir+json' },
    body: JSON.stringify(resource),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const body = await resp.json();
      if (body?.resourceType === 'OperationOutcome') {
        const issues = (body.issue || []).map(i => `${i.severity}:${i.code}${i.diagnostics ? ` ${i.diagnostics}` : ''}`).join('; ');
        detail = issues ? ` (${issues})` : '';
      }
    } catch {}
    throw new Error(`PUT ${rt}/${id} -> ${resp.status}${detail}`);
  }
  return resp;
}

export async function postResource(resource) {
  const rt = resource?.resourceType;
  const resp = await hapiFetch('', {
    method: 'POST',
    headers: { 'Content-Type': 'application/fhir+json' },
    body: JSON.stringify(resource),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const body = await resp.json();
      if (body?.resourceType === 'OperationOutcome') {
        const issues = (body.issue || []).map(i => `${i.severity}:${i.code}${i.diagnostics ? ` ${i.diagnostics}` : ''}`).join('; ');
        detail = issues ? ` (${issues})` : '';
      }
    } catch {}
    throw new Error(`POST ${rt || 'Resource'} -> ${resp.status}${detail}`);
  }
  return resp;
}

export async function postTransactionBundle(bundle) {
  const resp = await hapiFetch('', {
    method: 'POST',
    headers: { 'Content-Type': 'application/fhir+json', 'Accept': 'application/fhir+json' },
    body: JSON.stringify(bundle),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const body = await resp.json();
      if (body?.resourceType === 'OperationOutcome') {
        const issues = (body.issue || []).map(i => `${i.severity}:${i.code}${i.diagnostics ? ` ${i.diagnostics}` : ''}`).join('; ');
        detail = issues ? ` (${issues})` : '';
      }
    } catch {}
    throw new Error(`POST transaction bundle -> ${resp.status}${detail}`);
  }
  return resp;
}
