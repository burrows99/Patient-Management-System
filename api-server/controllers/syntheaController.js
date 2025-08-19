import { getSyntheaBase, getSyntheaOutputDir } from '../utils/environment.js';
import { reloadHapiFromSynthea } from '../utils/syntheaLoader.js';
import { listDirOnce, previewJsonFiles, readMounts } from '../utils/syntheaFs.js';
import { fetchPatientById, fetchRecentPatients, fetchEverythingForPatient } from '../services/patientService.js';
import { TRIAGE_DEFAULT_TYPES, TRIAGE_DEFAULT_TYPE_FILTER, TRIAGE_DEFAULT_ELEMENTS } from '../constants/fhir.js';

// Use loader utilities (moved out of controller for SRP)

// GET /synthea/health
export async function health(req, res) {
  const base = getSyntheaBase();
  const timeoutMs = Number(process.env.SYNTHEA_TIMEOUT_MS || 120000);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    console.log(`[Synthea][health] GET ${base} (timeout ${timeoutMs}ms)`);
    console.time('[Synthea][health] duration');
    const r = await fetch(base, { method: 'GET', signal: controller.signal });
    console.timeEnd('[Synthea][health] duration');
    clearTimeout(id);
    console.log('[Synthea][health] status=%s content-type=%s', r.status, r.headers.get('content-type'));
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status });
  } catch (e) {
    clearTimeout(id);
    console.error('[Synthea][health] error:', e);
    return res.status(502).json({ ok: false, error: String(e) });
  }
}

// GET /synthea/generate
export async function generate(req, res) {
  let p = Number(req.query.p);
  if (!p || p < 1) p = 10; // default when not provided or invalid
  // Hard cap per environment policy
  const MAX_P = 5;
  p = Math.max(1, Math.min(MAX_P, p)); // cap to [1..5]

  const base = getSyntheaBase();
  const url = `${base}/?p=${p}&stu=4`; // HAPI is R4-only; always generate R4

  try {
    // 1) Generate data via Synthea (avoid waiting on long-running stream)
    const timeoutMs = Number(process.env.SYNTHEA_GENERATE_TIMEOUT_MS || process.env.SYNTHEA_TIMEOUT_MS || 300000); // 5 minutes default
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    console.log(`[Synthea][generate] GET ${url} (timeout ${timeoutMs}ms)`);
    const r = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(id);
    if (!r.ok) throw new Error(`Synthea returned ${r.status}`);
    try {
      // Cancel the response stream to return immediately; Synthea continues processing server-side
      await r.body?.cancel?.();
    } catch {}

    // Generation is fixed to R4; proceed to reload HAPI.

    // 2) Reload HAPI data directly from API server (no external service)
    try {
      const force = true; // mimic previous behavior
      const minVerifyCount = 1;
      const loadStats = await reloadHapiFromSynthea({ force, minVerifyCount });
      console.log('[Synthea][generate] reload summary:', loadStats);
    } catch (e) {
      console.warn('[Synthea][generate] reload skipped/failed:', e.message);
    }

    // Optional diagnostics (can be slow). Enable with ?debug=1 or SYNTHEA_DEBUG=true
    const debug = String(req.query.debug || '').trim() === '1' || String(process.env.SYNTHEA_DEBUG || '').toLowerCase() === 'true';
    let scans = undefined;
    let mounts = undefined;
    if (debug) {
      const outDir = getSyntheaOutputDir();
      const roots = Array.from(new Set([
        outDir,
        '/data',
        '/synthea',
        '/app',
      ]));

      scans = [];
      for (const rPath of roots) {
        const listing = await listDirOnce(rPath);
        const preview = await previewJsonFiles(rPath, 3, Math.max(1, Math.min(3, p)));
        scans.push({ root: rPath, listing, preview });
      }

      mounts = await readMounts();
    }
    const env = {
      SYNTHEA_OUTPUT_DIR: process.env.SYNTHEA_OUTPUT_DIR || null,
      PWD: process.env.PWD || null,
      NODE_ENV: process.env.NODE_ENV || null,
      HAPI_BASE_URL: process.env.HAPI_BASE_URL || null,
      SYNTHEA_BASE: process.env.SYNTHEA_BASE || null,
    };

    return res.json({
      message: 'Synthea R4 data generated and HAPI reload triggered',
      patientsGenerated: p,
      limit: MAX_P,
      limitMessage: `Generation per request is capped at ${MAX_P} patients in this environment`,
      env,
      mounts,
      scans,
      hapiStatus: 'reload_triggered',
    });
  } catch (e) {
    res.status(502).json({ error: 'Synthea failed', detail: String(e) });
  }
}

// GET /synthea/patients
export async function patients(req, res) {
  const n = Math.max(1, Math.min(100, Number(req.query.n) || 20));
  const patientId = req.query.patientId ? String(req.query.patientId) : undefined;

  try {
    // 1) Resolve patient(s)
    let patientsList = [];
    if (patientId) {
      const p = await fetchPatientById(patientId);
      patientsList = [p];
    } else {
      const bundle = await fetchRecentPatients(n);
      patientsList = Array.isArray(bundle.entry) ? bundle.entry.map((e) => e.resource).filter(Boolean) : [];
    }

    if (patientsList.length === 0) {
      return res.status(202).json({
        message: 'No patients found in HAPI FHIR server',
        note: 'Ensure Synthea data has been loaded into HAPI server',
      });
    }

    // 2) For each patient, fetch triage-focused $everything resources via service
    // Defaults are chosen for a triage use-case but are overridable via query params
    const defaultTypes = TRIAGE_DEFAULT_TYPES;
    const defaultTypeFilter = TRIAGE_DEFAULT_TYPE_FILTER;
    const defaultElements = TRIAGE_DEFAULT_ELEMENTS;

    const parseCsv = (v) => (typeof v === 'string' && v.trim() ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined);

    const count = Math.max(1, Math.min(200, Number(req.query._count) || undefined));
    const types = parseCsv(req.query.types) || defaultTypes;
    const typeFilter = parseCsv(req.query.typeFilter) || defaultTypeFilter; // e.g. "Observation?category=vital-signs"
    const elements = parseCsv(req.query.elements) || defaultElements;
    const summary = req.query._summary ? String(req.query._summary) : undefined; // e.g. 'data' | 'true' | 'count'
    const start = req.query.start ? String(req.query.start) : undefined; // YYYY-MM-DD or instant
    const end = req.query.end ? String(req.query.end) : undefined;
    const since = req.query._since ? String(req.query._since) : undefined;

    const results = [];
    const skippedPatients = [];
    for (const p of patientsList) {
      try {
        const resources = await fetchEverythingForPatient(p.id, {
          count,
          types,
          typeFilter,
          elements,
          summary,
          start,
          end,
          since,
        });
        results.push({ patient: p, resources });
      } catch (e) {
        skippedPatients.push({ id: p.id, reason: e.message });
      }
    }

    return res.json({
      count: results.length,
      patientsFound: results.length,
      skippedPatients,
      patients: results,
      note: 'Patient and triage-focused $everything resources (filterable via query params)',
      triageDefaults: {
        types: defaultTypes,
        typeFilter: defaultTypeFilter,
        elements: defaultElements,
      },
    });
  } catch (err) {
    console.error('Patients endpoint error with HAPI:', err);
    return res.status(500).json({
      error: 'Failed to retrieve data from HAPI FHIR server',
      detail: err.message,
      note: 'Ensure HAPI server is running and contains patient data',
    });
  }
}
