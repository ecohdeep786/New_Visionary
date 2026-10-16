/* Compare CTA sub treatment on the two converted pages + hero subs. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const measure = async (url, heroStart, ctaHeading) => {
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(800);
  return await page.evaluate(({ heroStart, ctaHeading }) => {
    const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
    const all = Array.from(document.querySelectorAll('#main *'));
    const byText = (t, sel = '*') => all.find((el) => el.matches(sel) && (el.textContent || '').replace(/\s+/g, ' ').trim().startsWith(t));
    const dump = (label, el) => el ? {
      label, fs: cs(el, 'font-size'), fw: cs(el, 'font-weight'), lh: cs(el, 'line-height'),
      color: cs(el, 'color'), txt: (el.textContent || '').trim().slice(0, 44),
    } : { label, missing: true };
    const h1 = document.querySelector('#main h1');
    const heroSub = h1 && h1.parentElement ? Array.from(h1.parentElement.querySelectorAll('p')).find((p) => (p.textContent || '').trim().length > 10) : null;
    const ctaH = byText(ctaHeading, 'h2');
    const ctaSub = ctaH && ctaH.closest('div,section') ? ctaH.parentElement.querySelector('p') : null;
    return {
      hero: dump('hero sub', heroSub),
      ctaSub: dump('cta sub', ctaSub),
    };
  }, { heroStart, ctaHeading });
};

const hiw = await (async () => {
  await page.goto('http://localhost:5173/how-it-works', { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => document.body.innerText.includes('See it with your own question'), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(500);
  return await page.evaluate(() => {
    const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
    const all = Array.from(document.querySelectorAll('#main *'));
    const h2 = all.find((el) => el.tagName === 'H2' && (el.textContent || '').trim().startsWith('See it with your own question'));
    const sub = h2 ? h2.parentElement.querySelector('p') : null;
    const h1 = document.querySelector('#main h1');
    const heroSub = h1 ? Array.from(h1.parentElement.querySelectorAll('p')).find((p) => (p.textContent || '').trim().length > 10) : null;
    const dump = (label, el) => el ? {
      label, fs: cs(el, 'font-size'), fw: cs(el, 'font-weight'), lh: cs(el, 'line-height'),
      color: cs(el, 'color'), txt: (el.textContent || '').trim().slice(0, 44),
    } : { label, missing: true };
    return { hero: dump('hero sub', heroSub), ctaSub: dump('cta sub', sub) };
  });
})();
const pri = await measure('http://localhost:5173/pricing', 'Start free', 'Your journey is already');
console.log('HOW-IT-WORKS:', JSON.stringify(hiw, null, 1));
console.log('PRICING:', JSON.stringify(pri, null, 1));
await browser.close();
