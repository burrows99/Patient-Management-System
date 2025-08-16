import { Router } from 'express';
import { simulateTriage } from '../controllers/triageController.js';

const router = Router();

/**
 * @openapi
 * /triage/simulate:
 *   get:
 *     summary: Generate synthetic triage queue
 *     parameters:
 *       - name: dept
 *         in: query
 *         schema:
 *           type: string
 *           example: ED
 *       - name: n
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           example: 30
 *       - name: datasetId
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       500:
 *         description: Missing configuration
 */
router.get('/simulate', simulateTriage);

export default router;
