import { test, expect } from '@playwright/test';

const SERVER = process.env.SERVER_URL || 'http://127.0.0.1:3001';
const MAILPIT = process.env.MAILPIT_URL || 'http://127.0.0.1:8026';

function randomEmail(prefix: string) {
  const n = Date.now() + Math.floor(Math.random() * 1e6);
  return `${prefix}${n}@example.com`;
}

async function getTokensForEmail(email: string) {
  const res = await fetch(`${MAILPIT}/api/v1/messages`);
  const json = (await res.json()) as any;
  const matches = (json.messages as any[]).filter((m) =>
    (m.To as any[]).some((t) => (t.Address as string)?.toLowerCase() === email.toLowerCase()),
  );
  const tokens = matches
    .map((m) => (m.Snippet as string) || '')
    .map((s) => s.match(/token=([A-Za-z0-9]+)/)?.[1])
    .filter(Boolean) as string[];
  return tokens;
}

test.describe('Patient Management E2E', () => {
  test('doctor register -> verify -> login -> invite patient -> patient login', async ({ page, request }) => {
    const doctor = { email: randomEmail('doc'), password: 'Passw0rd!' };
    const patientEmail = randomEmail('pat');

    // Doctor registers via API to minimize UI work
    const reg = await request.post(`${SERVER}/auth/register`, { data: doctor });
    expect(reg.ok()).toBeTruthy();

    // Get verification token
    let vtoken: string | undefined;
    for (let i = 0; i < 30; i++) {
      const tokens = await getTokensForEmail(doctor.email);
      if (tokens.length) { vtoken = tokens[0]; break; }
      await page.waitForTimeout(1000);
    }
    expect(vtoken, 'verification token').toBeDefined();

    // Verify via server
    const verify = await request.get(`${SERVER}/auth/verify-email?token=${vtoken}`);
    expect(verify.ok()).toBeTruthy();

    // Login via API, set token in browser storage, then open doctor dashboard
    const loginRes = await request.post(`${SERVER}/auth/login`, { data: doctor });
    expect(loginRes.ok()).toBeTruthy();
    const loginJson: any = await loginRes.json();
    const doctorToken = loginJson.accessToken as string;
    expect(doctorToken).toBeTruthy();

    await page.addInitScript((token) => {
      window.localStorage.setItem('accessToken', token as string);
    }, doctorToken);
    await page.goto('/doctor');
    // Fallback to UI login if redirect happened
    if (page.url().includes('/login')) {
      await page.getByRole('textbox', { name: 'Email' }).fill(doctor.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(doctor.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('**/doctor', { timeout: 10000 });
    }
    // At this point, we should be on doctor dashboard
    await page.waitForURL('**/doctor', { timeout: 10000 });

    // Invite patient via UI
    await page.getByRole('textbox', { name: 'Patient Email' }).fill(patientEmail);
    await page.getByRole('button', { name: 'Send Invite' }).click();
    await expect(page.getByText('Invite sent')).toBeVisible();

    // Fetch patient login token
    let ptoken: string | undefined;
    for (let i = 0; i < 30; i++) {
      const tokens = await getTokensForEmail(patientEmail);
      if (tokens.length) { ptoken = tokens[0]; break; }
      await page.waitForTimeout(1000);
    }
    expect(ptoken, 'patient token').toBeDefined();

    // Open patient login link
    await page.goto(`/patient-login?token=${ptoken}`);
    await page.waitForURL('**/patient', { timeout: 10_000 });
    await expect(page.getByText('Patient Dashboard')).toBeVisible();

    // Validate /patients/me via API using token from localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).toBeTruthy();
    const me = await request.get(`${SERVER}/patients/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(me.ok()).toBeTruthy();
    const body = await me.json();
    expect(body.email.toLowerCase()).toBe(patientEmail.toLowerCase());
  });
});


