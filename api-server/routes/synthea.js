import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const SYNTHEA_DIR = process.env.SYNTHEA_DATA_DIR || path.join(process.cwd(), 'data', 'synthea');

function isSubPath(parent, child) {
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function walkJsonFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && e.name.toLowerCase().endsWith('.json')) results.push(full);
    }
  }
  return results;
}

/**
 * @openapi
 * /synthea/bundles:
 *   get:
 *     summary: List Synthea JSON bundles available on the server
 *     responses:
 *       200:
 *         description: Array of bundle metadata
 */
router.get('/bundles', (req, res) => {
  try {
    if (!fs.existsSync(SYNTHEA_DIR)) {
      return res.status(200).json({ dir: SYNTHEA_DIR, count: 0, items: [] });
    }
    const files = walkJsonFiles(SYNTHEA_DIR);
    const items = files.map((abs) => ({
      name: path.relative(SYNTHEA_DIR, abs),
      size: fs.statSync(abs).size,
    }));
    res.json({ dir: SYNTHEA_DIR, count: items.length, items });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[synthea] list error:', err);
    res.status(500).json({ error: 'Failed to list Synthea output' });
  }
});

/**
 * @openapi
 * /synthea/bundles/{name}:
 *   get:
 *     summary: Fetch a specific Synthea JSON bundle by relative path
 *     parameters:
 *       - name: name
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Relative file path under SYNTHEA_DATA_DIR
 *     responses:
 *       200:
 *         description: JSON bundle
 */
router.get('/bundles/:name', (req, res) => {
  try {
    const rel = req.params.name;
    const target = path.join(SYNTHEA_DIR, rel);
    const resolvedDir = path.resolve(SYNTHEA_DIR);
    const resolvedTarget = path.resolve(target);
    if (!resolvedTarget.startsWith(resolvedDir) || !fs.existsSync(resolvedTarget) || !fs.statSync(resolvedTarget).isFile()) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.setHeader('Content-Type', 'application/json');
    fs.createReadStream(resolvedTarget).pipe(res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[synthea] read error:', err);
    res.status(500).json({ error: 'Failed to read Synthea file' });
  }
});

export default router;
