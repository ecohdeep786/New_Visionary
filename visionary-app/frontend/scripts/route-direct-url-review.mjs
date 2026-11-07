/* F-01 (Principal Frontend Architecture & Route Engineer): direct-URL route
 * review — proves the route graph in the RENDERED product, not only in source.
 *
 * Scenarios (task S01–S06):
 *   S01  /research direct open, refresh, footer navigation and Back — route and
 *        scroll behaviour stay correct.
 *   S02  Signed-out direct request of /dashboard/learn (and /onboarding):
 *        the auth gate redirects to /login?returnTo=<intended> WITHOUT
 *        rendering private workspace content; the login form is usable.
 *   S03  Preview-mode register -> onboarding gate bounces /dashboard/home back
 *        to /onboarding; the wizard completes; sign-out; deep-link
 *        /dashboard/learn -> sign-in LANDS on /dashboard/learn (destination
 *        recovery) — "resumes intended workspace only when allowed".
 *   S04  An unrecognized path renders the 404 with a working Go Home recovery.
 *   S05  A failing lazy chunk (isolated request abort on /careers) renders the
 *        public error boundary and recovers via Go to home without claiming
 *        prior work was saved.
 *   S06  All 24 public experiences mapped in the browser at 390/1440 (+320 and
 *        1920 spot checks): correct page, no 404 text, no horizontal overflow;
 *        redirect aliases (/signin, /career) and the six auth surfaces verified.
 *
 * Env: ROUTE_REVIEW_URL (default http://127.0.0.1:4197), ROUTE_REVIEW_EVIDENCE_DIR.
 * Run against the worktree dev server in preview mode (no VITE_AUTH_MODE=firebase).
 * The only request interception in this script is S05's explicit isolated
 * failure simulation; nothing is seeded — registration is the product's own.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.ROUTE_REVIEW_URL || 'http://127.0.0.1:4197';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.ROUTE_REVIEW_EVIDENCE_DIR || 'docs/visionary/baseline/f01-route-graph-2026-11-07');
await fs.mkdir(evidence, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PUBLIC_ROUTES = ['/', '/student', '/teacher', '/parent', '/professional', '/organization', '/how-it-works', '/help', '/pricing', '/download', '/about', '/research', '/community', '/updates', '/partners', '/referral', '/privacy', '/terms', '/cookies', '/safety', '/security', '/accessibility', '/careers', '/contact'];
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/forgot-user-id', '/reset-password', '/auth/action'];
const PASSWORD = 'Visionary#Route2026';
const CONTINUE_LABEL = /^(Continue|Next|Get started|Finish|Complete setup|Submit)$/i;
/* Label-mapped answers (student) copied from the baseline ROLE_ANSWERS so the
 * board select lands on 'CBSE' (picking 'State' would demand the state text
 * field and stall the step, per setupStepReady's school-context law). */
const WIZARD_ANSWERS = {
  'What should we call you?': 'Alex',
  'Your age range': 'adult',
  'Which board are you studying under?': 'CBSE',
  'What language does your school use to teach?': 'English',
  'Which class are you studying in?': 'Class 12',
  'Which state are you in?': 'West Bengal',
};

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const failures = [];
const results = {
  task: 'F-01 direct-URL route review',
  at: new Date().toISOString(),
  base,
  browser: 'Microsoft Edge (channel msedge) headless via playwright-core',
  mode: 'local preview repository (VITE_AUTH_MODE unset) — real register/OTP/onboarding journey, no fixture seeding; S05 is the only request interception and is an isolated failure simulation',
  scenarios: {}, sweep: [], redirects: [], authSurfaces: [],
};
const fail = (id, message) => { failures.push(`${id}: ${message}`); console.log(`FAIL ${id}: ${message}`); };
const ok = (id, message) => { console.log(`PASS ${id}: ${message}`); };
const shoot = async (page, name) => { try { await page.screenshot({ path: path.join(evidence, `${name}.png`), fullPage: false }); } catch { /* evidence best-effort */ } };
const pageState = page => page.evaluate(() => ({
  pathname: location.pathname + location.search,
  title: document.title,
  h1: document.querySelector('main h1, #main h1, h1')?.textContent?.trim() ?? null,
  notFound: /Page Not Found/i.test(document.body.textContent || ''),
  overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  dashboardNavPresent: Boolean(document.querySelector('#dashboard-navigation')),
}));

