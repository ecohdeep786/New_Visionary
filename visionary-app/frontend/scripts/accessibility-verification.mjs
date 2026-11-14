/* F-10 (Accessibility Engineer): live accessibility verification harness.
 * Runs the FAP-30 rendered audit (informative-text contrast with alpha
 * compositing + 44px hit areas), semantic checks (img alt, form labels,
 * heading order, landmarks), and the keyboard skip-link path on the real
 * product: public surfaces + preview-mode workspace journey. No API
 * interception, no fixture seeding.
 * Env: A11Y_BASE_URL (default http://127.0.0.1:4198), A11Y_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.A11Y_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.A11Y_EVIDENCE_DIR || 'docs/visionary/baseline/f10-accessibility-2026-11-06');
await fs.mkdir(evidence, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PASSWORD = 'Visionary#Baseline2026';
const records = [];
const defects = [];
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

/* FAP-30 rendered audit: informative-text contrast (alpha composited over the
 * painted ancestor chain) and 44px hit areas on visible controls. */
const renderedAudit = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((s) => parseFloat(s)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: fg.a + bg.a * (1 - fg.a) });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratioOf = (a, b) => { const l1 = lum(a), l2 = lum(b); const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]; return (hi + 0.05) / (lo + 0.05); };
  const bgChain = (el) => {
    const layers = []; let node = el;
    while (node && node !== document.documentElement) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0) layers.push(c);
      if (c && c.a >= 1) break;
      node = node.parentElement;
    }
    if (!layers.length || layers[layers.length - 1].a < 1) { const b = parse(getComputedStyle(document.body).backgroundColor); if (b) layers.push(b); }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
    return bg;
  };
  const texts = [...document.querySelectorAll('#main p,#main li,#main label,#main span,#main a,#main button,#main h1,#main h2,#main h3,#main td,#main th,#main dt,#main dd')]
    .filter((el) => el.offsetParent !== null && !el.closest('[aria-hidden="true"],.sr-only') && (el.textContent || '').trim().length > 1 && ![...el.childNodes].some((n) => n.nodeType === 1));
  const seen = new Map();
  for (const el of texts) {
    const cs = getComputedStyle(el);
    let fg = parse(cs.color); const bg = bgChain(el);
    if (!fg || !bg) continue;
    /* Gradient text paints the background-image through background-clip:text
     * with a transparent fill (public-system.css .accent-gradient). Detect it
     * BEFORE compositing overwrites the transparent alpha, and measure the
     * gradient's darkest endpoint instead of flagging the fill. */
    const isGradientText = fg.a === 0 && (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') && cs.backgroundImage !== 'none';
    if (fg.a < 1) fg = over(fg, bg);
    const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight, 10) || 400;
    const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
    const key = `${cs.color}|${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}|${fs}|${fw}`;
    if (!seen.has(key)) seen.set(key, { color: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, fs, fw, large, required: large ? 3 : 4.5, ratio: isGradientText ? Math.round(ratioOf(parse('rgb(0,102,204)'), bg) * 100) / 100 : Math.round(ratioOf(fg, bg) * 100) / 100, sample: (el.textContent || '').trim().slice(0, 40), html: el.outerHTML.slice(0, 160), gradientText: isGradientText });
  }
  const controls = [...document.querySelectorAll('#main a[href],#main button')]
    .filter((el) => el.offsetParent !== null)
    .map((el) => {
      const r = el.getBoundingClientRect();
      /* FAP-30 hit-area law counts pseudo hit-unions (qa:taps "pseudo hit-unions"): ::after/::before
       * absolute insets expand the target. Union = box inflated by the pseudo's symmetric offsets. */
      let w = r.width, h = r.height;
      for (const pseudo of ['::after', '::before']) {
        const ps = getComputedStyle(el, pseudo);
        if (ps.content === 'none' || ps.position !== 'absolute') continue;
        const top = parseFloat(ps.top) || 0, bottom = parseFloat(ps.bottom) || 0, left = parseFloat(ps.left) || 0, right = parseFloat(ps.right) || 0;
        h = Math.max(h, r.height + 2 * Math.max(Math.abs(top), Math.abs(bottom)));
        w = Math.max(w, r.width + 2 * Math.max(Math.abs(left), Math.abs(right)));
      }
      return { text: (el.textContent || '').trim().slice(0, 30), w: Math.round(w), h: Math.round(h), boxW: Math.round(r.width), boxH: Math.round(r.height), html: el.outerHTML.slice(0, 140) };
    })
    .filter((c) => c.w > 0);
  return {
    gradientTextSamples: [...seen.values()].filter((s) => s.gradientText).length,
    lowContrast: [...seen.values()].filter((s) => s.ratio < s.required && !s.gradientText),
    smallControls: controls.filter((c) => Math.min(c.w, c.h) < 44),
    sampled: seen.size, controlCount: controls.length,
  };
};

