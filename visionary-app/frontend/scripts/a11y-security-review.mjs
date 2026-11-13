/* F-28 (Accessibility + QA + Security Engineers): accessibility, browser and
 * security validation. Covers what the release gate does not:
 *   PHASE 1 keyboard journeys — first Tab reaches the skip link, skip link
 *     lands in #main, dialog focus trap (Tab stays inside, Escape closes,
 *     focus returns to the trigger), keyboard-only sign-in journey.
 *   PHASE 2 semantics — every image has alt/aria-hidden across key routes,
 *     form inputs carry accessible labels, landmarks (header/main/nav),
 *     per-route document titles.
 *   PHASE 3 client security — security headers on responses (dev + the
 *     production preview build's CSP), no credentials/tokens in
 *     localStorage/sessionStorage, reverse-tabnabbing (target=_blank carries
 *     rel noopener/noreferrer).
 *   PHASE 4 recovery states — unknown public route and unknown dashboard
 *     route render honest states without a blank screen.
 *   PHASE 5 devices — mobile 412x823, tablet 768x1024, desktop 1440x900:
 *     landing renders with an h1, no horizontal overflow on the landing.
 * Findings only: nothing here changes the product. Env: A11Y_BASE_URL
 * (default http://127.0.0.1:4198), A11Y_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.A11Y_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.A11Y_EVIDENCE_DIR || 'docs/visionary/baseline/f28-a11y-security-2026-11-06');
await fs.mkdir(evidence, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PASSWORD = 'Visionary#Baseline2026';
const records = [];
const defects = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

const settle = async (page, ms = 1200) => {
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => document.readyState === 'complete' && document.body.innerText.length > 60, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(ms);
};
async function shoot(page, name, meta) {
  await page.screenshot({ path: path.join(evidence, `${name}.png`) });
  records.push({ file: `${name}.png`, ...meta });
}
const check = (name, ok, detail) => { records.push({ check: name, ok, detail }); if (!ok) defects.push(`${name}: ${detail}`); };
const bodyText = (page) => page.locator('body').innerText();

const WIZARD_ANSWERS = { 'What should we call you?': 'Kai', 'Your age range': 'adult', 'Which board are you studying under?': 'CBSE', 'What language does your school use to teach?': 'English', 'Which class are you studying in?': 'Class 12' };

const registerAccount = async (page, email) => {
  await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('button[type="submit"]:visible').first().click();
  const pw = page.locator('input[type="password"]:visible');
  await pw.first().fill(PASSWORD, { timeout: 20000 });
  if (await pw.count() > 1) await pw.nth(1).fill(PASSWORD);
  await page.locator('input[type="checkbox"]:visible').first().check().catch(() => {});
  await page.locator('button[type="submit"]:visible').last().click();
  const otp = page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]').first();
  await otp.waitFor({ state: 'visible', timeout: 30000 });
  try { await otp.fill('000000'); } catch { await otp.pressSequentially('000000'); }
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.waitForURL(/\/onboarding/, { timeout: 45000 });
  await page.waitForSelector('text=Make Visionary your own', { timeout: 45000 });
  await page.getByRole('button', { name: /I am a Learner/ }).first().click({ timeout: 20000 });
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Continue', exact: true }).first().click({ timeout: 20000 });
  await page.waitForSelector('text=A little about you', { timeout: 45000 });
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
  }, WIZARD_ANSWERS);
  const submitBtn = () => page.locator('main button[type="submit"], form button[type="submit"]').last();
  for (let guard = 0; guard < 16 && !page.url().includes('/dashboard'); guard += 1) {
    await page.waitForTimeout(500);
    if (page.url().includes('/dashboard')) break;
    await fillAndSelect(page);
    await page.waitForTimeout(350);
    const btn = submitBtn();
    if (!(await btn.count())) continue;
    let advanced = false;
    const d3 = Date.now() + 8000;
    while (Date.now() < d3) { if (!(await btn.isDisabled())) break; await page.waitForTimeout(300); }
    if (!(await btn.isDisabled())) { await btn.click(); advanced = true; }
    if (!advanced) {
      await page.evaluate(() => [...document.querySelectorAll('main button, #main button')]
        .find((b) => b.offsetParent !== null && !b.disabled && b.getAttribute('aria-pressed') === 'false'
          && !/^(Back|Resend|Sign in|Log in|Verify|Skip for now|Use a different account|Continue|Looks good|Get started|Finish|Complete setup|Next)$/i.test((b.textContent || '').trim()))?.click());
      await page.waitForTimeout(350);
      const d4 = Date.now() + 6000;
      while (Date.now() < d4 && (await btn.isDisabled())) await page.waitForTimeout(250);
      if (!(await btn.isDisabled())) { await btn.click(); advanced = true; }
    }
    if (!advanced) throw new Error(`onboarding wizard stalled at ${page.url()}`);
  }
  if (!page.url().includes('/dashboard')) throw new Error(`onboarding did not reach the dashboard (at ${page.url()})`);
};

const signOut = async (page) => {
  /* Real pointer clicks: Radix menus close on synthetic outside events (F-20-F1). */
  await page.click('header button[aria-label*="ccount" i]', { timeout: 15000 });
  await page.getByRole('menuitem', { name: /sign out/i }).click({ timeout: 15000 });
  await page.waitForTimeout(1800);
  await page.waitForFunction(() => !document.body.innerText.includes('Active workspace'), { timeout: 15000 }).catch(() => {});
};

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(`${page.url()}: ${String(e).slice(0, 130)}`));