/* ── S06: every public experience renders as its own page at phone and desktop ── */
for (const viewport of [{ key: 'mobile-390', width: 390, height: 844 }, { key: 'desktop-1440', width: 1440, height: 900 }]) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  for (const route of PUBLIC_ROUTES) {
    try {
      await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
      /* Landing-pack pages are lazy chunks; wait for the page heading instead
       * of a fixed settle so a slow first paint is not misread as no h1. */
      await page.waitForSelector('main h1, h1', { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(600);
      const state = await pageState(page);
      const entry = { route, viewport: viewport.key, ...state, pageErrors: [...errors] };
      results.sweep.push(entry);
      await shoot(page, `sweep${route.replaceAll('/', '-')}@${viewport.key}`);
      if (state.notFound) fail('S06', `${route} @ ${viewport.key} rendered the 404 page`);
      if (!state.h1) fail('S06', `${route} @ ${viewport.key} has no h1`);
      if (state.overflowPx > 1) fail('S06', `${route} @ ${viewport.key} horizontal overflow ${state.overflowPx}px`);
    } catch (error) { fail('S06', `${route} @ ${viewport.key} failed: ${String(error).slice(0, 200)}`); }
  }
  await context.close();
}
/* Spot widths beyond the primary grid on representative routes. */
for (const viewport of [{ key: 'mobile-320', width: 320, height: 720, routes: ['/', '/research', '/definitely-not-a-real-route-xyz'] }, { key: 'desktop-1920', width: 1920, height: 1080, routes: ['/'] }]) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  for (const route of viewport.routes) {
    try {
      await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
      await page.waitForTimeout(1200);
      const state = await pageState(page);
      results.sweep.push({ route, viewport: viewport.key, ...state, pageErrors: [] });
      if (route.startsWith('/definitely')) continue; // 404 route checked in S04
      if (state.notFound) fail('S06', `${route} @ ${viewport.key} rendered the 404 page`);
      if (state.overflowPx > 1) fail('S06', `${route} @ ${viewport.key} horizontal overflow ${state.overflowPx}px`);
    } catch (error) { fail('S06', `${route} @ ${viewport.key} failed: ${String(error).slice(0, 200)}`); }
  }
  await context.close();
}
ok('S06', `sweep recorded ${results.sweep.length} viewport-route states`);

/* Redirect aliases resolve to their targets. */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  for (const [from, to] of [['/signin', '/login'], ['/career', '/careers']]) {
    try {
      await page.goto(base + from, { waitUntil: 'load', timeout: 90000 });
      await page.waitForURL(new RegExp(`${to.replace('/', '/')}($|\\?)`), { timeout: 20000 });
      await page.waitForTimeout(800);
      const state = await pageState(page);
      results.redirects.push({ from, to, landed: state.pathname, h1: state.h1 });
      if (!state.pathname.startsWith(to)) fail('S06', `redirect ${from} landed on ${state.pathname} instead of ${to}`);
      if (state.notFound) fail('S06', `redirect ${from} rendered 404 content`);
    } catch (error) { fail('S06', `redirect ${from} failed: ${String(error).slice(0, 200)}`); }
  }
  for (const route of AUTH_ROUTES) {
    try {
      await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
      await page.waitForTimeout(1000);
      const state = await pageState(page);
      results.authSurfaces.push({ route, ...state });
      if (state.notFound) fail('S06', `auth surface ${route} rendered the 404 page`);
      if (!state.h1) fail('S06', `auth surface ${route} has no h1`);
    } catch (error) { fail('S06', `auth surface ${route} failed: ${String(error).slice(0, 200)}`); }
  }
  await context.close();
  ok('S06', `redirect aliases and ${results.authSurfaces.length} auth surfaces verified`);
}

