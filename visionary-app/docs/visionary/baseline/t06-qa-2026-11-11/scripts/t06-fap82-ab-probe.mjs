import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const BEFORE = process.argv[2] || 'http://127.0.0.1:5174';
const AFTER = process.argv[3] || 'http://127.0.0.1:5173';
const outDir = process.argv[4] || 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t06-fap82-ab-2026-11-11';
fs.mkdirSync(outDir, { recursive: true });

/* The routes that flagged h1/h2 offscreen at 200% text in TEXT200_SCOPE.
   Eight are covered by the FAP-82 cap law (ladder tokens + unified h1 role
   law + hero eyebrow). /about, /partners, /careers and /research keep one
   box-level flag each from the min-content grid-track mechanism (heading
   TEXT fits — the min-content is inside the track; only the box is dragged
   by a sibling) — deliberate residual, recorded not asserted. */
const HEADLINE_ROUTES = ['/', '/student', '/teacher', '/parent', '/professional', '/organization', '/help', '/pricing'];
const RESIDUAL_ROUTES = ['/about', '/partners', '/careers', '/research'];
const ALL_ROUTES = [...HEADLINE_ROUTES, ...RESIDUAL_ROUTES];
const WIDTHS = [
  { key: '320x720', w: 320, h: 720 },
  { key: '390x844', w: 390, h: 844 },
];
const TOKEN_WIDTHS = [
  { key: '320', w: 320, h: 720 },
  { key: '390', w: 390, h: 844 },
  { key: '768', w: 768, h: 1024 },
  { key: '1024', w: 1024, h: 768 },
  { key: '1440', w: 1440, h: 900 },
];

const SWEEP = `(() => {
  const vw = document.documentElement.clientWidth;
  const scrollable = (el) => { let p = el.parentElement; while (p && p !== document.documentElement) { if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) return true; p = p.parentElement; } return false; };
  const visible = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.01; };
  const heads = [];
  for (const el of document.querySelectorAll('h1, h2')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right <= vw + 1 && r.left >= -1) continue;
    if (scrollable(el) || getComputedStyle(el).position === 'fixed') continue;
    const cs = getComputedStyle(el);
    const prev = el.style.width; el.style.width = 'min-content'; const mc = Math.round(el.getBoundingClientRect().width); el.style.width = prev;
    heads.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 70), fs: cs.fontSize, beyond: Math.round(Math.max(r.right - vw, -r.left)), minContent: mc, text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 60) });
  }
  const controls = [];
  for (const el of document.querySelectorAll('button, a')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right <= vw + 1) continue;
    if (scrollable(el) || getComputedStyle(el).position === 'fixed') continue;
    controls.push({ tag: el.tagName, fs: getComputedStyle(el).fontSize, beyond: Math.round(r.right - vw), text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 40) });
  }
  return { route: location.pathname, vw, docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, headsOffscreen: heads, controlsOffscreen: controls.slice(0, 12) };
})()`;

const PRICING_GEOMETRY = `(() => {
  const vw = document.documentElement.clientWidth;
  const g = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), h: Math.round(r.height), fs: cs.fontSize, w: Math.round(r.width) }; };
  const btns = [...document.querySelectorAll('[role="group"][aria-label="Billing period"] button')].map((b) => { const r = b.getBoundingClientRect(); return { text: (b.innerText || '').replace(/\\s+/g, ' '), left: Math.round(r.left), right: Math.round(r.right), pressed: b.getAttribute('aria-pressed') }; });
  const faq = [...document.querySelectorAll('section[data-section="04-faq"] button[id^="pricing-faq-question-"]')].map((b) => { const r = b.getBoundingClientRect(); return { id: b.id, left: Math.round(r.left), right: Math.round(r.right), expanded: b.getAttribute('aria-expanded') }; });
  return { vw, docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, h1: g('main h1'), span: g('main h1 .accent-gradient'), toggle: g('[role="group"][aria-label="Billing period"]'), toggleButtons: btns, faqH2: g('section[data-section="04-faq"] h2'), faqButtons: faq };
})()`;

