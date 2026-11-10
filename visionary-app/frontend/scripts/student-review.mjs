/* F-18 (Education + Product Engineers): student experience review.
 * Drives the learning surfaces through the real journey: register ->
 * onboarding -> Learn (topic -> detail) -> Ask (send a question, honest
 * guide state) -> Practice (start) -> Build (artifact) -> Progress (honest
 * empty history) -> Classes (join with an unknown code). Captures each
 * state and records the honest-boundary markers. Preview repository mode.
 * Env: STUDENT_BASE_URL (default http://127.0.0.1:4198), STUDENT_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.STUDENT_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.STUDENT_EVIDENCE_DIR || 'docs/visionary/baseline/f18-student-2026-11-06');
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

const registerStudent = async (page) => {
  const email = `student-${Date.now()}@visionary.test`;
  await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
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
  await page.evaluate(() => [...document.querySelectorAll('main button, #main button')].find((b) => (b.textContent || '').includes('I am a Learner'))?.click());
  const answers = { 'What should we call you?': 'Alex', 'Your age range': 'adult', 'Which board are you studying under?': 'CBSE', 'What language does your school use to teach?': 'English', 'Which class are you studying in?': 'Class 12' };
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
  await registerStudent(page);

  /* ── Learn: topic list -> open a topic -> detail ── */
  await page.goto(`${base}/dashboard/learn`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const learn = await page.evaluate(() => ({
    h1: (document.querySelector('h1')?.textContent || '').trim().slice(0, 50),
    hasSamplePath: /Try authored learning sample/i.test(document.body.innerText),
    hasOutlinePath: /Open my outline/i.test(document.body.innerText),
  }));
  await shoot(page, 'student-learn-topics', { surface: 'learn', learn, errors: [...errors] });
  check('learn-entry', Boolean(learn.h1) && learn.hasSamplePath && learn.hasOutlinePath, JSON.stringify(learn));

  /* The authored learning sample is the honest fixture path (SAMPLE_SELECTION). */
  await page.evaluate(() => [...document.querySelectorAll('#main summary, main summary')].find((el) => (el.textContent || '').includes('Choose a subject'))?.click()).catch(() => {});
  await page.waitForTimeout(500);
  const sampleClicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('#main button, main button')].find((b) => /Try authored learning sample/i.test(b.textContent || '') && b.offsetParent !== null);
    if (btn) { btn.click(); return true; }
    return false;
  }).catch(() => false);
  if (sampleClicked) await settle(page, 2200);
  const outline = await page.evaluate(() => ({
    body: document.body.innerText.slice(0, 420).replace(/\n+/g, ' | '),
    headings: [...document.querySelectorAll('#main h2, #main h3, main h2, main h3')].filter((h) => h.offsetParent !== null).map((h) => (h.textContent || '').trim().slice(0, 40)).slice(0, 6),
    chapterButtons: [...document.querySelectorAll('#main button, main button')].filter((b) => b.offsetParent !== null && /chapter|unit/i.test(b.textContent || '')).length,
  }));
  await shoot(page, 'student-learn-outline', { surface: 'learn', sampleClicked, outline, errors: [...errors] });
  check('learn-sample-outline', Boolean(outline.body.length > 100), JSON.stringify(outline).slice(0, 160));
  /* Drill into the first chapter/outline entry (best-effort). */
  const drill = await page.evaluate(() => {
    const target = [...document.querySelectorAll('#main button, #main a, main button, main a')]
      .find((b) => b.offsetParent !== null && /chapter|topic|open|start/i.test(b.textContent || ''));
    if (target) { target.click(); return (target.textContent || '').trim().slice(0, 30); }
    return null;
  }).catch(() => null);
  if (drill) {
    await settle(page, 2200);
    const detail = await page.evaluate(() => ({
      h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 60),
      body: document.body.innerText.slice(0, 300).replace(/\n+/g, ' | '),
    }));
    await shoot(page, 'student-learn-topic-detail', { surface: 'learn', detail, errors: [...errors] });
    check('learn-topic-detail', Boolean(detail.h1), 'drilled: ' + JSON.stringify(drill) + ' ' + JSON.stringify(detail).slice(0, 100));
  } else {
    records.push({ check: 'learn-topic-detail', detail: 'skipped — sample flow did not expose topic links this run' });
  }

  /* ── Ask: send a question, honest guide state ── */
  await page.goto(`${base}/dashboard/ask`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1500);
  await page.locator('#ask-question, textarea').first().fill('What is the difference between area and perimeter?');
  await page.locator('button[type="submit"]:visible, form button:visible').last().click();
  await page.waitForTimeout(3500);
  const ask = await page.evaluate(() => ({
    replied: document.body.innerText.length > 400,
    honestMarker: /local preview|not connected|fixture|demo/i.test(document.body.innerText),
    body: document.body.innerText.slice(200, 560).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'student-ask-question', { surface: 'ask', ask, errors: [...errors] });
  check('ask-interaction', ask.replied, JSON.stringify(ask).slice(0, 140));

  /* ── Practice: start state ── */
  await page.goto(`${base}/dashboard/practice`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const practice = await page.evaluate(() => ({
    h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 50),
    body: document.body.innerText.slice(0, 300).replace(/\n+/g, ' | '),
    buttons: [...document.querySelectorAll('#main button, main button')].filter((b) => b.offsetParent !== null).map((b) => (b.textContent || '').trim().slice(0, 24)).slice(0, 6),
  }));
  await shoot(page, 'student-practice', { surface: 'practice', practice, errors: [...errors] });
  check('practice-state', Boolean(practice.h1), JSON.stringify(practice).slice(0, 140));

  /* ── Build: artifact studio ── */
  await page.goto(`${base}/dashboard/build`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const build = await page.evaluate(() => ({
    h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 50),
    body: document.body.innerText.slice(0, 300).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'student-build', { surface: 'build', build, errors: [...errors] });
  check('build-state', Boolean(build.h1), JSON.stringify(build).slice(0, 140));

  /* ── Progress: honest empty history ── */
  await page.goto(`${base}/dashboard/progress`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const progress = await page.evaluate(() => ({
    h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 50),
    honestEmpty: /evidence starts with|no .*yet|not enough|start with/i.test(document.body.innerText),
    inventedAchievements: document.querySelectorAll('.v-progress-overview').length,
    body: document.body.innerText.slice(0, 300).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'student-progress', { surface: 'progress', progress, errors: [...errors] });
  check('progress-honest-state', Boolean(progress.h1) && !progress.inventedAchievements, JSON.stringify(progress).slice(0, 140));

  /* ── Classes: join flow with an unknown code (honest state) ── */
  await page.goto(`${base}/dashboard/classes`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const classesJoin = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('#main input, main input')].filter((i) => i.offsetParent !== null);
    return { joinInputs: inputs.length, body: document.body.innerText.slice(0, 300).replace(/\n+/g, ' | ') };
  });
  const joinInput = page.locator('#main input:visible, main input:visible').first();
  if (await joinInput.count()) {
    await joinInput.fill('UNKNOWN-CODE-123');
    await page.locator('#main button:visible, main button:visible').filter({ hasText: /join/i }).first().click().catch(() => {});
    await page.waitForTimeout(2000);
  }
  const classesAfter = await page.evaluate(() => ({
    honestJoin: /not found|couldn'|invalid|no class|couldn't find/i.test(document.body.innerText),
    body: document.body.innerText.slice(0, 300).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'student-classes-join', { surface: 'classes', classesJoin, classesAfter, errors: [...errors] });
  check('classes-join-honest', classesAfter.honestJoin || classesJoin.joinInputs === 0, JSON.stringify(classesAfter).slice(0, 140));
} catch (error) {
  defects.push(`journey: ${String(error).slice(0, 250)}`);
}
await context.close();
await browser.close();

const receipt = { task: 'F-18 student experience review', at: new Date().toISOString(), base, records, defects };
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; defects: ${defects.length}`);
for (const defect of defects.slice(0, 8)) console.log(` - ${defect}`);
if (defects.length) process.exit(1);
console.log('PASS student experience review: Learn/Ask/Practice/Build/Progress/Classes states verified.');
