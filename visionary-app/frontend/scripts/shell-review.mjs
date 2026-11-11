/* F-17 (Architect + UX Engineer): internal shell & navigation review.
 * Verifies the dashboard shell through the REAL journey: register ->
 * onboarding -> role-add via the WorkspaceSwitcher dialog (four additional
 * roles), role-scoped sidebar contents, workspace switching, the navigation
 * allowlist guard, and the mobile More sheet. Preview repository mode.
 * Env: SHELL_BASE_URL (default http://127.0.0.1:4198), SHELL_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.SHELL_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.SHELL_EVIDENCE_DIR || 'docs/visionary/baseline/f17-shell-2026-11-06');
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

const registerAdult = async (page) => {
  const email = `shell-${Date.now()}@visionary.test`;
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
  await page.evaluate(() => [...document.querySelectorAll('main button, #main button')].find((b) => (b.textContent || '').includes('I am a Learner'))?.click());
  const answers = { 'What should we call you?': 'Alex', 'Your age range': 'adult', 'Which board are you studying under?': 'CBSE', 'What language does your school use to teach?': 'English', 'Which class are you studying in?': 'Class 12' };
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
  for (let guard = 0; guard < 14 && !page.url().includes('/dashboard'); guard += 1) {
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

const sidebarItems = (page) => page.evaluate(() => [...document.querySelectorAll('aside a, .workspace-sidebar a, nav[class*="sidebar"] a')]
  .filter((a) => a.offsetParent !== null).map((a) => (a.textContent || '').trim().slice(0, 20)).filter(Boolean));

const addRole = async (page, roleLabel) => {
  const addOption = await page.evaluate(() => {
    const select = document.querySelector('.workspace-switcher select');
    if (!select) return null;
    const opt = [...select.options].find((o) => /add a role|add role/i.test(o.textContent || ''));
    return opt ? opt.value : null;
  });
  if (!addOption) throw new Error('Add-role option not found in the workspace switcher');
  await page.evaluate((value) => {
    const select = document.querySelector('.workspace-switcher select');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    setter.call(select, value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, addOption);
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  await page.evaluate((label) => {
    const select = document.querySelector('[role="dialog"] select');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    const opt = [...select.options].find((o) => (o.textContent || '').toLowerCase().includes(label.toLowerCase()));
    if (opt) { setter.call(select, opt.value); select.dispatchEvent(new Event('change', { bubbles: true })); }
  }, roleLabel);
  await page.getByRole('button', { name: /confirm|add role|continue/i }).last().click();
  await page.waitForTimeout(1500);
};

const ROLE_EXPECT = {
  teacher: { primary: ['Home', 'Prepare', 'Classes', 'Learners', 'Insights'], cta: 'Create a class' },
  organization: { primary: ['Home', 'People', 'Cohorts', 'Curriculum', 'Insights'], cta: 'Add people' },
  professional: { primary: ['Home', 'Learn', 'Ask', 'Practice', 'Build', 'Career'], cta: 'Set a career goal' },
  parent: { primary: ['Home', 'Children', 'Reports', 'Connections'], cta: 'Connect your child' },
  student: { primary: ['Home', 'Learn', 'Ask', 'Practice', 'Build'], cta: 'Join a class' },
};

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
try {
  await registerAdult(page);
  await settle(page, 800);
  const studentItems = await sidebarItems(page);
  check('student-sidebar', ROLE_EXPECT.student.primary.every((p) => studentItems.some((i) => i.includes(p))), JSON.stringify(studentItems));

  for (const [role, expect] of Object.entries(ROLE_EXPECT)) {
    if (role === 'student') continue;
    await addRole(page, role);
    await settle(page, 1800);
    const items = await sidebarItems(page);
    const cta = await page.evaluate(() => {
      const links = [...document.querySelectorAll('header a, header button')].filter((el) => el.offsetParent !== null);
      return links.map((l) => (l.textContent || '').trim().slice(0, 30)).find((t) => t.length > 4) || null;
    });
    await shoot(page, `shell-${role}-desktop`, { role, sidebar: items, topbarCta: cta, errors: [...errors] });
    check(`${role}-sidebar`, expect.primary.every((p) => items.some((i) => i.includes(p))), `expected ${JSON.stringify(expect.primary)} got ${JSON.stringify(items)}`);
    records.push({ check: `${role}-cta`, detail: cta });
  }

  await page.evaluate(() => {
    const select = document.querySelector('.workspace-switcher select');
    const studentOption = [...select.options].find((o) => (o.textContent || '').toLowerCase().includes('personal'));
    if (studentOption) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(select, studentOption.value);
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await settle(page, 1800);
  const backItems = await sidebarItems(page);
  check('workspace-switch-student', ROLE_EXPECT.student.primary.every((p) => backItems.some((i) => i.includes(p))), JSON.stringify(backItems));

  await page.goto(`${base}/dashboard/prepare`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1500);
  const guard = await page.evaluate(() => ({
    path: location.pathname,
    onPrepare: location.pathname.includes('/dashboard/prepare'),
    bodyStart: document.body.innerText.slice(0, 80).replace(/\n+/g, ' | '),
  }));
  check('allowlist-guard-prepare-as-student', !guard.onPrepare || guard.bodyStart.toLowerCase().includes('home'), JSON.stringify(guard));

  /* Same authenticated session, mobile width: the md breakpoint switches
   * the shell to the bottom nav + More sheet. */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.goto(`${base}/dashboard/home`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 2000);
  const more = await page.evaluate(() => {
    const btn = document.querySelector('.workspace-bottom-more');
    if (!btn) return null;
    btn.click();
    return new Promise((r) => setTimeout(() => {
      const sheet = document.querySelector('#mobile-workspace-navigation, [role="dialog"]');
      const links = sheet ? [...sheet.querySelectorAll('a')].filter((a) => a.offsetParent !== null).map((a) => (a.textContent || '').trim().slice(0, 18)) : [];
      r({ opened: Boolean(sheet) && links.length >= 3, links });
    }, 700));
  });
  await page.screenshot({ path: path.join(evidence, 'shell-more-sheet-mobile.png') });
  check('mobile-more-sheet', Boolean(more?.opened && more.links.length >= 3), JSON.stringify(more));
} catch (error) {
  defects.push(`journey: ${String(error).slice(0, 250)}`);
}
await context.close();
await browser.close();

const receipt = { task: 'F-17 shell & navigation review', at: new Date().toISOString(), base, records, defects };
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; defects: ${defects.length}`);
for (const defect of defects.slice(0, 8)) console.log(` - ${defect}`);
if (defects.length) process.exit(1);
console.log('PASS shell & navigation review: role-add, scoping, switching, allowlist guard, More sheet verified.');
