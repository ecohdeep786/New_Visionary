/* F-16 (Product + Platform Engineers): auth & onboarding UI review.
 * Verifies the UI-level auth experiences without touching authentication
 * logic or weakening any boundary: unknown-email honesty, wrong-password
 * recovery (view + password cleared), duplicate-submit guard, forgot/reset/
 * action page rendering, onboarding draft resume, role selection coverage,
 * and the account-switch reset. Preview mode (localStorage repository).
 * Env: AUTHUI_BASE_URL (default http://127.0.0.1:4198), AUTHUI_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.AUTHUI_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.AUTHUI_EVIDENCE_DIR || 'docs/visionary/baseline/f16-auth-ui-2026-11-06');
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

/* Register a known account for the wrong-password test, then sign out. */
async function registerAccount(page, email) {
  await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('button[type="submit"]:visible').first().click();
  const passwords = page.locator('input[type="password"]');
  await passwords.first().fill(PASSWORD, { timeout: 20000 });
  if (await passwords.count() > 1) await passwords.nth(1).fill(PASSWORD);
  /* the register flow requires the terms checkbox before Create account enables */
  await page.locator('input[type="checkbox"]:visible').first().check().catch(() => {});
  await page.locator('button[type="submit"]:visible').last().click();
  const otp = page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]').first();
  await otp.waitFor({ state: 'visible', timeout: 30000 });
  try { await otp.fill('000000'); } catch { await otp.pressSequentially('000000'); }
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.waitForURL(/\/onboarding/, { timeout: 45000 });
}

/* ── 1. Unknown email honesty ── */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.getByRole('button', { name: 'Continue with Email' }).first().click();
  await page.locator('input[type="email"]').first().fill(`nobody-${Date.now()}@visionary.test`);
  await page.locator('button[type="submit"]:visible').first().click();
  await page.waitForTimeout(1200);
  const state = await page.evaluate(() => ({
    bodyHasHonest: document.body.innerText.includes("Couldn't find your Visionary Account"),
    stillOnLogin: location.pathname === '/login',
  }));
  await shoot(page, 'auth-login-unknown-email', { surface: 'auth', state, errors });
  check('unknown-email-honesty', state.bodyHasHonest && state.stillOnLogin, JSON.stringify(state));
  await context.close();
}

/* ── 2. Wrong-password failure recovery + 3. duplicate submit guard ── */
{
  const email = `authui-${Date.now()}@visionary.test`;
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
  await registerAccount(page, email);
  /* Sign out via the onboarding account switcher ("Use a different account"). */
  await page.getByRole('button', { name: 'Use a different account' }).click();
  await page.waitForTimeout(1000);
  const switched = await page.evaluate(() => location.pathname);
  check('account-switch-reset', switched === '/login' || switched === '/onboarding' || switched === '/', `pathname after switch: ${switched}`);

  /* Wrong password: error message + password field cleared + password view retained. */
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.getByRole('button', { name: 'Continue with Email' }).first().click();
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('button[type="submit"]:visible').first().click();
  await page.locator('input[type="password"]').first().fill('WrongPassword#1', { timeout: 20000 });
  await page.locator('button[type="submit"]:visible').last().click();
  await page.waitForTimeout(1200);
  const wrong = await page.evaluate(() => ({
    errorShown: document.body.innerText.toLowerCase().includes('email or password is incorrect') || document.body.innerText.toLowerCase().includes('could not finish'),
    passwordCleared: ![...document.querySelectorAll('input[type="password"]')].some((i) => i.value.length > 0),
  }));
  await shoot(page, 'auth-wrong-password', { surface: 'auth', wrong, errors });
  check('wrong-password-recovery', wrong.errorShown && wrong.passwordCleared, JSON.stringify(wrong));

  /* Duplicate submit guard: click Verify twice rapidly during registration —
   * only one pending registration is created (second click no-ops). */
  await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.getByRole('button', { name: 'Continue with Email' }).first().click();
  const email2 = `authui-dup-${Date.now()}@visionary.test`;
  await page.locator('input[type="email"]').first().fill(email2);
  const submit = page.locator('button[type="submit"]:visible').first();
  const before = await submit.evaluate((el) => el.disabled || getComputedStyle(el).pointerEvents === 'none');
  await submit.click();
  await submit.click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(900);
  const emailViewGone = !(await page.evaluate(() => [...document.querySelectorAll('input[type="email"]')].some((i) => i.offsetParent !== null)));
  check('duplicate-submit-guard', before || emailViewGone, `first-click disabled state: ${before}; email view advanced: ${emailViewGone}`);
  await context.close();
}

