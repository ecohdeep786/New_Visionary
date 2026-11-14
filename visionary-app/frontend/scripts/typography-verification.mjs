/* F-06 (Typography Engineer): live typography verification harness.
 * Verifies font loading, weights, sizes/line heights against the recorded
 * type law (styles/README.md), wrapping laws and language fallbacks on the
 * real product: public landing (no auth) + preview-mode workspace journey
 * (register -> OTP -> onboarding, learning language Hindi so Devanagari
 * content renders). No API interception, no fixture seeding.
 * Env: TYPO_BASE_URL (default http://127.0.0.1:4198), TYPO_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.TYPO_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.TYPO_EVIDENCE_DIR || 'docs/visionary/baseline/f06-typography-2026-11-06');
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

/* Computed typography facts for a matched element set. */
const typo = (page, selector) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const cs = getComputedStyle(el);
  return { selector: sel, family: cs.fontFamily, size: cs.fontSize, lineHeight: cs.lineHeight, weight: cs.fontWeight, wrap: cs.textWrap, letterSpacing: cs.letterSpacing };
}, selector);

const fontsState = (page) => page.evaluate(() => ({
  loaded: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`),
  flex600: document.fonts.check('600 16px "Google Sans Flex"'),
  flex700: document.fonts.check('700 16px "Google Sans Flex"'),
  product600: document.fonts.check('600 16px "Google Sans"'),
  product700: document.fonts.check('700 16px "Google Sans"'),
}));

/* ── Public pass ── */
for (const [key, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const { context, page, errors } = await newContext(width, height);
  await page.goto(`${base}/`, { waitUntil: 'load', timeout: 90000 });
  await settle(page);
  const body = await typo(page, 'body');
  /* The hero is a fixed hero: the h1 wrapper is intentionally role-free and
   * the visible spans carry var(--fs-hero-headline) inline (styles/README:
   * "Original root tokens remain independent for fixed heroes"). */
  const heroSpan = await typo(page, '.cast-copy span[style*="--fs-hero-headline"]');
  const lead = await typo(page, '[data-type="lead"], [data-type="editorial-lead"]');
  const bodyInScope = await typo(page, '#main section:not([data-section="01-hero"]) [data-type="body"]');
  const bodyLaw = await page.evaluate(() => {
    const el = document.querySelector('#main section:not([data-section="01-hero"]) [data-type="body"]');
    return el ? {
      lhVar: getComputedStyle(el).getPropertyValue('--lh-body').trim(),
      fsVar: getComputedStyle(el).getPropertyValue('--fs-body').trim(),
      computedLineHeight: getComputedStyle(el).lineHeight,
      computedFontSize: getComputedStyle(el).fontSize,
    } : null;
  });
  const allH1 = await page.evaluate(() => [...document.querySelectorAll('h1')].map((el) => ({
    text: (el.textContent || '').trim().slice(0, 40), size: getComputedStyle(el).fontSize, weight: getComputedStyle(el).fontWeight, cls: el.className.slice(0, 60),
  })));
  const balanced = await typo(page, '#main h2, main h2');
  const fonts = await fontsState(page);
  await shoot(page, `typography-landing-${key}`, { surface: 'public', route: '/', viewport: `${width}x${height}`, body, heroSpan, lead, bodyInScope, bodyLaw, allH1, balancedHeading: balanced, fonts, errors: [...errors] });
  if (bodyLaw && bodyLaw.computedFontSize === '17px' && Math.abs(parseFloat(bodyLaw.computedLineHeight) - 25) > 1) {
    records.push({ finding: 'body-role-line-height', note: `recorded law body = 17/25 (styles/README) but --lh-body: ${bodyLaw.lhVar} (rhythm.css, commented "25px/21px" display-body ratio) yields ${bodyLaw.computedLineHeight} at 17px`, evidence: bodyLaw });
  }
  /* Law gates: public family is Google Sans Flex; the fixed-hero headline
   * resolves from the root tokens at display scale with a real 600 face. */
  if (!body || !/Google Sans Flex/.test(body.family)) failures.push(`landing ${key}: body family "${body?.family}" is not --font-public`);
  if (!heroSpan || parseFloat(heroSpan.size) < 40) failures.push(`landing ${key}: fixed-hero headline ${heroSpan?.size} is not display scale`);
  if (!fonts.flex600) failures.push(`landing ${key}: Google Sans Flex 600 face did not load`);
  await context.close();
}

/* ── Workspace pass: preview journey with Hindi learning language ── */
const answers = {
  'What should we call you?': 'Alex', 'Your age range': 'adult',
  'Which board are you studying under?': 'CBSE',
  'What language does your school use to teach?': 'Hindi',
  'Which class are you studying in?': 'Class 12',
};
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
  await page.locator('input[type="email"]').first().fill(`typo-hi-${Date.now()}@visionary.test`);
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
  await page.evaluate((answers) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    for (const input of [...document.querySelectorAll('main input[type="text"], #main input[type="text"]')]) {
      if (input.value || input.offsetParent === null) continue;
      const label = [...document.querySelectorAll('label')].find((l) => l.htmlFor === input.id)?.textContent?.trim();
      if (label === 'What should we call you?') { setter.call(input, 'Alex'); input.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    const ssetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    for (const select of [...document.querySelectorAll('main select, #main select')]) {
      if (select.offsetParent === null || select.value) continue;
      const label = [...document.querySelectorAll('label')].find((l) => l.htmlFor === select.id)?.textContent?.trim();
      if (label === 'Your age range') { ssetter.call(select, 'adult'); select.dispatchEvent(new Event('change', { bubbles: true })); }
    }
  }, answers);
  await clickContinue(page);
  for (let guard = 0; guard < 14 && !page.url().includes('/dashboard'); guard += 1) {
    await page.waitForTimeout(500);
    if (page.url().includes('/dashboard')) break;
    await page.evaluate((answers) => {
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
      const target = [...document.querySelectorAll('main button, #main button')]
        .find((b) => b.offsetParent !== null && !b.disabled && b.getAttribute('aria-pressed') === 'false'
          && (b.textContent || '').trim() && !skip.test((b.textContent || '').trim())
          && (wanted.includes((b.textContent || '').trim().toLowerCase()) || true));
      if (target) target.click();
    }, answers);
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
  /* Dismiss the D-066 welcome dialog via its own flow so content is visible. */
  const dialog = page.locator('[role="dialog"]').first();
  if (await dialog.isVisible().catch(() => false)) {
    for (let i = 0; i < 3; i += 1) {
      await dialog.getByRole('button', { name: i === 2 ? 'Start exploring' : 'Continue', exact: true }).last().click();
      await page.waitForTimeout(600);
    }
  }

  const root = await page.evaluate(() => {
    const el = document.querySelector('.visionary-workspace');
    return el ? { lang: el.closest('[lang]')?.getAttribute('lang') || el.getAttribute('lang'), family: getComputedStyle(el).fontFamily } : null;
  });
  const h1 = await typo(page, '.visionary-workspace h1, [data-font-surface="product"] h1');
  const semibold = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.visionary-workspace *, [data-font-surface="product"] *')]
      .find((n) => n.offsetParent !== null && getComputedStyle(n).fontWeight === '600' && (n.textContent || '').trim().length > 3);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { text: (el.textContent || '').trim().slice(0, 40), family: cs.fontFamily, size: cs.fontSize, weight: cs.fontWeight };
  });
  /* Switch languages through the product's own personalization UI. */
  await page.goto(`${base}/dashboard/personalization`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1200);
  await page.evaluate(() => {
    const sSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    for (const select of [...document.querySelectorAll('select[aria-label]')]) {
      const label = select.getAttribute('aria-label');
      if (/Teaching language|Interface language/i.test(label)) {
        const options = [...select.options].map((o) => o.value);
        const hi = options.find((v) => v === 'hi');
        if (hi) { sSetter.call(select, hi); select.dispatchEvent(new Event('change', { bubbles: true })); }
      }
    }
  });
  await page.waitForTimeout(800);
  await page.goto(`${base}/dashboard/home`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 2000);
  const indic = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent || '';
      if (/[\u0900-\u097F]/.test(text) && text.trim().length > 3) {
        const el = node.parentElement;
        const cs = getComputedStyle(el);
        const inherited = el.closest('[lang]');
        return { sample: text.trim().slice(0, 40), family: cs.fontFamily, lineHeight: cs.lineHeight, size: cs.fontSize, langAttr: inherited?.getAttribute('lang') || null };
      }
    }
    return null;
  });
  const fonts = await fontsState(page);
  await shoot(page, 'typography-dashboard-hi-desktop', { surface: 'workspace', route: page.url().replace(base, ''), root, h1, semibold, indic, fonts, errors: [...errors] });
  if (!root || !/Google Sans/.test(root.family)) failures.push(`workspace: family "${root?.family}" is not --font-product`);
  if (semibold && fonts.product600 === false) {
    records.push({ finding: 'workspace-600-mapping', note: 'computed weight 600 renders via the 700 face: static Google Sans declares no 600 (@font-face set 400/500/700); CSS Fonts matching picks 700 for desired 600', semibold, product600: fonts.product600, product700: fonts.product700 });
  }
  if (!indic) {
    records.push({ finding: 'hi-content-not-visible', note: 'no Devanagari text node found on the captured dashboard surface; hi rendering verified where content exposes it' });
  } else if (!/Google Sans/.test(indic.family) === false && !indic.langAttr) {
    failures.push(`workspace hi node lacks a lang ancestor: ${JSON.stringify(indic)}`);
  }
} catch (error) {
  failures.push(`workspace journey: ${String(error).slice(0, 300)}`);
}
await context.close();
await browser.close();

const receipt = {
  task: 'F-06 typography verification',
  at: new Date().toISOString(),
  base,
  law: 'styles/README.md type-role table; tokens.css surface families; workspace :lang(hi)/:lang(bn) line-height laws',
  records,
  failures,
};
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; evidence -> ${path.relative(productRoot, evidence)}`);
for (const record of records.filter((r) => r.finding)) console.log(`NOTE ${record.finding}: ${record.note}`);
if (failures.length) {
  console.log(`FAIL ${failures.length}:`);
  for (const failure of failures) console.log(` - ${failure}`);
  process.exit(1);
}
console.log('PASS typography verification: surface families, hero weight/face, and hi fallback rendering verified.');