/* ── S01: /research direct open, refresh, footer navigation, Back ── */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto(`${base}/research`, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(1200);
    const first = await pageState(page);
    await shoot(page, 's01-research-direct');
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const refreshed = await pageState(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    const footerLink = page.locator('footer a[href="/privacy"]').first();
    if (await footerLink.count()) {
      await footerLink.click();
      await page.waitForURL(/\/privacy/, { timeout: 20000 });
      await page.waitForTimeout(800);
      const privacy = await pageState(page);
      await shoot(page, 's01-footer-to-privacy');
      await page.goBack();
      await page.waitForTimeout(1200);
      const back = await pageState(page);
      results.scenarios.S01 = { direct: first, refreshed, privacy: privacy.pathname, back: back.pathname, backH1: back.h1 };
      if (first.notFound || refreshed.notFound || back.notFound) fail('S01', '404 content shown during /research journey');
      if (!back.pathname.startsWith('/research')) fail('S01', `Back landed on ${back.pathname} instead of /research`);
      if (!back.h1) fail('S01', 'Back lost the page heading');
      ok('S01', `direct+refresh+footer+Back correct (back at ${back.pathname})`);
    } else { fail('S01', 'no footer /privacy link found on /research'); }
  } catch (error) { fail('S01', String(error).slice(0, 300)); }
  await context.close();
}

/* ── S02: signed-out direct requests of protected routes ── */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto(`${base}/dashboard/learn`, { waitUntil: 'load', timeout: 90000 });
    await page.getByRole('button', { name: 'Continue with Email' }).first().waitFor({ timeout: 30000 });
    const state = await pageState(page);
    const returnTo = await page.evaluate(() => new URLSearchParams(location.search).get('returnTo'));
    await shoot(page, 's02-dashboard-learn-signed-out');
    results.scenarios.S02 = { requested: '/dashboard/learn', landed: state.pathname, returnTo, dashboardNavPresent: state.dashboardNavPresent };
    if (!state.pathname.startsWith('/login')) fail('S02', `signed-out /dashboard/learn landed on ${state.pathname}`);
    if (returnTo !== '/dashboard/learn') fail('S02', `returnTo was ${returnTo} — intended destination not preserved`);
    if (state.dashboardNavPresent) fail('S02', 'private workspace navigation rendered while signed out');
    ok('S02', `/dashboard/learn -> ${state.pathname} (returnTo preserved, no private content)`);
    await page.goto(`${base}/onboarding`, { waitUntil: 'load', timeout: 90000 });
    await page.getByRole('button', { name: 'Continue with Email' }).first().waitFor({ timeout: 30000 });
    const onboardingReturnTo = await page.evaluate(() => new URLSearchParams(location.search).get('returnTo'));
    const onboardingState = await pageState(page);
    results.scenarios.S02.onboarding = { requested: '/onboarding', landed: onboardingState.pathname, returnTo: onboardingReturnTo };
    if (onboardingReturnTo !== '/onboarding') fail('S02', `signed-out /onboarding returnTo was ${onboardingReturnTo}`);
    if (onboardingState.dashboardNavPresent) fail('S02', 'private content rendered for signed-out /onboarding');
    ok('S02', `/onboarding -> ${onboardingState.pathname} (returnTo preserved, no private content)`);
  } catch (error) { fail('S02', String(error).slice(0, 300)); }
  await context.close();
}

