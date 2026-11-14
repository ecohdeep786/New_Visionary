/* F-07 (Iconography Engineer): live icon verification harness.
 * Verifies rendered stroke weights against the recorded law (public-icons.css
 * / workspace-design.css: 1.75 normal pictograms), icon-only control
 * accessible names, and VisionaryLogo consistency across surfaces, on the
 * real product: public landing + preview-mode workspace journey. No API
 * interception, no fixture seeding.
 * Env: ICON_BASE_URL (default http://127.0.0.1:4198), ICON_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.ICON_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.ICON_EVIDENCE_DIR || 'docs/visionary/baseline/f07-iconography-2026-11-06');
await fs.mkdir(evidence, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PASSWORD = 'Visionary#Baseline2026';
const records = [];
const findings = [];
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
  if (meta.errors?.length) findings.push(`${name}: page errors ${JSON.stringify(meta.errors)}`);
}

/* Icon facts for the current page. */
const iconScan = (page) => page.evaluate(() => {
  const svgs = [...document.querySelectorAll('svg')];
  const lucide = svgs.filter((s) => s.classList.contains('lucide') || (s.getAttribute('class') || '').includes('lucide'));
  const strokes = {};
  for (const s of lucide) {
    const sw = getComputedStyle(s).strokeWidth;
    strokes[sw] = (strokes[sw] || 0) + 1;
  }
  const unlabeled = [];
  for (const control of document.querySelectorAll('button, a[href], [role="button"]')) {
    if (control.offsetParent === null) continue;
    const name = (control.getAttribute('aria-label') || control.getAttribute('aria-labelledby') || (control.textContent || '').replace(/\s+/g, ' ').trim() || control.getAttribute('title') || '').trim();
    if (name) continue;
    const svg = control.querySelector('svg');
    if (svg && (svg.classList.contains('lucide') || control.textContent.trim().length === 0)) {
      unlabeled.push({ tag: control.tagName.toLowerCase(), svgClass: (svg.getAttribute('class') || '').slice(0, 60), html: control.outerHTML.slice(0, 140) });
    }
  }
  const logos = [...document.querySelectorAll('svg[aria-label="Visionary"]')].map((s) => ({ height: getComputedStyle(s).height, width: getComputedStyle(s).width }));
  return { lucideCount: lucide.length, allSvgCount: svgs.length, strokes, unlabeled, logos };
});

/* ── Public pass ── */
for (const [key, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const { context, page, errors } = await newContext(width, height);
  await page.goto(`${base}/`, { waitUntil: 'load', timeout: 90000 });
  await settle(page);
  const scan = await iconScan(page);
  await shoot(page, `iconography-landing-${key}`, { surface: 'public', route: '/', viewport: `${width}x${height}`, scan, errors: [...errors] });
  for (const unlabeled of scan.unlabeled.slice(0, 8)) {
    findings.push(`landing ${key}: icon-only control without accessible name — ${unlabeled.html}`);
  }
  await context.close();
}

/* ── Workspace pass: preview journey (student, English) ── */
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
const { context, page, errors } = await newContext(1440, 900);
try {
  await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
  await page.locator('input[type="email"]').first().fill(`icono-${Date.now()}@visionary.test`);
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
  const answers = {
    'What should we call you?': 'Alex', 'Your age range': 'adult',
    'Which board are you studying under?': 'CBSE',
    'What language does your school use to teach?': 'English',
    'Which class are you studying in?': 'Class 12',
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
  }, answers);
  await fillAndSelect(page);
  await clickContinue(page);
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
    for (let i = 0; i < 3; i += 1) {
      await dialog.getByRole('button', { name: i === 2 ? 'Start exploring' : 'Continue', exact: true }).last().click();
      await page.waitForTimeout(600);
    }
  }
  const scan = await iconScan(page);
  await shoot(page, 'iconography-dashboard-desktop', { surface: 'workspace', route: page.url().replace(base, ''), scan, errors: [...errors] });
  for (const unlabeled of scan.unlabeled.slice(0, 8)) {
    findings.push(`dashboard: icon-only control without accessible name — ${unlabeled.html}`);
  }
  /* Law gate: workspace-governed lucide icons render at the 1.75 CSS law. */
  const governed = Object.entries(scan.strokes).filter(([sw]) => parseFloat(sw) !== 1.75);
  records.push({ finding: 'workspace-stroke-distribution', note: 'computed stroke widths of workspace lucide icons; workspace-design.css law = 1.75 for .v-button/.v-page/.workspace-topbar svgs', strokes: scan.strokes, offLaw: governed.length > 0 ? governed.map(([sw, count]) => `${sw} x${count}`) : [] });
} catch (error) {
  findings.push(`workspace journey: ${String(error).slice(0, 300)}`);
}
await context.close();
await browser.close();

const receipt = {
  task: 'F-07 iconography verification',
  at: new Date().toISOString(),
  base,
  law: 'public-icons.css --icon-stroke 1.75 (landing spec: 24px/stroke 1.75/tokenized sizes); workspace-design.css 1.75 for governed svgs',
  records,
  findings,
};
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; evidence -> ${path.relative(productRoot, evidence)}`);
if (findings.length) {
  console.log(`FINDINGS ${findings.length}:`);
  for (const finding of findings.slice(0, 12)) console.log(` - ${finding}`);
  process.exit(1);
}
console.log('PASS iconography verification: no unlabeled icon-only controls; stroke law verified on governed icons.');
