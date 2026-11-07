/* F-03 (Cross-Browser QA + Pixel Engineer): device visual baseline harness.
 * Captures the product's representative public surfaces, the onboarding wizard
 * and the five role dashboards at mobile, tablet and desktop sizes through the
 * REAL preview-mode journey: register -> OTP -> onboarding wizard -> dashboard.
 * No API interception and no fixture seeding — the local preview repository is
 * the product's own development mode. Firebase-mode sessions remain dependent
 * on the recorded QA-login bring-up (F-02-F1); this harness records that
 * boundary instead of pretending to cover it.
 * Env: VISUAL_BASE_URL (default http://127.0.0.1:4198), VISUAL_EVIDENCE_DIR.
 * Run with the worktree dev server in preview mode (no VITE_AUTH_MODE=firebase). */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchReviewedBrowser, openEvidenceDir } from './qa-env.mjs';

const base = process.env.VISUAL_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.VISUAL_EVIDENCE_DIR || 'docs/visionary/baseline/f03-device-visual-2026-11-05');
await openEvidenceDir(evidence);

const SIZES = [
  { key: 'mobile', width: 390, height: 844 },
  { key: 'tablet', width: 768, height: 1024 },
  { key: 'desktop', width: 1440, height: 900 },
];

const PUBLIC_ROUTES = [
  ['/', 'landing'],
  ['/about', 'about'],
  ['/how-it-works', 'how-it-works'],
  ['/pricing', 'pricing'],
  ['/student', 'role-student'],
  ['/teacher', 'role-teacher'],
  ['/parent', 'role-parent'],
  ['/professional', 'role-professional'],
  ['/organization', 'role-organization'],
  ['/login', 'login'],
  ['/register', 'register'],
  ['/privacy', 'privacy'],
];

/* Role dashboard journeys mirror the recorded role-journey sweep surfaces. */
const ROLE_JOURNEYS = {
  student: ['/dashboard/home', '/dashboard/learn', '/dashboard/ask', '/dashboard/progress'],
  teacher: ['/dashboard/home', '/dashboard/classes', '/dashboard/prepare', '/dashboard/insights'],
  parent: ['/dashboard/home', '/dashboard/child', '/dashboard/reports', '/dashboard/notifications'],
  professional: ['/dashboard/home', '/dashboard/career', '/dashboard/build', '/dashboard/settings'],
  organization: ['/dashboard/home', '/dashboard/people', '/dashboard/curriculum', '/dashboard/analytics'],
};

const PASSWORD = 'Visionary#Baseline2026';
const captures = [];
const failures = [];
const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

/* Deterministic wizard answers where the product asks a specific question.
 * Unlisted steps use the first available option (recorded in the receipt). */
const ROLE_IDENTITY = {
  student: 'I am a Learner',
  teacher: 'I am a Teacher',
  parent: 'I am a Parent',
  professional: 'I am a Professional',
  organization: 'We are an Organization',
};
const ROLE_ANSWERS = {
  common: { 'What should we call you?': 'Alex', 'Your age range': 'adult', 'Organization name': 'Baseline Learning Org' },
  student: { 'Which board are you studying under?': 'CBSE', 'What language does your school use to teach?': 'English', 'Which class are you studying in?': 'Class 12', 'Which state are you in?': 'West Bengal' },
  teacher: { 'What kind of teacher are you?': 'School', 'Which board do you teach under?': 'CBSE', 'Which language do you use to teach?': 'English', 'What is your current role?': 'Subject Teacher', "What's your current role?": 'Subject Teacher' },
  parent: { "What's your relation to the child?": 'Guardian', 'What is your child currently studying?': 'School', 'Which board does your child study under?': 'CBSE', 'Which class is your child in?': 'Class 12', 'Which language does your child study in?': 'English' },
  professional: {},
  organization: { 'What type of organization are you?': 'Training', 'Which board does your institution follow?': 'CBSE', 'What languages do you teach in?': 'English' },
};
const CONTINUE_LABEL = /^(Continue|Looks good|Get started|Finish|Complete setup|Next)$/i;

