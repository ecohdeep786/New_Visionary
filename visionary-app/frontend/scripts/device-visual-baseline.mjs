/* F-03 (Cross-Browser QA + Pixel Engineer): device visual baseline harness.
 * Captures the product's representative public surfaces, the onboarding wizard
 * and the five role dashboards at mobile, tablet and desktop sizes through the
 * REAL identity journey: register -> verified email -> onboarding wizard ->
 * dashboard. FAP-93 made Firebase the only identity source (no local auth
 * mode exists), so the journey runs against the Auth Emulator realm: the
 * harness registers through the product UI, completes the real oobCode
 * verification through the product's own /auth/action page, and continues
 * into the wizard. No API interception and no fixture seeding.
 * Env: VISUAL_BASE_URL (default http://127.0.0.1:4198), VISUAL_EVIDENCE_DIR,
 * VISUAL_AUTH_EMULATOR (default http://127.0.0.1:9099), VISUAL_PROJECT_ID
 * (default demo-visionary-e2e). Run with the dev server in firebase emulator
 * mode (VITE_AUTH_MODE=firebase + demo- project + emulator URL). */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { launchReviewedBrowser, openEvidenceDir, receiptMeta } from './qa-env.mjs';

const base = process.env.VISUAL_BASE_URL || 'http://127.0.0.1:4198';
const authEmulator = process.env.VISUAL_AUTH_EMULATOR || 'http://127.0.0.1:9099';
const projectId = process.env.VISUAL_PROJECT_ID || 'demo-visionary-e2e';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.VISUAL_EVIDENCE_DIR || 'docs/visionary/baseline/f03-device-visual-2026-11-05');
await openEvidenceDir(evidence);

const SIZES = [
  { key: 'mobile', width: 390, height: 844 },
  { key: 'tablet', width: 768, height: 1024 },
  { key: 'desktop', width: 1440, height: 900 },
];

/* Every live public route plus the two auth surfaces (V5 F-03: the full
 * matrix, not a 12-route sample; the route contract test is the source). */
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
  ['/help', 'help'],
  ['/download', 'download'],
  ['/careers', 'careers'],
  ['/research', 'research'],
  ['/community', 'community'],
  ['/contact', 'contact'],
  ['/partners', 'partners'],
  ['/updates', 'updates'],
  ['/referral', 'referral'],
  ['/safety', 'safety'],
  ['/privacy', 'privacy'],
  ['/terms', 'terms'],
  ['/security', 'security'],
  ['/accessibility', 'accessibility'],
  ['/cookies', 'cookies'],
  ['/login', 'login'],
  ['/register', 'register'],
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

const { browser, version: browserVersion } = await launchReviewedBrowser({ chromium });

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
  const bytes = await fs.readFile(path.join(evidence, file));
  const record = { file, sha256: createHash('sha256').update(bytes).digest('hex').slice(0, 16), bytes: bytes.length, ...meta, h1: await heading(page), url: page.url() };
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

/* ── V5 F-03 public device matrix: DOM facts at every recorded width,
 *    screenshots at the representative set. Facts are measured, not eyeballed:
 *    horizontal overflow, broken images, essential controls outside the
 *    viewport, blank mains and page errors each fail the receipt (S01/S02/S05/S06). */
