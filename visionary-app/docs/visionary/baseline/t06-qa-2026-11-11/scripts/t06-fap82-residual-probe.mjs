import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true, locale: 'en-IN' });
const page = await context.newPage();

// ── 1 · home h1.m-0 anatomy ──
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(500);
await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
await page.waitForTimeout(400);
const home = await page.evaluate(`(() => {
  const out = [];
  for (const h1 of document.querySelectorAll('h1')) {
    const r = h1.getBoundingClientRect();
    const cs = getComputedStyle(h1);
    out.push({
      cls: String(h1.className), fs: cs.fontSize, w: Math.round(r.width), right: Math.round(r.right),
      text: (h1.innerText || '').replace(/\\s+/g, ' ').slice(0, 80),
      kids: [...h1.children].map(k => { const kr = k.getBoundingClientRect(); const kcs = getComputedStyle(k); return { tag: k.tagName, cls: String(k.className).slice(0, 50), pos: kcs.position, ws: kcs.whiteSpace, fs: kcs.fontSize, w: Math.round(kr.width), right: Math.round(kr.right), text: (k.textContent || '').replace(/\\s+/g, ' ').slice(0, 50) }; }),
    });
  }
  return out;
})()`);
console.log('HOME H1s:', JSON.stringify(home, null, 2));

// ── 2 · the +11px button present on every route (probe on /pricing) ──
await page.goto(base + '/pricing', { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
await page.waitForTimeout(400);
const btn = await page.evaluate(`(() => {
  const vw = document.documentElement.clientWidth;
  const scrollable = (el) => { let p = el.parentElement; while (p && p !== document.documentElement) { if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) return true; p = p.parentElement; } return false; };
  const out = [];
  for (const el of document.querySelectorAll('button, a')) {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1 || cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (r.right <= vw + 1) continue;
    if (scrollable(el) || cs.position === 'fixed') continue;
    out.push({ tag: el.tagName, cls: String(el.className).slice(0, 100), pos: cs.position, fs: cs.fontSize, pad: cs.padding, w: Math.round(r.width), left: Math.round(r.left), right: Math.round(r.right), text: (el.innerText || '').replace(/\\s+/g, ' ').slice(0, 40), aria: el.getAttribute('aria-label') });
  }
  return out;
})()`);
console.log('PRICING offscreen controls:', JSON.stringify(btn, null, 2));

// ── 3 · /careers + /research flagged h2 ancestry (who drags the box) ──
for (const route of ['/careers', '/research']) {
  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.waitForTimeout(400);
  const info = await page.evaluate(`(() => {
    const vw = document.documentElement.clientWidth;
    const scrollable = (el) => { let p = el.parentElement; while (p && p !== document.documentElement) { if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) return true; p = p.parentElement; } return false; };
    const hs = [...document.querySelectorAll('h2')].filter(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return r.width > 1 && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.01 && r.right > vw + 1 && !scrollable(el) && cs.position !== 'fixed'; });
    return hs.map(h => {
      const r = h.getBoundingClientRect(); const cs = getComputedStyle(h);
      const chain = [];
      let p = h.parentElement; let depth = 0;
      while (p && p !== document.body && depth < 6) {
        const pr = p.getBoundingClientRect(); const pcs = getComputedStyle(p);
        chain.push({ tag: p.tagName, cls: String(p.className).slice(0, 70), display: pcs.display, w: Math.round(pr.width), right: Math.round(pr.right), overflowX: pcs.overflowX, cols: pcs.gridTemplateColumns.slice(0, 60) });
        p = p.parentElement; depth++;
      }
      // siblings inside nearest grid/flex ancestor
      const anc = h.parentElement;
      const sibs = [...anc.children].map(s => { const sr = s.getBoundingClientRect(); const scs = getComputedStyle(s); const prev = s.style.width; s.style.width = 'min-content'; const mc = Math.round(s.getBoundingClientRect().width); s.style.width = prev; return { tag: s.tagName, cls: String(s.className).slice(0, 55), w: Math.round(sr.width), minContent: mc, ws: scs.whiteSpace, right: Math.round(sr.right), text: (s.innerText || '').replace(/\\s+/g, ' ').slice(0, 40) }; });
      return { text: (h.innerText || '').replace(/\\s+/g, ' ').slice(0, 50), fs: cs.fontSize, w: Math.round(r.width), right: Math.round(r.right), minContentEl: (() => { const prev = h.style.width; h.style.width = 'min-content'; const mc = Math.round(h.getBoundingClientRect().width); h.style.width = prev; return mc; })(), chain, sibs };
    });
  })()`);
  console.log(route.toUpperCase(), 'flagged h2 ancestry:', JSON.stringify(info, null, 2));
}
await browser.close();
