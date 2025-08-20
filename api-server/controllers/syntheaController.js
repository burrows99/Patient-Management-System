import { getSyntheaBase } from '../utils/environment.js';
import { fetchPatientById, fetchRecentPatients, fetchEverythingForPatient } from '../services/patientService.js';
import { generatePatients } from '../services/patientGenerationService.js';
import { TRIAGE_DEFAULT_TYPES, TRIAGE_DEFAULT_TYPE_FILTER, TRIAGE_ELEMENT_PRESETS, TRIAGE_ELEMENTS_RICH } from '../constants/fhir.js';

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
  const MAX_P = 5; // Hard cap per environment policy
  const debug = String(req.query.debug || '').trim() === '1' || String(process.env.SYNTHEA_DEBUG || '').toLowerCase() === 'true';

  try {
    const result = await generatePatients({
      patientCount: Number(req.query.p),
      maxPatients: MAX_P,
      debug,
      skipReload: false
    });

    return res.json({
      message: 'Synthea R4 data generated and HAPI reload triggered',
      patientsGenerated: result.patientsGenerated,
      limit: result.maxPatients,
      limitMessage: `Generation per request is capped at ${result.maxPatients} patients in this environment`,
      env: result.env,
      mounts: result.mounts,
      scans: result.scans,
      hapiStatus: result.hapiStatus,
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
    const elementsPresetKey = (req.query.elementsPreset || 'rich').toString().toLowerCase();
    const presetElements = TRIAGE_ELEMENT_PRESETS[elementsPresetKey] || TRIAGE_ELEMENTS_RICH;
    const defaultElements = presetElements;

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
