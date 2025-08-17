import express from 'express';
import path from 'path';
import { getSyntheaBase } from '../utils/environment.js';
import { readLatestFhirBundles } from '../utils/syntheaOutput.js';

const router = express.Router();

/**
 * @openapi
 * /synthea/health:
 *   get:
 *     summary: Health check for the Synthea service
 *     tags: [Synthea]
 *     description: Performs a simple GET to the configured Synthea base URL to verify reachability.
 *     responses:
 *       200:
 *         description: Synthea service reachable
 *       502:
 *         description: Upstream error or Synthea not reachable
 */
router.get('/health', async (req, res) => {
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
});

/**
 * @openapi
 * /synthea/generate:
 *   get:
 *     summary: Generate synthetic patients via Synthea
 *     description: |
 *       Triggers smartonfhir/synthea to generate patients, then reads the latest output directory
 *       and returns a combined JSON of all generated patient bundles in a single object keyed by patient id.
 *       Example: `GET /synthea/generate?stu=3&p=100`.
 *     tags: [Synthea]
 *     parameters:
 *       - in: query
 *         name: stu
 *         schema: { type: string, enum: ["2","3","4"] }
 *         description: FHIR STU version
 *       - in: query
 *         name: p
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of patients to generate.
 *     responses:
 *       200:
 *         description: Generation completed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 directory:
 *                   type: string
 *                   description: Filesystem directory from which FHIR files were read.
 *                 patients:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                   description: Object keyed by patient id with full FHIR Bundle JSON for each patient.
 *       400:
 *         description: Missing required `p` query parameter.
 *       502:
 *         description: Failed to contact Synthea or upstream error.
 *       504:
 *         description: Request to Synthea timed out.
 */
router.get('/generate', async (req, res) => {
  const base = getSyntheaBase();
  const timeoutMs = Number(process.env.SYNTHEA_TIMEOUT_MS || 300000); // generation can take time
  const params = new URLSearchParams();
  const p = Number(req.query.p);
  const stu = (req.query.stu || '3').toString();
  if (!p || p < 1) {
    return res.status(400).json({ error: 'Missing required query param: p (patient count)' });
  }
  params.set('p', String(p));
  params.set('stu', stu);
  const url = `${base}/?${params.toString()}`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    console.log('[Synthea][generate] base=%s url=%s params=%o timeoutMs=%d', base, url, Object.fromEntries(params.entries()), timeoutMs);
    console.time('[Synthea][generate] synthea');
    const r = await fetch(url, { method: 'GET', signal: controller.signal });
    // Drain body to allow upstream to complete, but we don't forward it
    await r.text();
    console.timeEnd('[Synthea][generate] synthea');
    clearTimeout(id);

    const outDir = process.env.SYNTHEA_OUTPUT_DIR || '/data/synthea';
    // Read latest bundles and combine into a single object keyed by patient id
    const result = await readLatestFhirBundles(outDir, p, { summary: false, requirePatient: true });

    const patientsObj = {};
    const srcPatients = Array.isArray(result?.patients) ? result.patients : [];
    for (const item of srcPatients) {
      const bundle = item?.bundle;
      if (!bundle) continue;
      let patientId = undefined;
      try {
        const entries = Array.isArray(bundle?.entry) ? bundle.entry : [];
        const pat = entries.find(e => e?.resource?.resourceType === 'Patient');
        patientId = pat?.resource?.id;
      } catch (_) {
        // ignore
      }
      if (!patientId) {
        // fallback: derive from filename or generate index-based id
        const baseName = (item?.file || '').split('/').pop() || '';
        patientId = baseName.replace(/\.[^.]+$/, '') || `patient_${Object.keys(patientsObj).length + 1}`;
      }
      patientsObj[patientId] = bundle;
    }

    return res.status(200).json({
      count: Object.keys(patientsObj).length,
      directory: result?.directory || path.join(outDir, 'fhir'),
      patients: patientsObj,
    });
  } catch (e) {
    clearTimeout(id);
    console.error('[Synthea][generate] error for url=%s -> %s', url, String(e));
    const status = /AbortError/i.test(String(e)) ? 504 : 502;
    return res.status(status).json({ error: 'Failed to contact Synthea', detail: String(e), url, timeoutMs });
  }
});

export default router;
