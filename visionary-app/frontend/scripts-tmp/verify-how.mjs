/* Verify converted how-it-works: chapter geometry, joins, CTA, key styles. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const failed = [];
page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/api/')) failed.push(`${r.status()} ${r.url()}`); });
await page.goto('http://localhost:5173/how-it-works', { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(900);
await page.evaluate(async () => {
  const step = Math.max(400, Math.floor(innerHeight * 0.8));
  for (let y = 0; y < document.body.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); }
  scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 400));
});

const report = await page.evaluate(() => {
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const secs = Array.from(document.querySelectorAll('#main > section')).map((s) => ({
    id: s.getAttribute('data-section') || s.id || null,
    pad: `${cs(s, 'padding-top')}/${cs(s, 'padding-bottom')}`,
    radius: cs(s, 'border-top-left-radius'),
    bt: `${cs(s, 'border-top-width')} ${cs(s, 'border-top-color')}`,
    bg: cs(s, 'background-color'),
    h: Math.round(s.getBoundingClientRect().height),
  }));
  const h = Array.from(document.querySelectorAll('#main h1, #main h2, #main h3')).map((el) => ({
    tag: el.tagName.toLowerCase(),
    fs: cs(el, 'font-size'), fw: cs(el, 'font-weight'), lh: cs(el, 'line-height'),
    t: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 44),
  }));
  const ctaPrimary = Array.from(document.querySelectorAll('#main a')).find((a) => a.textContent.trim() === 'Get started');
  const ctaLink = Array.from(document.querySelectorAll('#main a')).find((a) => a.textContent.trim().startsWith('See pricing'));
  const scenarioLink = Array.from(document.querySelectorAll('#main a')).find((a) => a.textContent.trim().startsWith('See the'));
  const fine = Array.from(document.querySelectorAll('#main p')).find((p) => p.textContent.includes('Free to start. Private by design.'));
  const dump = (el) => el ? { fs: cs(el, 'font-size'), fw: cs(el, 'font-weight'), bg: cs(el, 'background-color'), br: cs(el, 'border-top-width'), color: cs(el, 'color'), h: Math.round(el.getBoundingClientRect().height) } : null;
  return {
    overflowX: document.documentElement.scrollWidth - innerWidth,
    docH: document.body.scrollHeight,
    secs, h,
    ctaPrimary: dump(ctaPrimary), ctaLink: dump(ctaLink), scenarioLink: dump(scenarioLink), fine: dump(fine),
  };
});
console.log(JSON.stringify(report, null, 1));
console.log('failed:', failed.join(' | ') || '(none)');
await browser.close();