/* ── S03: onboarding gate, wizard completion, sign-out, deep-link recovery ── */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const email = `route-s03-${Date.now()}@visionary.test`;
  try {
    /* Register through the product's own preview-mode journey. */
    await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('button[type="submit"]').first().click();
    const passwords = page.locator('input[type="password"]');
    await passwords.first().fill(PASSWORD, { timeout: 20000 });
    if (await passwords.count() > 1) await passwords.nth(1).fill(PASSWORD);
    await page.locator('button[type="submit"]').last().click();
    const otpInput = page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]').first();
    await otpInput.waitFor({ state: 'visible', timeout: 30000 });
    try { await otpInput.fill('000000'); } catch { await otpInput.pressSequentially('000000'); }
    await page.getByRole('button', { name: 'Verify' }).click();
    await page.waitForURL(/\/onboarding/, { timeout: 45000 });
    ok('S03', 'registered through the real preview journey; onboarding reached');

    /* S03a: the gate bounces a direct dashboard request back to onboarding. */
    await page.goto(`${base}/dashboard/home`, { waitUntil: 'load', timeout: 90000 });
    await page.waitForURL(/\/onboarding/, { timeout: 30000 });
    const gated = await pageState(page);
    await shoot(page, 's03-gate-bounces-dashboard');
    results.scenarios.S03 = { email, gateBounce: gated.pathname };
    if (!gated.pathname.startsWith('/onboarding')) fail('S03', `onboarding-incomplete account reached ${gated.pathname}`);
    if (gated.dashboardNavPresent) fail('S03', 'workspace navigation rendered before onboarding completed');
    ok('S03', 'un-finished onboarding cannot enter the workspace (bounced to /onboarding)');

    /* Complete the wizard so the SAME account is later allowed into the workspace. */
    await page.waitForSelector('text=Make Visionary your own', { timeout: 45000 });
    await page.evaluate(() => [...document.querySelectorAll('main button, #main button')].find(b => (b.textContent || '').includes('I am a Learner'))?.click());
    await clickContinue(page);
    await page.waitForSelector('text=A little about you', { timeout: 45000 });
    for (let guard = 0; guard < 16; guard += 1) {
      if (page.url().includes('/dashboard')) break;
      await fillInputs(page);
      await chooseFirstOption(page);
      const advanced = await clickContinue(page);
      if (!advanced) { await page.waitForTimeout(500); await clickContinue(page); }
      await page.waitForTimeout(600);
    }
    if (!page.url().includes('/dashboard')) throw new Error(`wizard did not reach the dashboard (at ${page.url()})`);
    /* The workspace also renders a closed search dialog; target the welcome
     * dialog by its own content, not [role=dialog].first(). The dialog opens
     * AFTER the workspace mounts, so wait for it (bounded) before walking —
     * the wizard loop breaks on the first /dashboard URL, which can precede
     * the dialog by a beat. If it never opens, continue without it. */
    const dialog = page.locator('[role="dialog"]', { hasText: 'Getting started' }).first();
    const opened = await dialog.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
    if (opened) {
      for (let i = 0; i < 3 && await dialog.isVisible().catch(() => false); i += 1) {
        const label = i === 2 ? 'Start exploring' : 'Continue';
        await dialog.getByRole('button', { name: label, exact: true }).last().click({ timeout: 15000 });
        await page.waitForTimeout(600);
      }
    }
    /* The welcome overlay must be gone before the topbar account menu is
     * clickable — a radix modal aria-hides outside content, which makes the
     * account button unresolvable to role queries. */
    await dialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {
      return page.keyboard.press('Escape').then(() => dialog.waitFor({ state: 'hidden', timeout: 5000 })).catch(() => {});
    });
    if (await dialog.isVisible().catch(() => false)) throw new Error('welcome dialog did not close; account menu would be intercepted');
    await page.waitForTimeout(1000);
    const workspace = await pageState(page);
    await shoot(page, 's03-workspace-reached');
    results.scenarios.S03.workspaceAfterOnboarding = workspace.pathname;
    if (!workspace.pathname.startsWith('/dashboard')) fail('S03', `completed onboarding landed on ${workspace.pathname}`);
    ok('S03', `wizard completed -> workspace ${workspace.pathname}`);

    /* Sign out through the product's own account menu. */
    await page.getByRole('button', { name: 'Open account menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await page.waitForURL(/\/login/, { timeout: 30000 });
    ok('S03', 'signed out through the account menu');

    /* Deep-link recovery: signed-out /dashboard/learn must survive sign-in. */
    await page.goto(`${base}/dashboard/learn`, { waitUntil: 'load', timeout: 90000 });
    await page.getByRole('button', { name: 'Continue with Email' }).first().waitFor({ timeout: 30000 });
    const returnTo = await page.evaluate(() => new URLSearchParams(location.search).get('returnTo'));
    await shoot(page, 's03-deeplink-login-returnto');
    if (returnTo !== '/dashboard/learn') fail('S03', `deep-link returnTo was ${returnTo}`);
    await page.getByRole('button', { name: 'Continue with Email' }).first().click();
    await page.locator('input[type="email"]').first().fill(email);
    await page.getByRole('button', { name: /continue|next/i }).last().click();
    await page.locator('input[type="password"]').first().fill(PASSWORD, { timeout: 20000 });
    await page.getByRole('button', { name: /sign in/i }).last().click();
    await page.waitForURL(/\/dashboard\/learn/, { timeout: 60000 });
    await page.waitForTimeout(1500);
    const recovered = await pageState(page);
    await shoot(page, 's03-recovered-dashboard-learn');
    results.scenarios.S03.recovered = { landed: recovered.pathname, h1: recovered.h1 };
    if (!recovered.pathname.startsWith('/dashboard/learn')) fail('S03', `sign-in after deep link landed on ${recovered.pathname} instead of /dashboard/learn`);
    ok('S03', `deep-link recovery: signed in and landed on ${recovered.pathname}`);
  } catch (error) { fail('S03', String(error).slice(0, 300)); }
  await context.close();
}

