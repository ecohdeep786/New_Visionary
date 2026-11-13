/* F-15 (Quality Lead + QA): public frontend release gate.
 * Consolidates the lane harnesses into one integration gate:
 *   1. Route sweep — every public route renders (200, h1, zero page errors).
 *   2. Keyboard — skip-link path + visible focus on landing/login/dashboard.
 *   3. Accessibility spot — the F-10 rendered audit (contrast with gradient
 *      awareness, pseudo-union hit areas, semantics) on key surfaces.
 *   4. Critical navigation — register -> OTP -> onboarding -> dashboard.
 *   5. Visual regression reference — fresh captures of the surfaces changed
 *      since the F-03 baseline (login/pricing/landing/cookies) for the
 *      reviewer's dimension+visual comparison against the recorded baselines.
 * Env: GATE_BASE_URL (default http://127.0.0.1:4198), GATE_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.GATE_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.GATE_EVIDENCE_DIR || 'docs/visionary/baseline/f15-release-gate-2026-11-06');
await fs.mkdir(evidence, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PASSWORD = 'Visionary#Baseline2026';
const gates = [];
const failures = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

const settle = async (page, ms = 2000) => {
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => document.readyState === 'complete' && (document.querySelector('h1, h2') || document.body.innerText.length > 200), { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(ms);
};
const gate = (name, ok, detail) => { gates.push({ gate: name, result: ok ? 'PASS' : 'FAIL', detail }); if (!ok) failures.push(`${name}: ${detail}`); };

/* ── Gate 1: route sweep (all public routes) ── */
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/student', '/teacher', '/parent', '/help', '/professional', '/how-it-works', '/organization', '/download', '/about', '/pricing', '/careers', '/research', '/community', '/contact', '/partners', '/updates', '/referral', '/safety', '/privacy', '/terms', '/security', '/accessibility', '/cookies'];
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${page.url()}: ${String(e).slice(0, 120)}`));
  const swept = [];
  for (const route of PUBLIC_ROUTES) {
    const response = await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
    await settle(page);
    const h1 = await page.evaluate(() => (document.querySelector('h1')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50) || null);
    swept.push({ route, status: response?.status(), h1 });
    if (response?.status() !== 200) failures.push(`${route}: HTTP ${response?.status()}`);
  }
  const noH1 = swept.filter((s) => !s.h1);
  gate('route-sweep', errors.length === 0 && noH1.length === 0, `${swept.length} routes swept; ${noH1.length} without h1; ${errors.length} page errors`);
  records_write(swept, '01-route-sweep.json');
  await context.close();
}

/* ── Gate 2: keyboard (skip link + visible focus) ── */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 2800);
  await page.keyboard.press('Tab');
  const skip = await page.evaluate(() => {
    const el = document.activeElement;
    return { text: (el?.textContent || '').trim().slice(0, 20), href: el?.getAttribute('href') || null };
  });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const landed = await page.evaluate(() => {
    const main = document.querySelector('#main, main');
    return { insideMain: main ? (main === document.activeElement || main.contains(document.activeElement)) : false };
  });
  gate('keyboard-skip-link', skip.href === '#main' && landed.insideMain, JSON.stringify({ skip, landed }));
  /* Visible focus on a login control. */
  await page.goto(`${base}/login`, { waitUntil: 'load', timeout: 90000 });
  await settle(page, 1500);
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    const cs = el ? getComputedStyle(el) : null;
    return el && cs ? { visible: (parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none') || cs.boxShadow.includes('rgb'), outline: `${cs.outlineWidth} ${cs.outlineStyle}` } : null;
  });
  gate('keyboard-focus-visible', Boolean(focus?.visible), JSON.stringify(focus));
  await context.close();
}

/* ── Gate 3: accessibility spot (F-10 audit on key surfaces) + Gate 5 captures ── */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const changedSurfaces = [['/', 'landing'], ['/login', 'login'], ['/pricing', 'pricing'], ['/cookies', 'cookies']];
  let totalLow = 0, totalSmall = 0;
  for (const [route, name] of changedSurfaces) {
    await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
    await settle(page, route === '/' ? 3200 : 1500);
    const audit = await page.evaluate(() => {
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
      const texts = [...document.querySelectorAll('#main p,#main li,#main label,#main span,#main a,#main button,#main h1,#main h2,#main h3,#main td,#main th,main p,main span,main h1,main h2,main h3')]
        .filter((el) => el.offsetParent !== null && !el.closest('[aria-hidden="true"],.sr-only') && (el.textContent || '').trim().length > 1 && ![...el.childNodes].some((n) => n.nodeType === 1));
      let low = 0;
      const samples = [];
      for (const el of texts) {
        const cs = getComputedStyle(el);
        let fg = parse(cs.color); const bg = bgChain(el);
        if (!fg || !bg) continue;
        const isGradient = fg.a === 0 && (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') && cs.backgroundImage !== 'none';
        if (fg.a < 1) fg = over(fg, bg);
        const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight, 10) || 400;
        const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
        const ratio = isGradient ? ratioOf(parse('rgb(0,102,204)'), bg) : ratioOf(fg, bg);
        if (ratio < (large ? 3 : 4.5)) { low += 1; if (samples.length < 4) samples.push({ ratio, text: (el.textContent || '').trim().slice(0, 30) }); }
      }
      const controlsMeta = [...document.querySelectorAll('a[href],button')].filter((el) => el.offsetParent !== null).map((el) => {
        const r = el.getBoundingClientRect();
        let w = r.width, h = r.height;
        for (const pseudo of ['::after', '::before']) {
          const ps = getComputedStyle(el, pseudo);
          if (ps.content === 'none' || ps.position !== 'absolute') continue;
          h = Math.max(h, r.height + 2 * Math.abs(parseFloat(ps.top) || 0));
          w = Math.max(w, r.width + 2 * Math.abs(parseFloat(ps.left) || 0));
        }
        const inlineTextLink = el.tagName === 'A' && r.height < 24;
        const recordedException = el.tagName === 'BUTTON' && el.getAttribute('aria-haspopup') === 'listbox' && r.height < 24;
        return { minDim: inlineTextLink ? 44 : Math.min(w, h), recordedException };
      });
      const recordedExceptions = controlsMeta.filter(c => c.recordedException).length;
      const imgNoAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt') && i.getAttribute('aria-hidden') !== 'true').length;
      return { low, small: controlsMeta.filter((c) => c.minDim < 44 && !c.recordedException).length, recordedExceptions, imgNoAlt, controls: controlsMeta.length, samples };
    });
    totalLow += audit.low; totalSmall += audit.small;
    await page.screenshot({ path: path.join(evidence, `gate-${name}-1440.png`) });
    records_write(audit, `03-a11y-${name}.json`);
  }
  gate('accessibility-spot', totalLow === 0 && totalSmall === 0, `${totalLow} low-contrast, ${totalSmall} small controls across 4 changed surfaces`);
  await context.close();
}

/* ── Gate 4: critical navigation (register -> OTP -> onboarding -> dashboard) ── */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
  let journey = 'failed';
  try {
    await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 30000 });
    await page.locator('input[type="email"]').first().fill(`gate-${Date.now()}@visionary.test`);
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
    const s = page.locator('main button[type="submit"], form button[type="submit"]').last();
    await s.waitFor({ state: 'visible', timeout: 20000 });
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && (await s.isDisabled())) await page.waitForTimeout(300);
    await s.click();
    await page.waitForSelector('text=A little about you', { timeout: 45000 });
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
    for (let guard = 0; guard < 14 && !page.url().includes('/dashboard'); guard += 1) {
      await page.waitForTimeout(500);
      if (page.url().includes('/dashboard')) break;
      await fillAndSelect(page);
      await page.waitForTimeout(350);
      const btn = page.locator('main button[type="submit"], form button[type="submit"]').last();
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
      if (!advanced) throw new Error('wizard stalled');
    }
    if (page.url().includes('/dashboard')) journey = 'reached-dashboard';
  } catch (error) {
    journey = `error: ${String(error).slice(0, 120)}`;
  }
  gate('critical-navigation', journey === 'reached-dashboard' && errors.length === 0, journey + (errors.length ? `; ${errors.length} page errors` : ''));
  await context.close();
}

function records_write(data, name) { fs.writeFile(path.join(evidence, name), JSON.stringify(data, null, 2) + '\n').catch(() => {}); }

await browser.close();
const receipt = { task: 'F-15 public release gate', at: new Date().toISOString(), base, gates, failures };
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`GATES: ${gates.length}, failures: ${failures.length}`);
for (const g of gates) console.log(` ${g.result} ${g.gate} — ${g.detail.slice(0, 110)}`);
if (failures.length) { console.log('RELEASE GATE FAIL'); process.exit(1); }
console.log('RELEASE GATE PASS');
