/* Focused check for /updates after conversion: escaped copies, quiet links, illustrations. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/updates', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1');
await page.waitForTimeout(900);

const out = await page.evaluate(() => {
  const g = (el) => {
    if (!el) return 'MISSING';
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return [el.tagName.toLowerCase(), `${c.fontSize}/${c.fontWeight}/${c.lineHeight}`, c.color,
      `w${Math.round(r.width)}`, `h${Math.round(r.height)}`, (el.textContent || '').trim().slice(0, 36)].join(' | ');
  };
  const t = (s) => document.querySelector(s);
  const svgs = (s) => [...document.querySelectorAll(s)].map((e) => `aria-hidden=${e.getAttribute('aria-hidden')} h${Math.round(e.getBoundingClientRect().height)}`);
  return {
    featCopy: g(t('#featured-title ~ div p')),
    featDate: g(t('#featured-title ~ p')),
    featQuiet: g(t('main > section:nth-of-type(2) a[href="/how-it-works"]')),
    featSvgs: svgs('main > section:nth-of-type(2) svg'),
    bandCopy: g(t('#research-band-title ~ div p')),
    bandQuiet: g(t('main > section:nth-of-type(4) a[href="/research"]')),
    bandSvgs: svgs('main > section:nth-of-type(4) svg'),
    contactQuiet: g(t('main > section:nth-of-type(6) a')),
    cardCount: document.querySelectorAll('#latest article').length,
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