const MATRIX_WIDTHS = [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920];
const SHOT_WIDTHS = [320, 390, 768, 1440];
const deviceMatrix = [];
const interactions = [];
{
  const { context, page, errors } = await newContext({ width: 1440, height: 900 });
  const domFacts = () => page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = Math.max(0, doc.scrollWidth - doc.clientWidth);
    const brokenImages = [...document.images].filter((img) => img.complete && img.naturalWidth === 0).length;
    /* A control counts as unreachable-clipped only when NO scroll or interaction
     * can use it: it must have no visible part (fully outside the viewport),
     * have no scrollable-x ancestor (tiles inside an intended snap-x carousel
     * are reachable by scrolling that container), and not be inert (the fan
     * marks its decorative bleed cards inert by design — F-03-D2). */
    const clippedControls = [...document.querySelectorAll('button, a, input, select, textarea')]
      .filter((el) => el.offsetParent !== null && !el.closest('[inert]'))
      .filter((el) => {
        const box = el.getBoundingClientRect();
        if (!(box.width > 0 && (box.right < -1 || box.left > doc.clientWidth + 1))) return false;
        for (let p = el.parentElement; p; p = p.parentElement) {
          const s = getComputedStyle(p);
          if (s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflow === 'auto' || s.overflow === 'scroll') return false;
        }
        return true;
      }).length;
    const main = document.querySelector('main, #main');
    const blankMain = !main || (main.innerText.trim().length < 40 && document.images.length === 0);
    return { overflow, brokenImages, clippedControls, blankMain };
  });
  for (const [route, name] of PUBLIC_ROUTES.filter(([r]) => r !== '/login' && r !== '/register')) {
    for (const width of MATRIX_WIDTHS) {
      try {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
        await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
        await settle(page, 500);
        const facts = await domFacts();
        const entry = { route, width, ...facts, pageErrors: [...errors] };
        deviceMatrix.push(entry);
        if (facts.overflow > 1) failures.push(`matrix ${route} @ ${width}px: horizontal overflow ${facts.overflow}px (S02)`);
        if (facts.brokenImages) failures.push(`matrix ${route} @ ${width}px: ${facts.brokenImages} broken image(s) (S05)`);
        if (facts.clippedControls) failures.push(`matrix ${route} @ ${width}px: ${facts.clippedControls} control(s) outside the viewport (S02)`);
        if (facts.blankMain) failures.push(`matrix ${route} @ ${width}px: blank main (S05)`);
        if (errors.length) failures.push(`matrix ${route} @ ${width}px: page errors ${JSON.stringify([...errors])} (S05)`);
        if (SHOT_WIDTHS.includes(width)) {
          const file = `matrix-${name}-${width}.png`;
          await page.screenshot({ path: path.join(evidence, file) });
          const bytes = await fs.readFile(path.join(evidence, file));
          captures.push({ file, sha256: createHash('sha256').update(bytes).digest('hex').slice(0, 16), bytes: bytes.length, surface: 'matrix', route, width, ...facts, errors: [...errors] });
        }
        errors.length = 0;
        if (width === 1440) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(400);
          const footerFile = `matrix-${name}-1440-footer.png`;
          await page.screenshot({ path: path.join(evidence, footerFile) });
          const footerBytes = await fs.readFile(path.join(evidence, footerFile));
          captures.push({ file: footerFile, sha256: createHash('sha256').update(footerBytes).digest('hex').slice(0, 16), bytes: footerBytes.length, surface: 'matrix-footer', route, width: 1440, errors: [] });
        }
      } catch (error) {
        failures.push(`matrix ${route} @ ${width}px: ${String(error).slice(0, 200)}`);
        errors.length = 0;
      }
    }
  }

  /* S03: the mobile drawer opens and closes with touch and keyboard without
   * stranding the page — Escape returns focus to the trigger, body scroll
   * unlocks, and no drawer remains. */
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/`, { waitUntil: 'load', timeout: 90000 });
    await settle(page, 500);
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.waitForTimeout(500);
    const openState = await page.evaluate(() => ({
      drawerOpen: Boolean(document.querySelector('header .safe-b')),
      bodyOverflow: document.body.style.overflow,
      focusInDrawer: Boolean(document.activeElement?.closest?.('.safe-b')),
    }));
    await page.screenshot({ path: path.join(evidence, 'interaction-mobile-drawer-open.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const closedState = await page.evaluate(() => ({
      drawerGone: !document.querySelector('header .safe-b'),
      bodyOverflow: document.body.style.overflow,
      focusLabel: document.activeElement?.getAttribute('aria-label') ?? null,
    }));
    await page.screenshot({ path: path.join(evidence, 'interaction-mobile-drawer-closed.png') });
    const touchReopen = await page.evaluate(() => { const b = [...document.querySelectorAll('header button')].find(x => x.getAttribute('aria-label') === 'Open menu'); if (!b) return false; b.click(); return true; });
    await page.waitForTimeout(500);
    const reopened = await page.evaluate(() => Boolean(document.querySelector('header .safe-b')) && document.body.style.overflow === 'hidden');
    await page.evaluate(() => { const b = [...document.querySelectorAll('header button')].find(x => x.getAttribute('aria-label') === 'Close menu'); b?.click(); });
    await page.waitForTimeout(300);
    const drawerPass = openState.drawerOpen && openState.bodyOverflow === 'hidden' && closedState.drawerGone && closedState.bodyOverflow === '' && closedState.focusLabel === 'Open menu' && touchReopen && reopened;
    interactions.push({ check: 'mobile-drawer', openState, closedState, touchReopen, reopened, result: drawerPass ? 'PASS' : 'FAIL' });
    if (!drawerPass) failures.push(`interaction mobile-drawer: ${JSON.stringify({ openState, closedState, touchReopen, reopened })} (S03)`);
  } catch (error) {
    failures.push(`interaction mobile-drawer: ${String(error).slice(0, 200)} (S03)`);
  }

  /* 200% user zoom: the browser halves the CSS-pixel viewport, so the honest
   * emulation is the half-size window (1280/2 × 900/2) — style.zoom would keep
   * the desktop breakpoints active and misread the nav. The landing primary
   * action must remain visible and unclipped at the emulated zoom. */
  try {
    await page.setViewportSize({ width: 640, height: 450 });
    await page.goto(`${base}/`, { waitUntil: 'load', timeout: 90000 });
    await settle(page, 500);
    const zoomFacts = await domFacts();
    await page.screenshot({ path: path.join(evidence, 'interaction-zoom-200-landing.png') });
    interactions.push({ check: 'zoom-200-landing', ...zoomFacts, method: 'half-size CSS viewport (1280x900 at 200% zoom)', result: zoomFacts.overflow <= 1 && !zoomFacts.clippedControls ? 'PASS' : 'FAIL' });
    if (interactions.at(-1).result === 'FAIL') failures.push(`interaction zoom-200-landing: overflow ${zoomFacts.overflow}px, clipped ${zoomFacts.clippedControls} (S02)`);
  } catch (error) {
    failures.push(`interaction zoom-200-landing: ${String(error).slice(0, 200)} (S02)`);
  }

  /* Reduced motion: the persona hero must render stably (no animation-driven
   * layout shift) — captured and recorded as a distinct motion state. */
  try {
    const rmContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const rmPage = await rmContext.newPage();
    await rmPage.goto(`${base}/student`, { waitUntil: 'load', timeout: 90000 });
    await settle(rmPage, 800);
    const headline = await rmPage.evaluate(() => document.querySelector('main h1, #main h1, h1')?.textContent?.trim() ?? null);
    await rmPage.screenshot({ path: path.join(evidence, 'interaction-reduced-motion-student.png') });
    await rmContext.close();
    interactions.push({ check: 'reduced-motion-student', headline, result: headline ? 'PASS' : 'FAIL' });
    if (!headline) failures.push('interaction reduced-motion-student: no headline rendered');
  } catch (error) {
    failures.push(`interaction reduced-motion-student: ${String(error).slice(0, 200)}`);
  }

  /* Landscape spot: a rotated phone must not overflow on the two densest
     public surfaces. */
  for (const route of ['/', '/pricing']) {
    try {
      await page.setViewportSize({ width: 844, height: 390 });
      await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
      await settle(page, 500);
      const facts = await domFacts();
      interactions.push({ check: `landscape-844x390 ${route}`, ...facts, result: facts.overflow <= 1 && !facts.clippedControls ? 'PASS' : 'FAIL' });
      if (interactions.at(-1).result === 'FAIL') failures.push(`interaction landscape ${route}: overflow ${facts.overflow}px, clipped ${facts.clippedControls} (S02)`);
    } catch (error) {
      failures.push(`interaction landscape ${route}: ${String(error).slice(0, 200)}`);
    }
  }
  await context.close();
}


/* ── Onboarding + dashboard journeys through the real identity flow ── */
async function registerViaUi(page, email) {
  await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('button[type="submit"]').first().click();
  const passwords = page.locator('input[type="password"]');
  await passwords.first().fill(PASSWORD, { timeout: 20000 });
  if (await passwords.count() > 1) await passwords.nth(1).fill(PASSWORD);
  await page.locator('button[type="submit"]').last().click();
  /* The real identity flow: the product asks the registrant to verify the
   * email address. The Auth Emulator hands the oobCode to this harness, which
   * completes it through the product's own /auth/action page in a second tab
   * of the same context — exactly what a real user does with the mail link. */
  await page.getByRole('heading', { name: 'Confirm your email address' }).waitFor({ state: 'visible', timeout: 30000 });
  const oobCode = await fetchLatestOobCode(email);
  const action = await page.context().newPage();
  try {
    await action.goto(`${base}/auth/action?mode=verifyEmail&oobCode=${encodeURIComponent(oobCode)}&lang=en`, { waitUntil: 'domcontentloaded' });
    await action.getByRole('heading', { name: 'Email verified' }).waitFor({ state: 'visible', timeout: 30000 });
  } finally { await action.close(); }
  await page.getByRole('button', { name: 'I verified my email' }).click();
  await page.waitForURL(/\/onboarding/, { timeout: 45000 });
}

/* The newest VERIFY_EMAIL oobCode for this registrant, from the Auth Emulator's
 * inspection API. A missing code is a harness-environment failure, never a
 * product one, and is reported as such. */
async function fetchLatestOobCode(email) {
  const response = await fetch(`${authEmulator}/emulator/v1/projects/${projectId}/oobCodes`);
  if (!response.ok) throw new Error(`Auth Emulator oobCodes unavailable (${response.status}); start the emulator realm before this harness.`);
  const { oobCodes = [] } = await response.json();
  const mine = oobCodes.filter(row => row.email === email && row.requestType === 'VERIFY_EMAIL');
  if (!mine.length) throw new Error(`No VERIFY_EMAIL oobCode for ${email}; the emulator realm did not record the registration.`);
  return mine.at(-1).oobCode;
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
/* The Auth Emulator persists accounts across runs, so the journey identity must
 * be unique per run — a deterministic email would fail with
 * auth/email-already-in-use before the verification step ever renders. */
const runSalt = Date.now().toString(36);
for (const size of SIZES) {
  for (const [role, routes] of Object.entries(ROLE_JOURNEYS)) {
    const { context, page, errors } = await newContext(size);
    try {
      let email = `visual-${role}-${size.key}-${runSalt}@visionary.test`;
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
  ...receiptMeta({ browser: `Microsoft Edge via playwright-core (${browserVersion ?? 'channel msedge'})`, viewport: 'multi', route: 'all public + 5 role journeys', role: 'five emulator-realm roles' }),
  base,
  mode: 'Auth Emulator realm (VITE_AUTH_MODE=firebase, demo- project) — real register/verified-email/onboarding/dashboard journey, no API interception, no fixture seeding',
  boundary: 'Hosted Firebase acceptance remains a separate gate; this harness verifies the real identity protocol against the local Auth Emulator realm.',
  sizes: SIZES,
  publicRoutes: PUBLIC_ROUTES.map(([route]) => route),
  matrixWidths: MATRIX_WIDTHS,
  roleJourneys: ROLE_JOURNEYS,
  captures,
  deviceMatrix,
  interactions,
  failures,
};
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
/* Reusable evidence index: one row per route × viewport so a later owner can
 * compare against this recorded beta SHA without re-deriving the matrix. */
const indexRows = PUBLIC_ROUTES.filter(([r]) => r !== '/login' && r !== '/register')
  .map(([route]) => {
    const cells = deviceMatrix.filter((m) => m.route === route);
    const worst = Math.max(0, ...cells.map((c) => c.overflow));
    const state = cells.length === MATRIX_WIDTHS.length && worst <= 1 ? 'PASS' : 'FAIL';
    return `| \`${route}\` | ${cells.length}/${MATRIX_WIDTHS.length} | ${worst}px | ${state} |`;
  });
const index = [
  '# F-03 visual baseline index', '',
  `Source SHA: \`${receipt.betaSha}\` · Browser: ${receipt.browser} · Mode: Auth Emulator realm (NOT hosted acceptance) · Generated: ${receipt.timestamp}`, '',
  '| Route | widths measured | worst horizontal overflow | state |', '|---|---|---|---|',
  ...indexRows, '',
  `Screenshots: ${captures.length} hashed captures · Interaction checks: ${interactions.length} · Failures: ${failures.length}`, '',
].join('\n');
await fs.writeFile(path.join(evidence, 'INDEX.md'), index + '\n');
const files = await fs.readdir(evidence);
const pngs = files.filter((f) => f.endsWith('.png'));
console.log(`Captured ${captures.length} records, ${pngs.length} PNG files, ${deviceMatrix.length} matrix cells, ${interactions.length} interaction checks -> ${path.relative(productRoot, evidence)}`);
if (failures.length) {
  console.log(`FAIL ${failures.length} failure(s):`);
  for (const failure of failures.slice(0, 20)) console.log(` - ${failure}`);
  process.exit(1);
}
console.log('PASS all captures rendered a heading with zero page errors and zero device-matrix defects.');
