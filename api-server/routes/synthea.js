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
router.get('/generate', generate);

/**
 * @swagger
 * /synthea/patients:
 *   get:
 *     summary: List Patients from Synthea FHIR output
 *     description: |
 *       Reads FHIR Bundle JSON files produced by Synthea from the mounted output volume and
 *       returns an array of Patient resources. If `stu` is provided, restricts to that STU subfolder.
 *     tags: [Synthea]
 *     parameters:
 *       - in: query
 *         name: stu
 *         schema:
 *           type: string
 *           enum: ["2", "3", "4"]
 *         description: FHIR STU version (2 = DSTU2, 3 = STU3, 4 = R4)
 *       - in: query
 *         name: n
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Max number of patient bundles to read (default 50)
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
 *                 directories:
 *                   type: array
 *                   items:
 *                     type: string
 *                 patients:
 *                   type: array
 *                   items:
 *                     type: object
 *       202:
 *         description: No files yet
 *       500:
 *         description: Server error
 */
router.get('/patients', patients);

export default router;
