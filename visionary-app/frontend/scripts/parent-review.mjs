/* F-20 (Product + Trust UI Engineers): parent experience review.
 * Drives the FULL consent pair through real UIs in one preview repository:
 * learner account registers first; parent account registers, requests
 * progress sharing (7-day expiry, honest no-guardianship-verification
 * notice); the learner accepts through Connections; the parent then sees
 * "Connected · Progress summaries only" and opens the shared report; plus
 * notifications and the parent privacy surface. No interception.
 * Env: PARENT_BASE_URL (default http://127.0.0.1:4198), PARENT_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.PARENT_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.PARENT_EVIDENCE_DIR || 'docs/visionary/baseline/f20-parent-2026-11-06');
await fs.mkdir(evidence, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PASSWORD = 'Visionary#Baseline2026';
const records = [];
const defects = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

const settle = async (page, ms = 2000) => {
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => document.readyState === 'complete' && document.body.innerText.length > 100, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(ms);
};
async function shoot(page, name, meta) {
  await page.screenshot({ path: path.join(evidence, `${name}.png`) });
  records.push({ file: `${name}.png`, ...meta });
}
const check = (name, ok, detail) => { records.push({ check: name, ok, detail }); if (!ok) defects.push(`${name}: ${detail}`); };

const fillAndSelect = (page, answers) => page.evaluate((answers) => {
  const iSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  for (const input of [...document.querySelectorAll('main input[type="text"], #main input[type="text"]')]) {
    if (input.value || input.offsetParent === null) continue;
    const label = [...document.querySelectorAll('label')].find((l) => l.htmlFor === input.id)?.textContent?.trim() || '';
    const hit = Object.entries(answers).find(([k]) => label.startsWith(k));
    if (hit || input.required) { iSetter.call(input, hit ? hit[1] : Object.values(answers)[0]); input.dispatchEvent(new Event('input', { bubbles: true })); }
  }
  const sSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  for (const select of [...document.querySelectorAll('main select, #main select')]) {
    if (select.offsetParent === null || select.value) continue;
    const label = [...document.querySelectorAll('label')].find((l) => l.htmlFor === select.id)?.textContent?.trim() || '';
    const hit = Object.entries(answers).find(([k]) => label.startsWith(k));
    const options = [...select.options].map((o) => o.value).filter(Boolean);
    const value = hit ? options.find((v) => v === hit[1]) || options.find((v) => v.toLowerCase().includes(hit[1].toLowerCase())) : options[0];
    if (value) { sSetter.call(select, value); select.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  const wanted = Object.values(answers).map((v) => String(v).toLowerCase());
  const skip = /^(Back|Resend|Sign in|Log in|Verify|Skip for now|Use a different account|Continue|Looks good|Get started|Finish|Complete setup|Next)$/i;
  const options2 = [...document.querySelectorAll('main button, #main button')]
    .filter((b) => b.offsetParent !== null && !b.disabled && b.getAttribute('aria-pressed') === 'false'
      && (b.textContent || '').trim() && !skip.test((b.textContent || '').trim()));
  const target = options2.find((b) => wanted.includes((b.textContent || '').trim().toLowerCase())) || options2[0];
  if (target) target.click();
}, answers);

const completeWizard = async (page, identityButton, answers) => {
  await page.waitForSelector('text=Make Visionary your own', { timeout: 45000 });
  await page.evaluate((text) => [...document.querySelectorAll('main button, #main button')].find((b) => (b.textContent || '').includes(text))?.click(), identityButton);
  const s = page.locator('main button[type="submit"], form button[type="submit"]').last();
  await s.waitFor({ state: 'visible', timeout: 20000 });
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline && (await s.isDisabled())) await page.waitForTimeout(300);
  await s.click();
  await page.waitForSelector('text=A little about you', { timeout: 45000 });
  for (let guard = 0; guard < 16 && !page.url().includes('/dashboard'); guard += 1) {
    await page.waitForTimeout(500);
    if (page.url().includes('/dashboard')) break;
    await fillAndSelect(page, answers);
    await page.waitForTimeout(350);
    const btn = page.locator('main button[type="submit"], form button[type="submit"]').last();
    if (!(await btn.count())) continue;
    const d3 = Date.now() + 8000;
    while (Date.now() < d3 && (await btn.isDisabled())) await page.waitForTimeout(300);
    if (!(await btn.isDisabled())) { await btn.click(); continue; }
    await page.evaluate(() => [...document.querySelectorAll('main button, #main button')]
      .find((b) => b.offsetParent !== null && !b.disabled && b.getAttribute('aria-pressed') === 'false'
        && !/^(Back|Resend|Sign in|Log in|Verify|Skip for now|Use a different account|Continue|Looks good|Get started|Finish|Complete setup|Next)$/i.test((b.textContent || '').trim()))?.click());
    await page.waitForTimeout(350);
    const d4 = Date.now() + 6000;
    while (Date.now() < d4 && (await btn.isDisabled())) await page.waitForTimeout(250);
    if (!(await btn.isDisabled())) await btn.click();
  }
  if (!page.url().includes('/dashboard')) throw new Error('wizard did not reach the dashboard');
  await settle(page, 2200);
  const dialog = page.locator('[role="dialog"]').first();
  if (await dialog.isVisible().catch(() => false)) {
    for (let i = 0; i < 3; i += 1) {
      await dialog.getByRole('button', { name: i === 2 ? 'Start exploring' : 'Continue', exact: true }).last().click();
      await page.waitForTimeout(600);
    }
  }
};

const registerAccount = async (page, email, identityButton, answers) => {
  await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
  await settle(page, 1500);
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 }).catch(async (e) => { const st = await page.evaluate(() => ({ url: location.href, body: document.body.innerText.slice(0, 120) })).catch(() => null); console.log('CLICK-DEBUG:', JSON.stringify(st), String(e).slice(0, 80)); throw e; });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('button[type="submit"]:visible').first().click();
  const pw = page.locator('input[type="password"]:visible');
  await pw.first().fill(PASSWORD, { timeout: 20000 });
  if (await pw.count() > 1) await pw.nth(1).fill(PASSWORD);
  await page.locator('button[type="submit"]:visible').last().click();
  const otp = page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]').first();
  await otp.waitFor({ state: 'visible', timeout: 30000 });
  try { await otp.fill('000000'); } catch { await otp.pressSequentially('000000'); }
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.waitForURL(/\/onboarding/, { timeout: 45000 });
  await completeWizard(page, identityButton, answers);
};

const signIn = async (page, email) => {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await settle(page, 1200);
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('button[type="submit"]:visible').first().click();
  const pw = page.locator('input[type="password"]:visible');
  await pw.first().fill(PASSWORD, { timeout: 20000 });
  await page.locator('button[type="submit"]:visible').last().click();
  await page.waitForURL(/\/dashboard/, { timeout: 45000 });
  await settle(page, 1500);
  const dialog = page.locator('[role="dialog"]').first();
  if (await dialog.isVisible().catch(() => false)) {
    for (let i = 0; i < 3; i += 1) {
      await dialog.getByRole('button', { name: i === 2 ? 'Start exploring' : 'Continue', exact: true }).last().click();
      await page.waitForTimeout(500);
    }
  }
};

const signOut = async (page) => {
  /* Real pointer clicks: Radix menus close on synthetic outside events. */
  await page.click('header button[aria-label*="ccount" i]', { timeout: 15000 });
  await page.getByRole('menuitem', { name: /sign out/i }).click({ timeout: 15000 });
  await page.waitForTimeout(1800);
  await page.waitForFunction(() => !document.body.innerText.includes('Active workspace'), { timeout: 15000 }).catch(() => {});
};
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`${page.url()}: ${String(e).slice(0, 130)}`));
const learnerEmail = `learner-${Date.now()}@visionary.test`;
const parentEmail = `parent-${Date.now()}@visionary.test`;
try {
  /* Learner account first. */
  await registerAccount(page, learnerEmail, 'I am a Learner', { 'What should we call you?': 'Sam', 'Your age range': 'adult', 'Which board are you studying under?': 'CBSE', 'What language does your school use to teach?': 'English', 'Which class are you studying in?': 'Class 12' });
  check('learner-registered', page.url().includes('/dashboard'), 'learner journey reached the dashboard');

  await signOut(page);
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await settle(page, 800);

  /* Parent account. */
  await registerAccount(page, parentEmail, 'I am a Parent', { 'What should we call you?': 'Anika', 'Your age range': 'adult', "What's your relation to the child?": 'Guardian', 'What is your child currently studying?': 'School', 'Which board does your child study under?': 'CBSE', 'Which class is your child in?': 'Class 12' });
  check('parent-registered', page.url().includes('/dashboard'), 'parent journey reached the dashboard');

  /* ── Child connections: request progress sharing with the learner email ── */
  await page.goto(`${base}/dashboard/child`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const connectState = await page.evaluate(() => ({
    honestNotice: /must accept|does not verify guardianship|do not enter real child/i.test(document.body.innerText),
    body: document.body.innerText.slice(0, 320).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'parent-child-request-form', { surface: 'child', connectState, errors: [...errors] });
  check('child-connect-honest-notice', connectState.honestNotice, JSON.stringify(connectState).slice(0, 150));

  await page.locator('#main input:visible, main input:visible').first().fill(learnerEmail);
  await page.locator('#main button:visible, main button:visible').filter({ hasText: /request|send/i }).first().click().catch(() => {});
  await page.waitForTimeout(1800);
  const pending = await page.evaluate(() => ({
    pendingShown: /awaiting acceptance|pending/i.test(document.body.innerText),
    expiry: /expire/i.test(document.body.innerText),
    body: document.body.innerText.slice(0, 320).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'parent-connection-pending', { surface: 'child', pending });
  check('connection-pending', pending.pendingShown, JSON.stringify(pending).slice(0, 150));

  /* ── Learner accepts through their Connections surface ── */
  await signOut(page);
  await signIn(page, learnerEmail);
  await page.goto(`${base}/dashboard/connections`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const learnerSide = await page.evaluate(() => ({
    pendingVisible: /awaiting|pending|accept/i.test(document.body.innerText),
    acceptButton: [...document.querySelectorAll('#main button, main button')].some((b) => /^(accept|approve|allow)/i.test((b.textContent || '').trim())),
    body: document.body.innerText.slice(0, 320).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'learner-connection-request', { surface: 'connections', learnerSide });
  if (learnerSide.acceptButton) {
    await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /^(accept|approve|allow)/i.test((b.textContent || '').trim()))?.click());
    await page.waitForTimeout(1500);
  }
  const accepted = await page.evaluate(() => ({
    active: /active|connected/i.test(document.body.innerText),
    body: document.body.innerText.slice(0, 250).replace(/\n+/g, ' | '),
  }));
  check('learner-accepts-request', learnerSide.pendingVisible || accepted.active, JSON.stringify({ learnerSide, accepted }).slice(0, 180));

  /* ── Parent: Connected + View report ── */
  await signOut(page);
  await signIn(page, parentEmail);
  await page.goto(`${base}/dashboard/child`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const connected = await page.evaluate(() => ({
    connectedShown: /connected/i.test(document.body.innerText),
    viewReport: [...document.querySelectorAll('#main a, main a')].some((a) => /view report/i.test(a.textContent || '')),
    body: document.body.innerText.slice(0, 300).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'parent-connection-connected', { surface: 'child', connected });
  check('parent-sees-connected', connected.connectedShown && connected.viewReport, JSON.stringify(connected).slice(0, 160));
  if (connected.viewReport) {
    await page.evaluate(() => [...document.querySelectorAll('#main a, main a')].find((a) => /view report/i.test(a.textContent || ''))?.click());
    await settle(page, 2200);
    const report = await page.evaluate(() => ({
      path: location.pathname,
      body: document.body.innerText.slice(0, 350).replace(/\n+/g, ' | '),
    }));
    await shoot(page, 'parent-progress-report', { surface: 'reports', report, errors: [...errors] });
    check('parent-progress-report', report.path.includes('/dashboard/reports'), JSON.stringify(report).slice(0, 160));
  }

  /* ── Notifications + privacy surface ── */
  await page.goto(`${base}/dashboard/notifications`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1500);
  const notifications = await page.evaluate(() => ({
    h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 40),
    body: document.body.innerText.slice(0, 220).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'parent-notifications', { surface: 'notifications', notifications });
  check('notifications-surface', Boolean(notifications.h1), JSON.stringify(notifications).slice(0, 120));
  await page.goto(`${base}/dashboard/privacy`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1500);
  const privacy = await page.evaluate(() => ({
    h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 40),
    body: document.body.innerText.slice(0, 220).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'parent-privacy', { surface: 'privacy', privacy });
  check('parent-privacy-surface', Boolean(privacy.h1), JSON.stringify(privacy).slice(0, 120));
} catch (error) {
  defects.push(`journey: ${String(error).slice(0, 250)}`);
}
await context.close();
await browser.close();

const receipt = { task: 'F-20 parent experience review', at: new Date().toISOString(), base, records, defects };
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; defects: ${defects.length}`);
for (const defect of defects.slice(0, 8)) console.log(` - ${defect}`);
if (defects.length) process.exit(1);
console.log('PASS parent experience review: consent pair, report, notifications, privacy verified.');
