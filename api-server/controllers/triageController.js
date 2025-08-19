// Environment is injected by container; no local dotenv here.
import { fetchPatientById, fetchRecentPatients, fetchEverythingForPatient } from '../services/patientService.js';
import { TRIAGE_DEFAULT_TYPES, TRIAGE_DEFAULT_TYPE_FILTER, TRIAGE_ELEMENTS_RICH } from '../constants/fhir.js';

// --- Helpers ---
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const YEAR_MS = 365.25 * DAY_MS;

// Parse simple scale strings like "1s=1d", "100ms=1h", "1m=1y"
function parseSimScale(scaleStr) {
  const s = String(scaleStr || '1s=1d');
  // left: simulated time unit; right: real time unit
  const m = s.match(/^\s*(\d+(?:\.\d+)?)(ms|s|m)\s*=\s*(\d+(?:\.\d+)?)(ms|s|m|h|d|y)\s*$/i);
  if (!m) return { compression: DAY_MS / 1000, label: '1s=1d' }; // default: 1 sim sec = 1 real day
  const [ , lVal, lUnit, rVal, rUnit ] = m;
  const toMs = (val, unit) => {
    const v = Number(val);
    switch (unit.toLowerCase()) {
      case 'ms': return v;
      case 's': return v * 1000;
      case 'm': return v * 60 * 1000;
      case 'h': return v * HOUR_MS;
      case 'd': return v * DAY_MS;
      case 'y': return v * YEAR_MS;
      default: return v * 1000;
    }
  };
  const simMs = toMs(lVal, lUnit);
  const realMs = toMs(rVal, rUnit);
  // compression = real_ms per simulated_ms (delay for delta = deltaMs / compression)
  const compression = realMs / simMs;
  return { compression, label: s };
}

function mapPriority(encounter) {
  const code = encounter?.type?.[0]?.coding?.[0]?.code || '';
  const display = encounter?.type?.[0]?.coding?.[0]?.display || '';
  const txt = `${code}`.toLowerCase() + ' ' + `${display}`.toLowerCase();
  if (txt.includes('emergency')) return 'high';
  if (txt.includes('urgent')) return 'urgent';
  return 'routine';
}

function extractVitals(observations = [], encStartMs) {
  // Pick observations with effectiveDateTime closest to encounter start
  const withTime = observations
    .map((o) => ({ o, t: Number(new Date(o.effectiveDateTime).getTime()) }))
    .filter((x) => Number.isFinite(x.t));
  if (withTime.length === 0) return {};
  // nearest by absolute delta
  withTime.sort((a, b) => Math.abs(a.t - encStartMs) - Math.abs(b.t - encStartMs));
  const nearest = withTime.slice(0, 5).map((x) => x.o); // small window

  const vitals = {};
  for (const o of nearest) {
    const codeText = o?.code?.text || o?.code?.coding?.[0]?.display || '';
    const comp = o?.component || [];
    const valQty = (qr) => {
      if (!qr) return undefined;
      if (typeof qr?.valueQuantity?.value === 'number') return qr.valueQuantity.value;
      if (typeof qr?.valueQuantity?.value === 'string') return Number(qr.valueQuantity.value);
      return undefined;
    };
    // Blood Pressure (systolic/diastolic in components)
    if (/blood pressure/i.test(codeText)) {
      const sys = comp.find((c) => /systolic/i.test(c?.code?.coding?.[0]?.display || ''));
      const dia = comp.find((c) => /diastolic/i.test(c?.code?.coding?.[0]?.display || ''));
      const s = valQty(sys);
      const d = valQty(dia);
      if (s && d) vitals.bloodPressure = `${Math.round(s)}/${Math.round(d)}`;
    }
    // BMI
    if (/body mass index|bmi/i.test(codeText)) {
      const v = valQty(o);
      if (Number.isFinite(v)) vitals.bmi = Number(v);
    }
    // Weight
    if (/body weight|weight/i.test(codeText)) {
      const v = valQty(o);
      if (Number.isFinite(v)) vitals.weight = Number(v);
    }
  }
  return vitals;
}

