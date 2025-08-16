import { Router } from 'express';
import { listDatasets, getDataset } from '../controllers/hrdcController.js';

const router = Router();

/**
 * @openapi
 * /api/hrdc/datasets:
 *   get:
 *     summary: List HRDC datasets (sandbox proxy)
 *     description: Returns dataset metadata from NHS HRDC Sandbox. If NHS_API_KEY is not set on the server, returns an empty list and an informational header. Reads NHS_API_KEY from the server environment only; it cannot be supplied via request headers.
 *     tags: [HRDC]
 *     responses:
 *       200:
 *         description: OK
 *         headers:
 *           X-HRDC-Notice:
 *             description: Present when NHS_API_KEY is not configured on the server
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     additionalProperties: true
 *             example:
 *               items: []
 *       502:
 *         description: Upstream fetch failed
 */
router.get('/', listDatasets);

/**
 * @openapi
 * /api/hrdc/datasets/{id}:
 *   get:
 *     summary: Get HRDC dataset detail (sandbox proxy)
 *     description: Requires NHS_API_KEY. Returns dataset JSON as provided by HRDC Sandbox. Reads NHS_API_KEY from the server environment only; it cannot be supplied via request headers.
 *     tags: [HRDC]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: HRDC dataset persistentId (UUID)
 *         schema:
 *           type: string
 *           example: dd5f0174-575f-4f4c-a4fc-b406aab953d9
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       403:
 *         description: NHS_API_KEY not configured
 *       404:
 *         description: Not found
 *       502:
 *         description: Upstream fetch failed
 */
router.get('/:id', getDataset);

export default router;