const TOKENS = `(() => {
  const sec = document.querySelector('section[data-section="04-faq"]') || document.querySelector('main section');
  /* resolved font-size probes: the declaration string legitimately changed
     (2.75rem -> min(2.75rem, 14vw)), so the pixel-identical guard reads the
     computed length of each token in both scopes. */
  const rootProbe = document.createElement('div');
  document.body.appendChild(rootProbe);
  const secProbe = sec ? document.createElement('div') : null;
  if (sec) sec.appendChild(secProbe);
  const resolved = (probe, token) => { probe.style.fontSize = 'var(' + token + ')'; return getComputedStyle(probe).fontSize; };
  const out = {
    vw: document.documentElement.clientWidth,
    root: {
      heroEyebrow: resolved(rootProbe, '--fs-hero-eyebrow'),
      heroHeadline: resolved(rootProbe, '--fs-hero-headline'),
      categoryStatement: resolved(rootProbe, '--fs-category-statement'),
    },
    section: secProbe ? {
      display: resolved(secProbe, '--fs-display'),
      h2: resolved(secProbe, '--fs-h2'),
      productSection: resolved(secProbe, '--fs-product-section'),
      heroEyebrow: resolved(secProbe, '--fs-hero-eyebrow'),
      heroHeadline: resolved(secProbe, '--fs-hero-headline'),
    } : null,
  };
  const faqH2 = document.querySelector('section[data-section="04-faq"] h2');
  out.faqH2FontSize = faqH2 ? getComputedStyle(faqH2).fontSize : null;
  rootProbe.remove(); if (secProbe) secProbe.remove();
  return out;
})()`;

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

