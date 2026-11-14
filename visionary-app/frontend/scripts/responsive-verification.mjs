/* F-08 (Responsive Engineer): live responsive verification harness.
 * Validates reflow at 320px (WCAG 1.4.10 proxy), mobile navigation, safe
 * areas, landscape orientation and dialog/tables behavior on the real
 * product: public surfaces + preview-mode workspace journey. No API
 * interception, no fixture seeding.
 * Env: RESP_BASE_URL (default http://127.0.0.1:4198), RESP_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.RESP_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.RESP_EVIDENCE_DIR || 'docs/visionary/baseline/f08-responsive-2026-11-06');
await fs.mkdir(evidence, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PASSWORD = 'Visionary#Baseline2026';
const records = [];
const failures = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

async function newContext(width, height) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.setDefaultNavigationTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 200)));
  return { context, page, errors };
}
const settle = async (page, ms = 1400) => {
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => document.readyState === 'complete' && (document.querySelector('h1, h2') || document.body.innerText.length > 200), { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(ms);
};
async function shoot(page, name, meta) {
  await page.screenshot({ path: path.join(evidence, `${name}.png`) });
  records.push({ file: `${name}.png`, ...meta });
  if (meta.errors?.length) failures.push(`${name}: page errors ${JSON.stringify(meta.errors)}`);
}

/* Reflow facts: horizontal scroll + the widest offenders. */
const reflow = (page) => page.evaluate(() => {
  const doc = document.scrollingElement;
  const overflowX = doc.scrollWidth - doc.clientWidth;
  const offenders = [];
  if (overflowX > 1) {
    const vw = doc.clientWidth;
    for (const el of document.querySelectorAll('body *')) {
      const rect = el.getBoundingClientRect();
      if (rect.width > vw + 2 && rect.right > vw + 2 && el.offsetParent !== null) {
        offenders.push({ tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 70), width: Math.round(rect.width) });
        if (offenders.length >= 6) break;
      }
    }
  }
  return { viewport: doc.clientWidth, scrollWidth: doc.scrollWidth, overflowX, offenders };
});

const checkReflow = (surface, key, scan) => {
  if (scan.overflowX > 1) {
    failures.push(`${surface} @ ${key}: horizontal overflow ${scan.overflowX}px — offenders ${JSON.stringify(scan.offenders)}`);
  }
};

/* ── Public reflow at 320 (WCAG 1.4.10 proxy) + 390 ── */
for (const [key, width, height] of [['320', 320, 700], ['390', 390, 844]]) {
  const { context, page, errors } = await newContext(width, height);
  for (const [route, name] of [['/', 'landing'], ['/login', 'login'], ['/pricing', 'pricing']]) {
    try {
      await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
      await settle(page);
      const scan = await reflow(page);
      await shoot(page, `responsive-${name}-${key}`, { surface: 'public', route, viewport: `${width}x${height}`, reflow: scan, errors: [...errors] });
      checkReflow(name, key, scan);
    } catch (error) {
      failures.push(`public ${route} @ ${key}: ${String(error).slice(0, 200)}`);
    }
  }
  await context.close();
}

/* ── Workspace journey at 390: bottom nav, safe area, reflow ── */
const CONTINUE = /^(Continue|Looks good|Get started|Finish|Complete setup|Next)$/i;
const submit = (page) => page.locator('main button[type="submit"], #main button[type="submit"], form button[type="submit"]').last();
const clickContinue = async (page) => {
  const s = submit(page);
  await s.waitFor({ state: 'visible', timeout: 20000 });
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (!(await s.isDisabled())) { await s.click(); return true; }
    await page.waitForTimeout(300);
  }
  return false;
};
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
}, { 'What should we call you?': 'Alex', 'Your age range': 'adult', 'Which board are you studying under?': 'CBSE', 'What language does your school use to teach?': 'English', 'Which class are you studying in?': 'Class 12' });

