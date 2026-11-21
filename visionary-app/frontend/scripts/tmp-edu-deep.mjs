import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
for (const [w, h, tag] of [[1440, 1000, 'desktop'], [390, 844, 'phone']]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.goto('https://www.apple.com/in/education/', { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(() => document.fonts?.ready);
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 500) { await page.evaluate(t => window.scrollTo({ top: t, behavior: 'instant' }), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `C:/Users/Administrator/nv-worktrees/fhe-01-landing-v10/shots/fhe-01-landing-v10/reference/edu-full-${tag}.png`, fullPage: true });
  // per-section precise geometry: padding, first headline size, the gap headline->content
  const geo = await page.evaluate(() => {
    const secs = [...document.querySelectorAll('main > section, main > div')].filter(s => s.getBoundingClientRect().height > 150);
    return secs.slice(0, 12).map(s => {
      const cs = getComputedStyle(s);
      const head = s.querySelector('h1,h2,h3');
      const img = s.querySelector('img');
      return {
        text: (s.innerText || '').replace(/\s+/g, ' ').slice(0, 42),
        pad: `${Math.round(parseFloat(cs.paddingTop))}/${Math.round(parseFloat(cs.paddingBottom))}`,
        h: Math.round(s.getBoundingClientRect().height),
        headFz: head ? Math.round(parseFloat(getComputedStyle(head).fontSize)) : null,
        headW: head ? Math.round(head.getBoundingClientRect().width) : null,
        imgW: img ? Math.round(img.getBoundingClientRect().width) : null,
      };
    });
  });
  console.log(tag, JSON.stringify(geo, null, 1));
  await page.context().close();
}
await browser.close();
console.log('done');
