/* FHE-21: local production-build integration test factory — the core
 * connected journeys (V6 §8 E01 + persistence + denial) verified end-to-end
 * on the PRODUCTION bundle against the real fenced realm (backend 3002,
 * Firebase Auth emulator), with server-owned state read back through the
 * app's own API after every mutation. No fictional backend outcomes, no
 * preview surfaces, no local-store shortcuts.
 *
 * Journeys:
 *   J1 (E01) register → email verify (emulator OOB) → onboard → account home,
 *            server state asserted via /api/auth/me.
 *   J2       profile display-name persistence across a full reload.
 *   J3       sign-out → sign-in continuity (server state preserved).
 *   J4       permission denial: unauthenticated /api/auth/me → 401.
 *
 * Env: FACTORY_URL (default http://localhost:4200 — the CSRF origin pin),
 * FACTORY_EMULATOR (default http://127.0.0.1:9098), FACTORY_PROJECT
 * (default demo-visionary-kan42), FACTORY_LANG (onboarding learning
 * language, default English), FACTORY_EVIDENCE_DIR.
 * Secret-safe: the account password is generated per run and never written
 * to the receipt or the log. Synthetic accounts accumulate in the realm by
 * design; the cleanup command is recorded in the receipt. */
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.FACTORY_URL || 'http://localhost:4200';
const emulator = process.env.FACTORY_EMULATOR || 'http://127.0.0.1:9098';
const projectId = process.env.FACTORY_PROJECT || 'demo-visionary-kan42';
const lang = process.env.FACTORY_LANG || 'English';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = path.resolve(productRoot, process.env.FACTORY_EVIDENCE_DIR || 'docs/visionary/baseline/realm-integration-2026-11-18');
await mkdir(evidenceDir, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const buildSha = execSync('git rev-parse HEAD', { cwd: productRoot }).toString().trim();

const stamp = new Date().toISOString();
/* The Auth emulator lowercases addresses; keep the synthetic identity
 * lowercase so the OOB lookup matches what the emulator records. */
const email = `fhe21-${stamp.replace(/[:.]/g, '-').toLowerCase()}@example.test`;
const password = 'Realm#Fhe21-' + Math.random().toString(36).slice(2, 12);
const displayName = 'FHE21 Factory Account';
const renamed = 'FHE21 Renamed ' + stamp.slice(11, 19);

const receipt = { at: stamp, base, emulator, projectId, buildSha, lang, journeys: [], account: { email, password: '(generated per run; not recorded)' }, cleanup: 'Synthetic realm identities accumulate by design. Auth emulator: DELETE http://127.0.0.1:9098/emulator/v1/projects/' + projectId + '/accounts (wipes all emulator identities). Backend rows for synthetic accounts live in the disposable realm datastore only.' };
let failures = 0;
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error).slice(0, 160)));

async function journey(id, title, run) {
  const steps = [];
  const record = { id, title, steps, verdict: 'pass' };
  receipt.journeys.push(record);
  try {
    await run(async (name, detail) => {
      const at = new Date().toISOString();
      const value = typeof detail === 'function' ? await detail() : detail;
      steps.push({ name, at, ok: true, detail: value });
      console.log(`  ✓ ${name}${value ? ' — ' + value : ''}`);
    });
  } catch (failure) {
    record.verdict = 'fail';
    failures += 1;
    steps.push({ name: 'JOURNEY FAILED', at: new Date().toISOString(), ok: false, detail: String(failure).slice(0, 300) });
    console.log(`  ✗ ${id}: ${String(failure).slice(0, 200)}`);
  }
}

const serverMe = () => page.evaluate(async () => {
  const response = await fetch('/api/auth/me', { credentials: 'include' });
  return { status: response.status, body: response.status === 200 ? await response.json() : null };
});

console.log(`FHE-21 factory on ${base} (build ${buildSha.slice(0, 10)}), account ${email}, language ${lang}`);