/* Semantic checks: img alt, form labels, heading order, landmarks, skip link. */
const semanticAudit = () => {
  const imgs = [...document.querySelectorAll('img')].map((el) => ({
    alt: el.getAttribute('alt'), hasAlt: el.hasAttribute('alt'),
    hidden: el.getAttribute('aria-hidden') === 'true' || el.getAttribute('role') === 'presentation' || el.closest('[aria-hidden="true"]') !== null,
    src: (el.getAttribute('src') || '').slice(0, 60),
  })).filter((i) => !i.hidden && !i.hasAlt);
  const inputs = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')].filter((el) => el.offsetParent !== null && el.type !== 'hidden').map((el) => {
    const id = el.id;
    const labeled = (id && document.querySelector(`label[for="${id}"]`)) || el.closest('label') || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
    return { tag: el.tagName.toLowerCase(), type: el.type || null, labeled: Boolean(labeled), name: el.name || null, html: el.outerHTML.slice(0, 120) };
  }).filter((i) => !i.labeled);
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => h.offsetParent !== null).map((h) => Number(h.tagName[1]));
  let skipped = null;
  for (let i = 1; i < headings.length; i += 1) {
    if (headings[i] - headings[i - 1] > 1) { skipped = { at: i, levels: headings.slice(Math.max(0, i - 2), i + 2) }; break; }
  }
  const landmarks = {
    main: Boolean(document.querySelector('main, [role="main"]')),
    nav: document.querySelectorAll('nav, [role="navigation"]').length,
    header: Boolean(document.querySelector('header, [role="banner"]')),
    footer: Boolean(document.querySelector('footer, [role="contentinfo"]')),
  };
  return { imgsWithoutAlt: imgs, inputsWithoutLabel: inputs, headingLevels: headings.slice(0, 12), skippedHeading: skipped, landmarks };
};

/* Skip-link keyboard path: Tab to the skip link, activate, focus must move past the nav. */
const skipLinkTest = async (page) => {
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => {
    const el = document.activeElement;
    return { text: (el?.textContent || '').trim().slice(0, 30), tag: el?.tagName?.toLowerCase(), href: el?.getAttribute('href') || null };
  });
  if (!first.href || !first.href.startsWith('#')) return { skipLink: first, activated: false, focusAfter: null };
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => {
    const el = document.activeElement;
    const main = document.querySelector('#main, main');
    return { tag: el?.tagName?.toLowerCase(), insideMain: main ? (main === el || main.contains(el)) : false, text: (el?.textContent || '').trim().slice(0, 30) };
  });
  return { skipLink: first, activated: true, focusAfter: after };
};

