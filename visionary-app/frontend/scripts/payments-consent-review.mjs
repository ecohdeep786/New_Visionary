/* F-26 (Trust UI + Security Engineers): payments, consent and data integrity review.
 * Drives the trust surfaces through the real journeys in preview repository mode:
 * PHASE 1 learner billing — Plans & usage simulated surface: honest simulation
 *   banner, checkout dialog ("Simulation only. Never enter card, bank, or UPI
 *   details."), the full demo subscription state machine (failed → no charge +
 *   unchanged plan; success → no payment collected; cancel → access retained to
 *   period end; resume), demo-usage entitlement disclosure, demo invoices and
 *   the no-real-checkout service information.
 * PHASE 2 consent pair — learner + parent two-account consent: the honest
 *   guardianship notice, pending 7-day request, learner acceptance, parent
 *   "Connected · Progress summaries only", consent-scoped shared report.
 * PHASE 3 data integrity — Privacy & consent surface: sharing boundaries
 *   ("Family billing does not grant guardian access"), workspace export as a
 *   real download validated as this account's local workspace JSON, and the
 *   recorded future-services boundary (cloud correction/deletion, guardian
 *   verification, grievance processing).
 * No entitlement, receipt or permission is invented: every assertion pins the
 * recorded honest copy. Env: TRUST_BASE_URL (default http://127.0.0.1:4198),
 * TRUST_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.TRUST_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.TRUST_EVIDENCE_DIR || 'docs/visionary/baseline/f26-payments-consent-2026-11-06');
await fs.mkdir(evidence, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PASSWORD = 'Visionary#Baseline2026';
const records = [];
const defects = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

const settle = async (page, ms = 1500) => {
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => document.readyState === 'complete' && document.body.innerText.length > 100, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(ms);
};
async function shoot(page, name, meta) {
  await page.screenshot({ path: path.join(evidence, `${name}.png`) });
  records.push({ file: `${name}.png`, ...meta });
}
const check = (name, ok, detail) => { records.push({ check: name, ok, detail }); if (!ok) defects.push(`${name}: ${detail}`); };
const bodyText = (page) => page.locator('body').innerText();

const WIZARD_ANSWERS = {
  learner: { 'What should we call you?': 'Sam', 'Your age range': 'adult', 'Which board are you studying under?': 'CBSE', 'What language does your school use to teach?': 'English', 'Which class are you studying in?': 'Class 12' },
  parent: { 'What should we call you?': 'Anika', 'Your age range': 'adult', "What's your relation to the child?": 'Guardian', 'What is your child currently studying?': 'School', 'Which board does your child study under?': 'CBSE', 'Which class is your child in?': 'Class 12' },
};

const registerAccount = async (page, email, roleButton, answers) => {
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
  await page.getByRole('button', { name: roleButton }).first().click({ timeout: 20000 });
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
  }, answers);
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
const learnerEmail = `learner-${Date.now()}@visionary.test`;
const parentEmail = `parent-${Date.now()}@visionary.test`;

try {
  /* ── PHASE 1: learner billing — simulated surface + state machine ── */
  await registerAccount(page, learnerEmail, /I am a Learner/, WIZARD_ANSWERS.learner);
  check('learner-registered', page.url().includes('/dashboard'), `learner reached ${page.url()}`);
  await page.goto(`${base}/dashboard/subscription`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 2000);
  const plans1 = await bodyText(page);
  check('plans-simulation-banner', /All billing here is simulated/i.test(plans1), 'Plans surface opens with the explicit simulation banner');
  check('plans-invoice-honesty', /No invoices\. This preview has no payment method\./i.test(plans1),
    'invoice area states there is no payment method in this preview');
  const plansFull = await page.locator('body').textContent();
  check('plans-service-info', /No real checkout, renewal, tax calculation, or payment method is connected\./i.test(plansFull),
    'contact and service information discloses the unconnected billing reality');
  await shoot(page, 'pay-plans-entry', { state: 'Preview Plans & usage — simulated billing surface' });

  /* checkout dialog — failure outcome first (no charge, plan unchanged) */
  await page.locator('button').filter({ hasText: /Review demo plan/i }).first().click({ timeout: 20000 });
  await settle(page, 800);
  const dialog1 = await bodyText(page);
  check('checkout-dialog-disclosure', /Simulation only\. Never enter card, bank, or UPI details\./i.test(dialog1) && /Taxes and live terms are not configured\./i.test(dialog1),
    'checkout dialog carries the anti-phishing and unconfigured-terms disclosures');
  const outcomeSelect = page.locator('select[aria-label="Demo checkout outcome"]');
  await outcomeSelect.selectOption('failed');
  await page.locator('button').filter({ hasText: /Simulate checkout/i }).first().click({ timeout: 20000 });
  await settle(page, 1500);
  const failedState = await bodyText(page);
  check('checkout-failed-honest', /Demo payment failed\. No charge was made and your current plan is unchanged\./i.test(failedState),
    'failed demo checkout states no charge and unchanged plan (server-owned outcome, not local entitlement)');
  check('plan-unchanged-after-failure', /Latest checkout Failure · Existing access retained|Current account plan\s*\n\s*Free/i.test(failedState.replace(/\n+/g, '\n')),
    'the recorded plan state reflects the failure without granting access');
  await shoot(page, 'pay-checkout-failed', { state: 'Demo checkout failure outcome — no charge, plan unchanged' });

  /* success outcome — no payment collected */
  await page.locator('button').filter({ hasText: /Review demo plan/i }).first().click({ timeout: 20000 });
  await settle(page, 800);
  await page.locator('select[aria-label="Demo checkout outcome"]').selectOption('active');
  await page.locator('button').filter({ hasText: /Simulate checkout/i }).first().click({ timeout: 20000 });
  await settle(page, 1500);
  const successState = await bodyText(page);
  check('checkout-success-honest', /Demo subscription activated\. No payment was collected\./i.test(successState),
    'successful demo checkout states explicitly that no payment was collected');
  await shoot(page, 'pay-checkout-success', { state: 'Demo checkout success — no payment collected' });

  /* cancel + resume — access retained to period end */
  await page.locator('button').filter({ hasText: /Cancel subscription/i }).first().click({ timeout: 20000 });
  await settle(page, 600);
  const cancelDialog = await bodyText(page);
  check('cancel-dialog-honest', /Your saved work is retained\. No real subscription is changed\./i.test(cancelDialog),
    'cancel dialog discloses that no real subscription changes');
  await page.getByRole('button', { name: 'Confirm', exact: true }).first().click({ timeout: 20000 });
  await settle(page, 1500);
  const cancelledState = await bodyText(page);
  check('cancel-retains-access', /Cancellation scheduled\. Demo access retained until /i.test(cancelledState),
    'cancelled state retains access until the period ends (no punitive lock-out)');
  await page.locator('button').filter({ hasText: /Resume subscription/i }).first().click({ timeout: 20000 });
  await settle(page, 600);
  await page.getByRole('button', { name: 'Confirm', exact: true }).first().click({ timeout: 20000 });
  await settle(page, 1500);
  const resumedState = await bodyText(page);
  check('resume-restores-state', /Demo subscription updated\. Saved work remains available\./i.test(resumedState),
    'resume flow completes with saved work retained');

  /* usage + entitlement disclosure */
  await page.locator('details summary').filter({ hasText: /Guided conversation usage/i }).first().click().catch(() => {});
  await settle(page, 600);
  const usageText = await bodyText(page);
  check('usage-entitlement-disclosure', /Demo counts are not production entitlements\./i.test(usageText) && /remain available at the limit/i.test(usageText),
    'usage meter is labelled a demo count and core access is preserved at the limit');

  /* ── PHASE 2: consent pair — parent requests, learner accepts ───── */
  await signOut(page);
  await registerAccount(page, parentEmail, /I am a Parent/, WIZARD_ANSWERS.parent);
  check('parent-registered', page.url().includes('/dashboard'), `parent reached ${page.url()}`);
  await page.goto(`${base}/dashboard/child`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => /Connect|guardian|child/i.test(document.body.innerText), { timeout: 30000 }).catch(() => {});
  await settle(page, 800);
  const connectState = await bodyText(page);
  check('guardianship-honest-notice', /does not verify guardianship|do not enter real child information/i.test(connectState),
    'guardian connect surface states the preview does not verify guardianship');
  await page.locator('#main input:visible, main input:visible').first().fill(learnerEmail);
  await page.locator('#main button:visible, main button:visible').filter({ hasText: /request|send/i }).first().click().catch(() => {});
  await page.waitForTimeout(1800);
  const pending = await bodyText(page);
  check('connection-pending-expiry', /awaiting acceptance|pending/i.test(pending) && /seven days|expire/i.test(pending),
    'connection request is pending with a visible expiry window');
  await shoot(page, 'pay-parent-request-pending', { state: 'Parent connection request pending with expiry' });

  /* learner accepts */
  await signOut(page);
  await signIn(page, learnerEmail);
  await page.goto(`${base}/dashboard/connections`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const accepted = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('#main button, main button')]
      .find((b) => /^(accept|approve|allow)/i.test((b.textContent || '').trim()));
    if (btn) { btn.click(); return true; }
    return /connected|active/i.test(document.body.innerText);
  });
  await page.waitForTimeout(1500);
  check('learner-accepts-request', Boolean(accepted), 'learner accepts the pending guardian request through Connections');
  await shoot(page, 'pay-learner-accepts', { state: 'Learner Connections — accepting the guardian request' });

  /* parent sees connected + consent-scoped report */
  await signOut(page);
  await signIn(page, parentEmail);
  await page.goto(`${base}/dashboard/child`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => /Connected|connected/i.test(document.body.innerText), { timeout: 30000 }).catch(() => {});
  await settle(page, 800);
  const connected = await bodyText(page);
  check('parent-connected-scoped', /connected/i.test(connected) && /Progress summaries only/i.test(connected),
    'parent sees the connected state scoped to progress summaries only');
  const viewReport = page.locator('a').filter({ hasText: /view report/i }).first();
  if (await viewReport.count()) {
    await viewReport.click({ timeout: 20000 });
    await page.waitForFunction(() => /Shared learning summaries|no longer shared|Connect before viewing/i.test(document.body.innerText), { timeout: 30000 }).catch(() => {});
    await settle(page, 800);
    const report = await bodyText(page);
    check('parent-report-consent-scoped', page.url().includes('/dashboard/reports'),
      `View report lands on the consent-scoped summary (${page.url()})`);
    check('parent-report-scoped-law', /Shared learning summaries, not private conversations/i.test(report),
      'shared report carries the scoping law (summaries not conversations)');
    /* the exclusion law sits inside a collapsed details section — textContent sees it */
    const reportFull = await page.locator('body').textContent();
    check('parent-report-exclusion-law', /Answers, grades and private feedback are excluded/i.test(reportFull),
      'shared report carries the exclusion law (answers/grades/private feedback excluded)');
    await shoot(page, 'pay-parent-report', { state: 'Parent consent-scoped progress report' });
  } else {
    check('parent-report-consent-scoped', false, 'View report door not found on the connected parent surface');
  }

  /* parent billing boundary: family plan copy keeps guardian permission separate */
  await page.goto(`${base}/dashboard/subscription`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => /All billing here is simulated|Current account plan/i.test(document.body.innerText), { timeout: 30000 }).catch(() => {});
  await settle(page, 600);
  const parentPlans = await bodyText(page);
  check('parent-plans-simulated', /All billing here is simulated/i.test(parentPlans),
    'parent Plans surface carries the same simulation banner');

  /* ── PHASE 3: data integrity — privacy surface + workspace export ── */
  await page.goto(`${base}/dashboard/privacy`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => /Sharing boundaries|Review sharing permissions/i.test(document.body.innerText), { timeout: 30000 }).catch(() => {});
  await settle(page, 600);
  const privacy = await bodyText(page);
  check('privacy-guardian-billing-boundary', /Family billing does not grant guardian access\./i.test(privacy),
    'privacy surface states family billing never grants guardian access');
  check('privacy-scope-honesty', /local preview, not verified cloud security/i.test(privacy),
    'privacy surface scopes itself honestly (local preview, not verified cloud security)');
  check('privacy-future-services', /Cloud correction, deletion, guardian verification and grievance processing require future services\./i.test(privacy),
    'privacy surface records the future-services boundary for correction/deletion/verification');
  await shoot(page, 'pay-privacy-surface', { state: 'Privacy & consent — sharing boundaries and export' });

  /* workspace export as a real download, validated as JSON */
  const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
  await page.locator('button').filter({ hasText: /Export this workspace/i }).first().click({ timeout: 20000 });
  const download = await downloadPromise.catch(() => null);
  if (download) {
    const exportPath = path.join(evidence, 'workspace-export.json');
    await download.saveAs(exportPath);
    const exported = await fs.readFile(exportPath, 'utf8');
    let parsed = null;
    try { parsed = JSON.parse(exported); } catch { parsed = null; }
    check('workspace-export-downloads', Boolean(parsed), `workspace export downloaded as ${download.suggestedFilename()}`);
    check('workspace-export-is-local-workspace', Boolean(parsed) && typeof parsed === 'object'
      && !('cardNumber' in parsed) && !/razorpay|payment_method|card_number/i.test(exported),
      'export contains local workspace records with no payment credentials inside');
    check('privacy-export-notice', /Export contains this account.s local workspace records/i.test(privacy),
      'the export notice states exactly what the export contains');
    await shoot(page, 'pay-workspace-export', { state: 'Workspace export downloaded from the privacy surface' });
  } else {
    check('workspace-export-downloads', false, 'workspace export did not produce a download');
  }

  /* server-owned decisions: the learner's failed checkout never granted entitlements;
     re-verify the learner's plan state after the consent pair is complete. */
  await signOut(page);
  await signIn(page, learnerEmail);
  await page.goto(`${base}/dashboard/subscription`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => /All billing here is simulated|Current account plan/i.test(document.body.innerText), { timeout: 30000 }).catch(() => {});
  await settle(page, 600);
  const learnerPlans = await bodyText(page);
  check('learner-state-persisted', /Current account plan/i.test(learnerPlans) && !/Never enter card/i.test(learnerPlans.split('Review')[0]),
    'learner billing state persists across sessions without inventing a payment method');
} catch (error) {
  defects.push(`harness: ${String(error).slice(0, 300)}`);
  await shoot(page, 'pay-harness-failure', { state: `harness failure at ${page.url()}` }).catch(() => {});
}

check('zero-page-errors', pageErrors.length === 0, pageErrors.length ? pageErrors.slice(0, 3).join(' | ') : 'no uncaught page errors in the whole journey');
const okCount = records.filter((r) => r.check && r.ok).length;
const receipt = {
  task: 'F-26 payments, consent and data integrity review',
  at: new Date().toISOString(),
  base,
  mode: 'preview repository (VITE_AUTH_MODE=preview; billing simulated; no payment method exists)',
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
console.log('PASS payments consent review');
await browser.close();
