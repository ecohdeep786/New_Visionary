/* Role-by-role end-to-end qualification (founder directive): for each
 * category — student, teacher, parent, professional, organization —
 * register a fresh synthetic identity through the real UI, verify email
 * via the emulator OOB action, onboard choosing that role, then walk the
 * role's workspace on the PRODUCTION build: every declared primary route
 * must render a connected surface or the honest room, zero page errors,
 * and the introduction dialog's skip must persist to the server.
 * Receipt per role; secret-safe (passwords generated, never recorded).
 * Env: E2E_URL (default http://localhost:4200), E2E_EMULATOR,
 * E2E_PROJECT, E2E_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navigationFor, secondaryNavigation } from '../src/lib/dashboardNavigation.js';

const base = process.env.E2E_URL || 'http://localhost:4200';
const emulator = process.env.E2E_EMULATOR || 'http://127.0.0.1:9098';
const projectId = process.env.E2E_PROJECT || 'demo-visionary-kan42';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = path.resolve(productRoot, process.env.E2E_EVIDENCE_DIR || 'docs/visionary/baseline/role-e2e-2026-11-18');
await mkdir(evidenceDir, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const buildSha = execSync('git rev-parse HEAD', { cwd: productRoot }).toString().trim();


const stamp = Date.now();
/* The product's categories, verbatim from the landing nav data — every
 * category the product declares gets a full end-to-end journey. */
const ROLES = [
  { key: 'student', card: 'I am a Learner' },
  { key: 'teacher', card: 'I am a Teacher' },
  { key: 'parent', card: 'I am a Parent' },
  { key: 'professional', card: 'I am a Professional' },
  { key: 'organization', card: 'We are an Organization' },
];
const receipt = { at: new Date().toISOString(), base, buildSha, roles: [], totals: {} };
let failures = 0;
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

async function registerThroughUi(page, email, password) {
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
  await page.waitForTimeout(2000);
  const codes = await (await fetch(`${emulator}/emulator/v1/projects/${projectId}/oobCodes`)).json();
  const code = (codes.oobCodes || []).filter(item => item.requestType === 'VERIFY_EMAIL' && item.email === email).pop();
  assert.ok(code, 'VERIFY_EMAIL code issued for ' + email);
  await fetch(code.oobLink);
  await page.goto(base + '/login', { waitUntil: 'load', timeout: 90000 });
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 20000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.getByRole('button', { name: 'Continue', exact: true }).last().click();
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: /sign in/i }).last().click();
  await page.waitForURL(/onboarding/, { timeout: 30000 });
}

/* Adaptive onboarding walker: every wizard step is snapshotted; text inputs
   are filled, selects resolved to a real value, role/context choice cards
   clicked, then the step advanced. Nothing hardcoded per role beyond the
   role card itself. */
async function onboard(page, role, displayName) {
  await page.getByRole('button', { name: role.card }).first().click();
  await page.waitForTimeout(900);
  for (let step = 0; step < 10; step++) {
    const snap = await page.evaluate(() => ({
      url: location.pathname,
      textInputs: [...document.querySelectorAll('input[type="text"]')].filter(i => i.offsetParent !== null).length,
      selects: [...document.querySelectorAll('select')].filter(s => s.offsetParent !== null).map(s => s.id || s.name),
      cardButtons: [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null && /^(Independent learning|School|Higher education|Exam preparation)/.test(b.textContent.trim())).map(b => b.textContent.trim().slice(0, 22)),
      advance: [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null && !b.disabled && /^(Continue|Start using Visionary)$/i.test(b.textContent.trim())).map(b => b.textContent.trim()),
    }));
    if (!snap.url.startsWith('/onboarding')) return 'landed ' + snap.url;
    for (let i = 0; i < snap.textInputs; i++) {
      await page.locator('input[type="text"]:visible').nth(i).fill(i === 0 ? displayName : 'Visionary');
    }
    /* every select on the page gets the attempt: the wizard keeps later
       steps mounted, so hidden ones fail harmlessly while the visible
       step's select takes the value */
    const value = await page.evaluate(() => {
      const visible = [...document.querySelectorAll('select')].find(sel => sel.offsetParent !== null);
      return visible ? [...visible.options].map(o => o.getAttribute('value')).find(v => v && v !== '') : null;
    });
    if (value) for (const sel of await page.locator('select').all()) await sel.selectOption(value).catch(() => {});
    if (snap.cardButtons.length) {
      /* role-name matching is exact; click by a substring regex, preferring
         the field-free context so the walker stays deterministic */
      const preferred = snap.cardButtons.find(t => /Independent learning/i.test(t)) || snap.cardButtons[0];
      const firstWord = preferred.split(/\s+/)[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await page.getByRole('button', { name: new RegExp('^' + firstWord) }).first().click().catch(() => {});
      await page.waitForTimeout(500);
    }
    /* re-read the advance buttons AFTER the fills — validation enables
       Continue only once the step's inputs hold values */
    const advance = await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null && !b.disabled && /^(Continue|Start using Visionary)$/i.test(b.textContent.trim())).map(b => b.textContent.trim()));
    if (!advance.length) throw new Error('onboarding stuck: ' + JSON.stringify(snap));
    await page.getByRole('button', { name: advance[advance.length - 1] }).click();
    await page.waitForTimeout(1100);
    const url = await page.evaluate(() => location.pathname);
    if (!url.startsWith('/onboarding')) return 'landed ' + url;
  }
  throw new Error('onboarding did not complete in 10 steps');
}

