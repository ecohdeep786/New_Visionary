/* F-19 (Education + Product Engineers): teacher experience review.
 * Drives the teacher workflows through the real journey: register ->
 * onboarding -> role-add teacher -> create a class (CreateClassModal) ->
 * class detail tabs (stream/classwork/curriculum/people/insights) ->
 * create assignment -> learners honest state -> Prepare surface ->
 * Insights. Preview repository mode; no interception.
 * Env: TEACHER_BASE_URL (default http://127.0.0.1:4198), TEACHER_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.TEACHER_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.TEACHER_EVIDENCE_DIR || 'docs/visionary/baseline/f19-teacher-2026-11-06');
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

const registerTeacher = async (page) => {
  const email = `teacher-${Date.now()}@visionary.test`;
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
  await page.evaluate(() => [...document.querySelectorAll('main button, #main button')].find((b) => (b.textContent || '').includes('I am a Teacher'))?.click());
  const answers = { 'What should we call you?': 'Alex', 'Your age range': 'adult', 'What kind of teacher are you?': 'School', 'Which board do you teach under?': 'CBSE', 'Which language do you use to teach?': 'English' };
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
  await registerTeacher(page);

  /* ── 1. Prepare surface (lesson preparation) ── */
  await page.goto(`${base}/dashboard/prepare`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const prepare = await page.evaluate(() => ({
    h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 60),
    body: document.body.innerText.slice(0, 350).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'teacher-prepare', { surface: 'prepare', prepare, errors: [...errors] });
  check('prepare-surface', Boolean(prepare.h1), JSON.stringify(prepare).slice(0, 140));

  /* ── 2. Create a class through the modal ── */
  await page.goto(`${base}/dashboard/classes`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  // exactly one create control per state: header "Create class" when classes exist, empty-state "Create your first class" otherwise (FAP-78)
  await page.getByRole('button', { name: /Create (your first )?class/i }).first().click();
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  await page.evaluate(() => {
    const iSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const nameInput = [...document.querySelectorAll('[role="dialog"] input')][0];
    if (nameInput) { iSetter.call(nameInput, 'Physics 9A'); nameInput.dispatchEvent(new Event('input', { bubbles: true })); }
    const subjectInput = [...document.querySelectorAll('[role="dialog"] input')][2];
    if (subjectInput) { iSetter.call(subjectInput, 'Physics'); subjectInput.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await shoot(page, 'teacher-create-class-modal', { surface: 'classes', note: 'CreateClassModal filled' });
  await page.locator('[role="dialog"] button[type="submit"], [role="dialog"] .v-button.primary').last().click();
  await page.waitForTimeout(2000);
  const created = await page.evaluate(() => ({
    classVisible: document.body.innerText.includes('Physics 9A'),
    joinCode: (document.body.innerText.match(/[A-Z]{4,}-[A-Z0-9]{3,}/) || [null])[0],
    body: document.body.innerText.slice(0, 300).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'teacher-class-created', { surface: 'classes', created, errors: [...errors] });
  check('class-created', created.classVisible, JSON.stringify(created).slice(0, 160));

  /* ── 3. Class detail tabs ── */
  const classLink = await page.evaluate(() => document.querySelector('a[href*="/dashboard/class/"]')?.getAttribute('href') || null);
  if (classLink) {
    await page.goto(base + classLink, { waitUntil: 'load', timeout: 90000 });
    await settle(page, 1800);
    const detail = await page.evaluate(() => ({
      tabs: [...document.querySelectorAll('#main button, main button')].filter((b) => b.offsetParent !== null).map((b) => (b.textContent || '').trim().slice(0, 18)).filter((t) => /stream|classwork|curriculum|people|insights|community/i.test(t)),
      joinCode: (document.body.innerText.match(/[A-Z]{4,}-[A-Z0-9]{3,}/) || [null])[0],
    }));
    await shoot(page, 'teacher-class-detail', { surface: 'class-detail', detail, errors: [...errors] });
    check('class-detail-tabs', detail.tabs.length >= 4, JSON.stringify(detail));

    /* Curriculum tab */
    await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /curriculum/i.test(b.textContent || ''))?.click());
    await page.waitForTimeout(1500);
    const curriculum = await page.evaluate(() => ({
      body: document.body.innerText.slice(0, 350).replace(/\n+/g, ' | '),
      honest: /assign|curriculum|no .*yet|not connected|provisional/i.test(document.body.innerText),
    }));
    await shoot(page, 'teacher-class-curriculum', { surface: 'class-detail', curriculum });
    check('class-curriculum-tab', curriculum.honest, JSON.stringify(curriculum).slice(0, 140));

    /* Classwork tab + create assignment */
    await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /classwork/i.test(b.textContent || ''))?.click());
    await page.waitForTimeout(1200);
    const classwork = await page.evaluate(() => ({
      createBtn: [...document.querySelectorAll('#main button, main button')].some((b) => /create assignment/i.test(b.textContent || '')),
      body: document.body.innerText.slice(0, 300).replace(/\n+/g, ' | '),
    }));
    await shoot(page, 'teacher-class-classwork', { surface: 'class-detail', classwork });
    check('class-classwork-tab', classwork.createBtn, JSON.stringify(classwork).slice(0, 140));
    await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /create assignment/i.test(b.textContent || ''))?.click());
    await page.waitForTimeout(1500);
    const assignForm = await page.evaluate(() => ({
      inlineForm: [...document.querySelectorAll('#main form, main form')].filter((f) => f.offsetParent !== null && /assign|title|instruction/i.test(f.innerText || '')).length,
      fields: [...document.querySelectorAll('#main input:not([type="hidden"]), #main textarea, main input:not([type="hidden"]), main textarea')].filter((i) => i.offsetParent !== null).length,
    }));
    await shoot(page, 'teacher-assignment-form', { surface: 'class-detail', assignForm });
    check('assignment-creation-inline-form', assignForm.inlineForm > 0 && assignForm.fields > 0, JSON.stringify(assignForm));

    /* People tab: honest empty roster */
    await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /people/i.test(b.textContent || ''))?.click());
    await page.waitForTimeout(1200);
    const people = await page.evaluate(() => ({
      honestEmpty: /connect|invite learners|no .*(students|people|learners)|not joined|no one/i.test(document.body.innerText),
      body: document.body.innerText.slice(0, 250).replace(/\n+/g, ' | '),
    }));
    await shoot(page, 'teacher-class-people', { surface: 'class-detail', people });
    check('class-people-honest', people.honestEmpty, JSON.stringify(people).slice(0, 140));

    /* Insights tab */
    await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /insights/i.test(b.textContent || ''))?.click());
    await page.waitForTimeout(1200);
    const insights = await page.evaluate(() => ({
      body: document.body.innerText.slice(0, 250).replace(/\n+/g, ' | '),
      honest: /not enough|no .*(yet|data)|awaiting|once/i.test(document.body.innerText),
    }));
    await shoot(page, 'teacher-class-insights', { surface: 'class-detail', insights });
    check('class-insights-honest', insights.honest, JSON.stringify(insights).slice(0, 140));
  } else {
    check('class-detail-tabs', false, 'class link not found after creation');
  }

  /* ── 4. Learners surface (no learners yet) ── */
  await page.goto(`${base}/dashboard/learners`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const learners = await page.evaluate(() => ({
    h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 50),
    honest: /no .*(learners|students)|not connected|once.*connect|invite learners|yet/i.test(document.body.innerText),
    body: document.body.innerText.slice(0, 280).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'teacher-learners', { surface: 'learners', learners, errors: [...errors] });
  check('learners-honest', Boolean(learners.h1) && learners.honest, JSON.stringify(learners).slice(0, 140));

  /* ── 5. Insights surface ── */
  await page.goto(`${base}/dashboard/insights`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const insights2 = await page.evaluate(() => ({
    h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 50),
    body: document.body.innerText.slice(0, 280).replace(/\n+/g, ' | '),
  }));
  await shoot(page, 'teacher-insights', { surface: 'insights', insights2, errors: [...errors] });
  check('insights-surface', Boolean(insights2.h1), JSON.stringify(insights2).slice(0, 140));
} catch (error) {
  defects.push(`journey: ${String(error).slice(0, 250)}`);
}
await context.close();
await browser.close();

const receipt = { task: 'F-19 teacher experience review', at: new Date().toISOString(), base, records, defects };
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; defects: ${defects.length}`);
for (const defect of defects.slice(0, 8)) console.log(` - ${defect}`);
if (defects.length) process.exit(1);
console.log('PASS teacher experience review: class creation, tabs, curriculum, assignment, learners, insights verified.');