const { browser } = await launchReviewedBrowser({ chromium });

async function newContext(size) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.setDefaultNavigationTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 300)));
  return { context, page, errors };
}

const heading = (page) => page.evaluate(() => document.querySelector('#main h1, main h1, h1')?.textContent?.trim() || document.querySelector('#main h2, main h2')?.textContent?.trim() || null);

async function settle(page, ms = 1200) {
  await page.waitForLoadState('load').catch(() => {});
  /* The dev server's first-load dependency optimizer can serve a sparse
   * "Loading…" shell (recorded as F-02-F1's harness observation); wait for
   * actual rendered content instead of a fixed delay. */
  await page.waitForFunction(() => document.readyState === 'complete'
    && (document.querySelector('h1, h2') || document.body.innerText.length > 200),
  { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function shoot(page, name, meta) {
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(evidence, file) });
  const record = { file, ...meta, h1: await heading(page), url: page.url() };
  captures.push(record);
  if (!record.h1) failures.push(`${file}: no h1/h2 heading rendered`);
  if (meta.errors?.length) failures.push(`${file}: page errors ${JSON.stringify(meta.errors)}`);
  return record;
}

/* ── Public surfaces ── */
for (const size of SIZES) {
  const { context, page, errors } = await newContext(size);
  for (const [route, name] of PUBLIC_ROUTES) {
    try {
      await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
      await settle(page);
      await shoot(page, `public-${name}-${size.key}`, { surface: 'public', route, size: size.key, errors: [...errors] });
    } catch (error) {
      failures.push(`public ${route} @ ${size.key}: ${String(error).slice(0, 200)}`);
    }
  }
  await context.close();
}

/* ── Onboarding + dashboard journeys through the real preview flow ── */
async function registerViaUi(page, email) {
  await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('button[type="submit"]').first().click();
  const passwords = page.locator('input[type="password"]');
  await passwords.first().fill(PASSWORD, { timeout: 20000 });
  if (await passwords.count() > 1) await passwords.nth(1).fill(PASSWORD);
  await page.locator('button[type="submit"]').last().click();
  /* The preview repository verifies the registration session, not the code
   * (any six digits pass); the product OTP view stays part of the journey. */
  const otpInput = page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]').first();
  await otpInput.waitFor({ state: 'visible', timeout: 30000 });
  try { await otpInput.fill('000000'); } catch { await otpInput.pressSequentially('000000'); }
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.waitForURL(/\/onboarding/, { timeout: 45000 });
}

const visibleButtons = (page) => page.evaluate(() => [...document.querySelectorAll('main button, #main button')]
  .filter((b) => b.offsetParent !== null && !b.disabled && (b.textContent || '').trim())
  .map((b) => (b.textContent || '').trim()));

/* The wizard's continue control is the form's primary submit button; it
 * enables after React state settles (e.g. a role/choice selection). Wait for
 * it rather than racing the re-render. */
const submitLocator = (page) => page.locator('main button[type="submit"], #main button[type="submit"], form button[type="submit"]').last();

const clickContinue = async (page) => {
  const submit = submitLocator(page);
  await submit.waitFor({ state: 'visible', timeout: 20000 });
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (!(await submit.isDisabled())) { await submit.click(); return true; }
    await page.waitForTimeout(300);
  }
  return false;
};

const fillTextInputs = async (page, answers) => page.evaluate((answers) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  for (const input of [...document.querySelectorAll('main input[type="text"], #main input[type="text"]')]) {
    if (input.value || input.offsetParent === null) continue;
    const label = [...document.querySelectorAll('label')].find((l) => l.htmlFor === input.id)?.textContent?.trim();
    const mapped = label && Object.entries(answers).find(([k]) => label.startsWith(k));
    const fallback = Object.values(answers)[0];
    const value = (mapped ? mapped[1] : (label && input.required ? fallback : '')) || '';
    if (!value) continue;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}, answers);

