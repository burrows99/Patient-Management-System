// Utilities to load Synthea-generated data into HAPI and verify state

import fs from 'fs/promises';
import path from 'path';
import { getHapiBase, getSyntheaOutputDir } from './environment.js';
import { hapiFetch, postResource, putResource, postTransactionBundle } from './hapiClient.js';

const HAPI_BASE_URL = getHapiBase();
const SYNTHEA_DIR = getSyntheaOutputDir();

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Normalize known STU3 fields/codes to R4-safe equivalents when possible.
// Minimal fix for HAPI error: Unknown Use code 'complete' (STU3 Claim.use)
function normalizeResource(resource) {
  if (!resource || typeof resource !== 'object') return resource;
  if (resource.resourceType === 'Claim' && typeof resource.use === 'string') {
    const map = {
      complete: 'claim',
      proposed: 'preauthorization',
      exploratory: 'predetermination',
    };
    const v = resource.use.toLowerCase();
    if (map[v]) resource.use = map[v];
  }
  return resource;
}

export async function pingHapi(maxWaitMs = 60000) {
  const start = Date.now();
  let lastStatus;
  let lastErr;
  while (Date.now() - start < maxWaitMs) {
    try {
      const r = await hapiFetch('/metadata', { method: 'GET' });
      lastStatus = r.status;
      if (r.status >= 200 && r.status < 500) return true;
    } catch (e) {
      lastErr = e;
    }
    await sleep(1500);
  }
  const errDetail = lastErr ? `, lastError=${lastErr.message}` : '';
  throw new Error(`HAPI server not reachable at ${HAPI_BASE_URL} (lastStatus=${lastStatus ?? 'none'}${errDetail})`);
}

export async function walkJsonFiles(dir) {
  const out = [];
  async function walk(d) {
    let entries;
    try { entries = await fs.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const ent of entries) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) await walk(full);
      else if (ent.isFile() && ent.name.toLowerCase().endsWith('.json')) out.push(full);
    }
  }
  await walk(dir);
  return out.sort();
}

export async function loadBundleResource(resource) {
  const rt = resource.resourceType;
  const id = resource.id;
  if (rt && id) return putResource(resource);
  return postResource(resource);
}

export async function loadFileIntoHapi(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  const json = JSON.parse(text);
  if (json.resourceType === 'Bundle' && Array.isArray(json.entry)) {
    if (json.type === 'transaction') {
      // Normalize entries in-place for R4 compatibility (e.g., Claim.use)
      for (const e of json.entry) if (e?.resource) normalizeResource(e.resource);
      const resp = await postTransactionBundle(json);
      if (!resp.ok) throw new Error(`POST transaction bundle -> ${resp.status} [file=${filePath}]`);
      return { loaded: 1, failed: 0 };
    }
    // Convert non-transaction bundle into a transaction while preserving fullUrl for urn:uuid resolution
    const tx = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [],
    };
    for (let idx = 0; idx < json.entry.length; idx++) {
      const e = json.entry[idx];
      if (!e || !e.resource) continue;
      const r = normalizeResource(e.resource);
      const rt = r.resourceType;
      if (!rt) continue;
      const hasId = !!r.id;
      const req = hasId
        ? { method: 'PUT', url: `${rt}/${r.id}` }
        : { method: 'POST', url: `${rt}` };
      const txEntry = { resource: r, request: req };
      if (e.fullUrl) txEntry.fullUrl = e.fullUrl; // preserve to resolve urn:uuid references
      tx.entry.push(txEntry);
    }
    const resp = await postTransactionBundle(tx);
    if (!resp.ok) throw new Error(`POST transaction bundle (converted) -> ${resp.status} [file=${filePath}]`);
    return { loaded: 1, failed: 0 };
  }
  try {
    await loadBundleResource(normalizeResource(json));
    return { loaded: 1, failed: 0 };
  } catch (err) {
    const rt = json?.resourceType || 'Unknown';
    const id = json?.id || 'new';
    throw new Error(`Failed to load standalone resource ${rt}/${id} from file=${filePath}: ${String(err)}`);
  }
}

export async function loadAllFromDir({ dir = SYNTHEA_DIR, limit = 0 } = {}) {
  const files = await walkJsonFiles(dir);
  const target = limit > 0 ? files.slice(0, limit) : files;
  let loaded = 0, failed = 0;
  for (const f of target) {
    try { const res = await loadFileIntoHapi(f); loaded += res.loaded; failed += res.failed; }
    catch (err) { failed++; /* Optional: console.error for visibility */ }
  }
  return { total: target.length, loaded, failed };
}

export async function verifyPatients(minCount = 1, maxWaitMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const r = await hapiFetch('/Patient?_summary=count', { method: 'GET' });
      const jr = await r.json().catch(() => ({}));
      const total = typeof jr.total === 'number' ? jr.total : 0;
      if (total >= minCount) return total;
    } catch {}
    await sleep(1500);
  }
  return 0;
}

export async function reloadHapiFromSynthea({ pattern, limit, minVerifyCount = 1, force = true } = {}) {
  await pingHapi();
  if (!force) {
    try {
      const r = await hapiFetch('/Patient?_summary=count', { method: 'GET' });
      const jr = await r.json();
      const total = jr?.total ?? 0;
      if (total > 0) return { message: 'HAPI already has patients', total };
    } catch {}
  }
  const stats = await loadAllFromDir({ limit: Number(limit) || 0 }); // pattern ignored in this minimal inliner
  const verified = await verifyPatients(Number(minVerifyCount) || 1);
  return { stats, verifiedPatients: verified, hapi: HAPI_BASE_URL, syntheaDir: SYNTHEA_DIR };
}
