import { DEFAULT_EVERYTHING_COUNT } from '../constants/fhir.js';
import { getHapiBase } from '../utils/environment.js';

const HAPI_BASE_URL = getHapiBase();

async function fetchJson(url, opts = {}) {
  const resp = await fetch(url, { headers: { Accept: 'application/fhir+json' }, ...opts });
  if (!resp.ok) throw new Error(`HAPI request failed ${resp.status} for ${url}`);
  return resp.json();
}

export async function fetchPatientById(patientId) {
  const url = `${HAPI_BASE_URL}/Patient/${encodeURIComponent(patientId)}`;
  return fetchJson(url);
}

export async function fetchRecentPatients(n = 20) {
  const url = `${HAPI_BASE_URL}/Patient?_count=${Math.max(1, Math.min(100, n))}&_sort=-_lastUpdated`;
  return fetchJson(url);
}

export async function fetchEverythingForPatient(patientId, count = DEFAULT_EVERYTHING_COUNT) {
  const resources = [];
  let nextUrl = `${HAPI_BASE_URL}/Patient/${encodeURIComponent(patientId)}/$everything?_count=${count}`;
  while (nextUrl) {
    const bundle = await fetchJson(nextUrl);
    if (Array.isArray(bundle.entry)) {
      for (const e of bundle.entry) if (e?.resource) resources.push(e.resource);
    }
    const nextLink = Array.isArray(bundle.link) ? bundle.link.find((l) => l.relation === 'next') : undefined;
    nextUrl = nextLink?.url || null;
  }
  return resources;
}