const setSelects = async (page, answers) => page.evaluate((answers) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  for (const select of [...document.querySelectorAll('main select, #main select')]) {
    if (select.offsetParent === null || select.value) continue;
    const label = [...document.querySelectorAll('label')].find((l) => l.htmlFor === select.id)?.textContent?.trim();
    const mappedEntry = Object.entries(answers).find(([k]) => label && label.startsWith(k));
    const options = [...select.options].map((o) => o.value).filter((v) => v && v !== '');
    const wanted = mappedEntry ? options.find((v) => v === mappedEntry[1]) || options.find((v) => v.toLowerCase().includes(String(mappedEntry[1]).toLowerCase())) : null;
    const value = wanted || options[0] || null;
    if (value) { setter.call(select, value); select.dispatchEvent(new Event('change', { bubbles: true })); }
  }
}, answers);

const chooseMatched = async (page, answers) => {
  const buttons = await visibleButtons(page);
  const options = buttons.filter((t) => !CONTINUE_LABEL.test(t) && !/^(Back|Resend|Sign in|Log in|Verify|Skip for now)$/i.test(t));
  for (const text of options) {
    const mappedEntry = Object.entries(answers).find(([k]) => text === k || text.startsWith(k) || k.startsWith(text));
    if (mappedEntry) {
      const target = options.find((o) => o === mappedEntry[1]) || options.find((o) => o.toLowerCase().includes(String(mappedEntry[1]).toLowerCase()));
      if (target) {
        await page.evaluate((t) => [...document.querySelectorAll('main button, #main button')].find((b) => (b.textContent || '').trim() === t)?.click(), target);
        await page.waitForTimeout(250);
        return target;
      }
    }
  }
  return null;
};

async function runWizard(page, role, sizeKey, wantsAllShots) {
  await page.waitForSelector('text=Make Visionary your own', { timeout: 45000 });
  const answers = { ...ROLE_ANSWERS.common, ...(ROLE_ANSWERS[role] || {}) };
  const steps = [];
  const identity = await visibleButtons(page);
  await shoot(page, `onboarding-${role}-${sizeKey}-identity`, { surface: 'onboarding', role, step: 'identity', size: sizeKey });
  await page.evaluate((text) => [...document.querySelectorAll('main button, #main button')].find((b) => (b.textContent || '').trim().includes(text))?.click(), ROLE_IDENTITY[role]);
  if (!await clickContinue(page)) throw new Error(`Identity selection did not enable Continue for ${role} @ ${sizeKey}`);
  await page.waitForSelector('text=A little about you', { timeout: 45000 });
  await shoot(page, `onboarding-${role}-${sizeKey}-about`, { surface: 'onboarding', role, step: 'about', size: sizeKey });
  await fillTextInputs(page, answers);
  await setSelects(page, answers);
  await clickContinue(page);
  let shotIndex = 0;
  for (let guard = 0; guard < 14; guard += 1) {
    await page.waitForTimeout(500);
    if (page.url().includes('/dashboard')) break;
    const title = await page.evaluate(() => document.querySelector('main h2, #main h2, main h1')?.textContent?.trim() || null);
    steps.push(title);
    const captureThis = wantsAllShots || shotIndex < 1;
    if (captureThis && title) {
      await shoot(page, `onboarding-${role}-${sizeKey}-step${shotIndex + 1}`, { surface: 'onboarding', role, step: title.slice(0, 60), size: sizeKey });
    }
    shotIndex += 1;
    await fillTextInputs(page, answers);
    await setSelects(page, answers);
    await chooseMatched(page, answers);
    let advanced = await clickContinue(page);
    if (!advanced) {
      /* Still disabled: select the first unselected option of each remaining
       * group (chips/grid buttons expose aria-pressed), re-checking Continue
       * after each selection. */
      for (let picks = 0; picks < 8 && !advanced; picks += 1) {
        const wanted = Object.values(answers).map((v) => String(v).toLowerCase());
        const picked = await page.evaluate((wanted) => {
          const skip = /^(Back|Resend|Sign in|Log in|Verify|Skip for now|Use a different account|Continue|Looks good|Get started|Finish|Complete setup|Next)$/i;
          const options = [...document.querySelectorAll('main button, #main button')]
            .filter((b) => b.offsetParent !== null && !b.disabled && b.getAttribute('aria-pressed') === 'false'
              && (b.textContent || '').trim() && !skip.test((b.textContent || '').trim()));
          const target = options.find((b) => wanted.includes((b.textContent || '').trim().toLowerCase())) || options[0];
          if (target) target.click();
          return Boolean(target);
        }, wanted);
        if (!picked) break;
        await page.waitForTimeout(350);
        advanced = await clickContinue(page);
      }
    }
    if (!advanced) throw new Error(`Wizard stalled on step "${title}" for ${role} @ ${sizeKey}`);
  }
  if (!page.url().includes('/dashboard')) throw new Error(`Onboarding did not reach the dashboard for ${role} @ ${sizeKey}`);
  await settle(page, 2500);
  /* D-066 three-screen welcome dialog auto-opens for the fresh account.
   * Walk all three pages (captured as onboarding evidence) and finish with the
   * product's own "Start exploring" so completion persists for the clean
   * dashboard captures. */
  const dialog = page.locator('[role="dialog"]').first();
  if (await dialog.isVisible().catch(() => false)) {
    for (let i = 0; i < 3; i += 1) {
      await shoot(page, `onboarding-${role}-${sizeKey}-welcome${i + 1}`, { surface: 'onboarding', role, step: `welcome ${i + 1} of 3`, size: sizeKey });
      const label = i === 2 ? 'Start exploring' : 'Continue';
      await dialog.getByRole('button', { name: label, exact: true }).last().click();
      await page.waitForTimeout(700);
    }
    await dialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  }
  return steps;
}