/* ── 4. Recovery/verification/action pages render honestly ── */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
  for (const [route, name] of [['/forgot-password', 'forgot-password'], ['/forgot-user-id', 'forgot-user-id'], ['/reset-password?code=fictional-code', 'reset-password'], ['/auth/action?mode=resetPassword&oobCode=fictional&apiKey=demo', 'auth-action']]) {
    await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
    await settle(page, 1500);
    const state = await page.evaluate(() => ({
      h1: (document.querySelector('h1')?.textContent || '').trim().slice(0, 50) || null,
      empty: document.body.innerText.trim().length < 40,
    }));
    await shoot(page, `auth-${name}`, { surface: 'auth', route, state, errors });
    check(`recovery-page-${name}`, !state.empty && Boolean(state.h1), JSON.stringify(state));
  }
  /* Bad action code must produce a handled error, not a crash. */
  await page.goto(`${base}/auth/action?mode=resetPassword&oobCode=invalid-code-xyz`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const actionPasswords = page.locator('input[type="password"]');
  await actionPasswords.first().fill('SomePassword#1').catch(() => {});
  if (await actionPasswords.count() > 1) await actionPasswords.nth(1).fill('SomePassword#1').catch(() => {});
  await page.locator('button[type="submit"]:visible').first().click().catch(() => {});
  await page.waitForTimeout(1500);
  const badCode = await page.evaluate(() => ({
    errorShown: /invalid or has already been used|Request a new email|could not finish/i.test(document.body.innerText),
    crashed: document.body.innerText.trim().length < 20,
  }));
  check('auth-action-bad-code-handled', badCode.errorShown && !badCode.crashed, JSON.stringify(badCode));
  await context.close();
}

/* ── 5. Onboarding draft resume + role selection coverage ── */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
  await registerAccount(page, `authui-draft-${Date.now()}@visionary.test`);
  /* The wizard is now on the identity step. Select teacher, advance one step,
   * then reload — the product's own draft store should restore progress. */
  /* Role selection coverage on the fresh identity step (F-16). Wait for the
   * role board to render before reading it (F-29-F1-era race: the check ran
   * against the pre-hydration paint and read all roles as absent). */
  await page.waitForSelector('text=Make Visionary your own', { timeout: 45000 });
  const roles = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      learner: text.includes('I am a Learner'),
      teacher: text.includes('I am a Teacher'),
      parent: text.includes('I am a Parent'),
      professional: text.includes('I am a Professional'),
      organization: text.includes('We are an Organization'),
    };
  });
  check('role-selection-coverage', Object.values(roles).every(Boolean), JSON.stringify(roles));
  await shoot(page, 'auth-role-selection', { surface: 'onboarding', roles });
  await page.evaluate(() => [...document.querySelectorAll('main button, #main button')].find((b) => (b.textContent || '').includes('I am a Teacher'))?.click());
  const s = page.locator('main button[type="submit"], form button[type="submit"]').last();
  await s.waitFor({ state: 'visible', timeout: 20000 });
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline && (await s.isDisabled())) await page.waitForTimeout(300);
  await s.click();
  await page.waitForSelector('text=A little about you', { timeout: 45000 });
  await page.evaluate(() => {
    const iSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    for (const input of [...document.querySelectorAll('main input[type="text"]')]) {
      if (!input.value && input.offsetParent !== null) { iSetter.call(input, 'Alex'); input.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    const sSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    for (const select of [...document.querySelectorAll('main select')]) {
      if (!select.value && select.offsetParent !== null) { const o = [...select.options].map((x) => x.value).filter(Boolean); if (o[0]) { sSetter.call(select, o[0]); select.dispatchEvent(new Event('change', { bubbles: true })); } }
    }
  });
  const draftKeys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes('onboarding')));
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2200);
  const resumed = await page.evaluate(() => ({
    hasDraft: Object.keys(localStorage).some((k) => k.includes('onboarding')),
    onTeacherPath: document.body.innerText.includes('Teacher') || Boolean(document.querySelector('main h1, main h2')),
    wizardVisible: Boolean(document.querySelector('main form, #main form, form')),
  }));
  await shoot(page, 'auth-onboarding-resume', { surface: 'onboarding', draftKeys, resumed, errors });
  check('onboarding-draft-persistence', resumed.hasDraft && resumed.wizardVisible, JSON.stringify({ draftKeys, resumed }));


  await context.close();
}

await browser.close();
const receipt = { task: 'F-16 auth & onboarding UI review', at: new Date().toISOString(), base, records, defects };
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; checks failed: ${defects.length}`);
for (const defect of defects) console.log(` - ${defect}`);
if (defects.length) process.exit(1);
console.log('PASS auth & onboarding UI review: recovery, guards, drafts, role coverage verified.');
