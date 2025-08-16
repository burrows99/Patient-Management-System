import express from 'express';
import { bnfSearch, spendingByCcg } from '../controllers/openDataController.js';

const router = express.Router();

/**
 * @openapi
 * /api/open/bnf/search:
 *   get:
 *     summary: Search BNF codes via OpenPrescribing
 *     description: Proxies OpenPrescribing `bnf_code` search API. Returns raw JSON from upstream.
 *     tags: [Open Data]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           example: metformin
 *         description: Free-text search term (name or BNF code fragment)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *             example:
 *               - bnf_code: "0601022B0" 
 *                 name: "Metformin Hydrochloride 500mg tablets"
 *       400:
 *         description: Missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Missing required query param: q"
 *       502:
 *         description: Upstream fetch failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/bnf/search', bnfSearch);

/**
 * @openapi
 * /api/open/spending_by_ccg:
 *   get:
 *     summary: Spending by CCG for a BNF code
 *     description: Proxies OpenPrescribing `spending_by_ccg` API. Returns raw JSON from upstream.
 *     tags: [Open Data]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           example: 0601022B0
 *         description: BNF code (chapter/chemical/presentation)
 *       - in: query
 *         name: ccg
 *         required: false
 *         schema:
 *           type: string
 *           example: 10A
 *         description: Optional CCG code filter (e.g. 10A)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *             example:
 *               - date: "2024-06-01"
 *                 row_id: "10A"
 *                 items: 1234
 *                 quantity: 5678
 *                 actual_cost: 12345.67
 *       400:
 *         description: Missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Missing required query param: code (BNF code)"
 *       502:
 *         description: Upstream fetch failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/spending_by_ccg', spendingByCcg);

export default router;
