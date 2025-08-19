import express from 'express';
import { health, generate, patients } from '../controllers/syntheaController.js';

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
router.get('/health', health);

/**
 * @openapi
 * /synthea/generate:
 *   get:
 *     summary: Generate synthetic patients via Synthea
 *     description: |
 *       Triggers Synthea to generate patients in FHIR R4 and reloads the HAPI FHIR server (which is R4-only).
 *       There is no `stu` parameter; generation and reload are fixed to R4.
 *
 *       Version compatibility:
 *       - The deployed HAPI server is R4-only.
 *       - Synthea generation is fixed to R4 in this environment; other versions are omitted by design.
 *     tags: [Synthea]
 *     parameters:
 *       # No STU selection parameter; generation is R4-only.
 *       - in: query
 *         name: p
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           default: 10
 *         description: Number of patients to generate. The environment caps this to 5 per request; values above 5 are reduced to 5.
 *       - in: query
 *         name: debug
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["0", "1"]
 *         description: When '1', returns directory scans and mount diagnostics in the response for troubleshooting.
 *     responses:
 *       200:
 *         description: Generation completed (HAPI reload triggered).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 patientsGenerated:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                   description: The enforced per-request cap on generated patients
 *                   example: 5
 *                 limitMessage:
 *                   type: string
 *                   description: Human-readable explanation of the cap
 *                 env:
 *                   type: object
 *                   additionalProperties: true
 *                 mounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     additionalProperties: true
 *                 scans:
 *                   type: array
 *                   items:
 *                     type: object
 *                     additionalProperties: true
 *                 hapiStatus:
 *                   type: string
 *                   description: reload_triggered
 *       400:
 *         description: Missing or invalid parameters.
 *       502:
 *         description: Failed to contact Synthea or upstream error.
 */
router.get('/generate', generate);

/**
 * @openapi
 * /synthea/patients:
 *   get:
 *     summary: Retrieve Patients and their $everything resources from HAPI
 *     description: |
 *       Returns raw Patient resources and, for each, all related resources via the FHIR `$everything` operation.
 *       This endpoint does not perform any triage logic or transformations.
 *
 *       Instructions:
 *       - `patientId` is OPTIONAL. Provide it to fetch a single patient and all related resources.
 *       - When `patientId` is omitted, the endpoint fetches recent patients; you may set `n` (1..100). If `n` is omitted, it defaults to 20.
 *       - Responses can be large; consider using `patientId` to limit payload size.
 *
 *       Version compatibility:
 *       - This endpoint queries the deployed HAPI FHIR server, which is R4-only in this environment.
 *       - There is no `stu` parameter here by design.
 *     tags: [Synthea]
 *     parameters:
 *       - in: query
 *         name: patientId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional. Fetch a single patient by id. When omitted, recent patients are returned.
 *       - in: query
 *         name: n
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of most recent patients to include when `patientId` is not provided.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Number of patient entries returned in this response
 *                 patientsFound:
 *                   type: integer
 *                   description: Alias of count for convenience
 *                 skippedPatients:
 *                   type: array
 *                   description: Patients that could not be expanded via $everything
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       reason:
 *                         type: string
 *                 patients:
 *                   type: array
 *                   description: Array of patient entries with raw Patient and related resources
 *                   items:
 *                     type: object
 *                     properties:
 *                       patient:
 *                         type: object
 *                         description: Raw FHIR R4 Patient resource as returned by HAPI
 *                         additionalProperties: true
 *                       resources:
 *                         type: array
 *                         description: Raw FHIR resources from $everything for the patient
 *                         items:
 *                           type: object
 *                           additionalProperties: true
 *                 note:
 *                   type: string
 *                   description: Informational note about response contents
 *       202:
 *         description: No patients found in HAPI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 0
 *                 patientsFound:
 *                   type: integer
 *                   example: 0
 *                 skippedPatients:
 *                   type: array
 *                   items:
 *                     type: object
 *                 patients:
 *                   type: array
 *                   items:
 *                     type: object
 *                 note:
 *                   type: string
 *                   example: "Raw Patient and $everything resources (no triage logic)"
 *       500:
 *         description: Server error
 */
router.get('/patients', patients);

export default router;