export async function simulateTriage(req, res) {
  // Parameters
  const dept = (req.query.dept || 'ED').toString();
  const n = Math.min(parseInt((req.query.n || '30').toString(), 10) || 30, 200);
  const patientId = (req.query.patientId || '').toString();
  const sim = (req.query.sim || '1s=1d').toString();
  // Optional paced mode: emit each event every fixed interval
  const paceMs = (() => {
    if (req.query.paceMs != null) {
      const v = Number(req.query.paceMs);
      return Number.isFinite(v) && v > 0 ? Math.floor(v) : null;
    }
    if (req.query.pace != null) {
      const v = Number(req.query.pace);
      return Number.isFinite(v) && v > 0 ? Math.floor(v * 1000) : null;
    }
    return null;
  })();

  // Prepare SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // Disable proxy buffering (NGINX)
  res.setHeader('X-Accel-Buffering', 'no');
  // CORS for cross-origin EventSource
  try {
    const clientPort = process.env.CLIENT_PORT || process.env.REACT_APP_CLIENT_PORT || '3000';
    const clientBase = process.env.REACT_APP_CLIENT_BASE || `http://localhost:${clientPort}`;
    res.setHeader('Access-Control-Allow-Origin', clientBase);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } catch {}
  res.flushHeaders?.();

  const { compression, label } = parseSimScale(sim); // kept for meta label only
  const simStartTs = Date.now();

  // Utility to write SSE event
  const sendEvent = (event, dataObj) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(dataObj)}\n\n`);
  };

  // Heartbeat to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(': keep-alive\n\n'); } catch {}
  }, 15000);

  try {
    // 1) Resolve patients by calling our own API route /synthea/patients
    const url = new URL(`${req.protocol}://${req.get('host')}/synthea/patients`);
    if (patientId) url.searchParams.set('patientId', patientId);
    url.searchParams.set('n', String(n));
    const r = await fetch(url.toString(), { method: 'GET' });
    const body = await r.json().catch(() => ({}));
    const rawList = Array.isArray(body?.patients) ? body.patients : [];
    // Keep full entry (e.g., { patient, resources }) to allow rich UI rendering
    const patientsList = rawList.filter(Boolean);

    if (patientsList.length === 0) {
      sendEvent('info', { message: 'No patients found in HAPI FHIR server' });
      try { res.end(); } catch {}
      clearInterval(heartbeat);
      return;
    }

    // 2) Send a simple meta and then stream each patient
    sendEvent('meta', {
      dept,
      simScale: label,
      count: patientsList.length,
      scheduling: paceMs ? { mode: 'paced', paceMs } : { mode: 'immediate' },
      note: 'Streaming raw Patient resources only',
    });

    const timers = [];
    const onClose = () => {
      for (const t of timers) clearTimeout(t);
      clearInterval(heartbeat);
      try { res.end(); } catch {}
    };
    req.on('close', onClose);

    if (paceMs) {
      patientsList.forEach((p, idx) => {
        const delay = idx * paceMs;
        const timer = setTimeout(() => {
          sendEvent('patient', { ...p, simulationTimestamp: new Date().toISOString() });
        }, delay);
        timers.push(timer);
      });
      const endTimer = setTimeout(() => {
        sendEvent('done', { message: 'Patient streaming complete' });
        try { res.end(); } catch {}
        clearInterval(heartbeat);
      }, patientsList.length * paceMs + 100);
      timers.push(endTimer);
    } else {
      for (const p of patientsList) {
        sendEvent('patient', { ...p, simulationTimestamp: new Date().toISOString() });
      }
      sendEvent('done', { message: 'Patient streaming complete' });
      try { res.end(); } catch {}
      clearInterval(heartbeat);
    }
  } catch (err) {
    sendEvent('error', { error: 'Failed to stream patients', detail: err.message });
    try { res.end(); } catch {}
    clearInterval(heartbeat);
  }
}
