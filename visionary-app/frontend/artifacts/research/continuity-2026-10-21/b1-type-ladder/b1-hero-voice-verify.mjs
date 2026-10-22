/**
 * B1 one-voice hero verification (FAP-46) — the landing cast hero's rotating
 * audience line must render EVERY word at ONE size per width. The fit is
 * computed once from the widest fragment (canvas measure against the 980px
 * copy column) and held in state, so per-word remounts inherit it; the stage
 * never re-ranks words by length. Samples the live line across a full cycle
 * at 1440/1024/390 and asserts exactly one distinct font-size per width.
 */
import { chromium } from 'playwright-core';

const PORT = process.env.PORT || '5186';
const WIDTHS = [1440, 1024, 390];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
let failures = 0;
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: 'light' });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('main h1', { timeout: 12000 });
  await page.waitForTimeout(2000);
  const samples = await page.evaluate(async () => {
    const out = [];
    const t0 = performance.now();
    await new Promise((resolve) => {
      const iv = setInterval(() => {
        const el = document.querySelector('section[data-section="01-hero"] span.accent-gradient.whitespace-nowrap');
        if (el) {
          const s = getComputedStyle(el);
          out.push({ t: Math.round((performance.now() - t0) / 100) / 10, text: (el.innerText || '').trim().slice(0, 24), fs: s.fontSize });
        }
        if (performance.now() - t0 > 20000) { clearInterval(iv); resolve(); }
      }, 400);
    });
    return out;
  });
  await ctx.close();
  const sizes = [...new Set(samples.map((s) => s.fs))];
  const words = [...new Set(samples.map((s) => s.text))].filter(Boolean);
  const ok = sizes.length === 1 && words.length >= 3;
  if (!ok) failures += 1;
  console.log(`${width}: sizes=${JSON.stringify(sizes)} words=${JSON.stringify(words)} samples=${samples.length} ${ok ? 'PASS' : 'FAIL'}`);
}
await browser.close();
console.log(failures === 0 ? 'all widths ONE VOICE' : `${failures} width(s) FAILED`);
process.exitCode = failures === 0 ? 0 : 1;
