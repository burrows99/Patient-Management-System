import { Router } from 'express';
import { listDatasets, getDataset } from '../controllers/hrdcController.js';

const router = Router();

/**
 * @openapi
 * /api/hrdc/datasets:
 *   get:
 *     summary: List HRDC datasets (sandbox proxy)
 *     responses:
 *       200:
 *         description: OK
 *       502:
 *         description: Upstream fetch failed
 */
router.get('/', listDatasets);

/**
 * @openapi
 * /api/hrdc/datasets/{id}:
 *   get:
 *     summary: Get HRDC dataset detail (sandbox proxy)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       502:
 *         description: Upstream fetch failed
 */
router.get('/:id', getDataset);

export default router;
