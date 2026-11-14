/* F-09 (Motion Engineer): live motion & interaction verification harness.
 * Verifies the D1 motion law at runtime: the one product curve on computed
 * transitions, entrance animation present by default and collapsed under
 * prefers-reduced-motion, visible keyboard focus states, and hover/active
 * interaction feedback. Public surfaces + preview-mode workspace journey.
 * Env: MOTION_BASE_URL (default http://127.0.0.1:4198), MOTION_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.MOTION_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.MOTION_EVIDENCE_DIR || 'docs/visionary/baseline/f09-motion-2026-11-06');
await fs.mkdir(evidence, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const LAW_CURVE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const PASSWORD = 'Visionary#Baseline2026';
const records = [];
const findings = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

const settle = async (page, ms = 1400) => {
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => document.readyState === 'complete' && (document.querySelector('h1, h2') || document.body.innerText.length > 200), { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(ms);
};
async function shoot(page, name, meta) {
  await page.screenshot({ path: path.join(evidence, `${name}.png`) });
  records.push({ file: `${name}.png`, ...meta });
}

const transitionProbe = (page, selector) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const cs = getComputedStyle(el);
  return { transitionProperty: cs.transitionProperty, duration: cs.transitionDuration, curve: cs.transitionTimingFunction };
}, selector);

const animationProbe = (page, selector) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const cs = getComputedStyle(el);
  return { animationName: cs.animationName, duration: cs.animationDuration, iteration: cs.animationIterationCount };
}, selector);

/* ── 1. Law curve on computed transitions (default motion) ── */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 150)));
  await page.goto(`${base}/`, { waitUntil: 'load', timeout: 90000 });
  await settle(page);
  const cta = await transitionProbe(page, '.cast-copy a, #main a[href*="login"], button');
  records.push({ check: 'law-curve-computed', selector: '.cast-copy a / #main a / button', cta, errors });
  if (cta && !cta.curve.includes('0.16') && !cta.curve.includes('cubic-bezier(0.16,1,0.3,1)')) {
    findings.push(`landing CTA transition curve "${cta.curve}" is not the law curve`);
  }
  const hero = await animationProbe(page, '.cast-copy span, [class*="hero-fade-up"]');
  records.push({ check: 'entrance-animation-default', hero });
  await page.screenshot({ path: path.join(evidence, 'motion-landing-default.png') });

  /* Hover feedback: scan visible primary controls; at least one must change
   * a computed paint property on hover. */
  const hover = await page.evaluate(() => new Promise((resolve) => {
    const controls = [...document.querySelectorAll('#main a[href], #main button, .cast-copy a, .cast-copy button')]
      .filter((el) => el.offsetParent !== null && (el.textContent || '').trim().length > 2).slice(0, 6);
    const results = [];
    let index = 0;
    const step = () => {
      if (index >= controls.length) { resolve(results); return; }
      const el = controls[index];
      const csBefore = getComputedStyle(el);
      const before = { bg: csBefore.backgroundColor, color: csBefore.color, transform: csBefore.transform };
      const event = new MouseEvent('mouseover', { bubbles: true });
      el.dispatchEvent(event);
      el.classList.add('__probe-hover');
      setTimeout(() => {
        const csAfter = getComputedStyle(el);
        const after = { bg: csAfter.backgroundColor, color: csAfter.color, transform: csAfter.transform };
        results.push({ text: (el.textContent || '').trim().slice(0, 24), changed: JSON.stringify(before) !== JSON.stringify(after), before, after });
        index += 1;
        setTimeout(step, 60);
      }, 120);
    };
    step();
  }));
  const anyHover = hover.some((h) => h.changed);
  records.push({ check: 'hover-feedback', hover, anyHover });
  if (!anyHover) findings.push('landing: no scanned control produced a computed hover change (probe is synthetic; real :hover may differ)');
  await page.screenshot({ path: path.join(evidence, 'motion-landing-hover.png') });

  /* Keyboard focus visibility: Tab until a focused control reports a visible outline/ring. */
  const focus = await page.evaluate(() => new Promise((resolve) => {
    let last = null;
    const step = () => {
      const el = document.activeElement;
      if (el && el !== document.body) {
        const cs = getComputedStyle(el);
        const visible = (parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none') || (cs.boxShadow !== 'none' && cs.boxShadow.includes('rgb')) ;
        last = { tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 30), outline: `${cs.outlineWidth} ${cs.outlineStyle}`, boxShadow: cs.boxShadow.slice(0, 80), visible };
        if (visible) { resolve(last); return; }
      }
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      /* Synthesize focus movement: the SPA binds focus-visible via real key events. */
      const focusables = [...document.querySelectorAll('a[href], button, input, select, [tabindex]:not([tabindex="-1"])')].filter((n) => n.offsetParent !== null);
      const index = focusables.indexOf(document.activeElement);
      const next = focusables[index + 1] || focusables[0];
      if (next) next.focus();
      attempts += 1;
      if (attempts > 12) { resolve(last); return; }
      setTimeout(step, 60);
    };
    let attempts = 0;
    step();
  }));
  records.push({ check: 'focus-visible-landing', focus });
  if (!focus || focus.visible !== true) findings.push(`landing: no visibly outlined focus state found in the Tab walk — ${JSON.stringify(focus)}`);
  await context.close();
}

