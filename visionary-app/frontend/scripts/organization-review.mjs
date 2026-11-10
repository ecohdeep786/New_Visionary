/* F-22 (Product + Platform Engineers): organization experience review.
 * Two phases on the real journey (preview repository, no interception):
 *  Phase 1 — owner: register -> organization onboarding ("We are an
 *    Organization") -> org shell/home -> People (invite an analyst through the
 *    real Connections form) -> Cohorts (create group, honest boundary) ->
 *    Content (author -> save -> submit; anti-self-approval wait) ->
 *    Curriculum (reviewed templates + unreviewed earlier drafts) -> Analytics
 *    (honest no-linkage) -> Audit (device-local honesty) -> Settings (owner
 *    edit -> review -> confirm; preview-only framing) -> Seats & billing
 *    (planning request, no charge honesty) -> Organization updates.
 *  Phase 2 — member permissions: sign out, register the invited analyst,
 *    accept the pending membership, then verify the analyst's permission
 *    matrix live: /dashboard/home shows OrganizationAccessHome with only the
 *    Aggregate insights door (+ privacy boundary), analytics renders the
 *    reduced "Aggregate insights" surface, and audit/cohorts/content/
 *    subscription are permission-blocked.
 * Env: ORG_BASE_URL (default http://127.0.0.1:4198), ORG_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.ORG_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.ORG_EVIDENCE_DIR || 'docs/visionary/baseline/f22-organization-2026-11-06');
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
const h1Ready = async (page, timeoutMs = 25000) => {
  /* Route pages render their h1 after workspace data loads; wait rather than sample mid-load. */
  await page.waitForFunction(() => { const h = document.querySelector('h1'); return !!h && h.textContent.trim().length > 0; }, { timeout: timeoutMs }).catch(() => {});
  await page.waitForTimeout(500);
};
const openDetails = async (page, text) => {
  await page.evaluate((text) => {
    const q = new RegExp(text, 'i');
    [...document.querySelectorAll('details')].forEach((x) => {
      if (x.querySelector(':scope > summary') && q.test(x.querySelector(':scope > summary').textContent || '')) x.setAttribute('open', '');
    });
  }, text).catch(() => {});
  await page.waitForTimeout(400);
};
async function shoot(page, name, meta) {
  await page.screenshot({ path: path.join(evidence, `${name}.png`) });
  records.push({ file: `${name}.png`, ...meta });
}
const check = (name, ok, detail) => { records.push({ check: name, ok, detail }); if (!ok) defects.push(`${name}: ${detail}`); };

