/* F-21 (Product + Education Engineers): professional experience review.
 * Drives the career workflow through the real journey: register ->
 * professional onboarding -> Career ("Your next capability") -> save a
 * direction -> verify the saved direction + evidence honest state -> Build
 * (artifact creation) -> Portfolio review honest state -> Progress.
 * Preview repository mode; no interception.
 * Env: PRO_BASE_URL (default http://127.0.0.1:4198), PRO_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.PRO_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.PRO_EVIDENCE_DIR || 'docs/visionary/baseline/f21-professional-2026-11-06');
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

const registerProfessional = async (page) => {
  const email = `pro-${Date.now()}@visionary.test`;
  await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
  await settle(page, 1500);
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
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
  await page.waitForSelector('text=Make Visionary your own', { timeout: 45000 });
  await page.evaluate(() => [...document.querySelectorAll('main button, #main button')].find((b) => (b.textContent || '').includes('I am a Professional'))?.click());
  const answers = { 'What should we call you?': 'Alex', 'Your age range': 'adult' };
  const fillAndSelect = (page) => page.evaluate((answers) => {
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
  const submitBtn = () => page.locator('main button[type="submit"], form button[type="submit"]').last();
  const advance = async (page) => {
    const btn = submitBtn();
    if (!(await btn.count())) return;
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && (await btn.isDisabled())) await page.waitForTimeout(300);
    if (!(await btn.isDisabled())) { await btn.click(); return; }
    await page.evaluate(() => [...document.querySelectorAll('main button, #main button')]
      .find((b) => b.offsetParent !== null && !b.disabled && b.getAttribute('aria-pressed') === 'false'
        && !/^(Back|Resend|Sign in|Log in|Verify|Skip for now|Use a different account|Continue|Looks good|Get started|Finish|Complete setup|Next)$/i.test((b.textContent || '').trim()))?.click());
    await page.waitForTimeout(350);
    const d2 = Date.now() + 6000;
    while (Date.now() < d2 && (await btn.isDisabled())) await page.waitForTimeout(250);
    if (!(await btn.isDisabled())) await btn.click();
  };
  await advance(page);
  await page.waitForSelector('text=A little about you', { timeout: 45000 });
  for (let guard = 0; guard < 14 && !page.url().includes('/dashboard'); guard += 1) {
    await page.waitForTimeout(500);
    if (page.url().includes('/dashboard')) break;
    await fillAndSelect(page);
    await page.waitForTimeout(350);
    await advance(page);
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
  return email;
};

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`${page.url()}: ${String(e).slice(0, 130)}`));
try {
  await registerProfessional(page);

  /* ── 1. Career workflow: save a direction ── */
  await page.goto(`${base}/dashboard/career`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const career = await page.evaluate(() => ({
    h1: (document.querySelector('h1')?.textContent || '').trim().slice(0, 50),
    steps: [...document.querySelectorAll('#main h2, main h2')].filter((h) => h.offsetParent !== null).map((h) => (h.textContent || '').trim().slice(0, 30)).slice(0, 4),
    honest: /stays in this workspace until you explicitly share|not a credential|not connected/i.test(document.body.innerText),
  }));
  await shoot(page, 'pro-career-entry', { surface: 'career', career, errors: [...errors] });
  check('career-entry', Boolean(career.h1) && career.steps.length >= 3, JSON.stringify(career).slice(0, 150));

  /* Save a direction (capability target). */
  await page.evaluate(() => {
    const iSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const input = [...document.querySelectorAll('#main input, main input')].find((i) => (i.placeholder || '').includes('evidence-based'));
    if (input) { iSetter.call(input, 'Make evidence-based decisions'); input.dispatchEvent(new Event('input', { bubbles: true })); }
    const tSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    const area = [...document.querySelectorAll('#main textarea, main textarea')][0];
    if (area) { tSetter.call(area, 'Evaluate a work decision with recorded evidence.'); area.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /Save direction/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(2000);
  await page.evaluate(() => { const d = [...document.querySelectorAll('#main details, main details')].find((x) => (x.className || '').includes('v-career-saved-direction')); if (d) d.setAttribute('open', ''); });
  await page.waitForTimeout(400);
  const saved = await page.evaluate(() => ({
    savedShown: /Latest saved direction/i.test(document.body.innerText),
    savedTitle: /Make evidence-based decisions/.test(document.body.innerText),
    body: document.body.innerText.slice(0, 320).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'pro-career-direction-saved', { surface: 'career', saved, errors: [...errors] });
  check('career-direction-saved', saved.savedShown && saved.savedTitle, JSON.stringify(saved).slice(0, 160));

  /* ── 2. Evidence honest state (no recorded check yet) ── */
  const evidence = await page.evaluate(() => ({
    honestEmpty: /No recorded check yet|not connected|No skill gap is inferred/i.test(document.body.innerText),
    body: document.body.innerText.slice(0, 300).replace(/\n+/g, ' | '),
  }));
  check('career-evidence-honest', evidence.honestEmpty, JSON.stringify(evidence).slice(0, 140));

  /* ── 3. Build: create an artifact (project evidence) ── */
  await page.goto(`${base}/dashboard/build`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const buildEntry = await page.evaluate(() => ({
    h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 50),
    buttons: [...document.querySelectorAll('#main button, main button')].filter((b) => b.offsetParent !== null).map((b) => (b.textContent || '').trim().slice(0, 28)).slice(0, 6),
  }));
  await shoot(page, 'pro-build-entry', { surface: 'build', buildEntry, errors: [...errors] });
  check('build-entry', Boolean(buildEntry.h1), JSON.stringify(buildEntry).slice(0, 140));
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')]
    .find((b) => /new project|create|start|new artifact/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1800);
  const buildState = await page.evaluate(() => ({
    editorVisible: Boolean(document.querySelector('#main textarea, main textarea, [contenteditable="true"]')),
    body: document.body.innerText.slice(0, 280).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'pro-build-editor', { surface: 'build', buildState, errors: [...errors] });
  check('build-editor', buildState.editorVisible, JSON.stringify(buildState).slice(0, 140));

  /* ── 4. Portfolio review honest state ── */
  await page.goto(`${base}/dashboard/career`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1500);
  const portfolio = await page.evaluate(() => ({
    honest: /not an employer endorsement|not connected|self-review|application evidence, not automatic mastery/i.test(document.body.innerText),
    body: document.body.innerText.slice(0, 300).replace(/\n+/g, ' | '),
  }));
  check('portfolio-honest-boundary', portfolio.honest, JSON.stringify(portfolio).slice(0, 140));

  /* ── 5. Progress surface ── */
  await page.goto(`${base}/dashboard/progress`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const progress = await page.evaluate(() => ({
    h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 50),
    honest: /recorded evidence|no .*yet|not enough|start/i.test(document.body.innerText),
    body: document.body.innerText.slice(0, 280).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'pro-progress', { surface: 'progress', progress, errors: [...errors] });
  check('progress-honest', Boolean(progress.h1) && progress.honest, JSON.stringify(progress).slice(0, 140));
} catch (error) {
  defects.push(`journey: ${String(error).slice(0, 250)}`);
}
await context.close();
await browser.close();

const receipt = { task: 'F-21 professional experience review', at: new Date().toISOString(), base, records, defects };
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; defects: ${defects.length}`);
for (const defect of defects.slice(0, 8)) console.log(` - ${defect}`);
if (defects.length) process.exit(1);
console.log('PASS professional experience review: career workflow, evidence, portfolio, progress verified.');
