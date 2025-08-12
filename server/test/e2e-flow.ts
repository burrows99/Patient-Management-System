/*
 End-to-end flow test against a running docker-compose stack.
 Requires:
 - Server: http://localhost:3001
 - Mailpit: http://localhost:8026
*/

type Json = Record<string, any>;

const SERVER = process.env.SERVER_URL || 'http://localhost:3001';
const MAILPIT = process.env.MAILPIT_URL || 'http://localhost:8026';

function randomEmail(prefix: string) {
  const n = Date.now() + Math.floor(Math.random() * 1e6);
  return `${prefix}${n}@example.com`;
}

async function http(method: string, url: string, body?: any, headers?: Record<string, string>) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    throw new Error(`${method} ${url} -> ${res.status} ${res.statusText}: ${text}`);
  }
  return data;
}

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function getLatestMessages(): Promise<Json[]> {
  const res = await fetch(`${MAILPIT}/api/v1/messages`);
  const json = (await res.json()) as Json;
  return (json.messages as Json[]) ?? [];
}

function extractTokenFromSnippet(snippet: string): string | null {
  const match = snippet.match(/token=([A-Za-z0-9]+)/);
  return match ? match[1] : null;
}

async function waitForTokenForEmail(email: string, timeoutMs = 30000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const list = await getLatestMessages();
    for (const m of list) {
      const toList: Json[] = (m.To as Json[]) ?? [];
      const toMatch = toList.some((t) => (t.Address as string)?.toLowerCase() === email.toLowerCase());
      if (!toMatch) continue;
      const snippet: string = (m.Snippet as string) ?? '';
      const token = extractTokenFromSnippet(snippet);
      if (token) return token;
    }
    await sleep(1000);
  }
  throw new Error(`Timeout waiting for token for ${email}`);
}

async function main() {
  const doctorEmail = randomEmail('doc');
  const doctorPass = 'Passw0rd!';
  const patientEmail = randomEmail('pat');

  console.log('Register doctor', doctorEmail);
  await http('POST', `${SERVER}/auth/register`, { email: doctorEmail, password: doctorPass });

  console.log('Waiting for doctor verification token...');
  const vtoken = await waitForTokenForEmail(doctorEmail);
  console.log('Doctor verification token:', vtoken);

  console.log('Verify doctor email');
  await http('GET', `${SERVER}/auth/verify-email?token=${encodeURIComponent(vtoken)}`);

  console.log('Doctor login');
  const login: any = await http('POST', `${SERVER}/auth/login`, { email: doctorEmail, password: doctorPass });
  const doctorToken = login.accessToken;
  if (!doctorToken) throw new Error('No accessToken in doctor login');
  console.log('Doctor JWT acquired');

  console.log('Invite patient', patientEmail);
  await http('POST', `${SERVER}/auth/invite`, { email: patientEmail }, { Authorization: `Bearer ${doctorToken}` });

  console.log('Waiting for patient login token...');
  const ptoken = await waitForTokenForEmail(patientEmail);
  console.log('Patient login token:', ptoken);

  console.log('Patient login with token');
  const plogin: any = await http('GET', `${SERVER}/auth/patient-login?token=${encodeURIComponent(ptoken)}`);
  const patientToken = plogin.accessToken;
  if (!patientToken) throw new Error('No accessToken in patient login');
  console.log('Patient JWT acquired');

  console.log('Patient fetch /patients/me');
  const me = await http('GET', `${SERVER}/patients/me`, undefined, { Authorization: `Bearer ${patientToken}` });
  console.log('Patient profile:', me);

  console.log('\nE2E flow SUCCESS');
}

main().catch((err) => {
  console.error('E2E flow FAILED:', err);
  process.exit(1);
});


