import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] || 'http://127.0.0.1:5174';
const outDir = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t06-text200-scope-2026-11-11';
fs.mkdirSync(outDir, { recursive: true });
const ROUTES = ['/', '/student', '/teacher', '/parent', '/professional', '/organization', '/how-it-works', '/help', '/pricing', '/download', '/about', '/research', '/community', '/updates', '/partners', '/referral', '/privacy', '/terms', '/cookies', '/safety', '/security', '/accessibility', '/careers', '/contact'];
const WIDTHS = [{ key: '320x720', w: 320, h: 720 }, { key: '390x844', w: 390, h: 844 }];

const MEASURE = `(() => {
  const vw = document.documentElement.clientWidth;
  const textOf = (el) => (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 90);
  const selOf = (el) => el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className || '').split(/\\s+/).filter(Boolean).slice(0, 3).join('.');
  const visible = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.01; };
  const scrollableAncestor = (el) => { let p = el.parentElement; while (p && p !== document.documentElement) { if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) return true; p = p.parentElement; } return false; };
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const beyond = Math.max(0, Math.round(r.right - vw), Math.round(-r.left));
    if (beyond <= 1) continue;
    if (scrollableAncestor(el) || getComputedStyle(el).position === 'fixed') continue;
    const txt = textOf(el);
    if (!txt) continue;
    out.push({ sel: selOf(el), beyond, text: txt });
  }
  return { path: location.pathname, vw, docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, offscreen: out.slice(0, 20) };
})()`;

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const out = { base, started: new Date().toISOString(), cells: [], errors: [] };
for (const vp of WIDTHS) {
  const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: true, hasTouch: true, locale: 'en-IN' });
  const page = await context.newPage();
  for (const route of ROUTES) {
    try {
      await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
      await page.waitForTimeout(400);
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      await page.waitForTimeout(400);
      const m = await page.evaluate(MEASURE);
      out.cells.push({ route, viewport: vp.key, ...m });
      if (m.offscreen.length) {
        console.log(`FLAG ${vp.key} ${route}: ${m.offscreen.length} offscreen-text elements; first: ${m.offscreen[0].sel} +${m.offscreen[0].beyond}px '${m.offscreen[0].text.slice(0, 50)}'`);
        await page.screenshot({ path: path.join(outDir, `flag-${vp.key}-${route.replaceAll('/', '-') || 'home'}.png`), fullPage: false }).catch(() => {});
      }
    } catch (e) {
      out.errors.push({ vp: vp.key, route, error: String(e).slice(0, 250) });
      console.log(`ERR ${vp.key} ${route}: ${String(e).slice(0, 120)}`);
    }
  }
  await context.close();
}
out.finished = new Date().toISOString();
out.summary = { cells: out.cells.length, offscreenCells: out.cells.filter(c => c.offscreen.length).length, routesAffected: [...new Set(out.cells.filter(c => c.offscreen.length).map(c => c.route))], errors: out.errors.length };
fs.writeFileSync(path.join(outDir, 'TEXT200_SCOPE.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.summary, null, 2));
await browser.close();
