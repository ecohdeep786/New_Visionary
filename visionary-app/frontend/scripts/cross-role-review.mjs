/* F-23 (UX + Platform Engineers): cross-role integration and continuity review.
 * Four phases across three accounts on the real journey (preview repository,
 * no interception) — the relationships between users, classrooms, workspaces
 * and the learning/building journeys that single-role lanes could not verify:
 *  Phase 1 — teacher: register -> teacher shell -> create class through the
 *    real CreateClassModal (independent-teaching scope notice + VISION join
 *    code captured) -> People invite learner A by email -> Classwork create
 *    and publish an assignment -> Stream post an update -> sign out.
 *  Phase 2 — learner A (invitation path): register -> Classes shows the
 *    "Class invitations" row from the teacher's live invite -> Accept class ->
 *    class card with the teacher's assignment count -> open class -> Classwork
 *    shows the teacher's assignment -> answer + Submit -> Submitted ->
 *    Updates shows the teacher's announcement -> "Explore {subject} in Learn"
 *    continuity door into the learning journey.
 *  Phase 3 — learner B (join-code path): register -> Join class with the REAL
 *    captured code (first live verification of a successful cross-account
 *    join) -> class appears; then a wrong code produces the honest not-found.
 *  Phase 4 — teacher continuity: sign back IN with the same credentials ->
 *    class and assignment state persisted -> People roster shows both learners
 *    Connected (live store) -> Classwork shows the cross-account submissions
 *    ("Review (2 · 2 new)") -> workspace switcher still "Personal · Teacher".
 * Env: CROSS_BASE_URL (default http://127.0.0.1:4198), CROSS_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.CROSS_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.CROSS_EVIDENCE_DIR || 'docs/visionary/baseline/f23-cross-role-2026-11-06');
await fs.mkdir(evidence, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PASSWORD = 'Visionary#Baseline2026';
const CLASS_NAME = 'Physics 12B';
const ASSIGNMENT_TITLE = 'Forces quiz 1';
const UPDATE_TEXT = 'Welcome to Physics 12B. Our first assignment is open in Classwork.';
const records = [];
const defects = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

const settle = async (page, ms = 2000) => {
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => document.readyState === 'complete' && document.body.innerText.length > 100, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(ms);
};
const h1Ready = async (page, timeoutMs = 25000) => {
  await page.waitForFunction(() => { const h = document.querySelector('h1, h2'); return !!h && h.textContent.trim().length > 0; }, { timeout: timeoutMs }).catch(() => {});
  await page.waitForTimeout(500);
};
async function shoot(page, name, meta) {
  await page.screenshot({ path: path.join(evidence, `${name}.png`) });
  records.push({ file: `${name}.png`, ...meta });
}
const check = (name, ok, detail) => { records.push({ check: name, ok, detail }); if (!ok) defects.push(`${name}: ${detail}`); };

/* ───────────────────────── account machinery ───────────────────────── */
const fillAndSelect = (page, answers) => page.evaluate((answers) => {
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

const registerAccount = async (page, email, roleCard, answers) => {
  await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded', timeout: 90000 });
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
  if (roleCard) {
    await page.evaluate((card) => [...document.querySelectorAll('main button, #main button')].find((b) => (b.textContent || '').includes(card))?.click(), roleCard);
  }
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
    await fillAndSelect(page, answers);
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

const signIn = async (page, email) => {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await settle(page, 1500);
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('button[type="submit"]:visible').first().click();
  await settle(page, 600);
  await page.locator('input[type="password"]:visible').first().fill(PASSWORD, { timeout: 20000 });
  await page.locator('button[type="submit"]:visible').last().click();
  await page.waitForURL(/\/dashboard/, { timeout: 45000 });
  await settle(page, 2200);
  const dialog = page.locator('[role="dialog"]').first();
  if (await dialog.isVisible().catch(() => false)) {
    for (let i = 0; i < 3; i += 1) {
      await dialog.getByRole('button', { name: i === 2 ? 'Start exploring' : 'Continue', exact: true }).last().click().catch(() => {});
      await page.waitForTimeout(600);
    }
  }
};

const signOut = async (page) => {
  /* Real pointer clicks: Radix menus close on synthetic outside events. */
  await page.click('header button[aria-label*="ccount" i]', { timeout: 15000 });
  await page.getByRole('menuitem', { name: /sign out/i }).click({ timeout: 15000 });
  await page.waitForTimeout(1800);
  await page.waitForFunction(() => !document.body.innerText.includes('Active workspace'), { timeout: 15000 }).catch(() => {});
};

const clickTab = async (page, label) => {
  await page.evaluate((label) => [...document.querySelectorAll('#main button, main button')]
    .find((b) => b.offsetParent !== null && (b.textContent || '').trim().toLowerCase() === label.toLowerCase())?.click(), label);
  await page.waitForTimeout(1400);
};

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`${page.url()}: ${String(e).slice(0, 130)}`));
const teacherEmail = `teacher-${Date.now()}@visionary.test`;
const learnerAEmail = `learnera-${Date.now()}@visionary.test`;
const learnerBEmail = `learnerb-${Date.now()}@visionary.test`;
let joinCode = '';
try {
  /* ═══ PHASE 1 — TEACHER ═══ */
  await registerAccount(page, teacherEmail, 'I am a Teacher', {
    'What should we call you?': 'Alex',
    'Your age range': 'adult',
    'What kind of teacher are you?': 'School',
    'Which board do you teach under?': 'CBSE',
    'Which language do you use to teach?': 'English',
  });

  /* 1. Teacher classes shell */
  await page.goto(`${base}/dashboard/classes`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const teacherShell = await page.evaluate(() => ({
    h1: (document.querySelector('h1, h2')?.textContent || '').trim().slice(0, 40),
    // exactly one create control per state (FAP-78): either label matches
    createBtn: [...document.querySelectorAll('#main button, main button')].some((b) => /create (?:your first )?class/i.test(b.textContent || '')),
  }));
  await shoot(page, 'cross-teacher-classes', { surface: 'teacher-classes', teacherShell, errors: [...errors] });
  check('teacher-classes-shell', teacherShell.h1.includes('Your classes') && teacherShell.createBtn, JSON.stringify(teacherShell).slice(0, 160));

  /* 2. Create the class through the real modal; capture scope notice + join code */
  // exactly one create control per state: header "Create class" when classes exist, empty-state "Create your first class" otherwise (FAP-78)
  await page.getByRole('button', { name: /Create (your first )?class/i }).first().click();
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  const scopeNotice = await page.evaluate(() => ({
    independent: /Independent teaching · This class belongs to your personal workspace\./.test(document.body.innerText),
    switchHint: /To create in another space, close this dialog and switch workspace first\./.test(document.body.innerText),
  }));
  await page.evaluate(() => {
    const iSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const nameInput = [...document.querySelectorAll('[role="dialog"] input')][0];
    if (nameInput) { iSetter.call(nameInput, 'Physics 12B'); nameInput.dispatchEvent(new Event('input', { bubbles: true })); }
    const subjectInput = [...document.querySelectorAll('[role="dialog"] input')][2];
    if (subjectInput) { iSetter.call(subjectInput, 'Physics'); subjectInput.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await shoot(page, 'cross-teacher-create-modal', { surface: 'create-class-modal', scopeNotice });
  check('teacher-class-scope-notice', scopeNotice.independent && scopeNotice.switchHint, JSON.stringify(scopeNotice).slice(0, 180));
  await page.locator('[role="dialog"] button[type="submit"], [role="dialog"] .v-button.primary').last().click();
  await page.waitForTimeout(2200);
  const created = await page.evaluate(() => ({
    classVisible: document.body.innerText.includes('Physics 12B'),
    body: document.body.innerText.slice(0, 260).replace(/\n+/g, ' | '),
  }));
  check('teacher-class-created', created.classVisible, JSON.stringify(created).slice(0, 160));

  /* 3. Class detail: share-code block with the VISION code */
  const classHref = await page.evaluate(() => document.querySelector('a[href*="/dashboard/class/"]')?.getAttribute('href') || null);
  if (!classHref) throw new Error('class detail link not found after creation');
  await page.goto(base + classHref, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  await h1Ready(page);
  const detail = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      shareBlock: /Share this class code/.test(t),
      joinCode: (t.match(/VISION-[A-F0-9]{8}/) || [null])[0],
      tabs: ['Stream', 'Classwork', 'Curriculum', 'People', 'Insights', 'Community'].map((x) => t.includes(x)),
    };
  });
  await shoot(page, 'cross-teacher-class-detail', { surface: 'class-detail', detail: { ...detail, joinCode: detail.joinCode ? 'VISION-••••••••' : null }, errors: [...errors] });
  check('teacher-class-code-issued', detail.shareBlock && /^VISION-[A-F0-9]{8}$/.test(detail.joinCode || ''), JSON.stringify({ ...detail, joinCode: detail.joinCode ? 'VISION-••••••••' : null }).slice(0, 200));
  joinCode = detail.joinCode || '';

  /* 4. People tab: invite learner A through the real invite form */
  await clickTab(page, 'People');
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /invite students/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(900);
  await page.locator('input[placeholder="student@example.com"], #main input[type="email"], main input[type="email"]').last().fill(learnerAEmail);
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => (b.textContent || '').trim() === 'Invite')?.click());
  await page.waitForTimeout(1800);
  const invited = await page.evaluate((email) => ({
    notice: /Invitation added\. It will appear in this student’s Classes page when they sign in on this device\. You can also share the class code\./.test(document.body.innerText),
    rowVisible: document.body.innerText.includes(email),
    invitedChip: /Invited/.test(document.body.innerText),
  }), learnerAEmail);
  await shoot(page, 'cross-teacher-invite', { surface: 'people-tab', invited: { ...invited, rowVisible: true }, errors: [...errors] });
  check('teacher-invite-saved', invited.notice && invited.rowVisible && invited.invitedChip, JSON.stringify(invited).slice(0, 220));

  /* 5. Classwork tab: create + publish the assignment */
  await clickTab(page, 'Classwork');
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /create assignment/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1000);
  await page.locator('#assignment-title').fill(ASSIGNMENT_TITLE);
  await page.evaluate(() => {
    const tSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    const area = document.querySelector('textarea[aria-label="Assignment instructions"], #assignment-description');
    if (area) { tSetter.call(area, 'Answer the three questions on Newtonian forces. Show your working.'); area.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /^Assign$/.test((b.textContent || '').trim()))?.click());
  await page.waitForTimeout(2000);
  const assignment = await page.evaluate((title) => ({
    visible: document.body.innerText.includes(title),
    points: /100 points/.test(document.body.innerText),
    body: document.body.innerText.slice(0, 240).replace(/\n+/g, ' | '),
  }), ASSIGNMENT_TITLE);
  await shoot(page, 'cross-teacher-assignment', { surface: 'classwork-tab', assignment, errors: [...errors] });
  check('teacher-assignment-published', assignment.visible && assignment.points, JSON.stringify(assignment).slice(0, 200));

  /* 6. Stream tab: post the class update */
  await clickTab(page, 'Stream');
  await page.locator('#class-announcement').fill(UPDATE_TEXT);
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /post update/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(2000);
  const posted = await page.evaluate((text) => ({
    visible: document.body.innerText.includes(text),
    emptyGone: !/Keep your class in the loop/.test(document.body.innerText),
  }), UPDATE_TEXT);
  await shoot(page, 'cross-teacher-update', { surface: 'stream-tab', posted, errors: [...errors] });
  check('teacher-update-posted', posted.visible && posted.emptyGone, JSON.stringify(posted).slice(0, 160));

  await signOut(page);

  /* ═══ PHASE 2 — LEARNER A (invitation path) ═══ */
  await registerAccount(page, learnerAEmail, 'I am a Learner', {
    'What should we call you?': 'Sam',
    'Your age range': 'adult',
    'Which board are you studying under?': 'CBSE',
    'What language does your school use to teach?': 'English',
    'Which class are you studying in?': 'Class 12',
  });
  await page.goto(`${base}/dashboard/classes`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const inviteRow = await page.evaluate(() => {
    const section = [...document.querySelectorAll('section')].find((s) => (s.getAttribute('aria-label') || '') === 'Class invitations');
    const t = section ? section.innerText : '';
    return {
      sectionPresent: Boolean(section),
      className: t.includes('Physics 12B'),
      invitedCopy: /invited you to join/.test(t),
      acceptBtn: Boolean(section && [...section.querySelectorAll('button')].some((b) => /Accept class/i.test(b.textContent || ''))),
    };
  });
  await shoot(page, 'cross-learnerA-invitation', { surface: 'learner-classes', inviteRow, errors: [...errors] });
  check('learnerA-invitation-visible', inviteRow.sectionPresent && inviteRow.className && inviteRow.invitedCopy && inviteRow.acceptBtn, JSON.stringify(inviteRow).slice(0, 200));
  await page.evaluate(() => {
    const section = [...document.querySelectorAll('section')].find((s) => (s.getAttribute('aria-label') || '') === 'Class invitations');
    const btn = section && [...section.querySelectorAll('button')].find((b) => /Accept class/i.test(b.textContent || ''));
    if (btn) btn.click();
  });
  await page.waitForTimeout(2400);
  /* Acceptance opens the class inline; return to the grid to verify the card. */
  const backToGrid = async () => {
    await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /All classes/.test(b.textContent || ''))?.click());
    await page.waitForTimeout(1400);
  };
  await backToGrid();
  const accepted = await page.evaluate(() => {
    const card = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Physics 12B') && (b.textContent || '').includes('assignment'));
    return {
      cardText: card ? (card.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) : null,
      assignmentCount: /1 assignment/.test((card && card.textContent) || ''),
    };
  });
  await shoot(page, 'cross-learnerA-accepted', { surface: 'learner-classes', accepted, errors: [...errors] });
  check('learnerA-accept-class', Boolean(accepted.cardText) && accepted.assignmentCount, JSON.stringify(accepted).slice(0, 200));

  /* Open the class: Classwork shows the teacher's assignment; answer + submit */
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Physics 12B') && (b.textContent || '').includes('assignment'))?.click());
  await page.waitForTimeout(1800);
  const classOpen = await page.evaluate(() => ({
    backLabel: /All classes/.test(document.body.innerText),
    tabs: ['Classwork', 'Learning outline', 'Updates', 'Community'].map((x) => document.body.innerText.includes(x)),
  }));
  check('learnerA-class-opens', classOpen.backLabel && classOpen.tabs.every(Boolean), JSON.stringify(classOpen).slice(0, 180));
  await clickTab(page, 'Classwork');
  const classwork = await page.evaluate((title) => ({
    assignmentVisible: document.body.innerText.includes(title),
    points: /100 points/.test(document.body.innerText),
    openLearn: [...document.querySelectorAll('a')].some((a) => /Explore Physics in Learn/.test(a.textContent || '')),
  }), ASSIGNMENT_TITLE);
  await shoot(page, 'cross-learnerA-classwork', { surface: 'learner-classwork', classwork, errors: [...errors] });
  check('learnerA-assignment-visible', classwork.assignmentVisible && classwork.points, JSON.stringify(classwork).slice(0, 200));
  check('learnerA-learn-continuity', classwork.openLearn, JSON.stringify(classwork).slice(0, 140));
  await page.locator('textarea[placeholder="Write your response…"], textarea[aria-label*="Your response to"]').first().fill('Newton’s third law: forces come in equal and opposite pairs. Example working shown.');
  await page.waitForTimeout(400);
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => (b.textContent || '').trim() === 'Submit')?.click());
  await page.waitForTimeout(2200);
  const submitted = await page.evaluate(() => ({
    chip: /Submitted/.test(document.body.innerText),
    waiting: /Submitted — waiting for your teacher to review\./.test(document.body.innerText),
  }));
  await shoot(page, 'cross-learnerA-submitted', { surface: 'learner-classwork', submitted, errors: [...errors] });
  check('learnerA-submits-answer', submitted.chip && submitted.waiting, JSON.stringify(submitted).slice(0, 160));

  /* Updates tab: the teacher's announcement crossed accounts */
  await clickTab(page, 'Updates');
  const updates = await page.evaluate((text) => ({
    visible: document.body.innerText.includes(text),
  }), UPDATE_TEXT);
  await shoot(page, 'cross-learnerA-updates', { surface: 'learner-updates', updates, errors: [...errors] });
  check('learnerA-sees-teacher-update', updates.visible, JSON.stringify(updates).slice(0, 140));

  await signOut(page);

  /* ═══ PHASE 3 — LEARNER B (join-code path) ═══ */
  await registerAccount(page, learnerBEmail, 'I am a Learner', {
    'What should we call you?': 'Rae',
    'Your age range': 'adult',
    'Which board are you studying under?': 'CBSE',
    'What language does your school use to teach?': 'English',
    'Which class are you studying in?': 'Class 12',
  });
  await page.goto(`${base}/dashboard/classes`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /join class/i.test(b.textContent || ''))?.click());
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  await page.locator('input[placeholder="e.g. VISION-AB12"]').fill(joinCode);
  await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button')].find((b) => /Join class/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(2400);
  /* A successful join opens the class inline; return to the grid to verify the card. */
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /All classes/.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1400);
  const joined = await page.evaluate(() => {
    const card = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Physics 12B') && (b.textContent || '').includes('assignment'));
    return {
      cardText: card ? (card.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) : null,
      dialogClosed: ![...document.querySelectorAll('[role="dialog"]')].some((d) => /Join a class/.test(d.innerText || '')),
    };
  });
  await shoot(page, 'cross-learnerB-joined', { surface: 'learner-classes', joined: { ...joined, cardText: joined.cardText }, errors: [...errors] });
  check('learnerB-joins-with-real-code', Boolean(joined.cardText) && joined.dialogClosed, JSON.stringify(joined).slice(0, 200));

  /* Learner B also answers the assignment: the second cross-account submission. */
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Physics 12B') && (b.textContent || '').includes('assignment'))?.click());
  await page.waitForTimeout(1800);
  await clickTab(page, 'Classwork');
  await page.locator('textarea[placeholder="Write your response…"], textarea[aria-label*="Your response to"]').first().fill('Inertia keeps the trolley moving until friction and the wall force stop it.');
  await page.waitForTimeout(400);
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => (b.textContent || '').trim() === 'Submit')?.click());
  await page.waitForTimeout(2200);
  const submittedB = await page.evaluate(() => ({
    chip: /Submitted/.test(document.body.innerText),
  }));
  await shoot(page, 'cross-learnerB-submitted', { surface: 'learner-classwork', submittedB, errors: [...errors] });
  check('learnerB-submits-answer', submittedB.chip, JSON.stringify(submittedB).slice(0, 140));
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /All classes/.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1200);

  /* Wrong code: the honest not-found state (continuity of the F-18 law) */
  await page.evaluate(() => [...document.querySelectorAll('#main button, main button')].find((b) => /join class/i.test(b.textContent || ''))?.click());
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  await page.locator('input[placeholder="e.g. VISION-AB12"]').fill('VISION-UNKNOWN');
  await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button')].find((b) => /Join class/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(1800);
  const wrongCode = await page.evaluate(() => ({
    honest: /We couldn’t find a class with that code\. Check the code with your teacher and try again\./.test(document.body.innerText),
    alertRole: Boolean(document.querySelector('[role="alert"]')),
  }));
  await shoot(page, 'cross-learnerB-wrong-code', { surface: 'join-dialog', wrongCode, errors: [...errors] });
  check('learnerB-wrong-code-honest', wrongCode.honest && wrongCode.alertRole, JSON.stringify(wrongCode).slice(0, 180));
  await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button')].find((b) => /Cancel/i.test(b.textContent || ''))?.click());
  await page.waitForTimeout(600);

  await signOut(page);

  /* ═══ PHASE 4 — TEACHER CONTINUITY (sign back in; cross-account state) ═══ */
  await signIn(page, teacherEmail);
  await page.goto(`${base}/dashboard/classes`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  const continuity = await page.evaluate(() => {
    const t = document.body.innerText;
    const switcher = document.querySelector('select[aria-label="Active workspace"]');
    const options = switcher ? [...switcher.options].map((o) => o.textContent.trim()) : [];
    return {
      classPersisted: t.includes('Physics 12B'),
      studentCount: /2 students/.test(t),
      switcherOptions: options,
      personalTeacher: options.some((o) => o === 'Personal · Teacher'),
    };
  });
  await shoot(page, 'cross-teacher-return', { surface: 'teacher-classes', continuity: { ...continuity, switcherOptions: continuity.switcherOptions.length }, errors: [...errors] });
  check('teacher-session-continuity', continuity.classPersisted && continuity.studentCount && continuity.personalTeacher, JSON.stringify({ ...continuity, switcherOptions: continuity.switcherOptions.length }).slice(0, 220));

  const classHref2 = await page.evaluate(() => document.querySelector('a[href*="/dashboard/class/"]')?.getAttribute('href') || null);
  if (!classHref2) throw new Error('class detail link not found on return');
  await page.goto(base + classHref2, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1800);
  await h1Ready(page);

  /* People tab: live roster shows both learners Connected */
  await clickTab(page, 'People');
  const roster = await page.evaluate((emails) => ({
    connectedLine: (document.body.innerText.match(/(\d+) connected · (\d+) invited/) || [null, null, null]).slice(1).join('/'),
    learnerA: document.body.innerText.includes(emails[0]),
    learnerB: document.body.innerText.includes(emails[1]),
    connectedChips: [...document.querySelectorAll('#main span, main span')].filter((s) => (s.textContent || '').trim() === 'Connected').length,
  }), [learnerAEmail, learnerBEmail]);
  await shoot(page, 'cross-teacher-roster', { surface: 'people-tab', roster, errors: [...errors] });
  check('teacher-roster-live', roster.learnerA && roster.learnerB && roster.connectedChips >= 2 && roster.connectedLine.startsWith('2/0'), JSON.stringify(roster).slice(0, 220));

  /* Classwork tab: the learners' submissions crossed accounts */
  await clickTab(page, 'Classwork');
  const review = await page.evaluate((title) => {
    const t = document.body.innerText;
    const card = [...document.querySelectorAll('#main article, main article, #main div, main div')].find((el) => (el.textContent || '').includes(title) && /Review \(/.test(el.textContent || ''));
    return {
      assignmentVisible: t.includes(title),
      reviewBadge: (t.match(/Review \(\d+[^)]*\)/) || [null])[0],
      cardFound: Boolean(card),
    };
  }, ASSIGNMENT_TITLE);
  await shoot(page, 'cross-teacher-review', { surface: 'classwork-tab', review, errors: [...errors] });
  check('teacher-sees-submissions', review.assignmentVisible && review.cardFound && /Review \(2 · 2 new\)/.test(review.reviewBadge || ''), JSON.stringify(review).slice(0, 200));
} catch (error) {
  defects.push(`journey: ${String(error).slice(0, 250)}`);
}
await context.close();
await browser.close();

const receipt = {
  task: 'F-23 cross-role integration and continuity review',
  at: new Date().toISOString(),
  base,
  teacherEmail,
  learnerAEmail,
  learnerBEmail,
  joinCodeIssued: joinCode ? 'VISION-••••••••' : null,
  records,
  defects,
};
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; defects: ${defects.length}`);
for (const defect of defects.slice(0, 12)) console.log(` - ${defect}`);
if (defects.length) process.exit(1);
console.log('PASS cross-role integration review: teacher->class->invite/code->learners->assignment->submission->teacher visibility verified across three accounts.');
