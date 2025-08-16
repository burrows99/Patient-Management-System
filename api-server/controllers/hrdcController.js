import 'dotenv/config';

export async function listDatasets(req, res) {
  const apiKey = process.env.NHS_API_KEY;
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
  const apiKey = process.env.NHS_API_KEY;
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