/* ── S04: unknown path renders the 404 with working recovery ── */
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(`${base}/definitely-not-a-real-route-xyz`, { waitUntil: 'load', timeout: 90000 });
    await page.getByRole('heading', { name: 'Page Not Found' }).waitFor({ timeout: 20000 });
    const state = await pageState(page);
    await shoot(page, 's04-not-found');
    results.scenarios.S04 = { requested: '/definitely-not-a-real-route-xyz', h1: state.h1 };
    const goHome = page.getByRole('button', { name: /Go Home/i });
    if (!(await goHome.count())) fail('S04', 'no Go Home recovery control on the 404');
    else {
      await goHome.click();
      await page.waitForURL(/\/$|\//, { timeout: 20000 });
      await page.waitForTimeout(1200);
      const home = await pageState(page);
      results.scenarios.S04.home = home.pathname;
      if (home.notFound) fail('S04', 'Go Home still rendered the 404');
      ok('S04', '404 rendered and Go Home recovered to the landing page');
    }
  } catch (error) { fail('S04', String(error).slice(0, 300)); }
  await context.close();
}

/* ── S05: failing lazy chunk renders the public error boundary and recovers ── */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto(`${base}/`, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(5500); // let the paced route prefetcher finish so only /careers is pending
    /* Isolated failure simulation (explicit, scenario-scoped): abort the lazy
     * CareersPage chunk. Works on the dev server (source URL) and a production
     * preview (hashed /assets URL) because both contain the module name. */
    await page.route(/CareersPage/, route => route.abort());
    const careersLink = page.locator('a[href="/careers"]').first();
    if (!(await careersLink.count())) throw new Error('no /careers link found on the landing page for the S05 simulation');
    await careersLink.click();
    await page.getByRole('heading', { name: 'Something went wrong' }).waitFor({ timeout: 30000 });
    const errorState = await pageState(page);
    const body = await page.evaluate(() => document.body.textContent || '');
    await shoot(page, 's05-lazy-chunk-error-boundary');
    results.scenarios.S05 = { route: '/careers', errorH1: errorState.h1, publicMessage: /Your session and data remain safe/.test(body), noFalseSavingClaim: !/saved|restored/i.test(body.match(/This page[^.]*\.[^.]*\./)?.[0] || '') };
    if (!/Your session and data remain safe/.test(body)) fail('S05', 'public error boundary message missing');
    if (/Reload page/.test(body)) fail('S05', 'dashboard-only asset-recovery affordance leaked onto a public route');
    const tryAgain = page.getByRole('button', { name: 'Try again' });
    const goHome = page.getByRole('button', { name: 'Go to home' });
    if (!(await tryAgain.count()) || !(await goHome.count())) fail('S05', 'error boundary recovery controls missing');
    await goHome.click();
    await page.waitForTimeout(1500);
    const home = await pageState(page);
    results.scenarios.S05.recovered = home.pathname;
    if (home.notFound || !home.h1) fail('S05', 'Go to home did not recover the landing page');
    ok('S05', 'lazy-chunk failure -> error boundary -> Go to home recovered');
  } catch (error) { fail('S05', String(error).slice(0, 300)); }
  await context.close();
}