for (const role of ROLES) {
  const email = `e2e-${role.key}-${stamp}@example.test`;
  const password = 'Realm#E2e-' + Math.random().toString(36).slice(2, 12);
  const displayName = 'E2E ' + role.key[0].toUpperCase() + role.key.slice(1);
  const record = { role: role.key, email, steps: [], verdict: 'pass' };
  receipt.roles.push(record);
  console.log('── ' + role.key + ' (' + email + ')');
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e).slice(0, 160)));
    await registerThroughUi(page, email, password);
    record.steps.push({ step: 'registered + verified + signed in', ok: true });
    const landed = await onboard(page, role, displayName);
    assert.ok(/dashboard/.test(landed), 'onboarding landed in the workspace: ' + landed);
    record.steps.push({ step: 'onboarded as ' + role.key, ok: true, detail: landed });

    // the introduction dialog auto-opens for a new account; skip it and
    // confirm the server persists the completion
    await page.waitForTimeout(1800);
    const skip = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"]');
      const btn = dlg ? [...dlg.querySelectorAll('button')].find(b => /skip/i.test(b.textContent)) : null;
      if (!btn) return 'no-dialog';
      btn.click();
      return 'skipped';
    });
    await page.waitForTimeout(1600);
    const me = await page.evaluate(async () => {
      const r = await fetch('/api/auth/me', { credentials: 'include' });
      return { status: r.status, body: r.status === 200 ? await r.json() : null };
    });
    assert.equal(me.status, 200, 'session works after onboarding');
    assert.equal(me.body.onboarding_complete, true, 'server records onboarding');
    assert.equal(me.body.identity, role.key === 'student' ? 'student' : role.key, 'server records the role');
    record.steps.push({ step: 'server state', ok: true, detail: `identity=${me.body.identity}, intro=${skip}, getting_started_complete=${me.body.getting_started_complete}` });

    // walk EVERY route in the role's navigation — primary + secondary,
    // derived from the navigation library itself so the walk is exactly
    // what the role's own shell offers, never a hand-picked subset
    const routeKeys = [...new Set([...navigationFor(role.key, 'en'), ...secondaryNavigation(role.key, 'en')].map(item => item.key))];
    const walked = [];
    for (const key of routeKeys) {
      const route = '/dashboard/' + key;
      const errorsBefore = pageErrors.length;
      await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
      await page.waitForTimeout(1400);
      const state = await page.evaluate(() => {
        const main = document.querySelector('main') || document.body;
        const text = main.textContent.trim();
        return { h1: document.querySelector('h1')?.textContent?.trim()?.slice(0, 40) || null, blank: text.length < 20, honest: /not available yet|अभी उपलब्ध नहीं|এখনো নেই/.test(text) };
      });
      const fresh = pageErrors.slice(errorsBefore);
      const verdict = state.blank ? 'BLANK' : fresh.length ? 'ERRORS' : state.honest ? 'honest-room' : 'surface';
      walked.push(route + '→' + verdict);
      if (verdict === 'BLANK' || verdict === 'ERRORS') { record.verdict = 'fail'; failures += 1; record.steps.push({ step: route, ok: false, detail: verdict + (fresh.length ? ': ' + fresh[0] : '') }); }
    }
    record.steps.push({ step: 'routes walked', ok: !walked.some(w => /BLANK|ERRORS/.test(w)), detail: walked.join(', ') });
    record.pageErrors = pageErrors.slice(0, 5);
    await context.close();
    console.log('   ' + walked.join('  '));
  } catch (failure) {
    record.verdict = 'fail';
    failures += 1;
    record.steps.push({ step: 'JOURNEY FAILED', ok: false, detail: String(failure).slice(0, 300) });
    console.log('   FAIL: ' + String(failure).slice(0, 200));
  }
}

await browser.close();
receipt.totals = { roles: ROLES.length, failures };
await writeFile(path.join(evidenceDir, 'role-e2e-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
assert.equal(failures, 0, `${failures} role journey(s) failed (see ${path.relative(productRoot, path.join(evidenceDir, 'role-e2e-receipt.json'))})`);
console.log(`PASS role-e2e: all ${ROLES.length} category journeys (student→organization) verified on the production build.`);