/* ───────────────────────── account machinery ───────────────────────── */
const registerOrg = async (page, email = `org-${Date.now()}@visionary.test`) => {
  await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
  await settle(page, 1500);
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('button[type="submit"]:visible').first().click();
  await settle(page, 600);
  const pw = page.locator('input[type="password"]:visible');
  await pw.first().fill(PASSWORD, { timeout: 20000 });
  if (await pw.count() > 1) await pw.nth(1).fill(PASSWORD);
  await page.locator('button[type="submit"]:visible').last().click();
  await settle(page, 900);
  const otp = page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]').first();
  await otp.waitFor({ state: 'visible', timeout: 45000 });
  try { await otp.fill('000000'); } catch { await otp.pressSequentially('000000'); }
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.waitForURL(/\/onboarding/, { timeout: 45000 });
  await page.waitForSelector('text=Make Visionary your own', { timeout: 45000 });
  await page.evaluate(() => [...document.querySelectorAll('main button, #main button')].find((b) => (b.textContent || '').includes('We are an Organization'))?.click());
  const answers = { 'What should we call you?': 'Alex', 'Your age range': 'adult', 'Organization name': 'Brightpath Academy', 'Organization type': 'school' };
  const fillAndSelect = (page) => page.evaluate((answers) => {
    const iSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    for (const input of [...document.querySelectorAll('main input[type="text"], #main input[type="text"], main input:not([type]), #main input:not([type])')]) {
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
  await page.waitForSelector('text=A little about you', { timeout: 45000 }).catch(() => {});
  for (let guard = 0; guard < 16 && !page.url().includes('/dashboard'); guard += 1) {
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
      await dialog.getByRole('button', { name: i === 2 ? 'Start exploring' : 'Continue', exact: true }).last().click().catch(() => {});
      await page.waitForTimeout(600);
    }
  }
  return email;
};

const signOut = async (page) => {
  /* Real pointer clicks: Radix menus close on synthetic outside events. */
  await page.click('header button[aria-label*="ccount" i]', { timeout: 15000 });
  await page.getByRole('menuitem', { name: /sign out/i }).click({ timeout: 15000 });
  await page.waitForTimeout(1800);
  await page.waitForFunction(() => !document.body.innerText.includes('Active workspace'), { timeout: 15000 }).catch(() => {});
};

const switchToOrgWorkspace = async (page, label) => {
  /* The workspace switcher is a native <select aria-label="Active workspace">. */
  const select = page.locator('select[aria-label="Active workspace"]').first();
  await select.waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
  const option = select.locator('option', { hasText: new RegExp(label, 'i') }).first();
  const value = await option.getAttribute('value').catch(() => null);
  if (value) await select.selectOption(value);
  await page.waitForTimeout(2000);
};

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`${page.url()}: ${String(e).slice(0, 130)}`));
let ownerEmail = '';
const partnerEmail = `partner-${Date.now()}@visionary.test`;
try {
  /* ═══ PHASE 1 — OWNER ═══ */
  ownerEmail = await registerOrg(page);

  /* 1. Home: org shell reading (owner home is DashboardHome in the org workspace) */
  await page.goto(`${base}/dashboard/home`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const home = await page.evaluate(() => {
    const t = document.body.innerText;
    const top = /Owner · My organization/.test(t);
    const search = /Find people, cohorts, or tools/.test(t);
    const primary = ['Home', 'People', 'Cohorts', 'Curriculum', 'Insights'].map(label => t.includes(label));
    const secondary = ['Content', 'Audit', 'Seats & billing'].map(label => t.includes(label));
    const connectAdd = /Add people/.test(t);
    return { top, search, primary, secondary, connectAdd, h1: (document.querySelector('h1')?.textContent || '').trim().slice(0, 40) };
  });
  await shoot(page, 'org-home', { surface: 'org-home', home, errors: [...errors] });
  check('org-home-shell', home.top && home.search && home.primary.every(Boolean) && home.secondary.every(Boolean), JSON.stringify(home).slice(0, 220));

  /* 2. People: invite an analyst through the real Connections form */
  await page.goto(`${base}/dashboard/people`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const peopleEntry = await page.evaluate(() => ({
    inviteSummary: /Invite someone to your organization/.test(document.body.innerText),
  }));
  /* open the <details> disclosure */
  await page.locator('summary').filter({ hasText: /Invite someone to your organization/ }).click({ timeout: 15000 }).catch(async () => {
    await page.evaluate(() => [...document.querySelectorAll('summary')].find((s) => /Invite someone to your organization/.test(s.textContent || ''))?.click());
  });
  await page.waitForTimeout(1000);
  await page.locator('input[type="email"]').last().fill(partnerEmail);
  await page.evaluate(() => {
    const sSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    for (const select of [...document.querySelectorAll('main select, #main select')]) {
      if (select.offsetParent === null) continue;
      const opts = [...select.options].map((o) => o.value);
      if (opts.some((v) => v === 'organization')) { sSetter.call(select, 'organization'); select.dispatchEvent(new Event('change', { bubbles: true })); }
    }
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const sSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    const select = [...document.querySelectorAll('main select, #main select')].find((s) => s.offsetParent !== null && [...s.options].some((o) => /analyst|administrator|permission/i.test((o.textContent || '') + o.value)));
    if (select) {
      const target = [...select.options].find((o) => /^Analyst$/i.test((o.textContent || '').trim())) || [...select.options].find((o) => /analyst/i.test(o.value));
      if (target) { sSetter.call(select, target.value); select.dispatchEvent(new Event('change', { bubbles: true })); }
    }
  });
  await page.evaluate(() => [...document.querySelectorAll('main button, #main button')].find((b) => /Request connection/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1800);
  const people = await page.evaluate((partnerEmail) => {
    const t = document.body.innerText;
    return {
      savedNotice: /Request saved locally for seven days/.test(t),
      inviteRow: t.includes(partnerEmail),
      pending: /Awaiting acceptance/.test(t),
      membershipScope: /Organization membership/.test(t) && /Analyst/.test(t),
    };
  }, partnerEmail);
  await shoot(page, 'org-people-invite', { surface: 'people-invite', people, errors: [...errors] });
  check('org-people-invite', people.savedNotice && people.inviteRow && people.pending && people.membershipScope, JSON.stringify(people).slice(0, 220));

  /* 3. Cohorts */
  await page.goto(`${base}/dashboard/cohorts`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1200);
  await h1Ready(page);
  const cohortsEntry = await page.evaluate(() => ({
    h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 40),
    honest: /Give a connected group a shared purpose, without merging their personal work/i.test(document.body.innerText),
  }));
  await shoot(page, 'org-cohorts-entry', { surface: 'cohorts', cohortsEntry, errors: [...errors] });
  check('org-cohorts-entry', cohortsEntry.h1 === 'Cohorts' && cohortsEntry.honest, JSON.stringify(cohortsEntry).slice(0, 160));
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /Create cohort/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1000);
  const cohortDialog = await page.evaluate(() => ({
    boundary: /Only accepted members and explicitly organization-linked classes are available\. No private notes or conversations are included/i.test(document.body.innerText),
  }));
  await page.evaluate(() => {
    const iSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const input = [...document.querySelectorAll('[role="dialog"] input')][0];
    if (input) { iSetter.call(input, 'Physics research circle'); input.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button')].find((b) => /Save cohort/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1500);
  const cohortSaved = await page.evaluate(() => ({
    notice: /Cohort saved\. Membership does not grant access to personal learning/i.test(document.body.innerText),
    row: /Physics research circle/.test(document.body.innerText),
  }));
  check('org-cohort-dialog', cohortDialog.boundary, JSON.stringify(cohortDialog).slice(0, 180));
  check('org-cohort-saved', cohortSaved.notice && cohortSaved.row, JSON.stringify(cohortSaved).slice(0, 180));

  /* 4. Content: author -> save -> submit (anti-self-approval) */
  await page.goto(`${base}/dashboard/library`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1200);
  await h1Ready(page);
  await openDetails(page, 'How it works');
  const contentEntry = await page.evaluate(() => ({
    h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 40),
    guidance: /Approval records an editorial review on this device\. It does not publish a learner curriculum, generate learning activities or verify source rights/i.test(document.body.innerText),
  }));
  check('org-content-entry', contentEntry.h1.includes('Organization content') && contentEntry.guidance, JSON.stringify(contentEntry).slice(0, 180));
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /New content draft/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1000);
  const contentDialog = await page.evaluate(() => ({
    honest: /A different academic administrator reviews each authored revision/.test(document.body.innerText),
  }));
  await page.evaluate(() => {
    const iSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const tSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    const inputs = [...document.querySelectorAll('[role="dialog"] input, [role="dialog"] textarea')];
    const title = inputs[0], body = inputs[1], source = inputs[2];
    if (title) { iSetter.call(title, 'Forces and motion'); title.dispatchEvent(new Event('input', { bubbles: true })); }
    if (body) { tSetter.call(body, 'Introduce Newtonian forces with recorded classroom examples.'); body.dispatchEvent(new Event('input', { bubbles: true })); }
    if (source) { tSetter.call(source, 'Textbook 2026 edition, chapter 3, page 41'); source.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button')].find((b) => /Save content draft/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1600);
  const contentSaved = await page.evaluate(() => ({
    notice: /Draft saved\. Submit the saved revision when it is ready/.test(document.body.innerText),
  }));
  await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button')].find((b) => /Submit saved revision/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1600);
  const contentSubmitted = await page.evaluate(() => ({
    waiting: /Waiting for a different academic administrator to review/.test(document.body.innerText),
    noApprove: !/Approve saved revision/.test(document.body.innerText),
  }));
  await shoot(page, 'org-content-submitted', { surface: 'content', contentSubmitted, errors: [...errors] });
  check('org-content-dialog', contentDialog.honest, JSON.stringify(contentDialog).slice(0, 180));
  check('org-content-saved', contentSaved.notice, JSON.stringify(contentSaved).slice(0, 180));
  check('org-content-anti-self-approval', contentSubmitted.waiting && contentSubmitted.noApprove, JSON.stringify(contentSubmitted).slice(0, 180));

  /* 5. Curriculum */
  await page.goto(`${base}/dashboard/curriculum`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1200);
  await h1Ready(page);
  await openDetails(page, 'Earlier subject drafts');
  const curriculum = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 40),
      earlierDrafts: /Earlier subject drafts · unreviewed/.test(t),
      honest: /cannot be distributed as approved curriculum/.test(t),
    };
  });
  await shoot(page, 'org-curriculum', { surface: 'curriculum', curriculum, errors: [...errors] });
  check('org-curriculum', curriculum.h1.includes('Reviewed curriculum templates') && curriculum.earlierDrafts && curriculum.honest, JSON.stringify(curriculum).slice(0, 200));

  /* 6. Analytics: honest no-linkage state */
  await page.goto(`${base}/dashboard/analytics`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const analytics = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      header: /Institution analytics/.test(t),
      noClassrooms: /No linked classrooms yet/.test(t),
      honest: /Roster drafts do not create classroom access/.test(t),
    };
  });
  await shoot(page, 'org-analytics', { surface: 'analytics', analytics, errors: [...errors] });
  check('org-analytics', analytics.header && analytics.noClassrooms && analytics.honest, JSON.stringify(analytics).slice(0, 200));

  /* 7. Audit */
  await page.goto(`${base}/dashboard/audit`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1200);
  await h1Ready(page);
  await openDetails(page, 'about');
  const audit = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 40),
      deviceLocal: /This history is stored on this device/.test(t),
      editableNote: /This local record is editable browser data/.test(t),
    };
  });
  await shoot(page, 'org-audit', { surface: 'audit', audit, errors: [...errors] });
  check('org-audit', audit.h1 === 'Organization audit' && audit.deviceLocal && audit.editableNote, JSON.stringify(audit).slice(0, 200));

  /* 8. Settings: owner edit -> review -> confirm */
  await page.goto(`${base}/dashboard/settings`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const settingsEntry = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 40),
      deviceOnly: /Revision \d+ · This device only/.test(t),
      editable: !/Your administrative role can read these settings/.test(t),
    };
  });
  await page.evaluate(() => {
    const sSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    const select = [...document.querySelectorAll('#main select, main select')].find((s) => s.offsetParent !== null && [...s.options].some((o) => /school|coaching|company|ngo/i.test(o.value)));
    if (select) {
      const target = [...select.options].find((o) => o.value === 'coaching') || select.options[1];
      if (target && target.value !== select.value) { sSetter.call(select, target.value); select.dispatchEvent(new Event('change', { bubbles: true })); }
    }
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /Review settings changes/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(900);
  const settingsDialog = await page.evaluate(() => ({
    applyTitle: /Apply organization settings\?/.test(document.body.innerText),
    previewOnly: /These settings apply only in this local preview/.test(document.body.innerText),
  }));
  await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button')].find((b) => /Confirm settings changes/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1600);
  const settingsSaved = await page.evaluate(() => ({
    notice: /Organization settings saved on this device/.test(document.body.innerText),
    coaching: /Coaching organization/.test(document.body.innerText),
  }));
  await shoot(page, 'org-settings-saved', { surface: 'settings', settingsSaved, errors: [...errors] });
  check('org-settings-entry', settingsEntry.h1 === 'Organization settings' && settingsEntry.deviceOnly && settingsEntry.editable, JSON.stringify(settingsEntry).slice(0, 200));
  check('org-settings-review-dialog', settingsDialog.applyTitle && settingsDialog.previewOnly, JSON.stringify(settingsDialog).slice(0, 180));
  check('org-settings-saved', settingsSaved.notice && settingsSaved.coaching, JSON.stringify(settingsSaved).slice(0, 160));

  /* 9. Seats & billing */
  await page.goto(`${base}/dashboard/subscription`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const billing = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 50),
      notConnected: /Organization pricing and invoices are not connected/.test(t),
      noCharge: /Acknowledgement does not activate seats, grant access or create a charge/.test(t),
    };
  });
  await page.evaluate(() => {
    const iSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const tSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    const input = [...document.querySelectorAll('#main input[type="number"], main input[type="number"]')][0];
    if (input) { iSetter.call(input, '5'); input.dispatchEvent(new Event('input', { bubbles: true })); }
    const area = [...document.querySelectorAll('#main textarea, main textarea')][0];
    if (area) { tSetter.call(area, 'Teacher licenses for Q3 onboarding.'); area.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /Save seat request/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1600);
  const billingSaved = await page.evaluate(() => ({
    notice: /Seat request saved locally for owner review/.test(document.body.innerText),
    history: /5 seats · pending/.test(document.body.innerText),
  }));
  await shoot(page, 'org-billing-saved', { surface: 'billing', billingSaved, errors: [...errors] });
  check('org-billing', billing.h1.includes('Organization seats and billing') && billing.notConnected && billing.noCharge, JSON.stringify(billing).slice(0, 200));
  check('org-billing-saved', billingSaved.notice && billingSaved.history, JSON.stringify(billingSaved).slice(0, 160));

  /* 10. Organization updates */
  await page.goto(`${base}/dashboard/notifications`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const notifications = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 40),
      honest: /Email, push and scheduled delivery require the later notification service/.test(t),
      preference: /Summary frequency/.test(t),
    };
  });
  await shoot(page, 'org-notifications', { surface: 'notifications', notifications, errors: [...errors] });
  check('org-notifications', notifications.h1.includes('Organization updates') && notifications.honest && notifications.preference, JSON.stringify(notifications).slice(0, 200));

  /* ═══ PHASE 2 — ANALYST / ORGANIZATION PERMISSIONS ═══ */
  await signOut(page);
  await registerOrg(page, partnerEmail);
  await settle(page, 1800);

  /* The partner needs the invited role workspace: switch to the member org workspace. */
  const partnerId = partnerEmail;
  await page.goto(`${base}/dashboard/connections`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const invitesBefore = await page.evaluate((partnerId) => ({
    pendingInvite: new RegExp(partnerId.split('@')[0]).test(document.body.innerText) || document.body.innerText.includes('Needs your approval'),
  }), partnerId);
  await shoot(page, 'org-member-invite-pending', { surface: 'member-invite', invitesBefore, errors: [...errors] });
  check('org-member-invite-visible', invitesBefore.pendingInvite, JSON.stringify(invitesBefore).slice(0, 160));
  /* accept the pending organization membership (real pointer click on the row Accept) */
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /Accept/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1600);
  /* switch to the joined organization workspace */
  await switchToOrgWorkspace(page, 'Brightpath Academy');
  await settle(page, 1200);

  /* Analyst home: OrganizationAccessHome with only the Aggregate insights door */
  await page.goto(`${base}/dashboard/home`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1200);
  await h1Ready(page);
  const memberHome = await page.evaluate((ownerEmail) => {
    const t = document.body.innerText;
    const doors = ['People', 'Cohorts and classes', 'Aggregate insights', 'Local audit', 'Seats and billing'].map(label => t.includes(label));
    return {
      h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 50),
      orgEmail: t.includes(ownerEmail),
      doors,
      aggregateOnly: doors[2] && !doors.some((d, i) => i !== 2 && d),
      privacy: /Private learner questions, personal notes and learning transcripts are excluded from administrative access/i.test(t),
    };
  }, ownerEmail);
  await shoot(page, 'org-member-home', { surface: 'member-home-permissions', memberHome, errors: [...errors] });
  check('org-member-access-home', memberHome.h1.includes('organization workspace') && memberHome.orgEmail && memberHome.aggregateOnly && memberHome.privacy, JSON.stringify(memberHome).slice(0, 240));

  /* Analyst analytics: reduced "Aggregate insights" surface (no academic) */
  await page.goto(`${base}/dashboard/analytics`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1200);
  await h1Ready(page);
  const memberAnalytics = await page.evaluate(() => ({
    reduced: /Aggregate insights/.test(document.body.innerText),
    noInstitutionMetrics: !/Institution analytics/.test(document.body.innerText),
  }));
  check('org-member-analytics-scoped', memberAnalytics.reduced && memberAnalytics.noInstitutionMetrics, JSON.stringify(memberAnalytics).slice(0, 180));

  /* Analyst blocked surfaces: audit / cohorts / curriculum / subscription */
  const blockedAreas = ['audit', 'cohorts', 'curriculum', 'library', 'subscription'];
  for (const area of blockedAreas) {
    await page.goto(`${base}/dashboard/${area}`, { waitUntil: 'load', timeout: 90000 });
    await settle(page, 1200);
    await h1Ready(page);
    const blocked = await page.evaluate((area) => {
      const t = document.body.innerText;
      return {
        permission: /Permission required|does not include this section/i.test(t),
        body: t.slice(0, 120).replace(/\n+/g, ' | '),
      };
    }, area);
    check(`org-member-blocked-${area}`, blocked.permission, `${area}: ${JSON.stringify(blocked).slice(0, 160)}`);
  }
  await shoot(page, 'org-member-blocked', { surface: 'member-blocked', blockedAreas, errors: [...errors] });
} catch (error) {
  defects.push(`journey: ${String(error).slice(0, 250)}`);
}
await context.close();
await browser.close();

const receipt = { task: 'F-22 organization experience review', at: new Date().toISOString(), base, ownerEmail, partnerEmail, records, defects };
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; defects: ${defects.length}`);
for (const defect of defects.slice(0, 12)) console.log(` - ${defect}`);
if (defects.length) process.exit(1);
console.log('PASS organization experience review: owner org journey + member permission matrix verified.');
