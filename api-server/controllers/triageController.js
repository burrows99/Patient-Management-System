// Environment is injected by container; no local dotenv here.
import { getNhsApiKey } from '../utils/environment.js';

export async function simulateTriage(req, res) {
  const dept = (req.query.dept || 'ED').toString();
  const n = Math.min(parseInt((req.query.n || '30').toString(), 10) || 30, 200);
  const datasetId = (req.query.datasetId || 'dd5f0174-575f-4f4c-a4fc-b406aab953d9').toString();
  const apiKey = getNhsApiKey();

  let meta = {};
  if (apiKey) {
    try {
      const url = `https://sandbox.api.service.nhs.uk/health-research-data-catalogue/datasets/${encodeURIComponent(datasetId)}`;
      const r = await fetch(url, { headers: { apikey: apiKey } });
      if (!r.ok) throw new Error(`HRDC fetch failed: ${r.status}`);
      meta = await r.json();
    } catch (e) {
      res.setHeader('X-TriageSimulator-Warning', `HRDC fetch failed: ${e.message}`);
      meta = {};
    }
  } else {
    res.setHeader('X-TriageSimulator-Warning', 'NHS_API_KEY not set; using default parameters');
  }

  const typicalRange = meta?.coverage?.typicalAgeRange || '0-100';
  const [minAgeStr, maxAgeStr] = typicalRange.split('-');
  const minAge = Number(minAgeStr) || 0;
  const maxAge = Number(maxAgeStr) || 100;

  const rand = (min, max) => Math.random() * (max - min) + min;
  const sampleInt = (min, max) => Math.floor(rand(min, max + 1));
  const sampleTriage = () => {
    const r = Math.random();
    if (r < 0.05) return 1;
    if (r < 0.20) return 2;
    if (r < 0.65) return 3;
    if (r < 0.95) return 4;
    return 5;
  };
  const now = Date.now();
  const capacityFactor = (deptName) => {
    if (/ED/i.test(deptName)) return 0.6;
    if (/Imaging|Radiology/i.test(deptName)) return 0.8;
    if (/Out/i.test(deptName)) return 0.9;
    return 0.75;
  };

  const items = Array.from({ length: n }).map((_, i) => {
    const triage = sampleTriage();
    const age = sampleInt(minAge, maxAge);
    const waitMins = sampleInt(0, 240);
    const arrivalTime = new Date(now - waitMins * 60 * 1000).toISOString();
    const cap = capacityFactor(dept);
    const riskScore = (age >= 75 ? 1 : 0) * 2 + (triage === 1 ? 4 : triage === 2 ? 2 : 0);
    const timeScore = Math.min(waitMins / 60, 4);
    const ruleScore = triage === 1 ? 10 : triage === 2 ? 6 : 0;
    const capScore = (1 - cap) * 2;
    const priorityScore = Number((ruleScore + timeScore + riskScore + capScore).toFixed(2));

    return {
      id: `${dept}-${Date.now()}-${i}`,
      dept,
      triageCategory: triage,
      arrivalTime,
      waitMins,
      age,
      riskScore,
      capacityFactor: cap,
      priorityScore,
    };
  });

  items.sort((a, b) => b.priorityScore - a.priorityScore);
  return res.json({ dept, count: items.length, items });
}