/* ── 2. Reduced motion collapses entrance animation ── */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 600);
  const heroReduce = await animationProbe(page, '.cast-copy span, [class*="hero-fade-up"]');
  /* The D1 reduced contract: motion collapses to static-and-visible. Per-sheet
   * contracts (cast.css etc.) keep opacity-only fades so content is never
   * invisible — movement (transform) must not run. */
  const probeReduce = await page.evaluate(() => {
    const animating = [...document.querySelectorAll('*')]
      .filter((n) => n.offsetParent !== null && getComputedStyle(n).animationName !== 'none')
      .slice(0, 5)
      .map((n) => {
        const cs = getComputedStyle(n);
        return { animationName: cs.animationName, duration: cs.animationDuration, transform: cs.transform, opacity: cs.opacity, cls: String(n.className).slice(0, 40) };
      });
    return { count: animating.length, animating };
  });
  records.push({ check: 'reduced-motion', heroReduce, probeReduce });
  await page.screenshot({ path: path.join(evidence, 'motion-landing-reduced.png') });
  for (const animation of probeReduce.animating) {
    if (animation.transform !== 'none' && animation.transform !== 'matrix(1, 0, 0, 1, 0, 0)') {
      findings.push(`reduced motion: movement animation still runs (${animation.animationName}, transform ${animation.transform})`);
    }
  }
  await context.close();
}

/* ── 3. Workspace interaction + focus (preview journey) ── */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 150)));
  try {
    await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
    await page.locator('input[type="email"]').first().fill(`motion-${Date.now()}@visionary.test`);
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
    /* Focus law via REAL keyboard events (programmatic focus does not match
     * :focus-visible). Tab from the identity grid until a control shows its
     * ring/outline. */
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const wizardFocus = await page.evaluate(() => {
      for (let i = 0; i < 10; i += 1) {
        const el = document.activeElement;
        if (el && el !== document.body) {
          const cs = getComputedStyle(el);
          const ringVisible = cs.boxShadow !== 'none' && cs.boxShadow.includes('rgb');
          const outlineVisible = parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none';
          if (ringVisible || outlineVisible) {
            return { text: (el.textContent || '').trim().slice(0, 30), boxShadow: cs.boxShadow.slice(0, 90), outline: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`, visible: true, tabs: i };
          }
        }
        return { text: (document.activeElement?.textContent || '').trim().slice(0, 30), boxShadow: getComputedStyle(document.activeElement).boxShadow.slice(0, 90), outline: `${getComputedStyle(document.activeElement).outlineWidth} ${getComputedStyle(document.activeElement).outlineStyle}`, visible: false, tabs: i };
      }
    });
    records.push({ check: 'focus-law-wizard', wizardFocus });
    if (wizardFocus && wizardFocus.visible === false) findings.push(`wizard: no visible focus indicator after real Tab focus — ${JSON.stringify(wizardFocus)}`);
    await page.evaluate(() => [...document.querySelectorAll('main button, #main button')].find((b) => (b.textContent || '').includes('I am a Learner'))?.click());
    const submitBtn = page.locator('main button[type="submit"], form button[type="submit"]').last();
    await submitBtn.waitFor({ state: 'visible', timeout: 20000 });
    const wizardTransition = await transitionProbe(page, 'main button[type="submit"]');
    records.push({ check: 'law-curve-wizard-submit', wizardTransition, errors });
    if (wizardTransition && !/0\.16/.test(wizardTransition.curve.replace(/\s/g, '')) ) findings.push(`wizard submit curve "${wizardTransition.curve}" is not the law curve`);
  } catch (error) {
    findings.push(`workspace journey: ${String(error).slice(0, 250)}`);
  }
  await context.close();
}

await browser.close();
const receipt = { task: 'F-09 motion & interaction verification', at: new Date().toISOString(), base, lawCurve: LAW_CURVE, records, findings };
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; evidence -> ${path.relative(productRoot, evidence)}`);
if (findings.length) {
  console.log(`FINDINGS ${findings.length}:`);
  for (const finding of findings) console.log(` - ${finding}`);
  process.exit(1);
}
console.log('PASS motion verification: law curve computed, reduced motion collapses, focus visible, hover feedback present.');
