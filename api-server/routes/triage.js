import { Router } from 'express';
import { simulateTriage } from '../controllers/triageController.js';

const router = Router();

/**
 * @openapi
 * /triage/simulate:
 *   get:
 *     summary: Generate synthetic triage queue
 *     description: Returns a synthetic triage queue for demo purposes. Works without NHS_API_KEY; a warning header may be returned.
 *     tags: [Triage]
 *     parameters:
 *       - name: dept
 *         in: query
 *         description: Department name
 *         schema:
 *           type: string
 *           enum: [ED, Imaging, Outpatients]
 *           example: ED
 *       - name: n
 *         in: query
 *         description: Number of items to generate (max 200)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           example: 30
 *       - name: datasetId
 *         in: query
 *         description: HRDC dataset persistentId used for parameterisation (optional)
 *         schema:
 *           type: string
 *           example: dd5f0174-575f-4f4c-a4fc-b406aab953d9
 *     responses:
 *       200:
 *         description: OK
 *         headers:
 *           X-TriageSimulator-Warning:
 *             description: Present when simulator runs without NHS_API_KEY or HRDC fetch fails
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dept:
 *                   type: string
 *                   example: ED
 *                 count:
 *                   type: integer
 *                   example: 30
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     additionalProperties: true
 *       500:
 *         description: Server error
 */
router.get('/simulate', simulateTriage);

export default router;
