import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
for (const [w, h] of [[1440, 1000], [768, 1024], [390, 844]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.goto('https://www.apple.com/in/iphone/', { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(() => document.fonts?.ready);
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 600) { await page.evaluate(t => window.scrollTo({ top: t, behavior: 'instant' }), y); await page.waitForTimeout(80); }
  await page.waitForTimeout(400);
  const found = await page.evaluate(() => {
    const els = [...document.querySelectorAll('*')]
      .filter(e => e.textContent.trim() === 'iPhone Duo' && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().width < innerWidth * 1.1)
      .sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize));
    return els.length ? { fz: getComputedStyle(els[0]).fontSize, tag: els[0].tagName, x: Math.round(els[0].getBoundingClientRect().left), y: Math.round(els[0].getBoundingClientRect().top + scrollY) } : null;
  });
  if (!found) { console.log(w, 'not found'); await page.context().close(); continue; }
  // scroll it into view
  await page.evaluate(y => window.scrollTo({ top: y - innerHeight / 2.5, behavior: 'instant' }), found.y);
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => {
    const els = [...document.querySelectorAll('*')]
      .filter(e => e.textContent.trim() === 'iPhone Duo' && e.getBoundingClientRect().width > 0)
      .sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize));
    const nameEl = els[0];
    let tile = nameEl;
    for (let i = 0; i < 10; i++) {
      tile = tile.parentElement; if (!tile) break;
      const r = tile.getBoundingClientRect();
      if (r.width > innerWidth * 0.55 && r.height > 200) break;
    }
    const r = tile.getBoundingClientRect();
    const cs = getComputedStyle(tile);
    return {
      viewport: innerWidth,
      tile: { w: Math.round(r.width), h: Math.round(r.height), aspect: (r.width / r.height).toFixed(2), radius: cs.borderRadius, vwPct: Math.round(r.width / innerWidth * 100), bg: cs.backgroundColor },
      name: { fz: getComputedStyle(nameEl).fontSize, fw: getComputedStyle(nameEl).fontWeight, x: Math.round(nameEl.getBoundingClientRect().left - r.left), y: Math.round(nameEl.getBoundingClientRect().top - r.top) },
      links: [...tile.querySelectorAll('a')].slice(0, 3).map(a => ({ t: a.textContent.trim().slice(0, 14), bg: getComputedStyle(a).backgroundColor })),
    };
  });
  console.log(w, JSON.stringify(m));
  await page.screenshot({ path: `C:/Users/Administrator/nv-worktrees/fhe-01-landing-v10/shots/fhe-01-landing-v10/reference/duo-${w}.png` });
  await page.context().close();
}
await browser.close();
console.log('done');
