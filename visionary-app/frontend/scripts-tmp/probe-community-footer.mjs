/* Footer join geometry: closer section bottom vs footer top vs hairline. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/community', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(600);
await page.evaluate(() => scrollTo(0, document.body.scrollHeight));

const out = await page.evaluate(() => {
  const cs = (el, p) => getComputedStyle(el)[p];
  const closer = document.querySelector('main > section:last-of-type');
  const footer = document.querySelector('footer') || document.querySelector('main + *');
  const r1 = closer.getBoundingClientRect(); const r2 = footer.getBoundingClientRect();
  return {
    closerBottomAbs: Math.round(r1.bottom + scrollY),
    closerBg: cs(closer, 'backgroundColor'),
    closerPad: `${cs(closer, 'paddingTop')}/${cs(closer, 'paddingBottom')}`,
    footerTag: footer.tagName.toLowerCase(),
    footerClass: (footer.className || '').slice(0, 80),
    footerTopAbs: Math.round(r2.top + scrollY),
    footerBg: cs(footer, 'backgroundColor'),
    footerBT: `${cs(footer, 'borderTopWidth')} ${cs(footer, 'borderTopColor')}`,
    siteFooter: !!document.querySelector('.site-footer, footer[class*="quiet"], footer'),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