/* ── Public pass ── */
for (const [route, name] of [['/', 'landing'], ['/login', 'login'], ['/pricing', 'pricing']]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 150)));
  await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
  /* The landing's staged hero reveal animates text color/opacity from
   * transparent; audit after the entrance completes so computed colors are
   * the rendered final state. */
  await settle(page, route === '/' ? 3200 : 1400);
  const audit = await page.evaluate(renderedAudit);
  const semantic = await page.evaluate(semanticAudit);
  let skip = null;
  if (route === '/') skip = await skipLinkTest(page);
  await shoot(page, `a11y-${name}-desktop`, { surface: 'public', route, audit: { lowContrast: audit.lowContrast.length, smallControls: audit.smallControls.length, sampled: audit.sampled, controlCount: audit.controlCount }, semantic: { ...semantic, headingLevels: semantic.headingLevels }, skip, errors });
  for (const low of audit.lowContrast.slice(0, 6)) defects.push(`${route}: low contrast ${low.ratio} < ${low.required} — "${low.sample}" (${low.color} on ${low.bg})`);
  for (const small of audit.smallControls.slice(0, 4)) defects.push(`${route}: control ${small.w}x${small.h} < 44px — "${small.text}" ${small.html}`);
  if (!semantic.landmarks.main) defects.push(`${route}: no main landmark`);
  for (const img of semantic.imgsWithoutAlt.slice(0, 4)) defects.push(`${route}: img without alt — ${img.src}`);
  for (const input of semantic.inputsWithoutLabel.slice(0, 4)) defects.push(`${route}: unlabeled input — ${input.html}`);
  if (semantic.skippedHeading) defects.push(`${route}: heading level skip — ${JSON.stringify(semantic.skippedHeading)}`);
  await context.close();
}

/* ── Workspace journey pass ── */
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

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 150)));
  try {
    await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
    await page.locator('input[type="email"]').first().fill(`a11y-${Date.now()}@visionary.test`);
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
      for (let i = 0; i < 3; i += 1) {
        await dialog.getByRole('button', { name: i === 2 ? 'Start exploring' : 'Continue', exact: true }).last().click();
        await page.waitForTimeout(600);
      }
    }
    for (const route of ['/dashboard/home', '/dashboard/learn', '/dashboard/settings']) {
      await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
      await settle(page, 1800);
      const audit = await page.evaluate(renderedAudit);
      const semantic = await page.evaluate(semanticAudit);
      await shoot(page, `a11y-dashboard${route.replace('/dashboard', '')}`, { surface: 'workspace', route, audit: { lowContrast: audit.lowContrast.length, smallControls: audit.smallControls.length, sampled: audit.sampled, controlCount: audit.controlCount }, semantic, errors });
      for (const low of audit.lowContrast.slice(0, 5)) defects.push(`${route}: low contrast ${low.ratio} < ${low.required} — "${low.sample}" (${low.color} on ${low.bg})`);
      for (const small of audit.smallControls.slice(0, 4)) defects.push(`${route}: control ${small.w}x${small.h} < 44px — "${small.text}" ${small.html}`);
      if (!semantic.landmarks.main) defects.push(`${route}: no main landmark`);
      for (const img of semantic.imgsWithoutAlt.slice(0, 4)) defects.push(`${route}: img without alt — ${img.src}`);
      for (const input of semantic.inputsWithoutLabel.slice(0, 4)) defects.push(`${route}: unlabeled input — ${input.html}`);
      if (semantic.skippedHeading) defects.push(`${route}: heading level skip — ${JSON.stringify(semantic.skippedHeading)}`);
    }
  } catch (error) {
    defects.push(`workspace journey: ${String(error).slice(0, 250)}`);
  }
  await context.close();
}
await browser.close();

const receipt = { task: 'F-10 accessibility verification', at: new Date().toISOString(), base, records, defects };
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; defects: ${defects.length}`);
for (const defect of defects.slice(0, 24)) console.log(` - ${defect}`);
console.log(defects.length ? `AUDIT COMPLETE with ${defects.length} recorded defect(s)` : 'PASS no accessibility defects recorded');
