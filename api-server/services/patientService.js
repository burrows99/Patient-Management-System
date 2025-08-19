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

function buildEverythingUrl(patientId, { count, types, typeFilter, elements, summary, start, end, since } = {}) {
  const params = new URLSearchParams();
  if (count) params.set('_count', String(count));
  if (types && types.length) params.set('_type', types.join(','));
  if (typeFilter && typeFilter.length) params.set('_typeFilter', typeFilter.join(','));
  if (elements && elements.length) params.set('_elements', elements.join(','));
  if (summary) params.set('_summary', String(summary));
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  if (since) params.set('_since', since);
  return `${HAPI_BASE_URL}/Patient/${encodeURIComponent(patientId)}/$everything?${params.toString()}`;
}

export async function fetchEverythingForPatient(patientId, opts = {}) {
  const {
    count = DEFAULT_EVERYTHING_COUNT,
    types,
    typeFilter,
    elements,
    summary,
    start,
    end,
    since,
  } = opts || {};

  const resources = [];
  let nextUrl = buildEverythingUrl(patientId, { count, types, typeFilter, elements, summary, start, end, since });
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