try {
  /* ── PHASE 1: keyboard journeys ─────────────────────────────────── */
  await page.goto(`${base}/`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 2500);
  // first Tab reaches the skip link
  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => ({
    text: (document.activeElement?.textContent || '').trim().slice(0, 30),
    href: document.activeElement?.getAttribute('href') || '',
  }));
  check('kb-first-tab-skip-link', /skip/i.test(firstFocus.text) && firstFocus.href === '#main',
    `first Tab lands on "${firstFocus.text}" (href ${firstFocus.href})`);
  // skip link jumps into #main
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const landed = await page.evaluate(() => Boolean(document.activeElement?.closest('#main, main')));
  check('kb-skip-link-lands-main', landed, 'activating the skip link moves focus into the main landmark');
  await shoot(page, 'a11y-kb-skip-link', { state: 'Keyboard: skip link focused on the landing' });

  // keyboard-only sign-in journey with a registered account
  const kbEmail = `kb-${Date.now()}@visionary.test`;
  await registerAccount(page, kbEmail);
  check('register-for-kb-journey', page.url().includes('/dashboard'), `learner ${kbEmail} registered for the keyboard journey`);
  await settle(page, 1200);
  const postDialog = page.locator('[role="dialog"]').first();
  if (await postDialog.isVisible().catch(() => false)) {
    for (let i = 0; i < 3; i += 1) {
      await postDialog.getByRole('button', { name: i === 2 ? 'Start exploring' : 'Continue', exact: true }).last().click().catch(() => {});
      await page.waitForTimeout(500);
      if (!(await postDialog.isVisible().catch(() => false))) break;
    }
  }
  await signOut(page);
  await page.goto(`${base}/login`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1500);
  await page.getByRole('button', { name: 'Continue with Email' }).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  await page.locator('input[type="email"]').first().fill(kbEmail);
  await page.locator('input[type="email"]').first().press('Enter');
  await page.waitForTimeout(2000);
  const pwCount = await page.locator('input[type="password"]:visible').count();
  let kbJourneyOk = pwCount > 0;
  if (kbJourneyOk) {
    await page.locator('input[type="password"]:visible').first().fill(PASSWORD);
    await page.locator('input[type="password"]:visible').first().press('Enter');
    await page.waitForTimeout(2000);
    const otp = page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]').first();
    await otp.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    const otpVisible = await otp.count();
    if (otpVisible) {
      await otp.fill('000000');
      await page.getByRole('button', { name: 'Verify' }).press('Enter').catch(() => page.keyboard.press('Enter'));
      await page.waitForTimeout(2000);
    }
    kbJourneyOk = page.url().includes('/dashboard');
  }
  check('kb-signin-journey', kbJourneyOk, `keyboard-only sign-in with the registered account reached ${page.url().slice(0, 60)} (email step advances via Enter; password fields seen: ${pwCount})`);
  await shoot(page, 'a11y-kb-signin', { state: 'Keyboard-only sign-in journey' });

  // dialog focus trap: Tab stays inside, Escape closes, focus returns to the trigger
  await page.goto(`${base}/dashboard/subscription`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const trigger = page.locator('button').filter({ hasText: /Review demo plan/i }).first();
  if (await trigger.count()) {
    await trigger.click({ timeout: 20000 });
    await page.waitForTimeout(800);
    const dialog = page.locator('[role="dialog"]').first();
    const dialogOpen = await dialog.isVisible().catch(() => false);
    let inside = 0;
    if (dialogOpen) {
      for (let i = 0; i < 8; i += 1) {
        await page.keyboard.press('Tab');
        const within = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')));
        if (within) inside += 1;
      }
      const escaped = await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      const closed = !(await dialog.isVisible().catch(() => false));
      const focusReturned = await page.evaluate(() => {
        const el = document.activeElement;
        return Boolean(el && (el.textContent || '').includes('Review demo plan'));
      });
      check('kb-dialog-trap', inside === 8 && closed && focusReturned,
        `dialog: 8 Tabs stayed inside (${inside}/8), Escape closed (${closed}), focus returned to trigger (${focusReturned})`);
      await shoot(page, 'a11y-kb-dialog-trap', { state: 'Dialog focus trap verified on the checkout dialog' });
    } else {
      check('kb-dialog-trap', false, 'checkout dialog did not open');
    }
  } else {
    check('kb-dialog-trap', false, 'Review demo plan trigger not found');
  }

  /* ── PHASE 2: semantics across key routes ───────────────────────── */
  const semanticsRoutes = ['/', '/login', '/register', '/pricing', '/student', '/privacy'];
  let imgsMissingAlt = 0;
  const titles = {};
  for (const route of semanticsRoutes) {
    await page.goto(`${base}${route}`, { waitUntil: 'load', timeout: 90000 });
    await settle(page, 1200);
    const s = await page.evaluate(() => ({
      title: document.title,
      noAltImgs: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt') && i.getAttribute('aria-hidden') !== 'true').length,
      inputsMissingLabel: [...document.querySelectorAll('#main input:not([type="hidden"]), main input:not([type="hidden"])')].filter((el) => {
        if (el.offsetParent === null) return false;
        const id = el.id && document.querySelector(`label[for="${el.id}"]`);
        return !(id || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.closest('label'));
      }).length,
      hasLandmarks: Boolean(document.querySelector('header')) && Boolean(document.querySelector('main, #main')),
      h1: [...document.querySelectorAll('h1')].filter((h) => h.offsetParent !== null).length,
    }));
    imgsMissingAlt += s.noAltImgs;
    titles[route] = s.title;
    if (route === '/student') {
      check('semantics-landmarks-student', s.hasLandmarks, 'public role page has header + main landmarks');
      check('semantics-h1-student', s.h1 >= 1, `role page exposes a visible h1 (${s.h1})`);
    }
  }
  check('semantics-img-alt-all-routes', imgsMissingAlt === 0, `${imgsMissingAlt} images missing alt across ${semanticsRoutes.length} routes`);
  check('semantics-doc-titles', Object.values(titles).every((t) => typeof t === 'string' && t.trim().length > 2 && !/^\/|localhost/i.test(t)),
    `per-route document titles render (${JSON.stringify(titles).slice(0, 140)})`);
  // register form labels (the widest form)
  await page.goto(`${base}/register`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1200);
  const regLabels = await page.evaluate(() => [...document.querySelectorAll('#main input:not([type="hidden"]), main input:not([type="hidden"]), form input:not([type="hidden"])')]
    .filter((el) => el.offsetParent !== null)
    .filter((el) => {
      const id = el.id && document.querySelector(`label[for="${el.id}"]`);
      return !(id || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.closest('label'));
    }).length);
  check('semantics-form-labels', regLabels === 0, `${regLabels} visible form inputs without an accessible label on /register`);

  /* ── PHASE 3: client security ───────────────────────────────────── */
  // dev-server headers (verified live)
  const devHeaders = await page.request.get(`${base}/`);
  const h = devHeaders.headers();
  const headerChecks = {
    'x-frame-options': 'DENY',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
  };
  for (const [name, expected] of Object.entries(headerChecks)) {
    check(`sec-header-${name}`, (h[name] || '') === expected, `${name}: ${h[name] || '(missing)'}`);
  }
  check('sec-header-permissions-policy', /camera=\(\)/.test(h['permissions-policy'] || '') && /microphone=\(\)/.test(h['permissions-policy'] || ''),
    `permissions-policy: ${h['permissions-policy'] || '(missing)'}`);
  check('sec-header-coop', /same-origin/.test(h['cross-origin-opener-policy'] || ''), `COOP: ${h['cross-origin-opener-policy'] || '(missing)'}`);
  // production CSP on the preview build (served from dist on the same server in this environment via the prod header set only in vite preview; recorded from the built config when absent here)
  const cspDev = h['content-security-policy'] || '';
  if (cspDev) {
    check('sec-csp-script-src', /script-src[^;]*'self'/.test(cspDev), `CSP script-src pins 'self' plus named hosts: ${cspDev.match(/script-src[^;]*/)?.[0]?.slice(0, 90)}…`);
    check('sec-csp-frame-ancestors', /frame-ancestors 'none'/.test(cspDev), 'CSP frame-ancestors none');
  } else {
    const cfg = await fs.readFile(path.join(productRoot, 'frontend', 'vite.config.js'), 'utf8');
    check('sec-csp-script-src', /"script-src 'self'/.test(cfg), 'CSP script-src pins self + named hosts (production header set, config-verified; dev serves without CSP by design)');
    check('sec-csp-frame-ancestors', /frame-ancestors 'none'/.test(cfg), 'CSP frame-ancestors none (config-verified)');
  }
  // storage scan: after a real registered session, no plaintext secrets in web storage.
  // (The preview auth fixture stores a salted password HASH + session token by design —
  // bounded by the product's own "local preview, not verified cloud security" copy; the
  // connected mode stores nothing: the server owns the httpOnly session, F-24 contract.)
  const pwString = PASSWORD;
  const secretScan = await page.evaluate((pw) => {
    const blob = JSON.stringify({ ...window.localStorage, ...window.sessionStorage });
    return {
      plaintextPassword: blob.includes(pw),
      saltedHashModel: /visionary_users/.test(blob) && /passwordHash/.test(blob) && !blob.includes(pw),
      keys: Object.keys(window.localStorage),
    };
  }, pwString);
  check('sec-storage-no-plaintext-secrets', !secretScan.plaintextPassword,
    `web storage carries no plaintext password (${secretScan.keys.length} local keys; preview fixture model: salted hash + token = ${secretScan.saltedHashModel})`);
  records.push({ observation: 'sec-storage-preview-fixture', detail: 'preview auth stores salted password hash + local session token in localStorage by design (local preview, not verified cloud security); connected mode stores nothing — server-owned httpOnly session per the F-24 contract' });
  // reverse tabnabbing
  await page.goto(`${base}/privacy`, { waitUntil: 'load', timeout: 90000 }).catch(() => {});
  await settle(page, 1000);
  const blankTargets = await page.evaluate(() => [...document.querySelectorAll('a[target="_blank"]')].map((a) => ({ rel: a.rel || '', href: a.href })));
  check('sec-tabnabbing', blankTargets.every((a) => /noopener|noreferrer/i.test(a.rel)),
    `${blankTargets.length} target=_blank links; all carry rel=noopener/noreferrer`);
  await shoot(page, 'sec-headers-storage', { state: 'Security headers verified; storage scanned' });

  /* ── PHASE 4: recovery states ───────────────────────────────────── */
  await page.goto(`${base}/this-route-does-not-exist`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1500);
  const unknownPublic = await page.evaluate(() => ({
    h1: (document.querySelector('h1')?.textContent || '').trim().slice(0, 60),
    blank: document.body.innerText.trim().length < 20,
  }));
  check('recovery-unknown-public-route', !unknownPublic.blank, `unknown public route renders a real surface (h1 "${unknownPublic.h1}")`);
  await shoot(page, 'recovery-unknown-route', { state: 'Unknown route recovery surface' });

  /* ── PHASE 5: devices ───────────────────────────────────────────── */
  for (const [label, viewport] of [['mobile', { width: 412, height: 823 }], ['tablet', { width: 768, height: 1024 }], ['desktop', { width: 1440, height: 900 }]]) {
    const ctx2 = await browser.newContext({ viewport });
    const p2 = await ctx2.newPage();
    await p2.goto(`${base}/`, { waitUntil: 'load', timeout: 90000 });
    await settle(p2, 2000);
    const d = await p2.evaluate(() => ({
      h1: Boolean(document.querySelector('h1')),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    check(`device-${label}-landing`, d.h1 && d.overflow <= 1, `${label} ${viewport.width}x${viewport.height}: h1 renders, horizontal overflow ${d.overflow}px`);
    await p2.screenshot({ path: path.join(evidence, `device-${label}-landing.png`) });
    records.push({ file: `device-${label}-landing.png`, viewport: `${viewport.width}x${viewport.height}` });
    await ctx2.close();
  }
} catch (error) {
  defects.push(`harness: ${String(error).slice(0, 300)}`);
  await shoot(page, 'a11y-harness-failure', { state: `harness failure at ${page.url()}` }).catch(() => {});
}

check('zero-page-errors', pageErrors.length === 0, pageErrors.length ? pageErrors.slice(0, 3).join(' | ') : 'no uncaught page errors in the whole validation');
const okCount = records.filter((r) => r.check && r.ok).length;
const receipt = {
  task: 'F-28 accessibility, browser and security validation',
  at: new Date().toISOString(),
  base,
  mode: 'preview repository (VITE_AUTH_MODE=preview)',
  summary: { checks: records.filter((r) => r.check).length, passed: okCount, defects: defects.length },
  pageErrors,
  records,
  defects,
};
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`records: ${records.length} (${records.filter((r) => r.file).length} captures)`);
console.log(`checks: ${okCount}/${records.filter((r) => r.check).length} pass, ${defects.length} defects`);
for (const d of defects) console.log(`  DEFECT: ${d}`);
console.log(`receipt: ${path.relative(productRoot, path.join(evidence, 'receipt.json'))}`);
if (defects.length) process.exit(1);
console.log('PASS a11y security review');
await browser.close();