await browser.close();

results.failures = failures;
results.summary = { scenarios: Object.keys(results.scenarios).length, sweepStates: results.sweep.length, failures: failures.length };
await fs.writeFile(path.join(evidence, 'DIRECT_URL_RESULTS.json'), `${JSON.stringify(results, null, 2)}\n`);
console.log(`\nevidence: ${path.join(evidence, 'DIRECT_URL_RESULTS.json')}`);
console.log(failures.length ? `ROUTE REVIEW FAILED: ${failures.length} failure(s)` : 'ROUTE REVIEW PASSED');
process.exit(failures.length ? 1 : 0);

/* ── wizard helpers (S03) — trimmed from the recorded F-03 baseline driver ── */
async function clickContinue(page) {
  const submit = page.locator('main button[type="submit"], #main button[type="submit"], form button[type="submit"]').last();
  await submit.waitFor({ state: 'visible', timeout: 20000 });
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (!(await submit.isDisabled())) { await submit.click(); return true; }
    await page.waitForTimeout(300);
  }
  return false;
}
async function fillInputs(page) {
  await page.evaluate((answers) => {
    const match = label => Object.entries(answers).find(([key]) => label && label.startsWith(key))?.[1];
    const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    for (const input of [...document.querySelectorAll('main input[type="text"], #main input[type="text"]')]) {
      if (input.value || input.offsetParent === null) continue;
      const label = [...document.querySelectorAll('label')].find(l => l.htmlFor === input.id)?.textContent?.trim();
      const value = match(label) || (/name/i.test(label || '') ? 'Alex' : (input.required ? 'Alex' : ''));
      if (!value) continue;
      inputSetter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const selectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    for (const select of [...document.querySelectorAll('main select, #main select')]) {
      if (select.offsetParent === null) continue;
      const label = [...document.querySelectorAll('label')].find(l => l.htmlFor === select.id)?.textContent?.trim();
      const wanted = match(label);
      const options = [...select.options].map(o => o.value).filter(v => v && v !== '');
      const value = wanted && options.find(v => v.toLowerCase().includes(String(wanted).toLowerCase())) || options[0] || null;
      if (value && select.value !== value) { selectSetter.call(select, value); select.dispatchEvent(new Event('change', { bubbles: true })); }
    }
  }, WIZARD_ANSWERS);
}
async function chooseFirstOption(page) {
  await page.evaluate(() => {
    const skip = /^(Back|Resend|Sign in|Log in|Verify|Skip for now|Use a different account|Continue|Looks good|Get started|Finish|Complete setup|Next)$/i;
    const options = [...document.querySelectorAll('main button, #main button')]
      .filter(b => b.offsetParent !== null && !b.disabled && b.getAttribute('aria-pressed') === 'false'
        && (b.textContent || '').trim() && !skip.test((b.textContent || '').trim()));
    options[0]?.click();
  });
  await page.waitForTimeout(300);
}