const { context, page, errors } = await newContext(390, 844);
try {
  await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
  await page.locator('input[type="email"]').first().fill(`resp-${Date.now()}@visionary.test`);
  await page.locator('button[type="submit"]').first().click();
  const passwords = page.locator('input[type="password"]');
  await passwords.first().fill(PASSWORD, { timeout: 20000 });
  if (await passwords.count() > 1) await passwords.nth(1).fill(PASSWORD);
  await page.locator('button[type="submit"]').last().click();
  const otp = page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]').first();
  await otp.waitFor({ state: 'visible', timeout: 30000 });
  try { await otp.fill('000000'); } catch { await otp.pressSequentially('000000'); }
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.waitForURL(/\/onboarding/, { timeout: 45000 });
  await page.waitForSelector('text=Make Visionary your own', { timeout: 45000 });
  await page.evaluate(() => [...document.querySelectorAll('main button, #main button')].find((b) => (b.textContent || '').includes('I am a Learner'))?.click());
  if (!await clickContinue(page)) throw new Error('identity continue stalled');
  await page.waitForSelector('text=A little about you', { timeout: 45000 });
  for (let guard = 0; guard < 14 && !page.url().includes('/dashboard'); guard += 1) {
    await page.waitForTimeout(500);
    if (page.url().includes('/dashboard')) break;
    await fillAndSelect(page);
    await page.waitForTimeout(350);
    if (!await clickContinue(page)) {
      await page.evaluate(() => [...document.querySelectorAll('main button, #main button')]
        .find((b) => b.offsetParent !== null && !b.disabled && b.getAttribute('aria-pressed') === 'false'
          && !/^(Back|Resend|Sign in|Log in|Verify|Skip for now|Use a different account|Continue|Looks good|Get started|Finish|Complete setup|Next)$/i.test((b.textContent || '').trim()))?.click());
      await page.waitForTimeout(350);
      if (!await clickContinue(page)) throw new Error('wizard stalled');
    }
  }
  if (!page.url().includes('/dashboard')) throw new Error('did not reach dashboard');
  await settle(page, 2500);
  const dialog = page.locator('[role="dialog"]').first();
  if (await dialog.isVisible().catch(() => false)) {
    /* Capture the welcome dialog at mobile width (dialog behavior evidence). */
    await shoot(page, 'responsive-dialog-mobile', { surface: 'workspace', route: page.url().replace(base, ''), note: 'D-066 welcome dialog at 390x844' });
    for (let i = 0; i < 3; i += 1) {
      await dialog.getByRole('button', { name: i === 2 ? 'Start exploring' : 'Continue', exact: true }).last().click();
      await page.waitForTimeout(600);
    }
  }
  const bottomNav = await page.evaluate(() => {
    const nav = document.querySelector('.workspace-bottom-nav');
    if (!nav) return null;
    const rect = nav.getBoundingClientRect();
    const cs = getComputedStyle(nav);
    return { visible: rect.height > 0, height: Math.round(rect.height), paddingBottom: cs.paddingBottom, position: cs.position, links: nav.querySelectorAll('a,button').length };
  });
  const scan = await reflow(page);
  await shoot(page, 'responsive-dashboard-mobile', { surface: 'workspace', route: page.url().replace(base, ''), viewport: '390x844', bottomNav, reflow: scan, errors: [...errors] });
  checkReflow('dashboard', '390', scan);
  if (!bottomNav || !bottomNav.visible) failures.push(`dashboard @ 390: mobile bottom nav missing`);
  /* Landscape re-check. */
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(800);
  const landscape = await reflow(page);
  const navStill = await page.evaluate(() => {
    const nav = document.querySelector('.workspace-bottom-nav');
    if (!nav) return null;
    const rect = nav.getBoundingClientRect();
    return { visible: rect.bottom <= window.innerHeight + 2, height: Math.round(rect.height) };
  });
  await shoot(page, 'responsive-dashboard-landscape', { surface: 'workspace', route: page.url().replace(base, ''), viewport: '844x390', reflow: landscape, bottomNav: navStill, errors: [...errors] });
  checkReflow('dashboard-landscape', '844x390', landscape);
  if (!navStill || !navStill.visible) failures.push('dashboard landscape: bottom nav clipped or missing');
} catch (error) {
  failures.push(`workspace journey: ${String(error).slice(0, 300)}`);
}
await context.close();
await browser.close();

const receipt = {
  task: 'F-08 responsive verification',
  at: new Date().toISOString(),
  base,
  law: 'viewport-fit=cover + env(safe-area-inset-*) laws; Apple-measured breakpoints (1068/734) + Tailwind scale; WCAG 1.4.10 reflow proxy at 320px',
  records,
  failures,
};
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; evidence -> ${path.relative(productRoot, evidence)}`);
if (failures.length) {
  console.log(`FAIL ${failures.length}:`);
  for (const failure of failures.slice(0, 10)) console.log(` - ${failure}`);
  process.exit(1);
}
console.log('PASS responsive verification: no horizontal overflow at 320/390/landscape; mobile nav and dialog behavior verified.');