const seenAccounts = new Set();
for (const size of SIZES) {
  for (const [role, routes] of Object.entries(ROLE_JOURNEYS)) {
    const { context, page, errors } = await newContext(size);
    try {
      let email = `visual-${role}-${size.key}@visionary.test`;
      let attempt = 0;
      while (seenAccounts.has(email)) email = `visual-${role}-${size.key}-${++attempt}@visionary.test`;
      seenAccounts.add(email);
      await registerViaUi(page, email);
      const steps = await runWizard(page, role, size.key, size.key === 'desktop');
      for (const route of routes) {
        await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
        await settle(page, 1800);
        await shoot(page, `${role}${route.replaceAll('/', '-')}-${size.key}`, { surface: 'dashboard', role, route, size: size.key, wizardSteps: role === 'student' ? steps : undefined, errors: [...errors] });
      }
    } catch (error) {
      failures.push(`${role} @ ${size.key}: ${String(error).slice(0, 300)}`);
    }
    await context.close();
  }
}

await browser.close();

/* ── Receipt and gates ── */
const receipt = {
  task: 'F-03 device visual baseline',
  at: new Date().toISOString(),
  base,
  mode: 'local preview repository (VITE_AUTH_MODE unset) — real register/OTP/onboarding/dashboard journey, no API interception, no fixture seeding',
  boundary: 'Firebase-mode authenticated sessions remain dependent on the QA-login bring-up recorded as F-02-F1; captured here in the product preview mode instead.',
  sizes: SIZES,
  publicRoutes: PUBLIC_ROUTES.map(([route]) => route),
  roleJourneys: ROLE_JOURNEYS,
  captures,
  failures,
};
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
const files = await fs.readdir(evidence);
const pngs = files.filter((f) => f.endsWith('.png'));
console.log(`Captured ${captures.length} records, ${pngs.length} PNG files -> ${path.relative(productRoot, evidence)}`);
if (failures.length) {
  console.log(`FAIL ${failures.length} failure(s):`);
  for (const failure of failures.slice(0, 20)) console.log(` - ${failure}`);
  process.exit(1);
}
console.log('PASS all captures rendered a heading with zero page errors.');
