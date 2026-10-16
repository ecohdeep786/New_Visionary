/* Verify both close-CTA chapters after the sub trim: statement alone, buttons, fine print. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const check = async (url, heading) => {
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction((h) => document.body.innerText.includes(h), heading, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(400);
  return await page.evaluate((heading) => {
    const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
    const all = Array.from(document.querySelectorAll('#main *'));
    const h2 = all.find((el) => el.tagName === 'H2' && (el.textContent || '').trim().startsWith(heading));
    const sec = h2?.closest('section');
    const ps = sec ? Array.from(sec.querySelectorAll('p')).map((p) => ({
      fs: cs(p, 'font-size'), fw: cs(p, 'font-weight'), color: cs(p, 'color'),
      txt: (p.textContent || '').trim().slice(0, 44),
    })) : [];
    const heavy = ps.filter((p) => parseFloat(p.fs) >= 20);
    return {
      sectionPad: sec ? `${cs(sec, 'padding-top')}/${cs(sec, 'padding-bottom')}` : null,
      h2: h2 ? `${cs(h2, 'font-size')}/${cs(h2, 'font-weight')}/${cs(h2, 'line-height')}` : 'missing',
      ps,
      heavySubs: heavy.length,
      overflowX: document.documentElement.scrollWidth - innerWidth,
    };
  }, heading);
};

console.log('HOW-IT-WORKS CTA:', JSON.stringify(await check('http://localhost:5173/how-it-works', 'See it with your own question'), null, 1));
console.log('PRICING CTA:', JSON.stringify(await check('http://localhost:5173/pricing', 'Your journey is already'), null, 1));
await browser.close();
