/* Verify explore-section header variants: landing shows eyebrow+sub; persona
   pages render only the h2 (unchanged). Also check aspect + img count. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

for (const path of ['/', '/student']) {
  await page.goto('http://localhost:5173' + path, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('[data-section="13-explore"]', { timeout: 30000 }).catch(() => {});
  const out = await page.evaluate(() => {
    const sec = document.querySelector('[data-section="13-explore"]');
    if (!sec) return { error: 'no explore section' };
    const head = sec.querySelector(':scope > div, :scope div');
    const eyebrow = sec.querySelector('p');
    const h2 = sec.querySelector('h2');
    const sub = sec.querySelector('p + p, h2 + p');
    const cards = sec.querySelectorAll('a[data-card]');
    const imgs = Array.from(sec.querySelectorAll('img'));
    return {
      eyebrowText: eyebrow ? eyebrow.innerText.slice(0, 40) : null,
      h2Text: h2 ? h2.innerText.slice(0, 60) : null,
      subText: sub ? sub.innerText.slice(0, 60) : null,
      cardCount: cards.length,
      imgCount: imgs.length,
      imgSizes: imgs.slice(0, 3).map((i) => ({ nw: i.naturalWidth, nh: i.naturalHeight, w: Math.round(i.getBoundingClientRect().width) })),
    };
  });
  console.log(path, JSON.stringify(out, null, 1));
}

// mobile landing router
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mpage = await mctx.newPage();
await mpage.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 120000 });
await mpage.waitForSelector('[data-section="13-explore"]', { timeout: 30000 }).catch(() => {});
const m = await mpage.evaluate(() => {
  const sec = document.querySelector('[data-section="13-explore"]');
  const card = sec?.querySelector('a[data-card]');
  const r = card?.getBoundingClientRect();
  return { cardW: r && Math.round(r.width), docW: document.documentElement.scrollWidth, vw: innerWidth };
});
console.log('/ mobile', JSON.stringify(m));

await browser.close();