async function probeSide(label, base) {
  const data = { label, base, sweep: [], pricing320_100: null, pricingFunctional200: null, tokens: [], screenshots: [] };
  // ── 1 · 200% text sweep on the 12 flagged routes ──
  for (const vp of WIDTHS) {
    const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: true, hasTouch: true, locale: 'en-IN' });
    const page = await context.newPage();
    for (const route of ALL_ROUTES) {
      try {
        await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
        await page.waitForTimeout(400);
        await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
        await page.waitForTimeout(400);
        const m = await page.evaluate(SWEEP);
        data.sweep.push({ width: vp.key, ...m });
      } catch (e) {
        data.sweep.push({ width: vp.key, route, error: String(e).slice(0, 200) });
      }
    }
    // screenshots: /pricing at 320/200%
    if (vp.key === '320x720') {
      try {
        await page.goto(base + '/pricing', { waitUntil: 'load', timeout: 90000 });
        await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
        await page.waitForTimeout(600);
        const f1 = path.join(outDir, `${label}-pricing-320-200-hero.png`);
        await page.screenshot({ path: f1 });
        data.screenshots.push(f1);
        const faq = page.locator('section[data-section="04-faq"]');
        await faq.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        const f2 = path.join(outDir, `${label}-pricing-320-200-faq.png`);
        await page.screenshot({ path: f2 });
        data.screenshots.push(f2);
      } catch (e) {
        data.screenshots.push(`ERROR ${String(e).slice(0, 120)}`);
      }
    }
    await context.close();
  }
  // ── 2 · /pricing geometry at 320/100% (regression guard) ──
  {
    const context = await browser.newContext({ viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true, locale: 'en-IN' });
    const page = await context.newPage();
    await page.goto(base + '/pricing', { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(500);
    data.pricing320_100 = await page.evaluate(PRICING_GEOMETRY);
    const f3 = path.join(outDir, `${label}-pricing-320-100-hero.png`);
    await page.screenshot({ path: f3 });
    data.screenshots.push(f3);
    await context.close();
  }
  // ── 3 · /pricing functional at 320/200% ──
  {
    const context = await browser.newContext({ viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true, locale: 'en-IN' });
    const page = await context.newPage();
    await page.goto(base + '/pricing', { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await page.waitForTimeout(500);
    const geom = await page.evaluate(PRICING_GEOMETRY);
    let q0 = null, pressed = null, afterOverflow = null, clickError = null;
    try {
      await page.locator('#pricing-faq-question-0').click({ timeout: 8000 });
      await page.waitForTimeout(800);
      q0 = await page.evaluate(`(() => {
        const vw = document.documentElement.clientWidth;
        const btn = document.querySelector('#pricing-faq-question-0');
        const ans = document.querySelector('#pricing-faq-answer-0');
        const cs = getComputedStyle(ans);
        const p = ans.querySelector('p'); const pr = p ? p.getBoundingClientRect() : null;
        return { expanded: btn.getAttribute('aria-expanded'), hidden: ans.getAttribute('aria-hidden'), ansH: Math.round(ans.getBoundingClientRect().height), ansVisible: cs.visibility, ansRight: Math.round(ans.getBoundingClientRect().right), textRight: pr ? Math.round(pr.right) : null };
      })()`);
      await page.getByRole('button', { name: /Annual/ }).click({ timeout: 8000 });
      await page.waitForTimeout(400);
      pressed = await page.evaluate(`(() => [...document.querySelectorAll('[role="group"][aria-label="Billing period"] button')].map((b) => ({ text: (b.innerText || '').replace(/\\s+/g, ' '), pressed: b.getAttribute('aria-pressed') })))()`);
      afterOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    } catch (e) {
      clickError = String(e).slice(0, 200);
    }
    data.pricingFunctional200 = { geom, q0, pressed, afterOverflow, clickError };
    await context.close();
  }
  // ── 4 · token matrix at 100% (default-text regression guard) ──
  for (const vp of TOKEN_WIDTHS) {
    const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.w < 700, hasTouch: vp.w < 700, locale: 'en-IN' });
    const page = await context.newPage();
    await page.goto(base + '/pricing', { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(400);
    const t = await page.evaluate(TOKENS);
    data.tokens.push({ width: vp.key, ...t });
    await context.close();
  }
  return data;
}

console.log('probing BEFORE', BEFORE);
const before = await probeSide('before', BEFORE);
fs.writeFileSync(path.join(outDir, 'BEFORE.json'), JSON.stringify(before, null, 2));
console.log('probing AFTER', AFTER);
const after = await probeSide('after', AFTER);
fs.writeFileSync(path.join(outDir, 'AFTER.json'), JSON.stringify(after, null, 2));

// ── comparison ──
const v = { headline: {}, residual: {}, pricingFunctional: {}, tokens: {}, geometry100: {}, docOverflow: [] };
for (const width of WIDTHS.map(w => w.key)) {
  for (const route of HEADLINE_ROUTES) {
    const b = before.sweep.find(c => c.width === width && c.route === route);
    const a = after.sweep.find(c => c.width === width && c.route === route);
    v.headline[`${width} ${route}`] = { before: b ? b.headsOffscreen?.length ?? `ERR:${b.error?.slice(0, 60)}` : 'MISSING', after: a ? a.headsOffscreen?.length ?? `ERR:${a.error?.slice(0, 60)}` : 'MISSING', pass: a && a.headsOffscreen && a.headsOffscreen.length === 0 };
  }
  for (const route of RESIDUAL_ROUTES) {
    const b = before.sweep.find(c => c.width === width && c.route === route);
    const a = after.sweep.find(c => c.width === width && c.route === route);
    v.residual[`${width} ${route}`] = { before: b?.headsOffscreen?.length, after: a?.headsOffscreen?.length };
  }
  for (const side of [before, after]) {
    const cells = side.sweep.filter(c => c.width === width);
    for (const c of cells) if ((c.docOverflow ?? 0) !== 0) v.docOverflow.push({ side: side.label, width, route: c.route, docOverflow: c.docOverflow });
  }
}
{
  const f = after.pricingFunctional200;
  const checks = {
    h1InsideViewport: f.geom.h1 && f.geom.h1.right <= f.geom.vw + 1,
    spanInsideViewport: f.geom.span && f.geom.span.right <= f.geom.vw + 1,
    toggleInsideViewport: f.geom.toggle && f.geom.toggle.right <= f.geom.vw + 1,
    toggleButtonsInside: f.geom.toggleButtons.every(b => b.right <= f.geom.vw + 1),
    faqH2InsideViewport: f.geom.faqH2 && f.geom.faqH2.right <= f.geom.vw + 1,
    allFaqButtonsInside: f.geom.faqButtons.length === 6 && f.geom.faqButtons.every(b => b.right <= f.geom.vw + 1),
    faqAccordionOpens: f.q0 && f.q0.expanded === 'true' && f.q0.hidden === 'false' && f.q0.ansH > 20 && f.q0.textRight <= f.geom.vw + 1,
    billingToggleWorks: Array.isArray(f.pressed) && f.pressed.length === 2 && f.pressed.find(b => /Annual/.test(b.text))?.pressed === 'true',
    noOverflowAfterInteractions: f.afterOverflow === 0,
    noClickError: !f.clickError,
  };
  v.pricingFunctional = { checks, allPass: Object.values(checks).every(Boolean), detail: f };
}
for (const width of TOKEN_WIDTHS.map(w => w.key)) {
  const b = before.tokens.find(t => t.width === width);
  const a = after.tokens.find(t => t.width === width);
  v.tokens[width] = {
    root: { before: b?.root, after: a?.root, equal: JSON.stringify(b?.root) === JSON.stringify(a?.root) },
    section: { before: b?.section, after: a?.section, equal: JSON.stringify(b?.section) === JSON.stringify(a?.section) },
    faqH2FontSize: { before: b?.faqH2FontSize, after: a?.faqH2FontSize, equal: b?.faqH2FontSize === a?.faqH2FontSize },
    allEqual: JSON.stringify(b?.root) === JSON.stringify(a?.root) && JSON.stringify(b?.section) === JSON.stringify(a?.section) && b?.faqH2FontSize === a?.faqH2FontSize,
  };
}
{
  const b = before.pricing320_100, a = after.pricing320_100;
  const near = (x, y) => x != null && y != null && Math.abs(x - y) <= 1;
  v.geometry100 = {
    h1: { before: b.h1, after: a.h1, equal: near(b.h1?.right, a.h1?.right) && near(b.h1?.left, a.h1?.left) && b.h1?.fs === a.h1?.fs },
    span: { before: b.span, after: a.span, equal: near(b.span?.right, a.span?.right) && b.span?.fs === a.span?.fs },
    toggle: { before: b.toggle, after: a.toggle, equal: near(b.toggle?.right, a.toggle?.right) && near(b.toggle?.w, a.toggle?.w) },
    toggleButtons: { before: b.toggleButtons, after: a.toggleButtons, equal: JSON.stringify(b.toggleButtons) === JSON.stringify(a.toggleButtons) },
    faqH2: { before: b.faqH2, after: a.faqH2, equal: near(b.faqH2?.right, a.faqH2?.right) && b.faqH2?.fs === a.faqH2?.fs },
    faqButtons: { before: b.faqButtons, after: a.faqButtons, equal: JSON.stringify(b.faqButtons) === JSON.stringify(a.faqButtons) },
    docOverflow: { before: b.docOverflow, after: a.docOverflow },
  };
}
fs.writeFileSync(path.join(outDir, 'AB_COMPARISON.json'), JSON.stringify(v, null, 2));
console.log(JSON.stringify(v, null, 2));
await browser.close();
