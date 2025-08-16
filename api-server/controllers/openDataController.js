import 'dotenv/config';

// Simple fetch wrapper with timeout
async function getJson(url) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json, */*;q=0.8',
        'User-Agent': 'NHS-MOA-Triage/1.0 (+https://github.com/burrows99/Patient-Management-System)',
        'Referer': 'https://openprescribing.net/'
      }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upstream ${res.status}: ${text}`);
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return await res.json();
    }
    // Fallback: try parse JSON, else error with snippet
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Unexpected content-type '${ct}': ${text.slice(0, 200)}`);
    }
  } finally {
    clearTimeout(id);
  }
}

export async function bnfSearch(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing required query param: q' });
  try {
    const url = `https://openprescribing.net/api/1.0/bnf_code/?format=json&q=${encodeURIComponent(q)}`;
    const json = await getJson(url);
    res.json(json);
  } catch (e) {
    res.status(502).json({ error: `OpenPrescribing bnf_code search failed: ${e.message}` });
  }
}

export async function spendingByCcg(req, res) {
  const { code, ccg } = req.query; // code = BNF code (chapter/chemical/presentation)
  if (!code) return res.status(400).json({ error: 'Missing required query param: code (BNF code)' });
  try {
    const base = `https://openprescribing.net/api/1.0/spending_by_ccg/?format=json&code=${encodeURIComponent(code)}`;
    const url = ccg ? `${base}&ccg=${encodeURIComponent(ccg)}` : base;
    const json = await getJson(url);
    res.json(json);
  } catch (e) {
    res.status(502).json({ error: `OpenPrescribing spending_by_ccg failed: ${e.message}` });
  }
}