await journey('J1', 'E01 register → verify → onboard → account home (server state)', async step => {
  await page.goto(base + '/register', { waitUntil: 'load', timeout: 90000 });
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 20000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.getByRole('button', { name: 'Continue', exact: true }).last().click();
  const passwords = page.locator('input[type="password"]');
  await passwords.first().fill(password);
  await passwords.nth(1).fill(password);
  const terms = page.locator('input[type="checkbox"]').first();
  if (await terms.count()) await terms.check().catch(() => {});
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForTimeout(2500);
  await step('registered through the real UI', await page.evaluate(() => document.body.textContent.includes('Confirm your email address') ? 'verification screen shown' : 'unexpected post-register state'));

  const codes = await (await fetch(`${emulator}/emulator/v1/projects/${projectId}/oobCodes`)).json();
  const code = (codes.oobCodes || []).filter(item => item.requestType === 'VERIFY_EMAIL' && item.email === email).pop();
  assert.ok(code, 'the emulator issued a VERIFY_EMAIL code for the new account');
  const verified = await fetch(code.oobLink);
  await step('email verified via the emulator OOB action', `action responded ${verified.status}`);

  await page.goto(base + '/login', { waitUntil: 'load', timeout: 90000 });
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 20000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.getByRole('button', { name: 'Continue', exact: true }).last().click();
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: /sign in/i }).last().click();
  await page.waitForURL(/onboarding/, { timeout: 30000 });
  await step('signed in and gated to onboarding', 'onboarding wizard opened');

  await page.getByRole('button', { name: /I am a Learner/ }).first().click();
  await page.getByRole('button', { name: 'Continue', exact: true }).last().click();
  await page.locator('input[type="text"]').first().fill(displayName);
  await page.locator('select').first().selectOption('adult');
  await page.getByRole('button', { name: 'Continue', exact: true }).last().click();
  await page.locator('select').first().selectOption(lang);
  await page.getByRole('button', { name: /Independent learning/ }).first().click();
  await page.getByRole('button', { name: 'Continue', exact: true }).last().click();
  await page.getByRole('button', { name: 'Continue', exact: true }).last().click();
  await page.getByRole('button', { name: 'Start using Visionary' }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await page.waitForTimeout(2000);
  await step('onboarded through the wizard', `landed on ${page.url().replace(base, '') || '/dashboard'}`);

  const me = await serverMe();
  assert.equal(me.status, 200, '/api/auth/me reachable with the session');
  assert.equal(me.body.onboarding_complete, true, 'server records onboarding complete');
  assert.equal(me.body.preferred_language, lang, 'server records the chosen learning language');
  assert.equal(me.body.full_name, displayName, 'server records the display name');
  await step('server-owned state read back', `onboarding_complete=true, preferred_language=${me.body.preferred_language}, full_name="${me.body.full_name}"`);
});

await journey('J2', 'profile display-name persists across a full reload', async step => {
  await page.goto(base + '/dashboard/profile', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1500);
  await page.locator('#connected-display-name').fill(renamed);
  await page.getByRole('button', { name: 'Save name' }).click();
  await page.waitForTimeout(1800);
  await step('renamed through the profile form', `submitted "${renamed}"`);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const me = await serverMe();
  assert.equal(me.status, 200);
  assert.equal(me.body.full_name, renamed, 'the rename survives a full reload from server state');
  await step('server state after reload', `full_name="${me.body.full_name}"`);
});

await journey('J3', 'sign-out → sign-in continuity', async step => {
  await page.getByRole('button', { name: 'Open account menu' }).click({ timeout: 15000 });
  await page.getByRole('menuitem', { name: 'Sign out' }).click({ timeout: 15000 });
  await page.waitForURL(/login/, { timeout: 30000 });
  await step('signed out through the account menu', 'returned to /login');
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 20000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.getByRole('button', { name: 'Continue', exact: true }).last().click();
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: /sign in/i }).last().click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await page.waitForTimeout(2000);
  const me = await serverMe();
  assert.equal(me.status, 200);
  assert.equal(me.body.onboarding_complete, true, 'onboarding state preserved across sessions');
  assert.equal(me.body.full_name, renamed, 'the J2 rename is the cross-session record');
  await step('signed back in; server state preserved', `full_name="${me.body.full_name}", onboarding_complete=true`);
});

await journey('J4', 'permission denial: unauthenticated /api/auth/me', async step => {
  const anonymous = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const stranger = await anonymous.newPage();
  await stranger.goto(base + '/', { waitUntil: 'load', timeout: 90000 });
  const status = await stranger.evaluate(async () => (await fetch('/api/auth/me', { credentials: 'include' })).status);
  await anonymous.close();
  assert.equal(status, 401, 'the API denies account state without a session');
  await step('unauthenticated probe rejected', `/api/auth/me → ${status}`);
});

await context.close();
await browser.close();
receipt.totals = { journeys: receipt.journeys.length, failures, pageErrors: pageErrors.length };
receipt.pageErrors = pageErrors.slice(0, 10);
await writeFile(path.join(evidenceDir, 'realm-integration-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
assert.equal(failures, 0, `${failures} realm journey(s) failed (see ${path.relative(productRoot, path.join(evidenceDir, 'realm-integration-receipt.json'))})`);
assert.equal(pageErrors.length, 0, `${pageErrors.length} page errors during the journeys`);
console.log(`PASS FHE-21 factory: ${receipt.journeys.length} core journeys verified on the production build against the real realm, zero page errors.`);
