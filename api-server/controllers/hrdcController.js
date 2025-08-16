// Environment is injected by container; no local dotenv here.
import { getNhsApiKey } from '../utils/environment.js';

export async function listDatasets(req, res) {
  const apiKey = getNhsApiKey();
  if (!apiKey) {
    res.setHeader('X-HRDC-Notice', 'NHS_API_KEY not set; returning empty dataset list');
    return res.status(200).json({ items: [] });
  }
  try {
    const url = 'https://sandbox.api.service.nhs.uk/health-research-data-catalogue/datasets';
    const r = await fetch(url, { headers: { apikey: apiKey } });
    const json = await r.json();
    return res.status(r.status).json(json);
  } catch (e) {
    return res.status(502).json({ error: `HRDC list fetch failed: ${e.message}` });
  }
}

export async function getDataset(req, res) {
  const apiKey = getNhsApiKey();
  if (!apiKey) return res.status(403).json({ error: 'NHS_API_KEY required to fetch dataset detail' });
  const { id } = req.params;
  try {
    const url = `https://sandbox.api.service.nhs.uk/health-research-data-catalogue/datasets/${encodeURIComponent(id)}`;
    const r = await fetch(url, { headers: { apikey: apiKey } });
    const json = await r.json();
    return res.status(r.status).json(json);
  } catch (e) {
    return res.status(502).json({ error: `HRDC detail fetch failed: ${e.message}` });
  }
}

// Fetch dataset detail using the provided HRDC self URL. We validate the base URL for safety.
export async function getDatasetBySelf(req, res) {
  const apiKey = getNhsApiKey();
  if (!apiKey) return res.status(403).json({ error: 'NHS_API_KEY required to fetch dataset detail' });
  const { self } = req.query;
  if (!self) return res.status(400).json({ error: 'Missing self parameter' });
  try {
    const allowedPrefix = 'https://sandbox.api.service.nhs.uk/health-research-data-catalogue/datasets/';
    if (!String(self).startsWith(allowedPrefix)) {
      return res.status(400).json({ error: 'Invalid self URL' });
    }
    const r = await fetch(self, { headers: { apikey: apiKey } });
    const json = await r.json();
    return res.status(r.status).json(json);
  } catch (e) {
    return res.status(502).json({ error: `HRDC self fetch failed: ${e.message}` });
  }
}
