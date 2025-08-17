import path from 'path';
import fs from 'fs/promises';
import fhirpath from 'fhirpath';
import { getSyntheaBase } from '../utils/environment.js';
import { listDirOnce, previewJsonFiles, readMounts } from '../utils/syntheaFs.js';

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
  const p = Number(req.query.p);
  if (!p || p < 1) return res.status(400).json({ error: 'Missing query param: p' });

  const base = getSyntheaBase();
  const stu = String(req.query.stu || 3);
  const url = `${base}/?p=${p}&stu=${stu}`;

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Synthea returned ${r.status}`);
    await r.text();

    const outDir = process.env.SYNTHEA_OUTPUT_DIR || '/data/synthea';
    const roots = Array.from(new Set([
      outDir,
      '/data',
      '/synthea',
      '/app',
      '/usr',
      '/',
    ]));

    const scans = [];
    for (const rPath of roots) {
      const listing = await listDirOnce(rPath);
      const preview = await previewJsonFiles(rPath, 3, Math.max(1, Math.min(3, p)));
      scans.push({ root: rPath, listing, preview });
    }

    const mounts = await readMounts();
    const env = {
      SYNTHEA_OUTPUT_DIR: process.env.SYNTHEA_OUTPUT_DIR || null,
      PWD: process.env.PWD || null,
      NODE_ENV: process.env.NODE_ENV || null,
    };

    return res.json({
      message: 'Diagnostics of filesystem and possible FHIR outputs',
      stu,
      env,
      mounts,
      scans,
    });
  } catch (e) {
    res.status(502).json({ error: 'Synthea failed', detail: String(e) });
  }
}

// GET /synthea/patients
export async function patients(req, res) {
  const outDir = process.env.SYNTHEA_OUTPUT_DIR || '/data/synthea';
  const stu = req.query.stu ? String(req.query.stu) : undefined;
  const n = Math.max(1, Math.min(1000, Number(req.query.n) || 50));

  const mapStu = (s) => {
    if (s === '2') return 'fhir_dstu2';
    if (s === '3') return 'fhir_stu3';
    return 'fhir';
  };

  const candidates = stu ? [mapStu(stu)] : ['fhir', 'fhir_stu3', 'fhir_dstu2'];

  try {
    const existing = [];
    for (const sub of candidates) {
      const dir = path.join(outDir, sub);
      try {
        const st = await fs.stat(dir);
        if (st.isDirectory()) existing.push(dir);
      } catch (err) {
        if (err.code !== 'ENOENT') console.error(`Error checking directory ${dir}:`, err);
      }
    }

    if (existing.length === 0) {
      return res.status(202).json({
        message: 'No Synthea FHIR directories found',
        outDir,
        tried: candidates.map((c) => path.join(outDir, c)),
        note: 'Synthea must be configured to generate the requested FHIR format in synthea.properties',
      });
    }

    const filesWithTime = [];
    for (const dir of existing) {
      const listing = await listDirOnce(dir);
      if (!listing.ok) continue;

      const jsons = listing.files
        .filter((f) => f.name.toLowerCase().endsWith('.json'))
        .map((f) => f.path);

      for (const f of jsons) {
        try {
          const st = await fs.stat(f);
          filesWithTime.push({ path: f, mtime: st.mtimeMs });
        } catch (err) {
          console.error(`Error accessing file ${f}:`, err);
        }
      }
    }

    if (filesWithTime.length === 0) {
      return res.status(202).json({
        message: 'No FHIR bundle files found',
        directories: existing,
        note: 'Synthea must be run to generate patient data first',
      });
    }

    filesWithTime.sort((a, b) => b.mtime - a.mtime);
    const selectedFiles = filesWithTime.slice(0, n);

    const patientsArr = [];
    const skippedFiles = [];

    for (const fileObj of selectedFiles) {
      try {
        const raw = await fs.readFile(fileObj.path, 'utf8');
        const bundle = JSON.parse(raw);

        const pats = fhirpath.evaluate(bundle, "Bundle.entry.resource.where(resourceType='Patient')");
        if (!pats || !Array.isArray(pats) || pats.length === 0) {
          skippedFiles.push({
            file: path.basename(fileObj.path),
            reason: 'No Patient resource found in bundle',
          });
          continue;
        }

        const patient = pats[0];
        const patientId = patient.id;
        const refPatient = `Patient/${patientId}`;
        const refUUID = `urn:uuid:${patientId}`;

        const safeEvaluate = (expr) => {
          try {
            return fhirpath.evaluate(bundle, expr) || [];
          } catch (e) {
            return [];
          }
        };

        const conditions = safeEvaluate(
          `Bundle.entry.resource.where(resourceType='Condition' and (subject.reference = '${refPatient}' or subject.reference = '${refUUID}'))`,
        );
        const observations = safeEvaluate(
          `Bundle.entry.resource.where(resourceType='Observation' and (subject.reference = '${refPatient}' or subject.reference = '${refUUID}'))`,
        );
        const medicationRequests = safeEvaluate(
          `Bundle.entry.resource.where(resourceType='MedicationRequest' and (subject.reference = '${refPatient}' or subject.reference = '${refUUID}'))`,
        );
        const medicationStatements = safeEvaluate(
          `Bundle.entry.resource.where(resourceType='MedicationStatement' and (subject.reference = '${refPatient}' or subject.reference = '${refUUID}'))`,
        );
        const procedures = safeEvaluate(
          `Bundle.entry.resource.where(resourceType='Procedure' and (subject.reference = '${refPatient}' or subject.reference = '${refUUID}' or patient.reference = '${refPatient}' or patient.reference = '${refUUID}'))`,
        );
        const encounters = safeEvaluate(
          `Bundle.entry.resource.where(resourceType='Encounter' and (subject.reference = '${refPatient}' or subject.reference = '${refUUID}'))`,
        );
        const allergies = safeEvaluate(
          `Bundle.entry.resource.where(resourceType='AllergyIntolerance' and (patient.reference = '${refPatient}' or patient.reference = '${refUUID}'))`,
        );
        const immunizations = safeEvaluate(
          `Bundle.entry.resource.where(resourceType='Immunization' and (patient.reference = '${refPatient}' or patient.reference = '${refUUID}'))`,
        );

        patientsArr.push({
          patient,
          bundleFile: path.basename(fileObj.path),
          sourceDirectory: path.basename(path.dirname(fileObj.path)),
          counts: {
            conditions: conditions.length,
            observations: observations.length,
            medicationRequests: medicationRequests.length,
            medicationStatements: medicationStatements.length,
            procedures: procedures.length,
            encounters: encounters.length,
            allergies: allergies.length,
            immunizations: immunizations.length,
          },
          conditions,
          observations,
          medicationRequests,
          medicationStatements,
          procedures,
          encounters,
          allergies,
          immunizations,
        });
      } catch (e) {
        skippedFiles.push({ file: path.basename(fileObj.path), reason: e.message || String(e) });
      }
    }

    return res.json({
      count: patientsArr.length,
      directoriesFound: existing.map((dir) => path.relative(outDir, dir)),
      stuMode: stu || 'auto (fhir > fhir_stu3 > fhir_dstu2)',
      totalFilesAvailable: filesWithTime.length,
      filesProcessed: selectedFiles.length,
      patientsFound: patientsArr.length,
      skippedFiles,
      patients: patientsArr,
      note:
        patientsArr.length === 0 && skippedFiles.length > 0
          ? 'All files were skipped - check skippedFiles for details'
          : undefined,
    });
  } catch (err) {
    console.error('Patients endpoint error:', err);
    return res.status(500).json({
      error: 'Failed to process Synthea FHIR data',
      detail: err.message,
      note: 'Ensure Synthea is properly configured to generate the requested FHIR format',
    });
  }
}
