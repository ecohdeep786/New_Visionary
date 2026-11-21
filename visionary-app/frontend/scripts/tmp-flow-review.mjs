import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
await page.goto('http://127.0.0.1:4310/', { waitUntil: 'load' });
await page.evaluate(() => document.fonts?.ready);
await page.waitForTimeout(600);
// geometry of the flow's joints
const joints = await page.evaluate(() => {
  const secs = [...document.querySelectorAll('main > section')];
  return secs.map(s => ({ id: s.dataset.section, top: Math.round(s.getBoundingClientRect().top + scrollY), h: Math.round(s.getBoundingClientRect().height), bg: getComputedStyle(s).backgroundColor, radius: getComputedStyle(s).borderRadius }));
});
console.log(JSON.stringify(joints, null, 2));
// the explore track's start inset
const track = await page.evaluate(() => {
  const t = document.querySelector('section[data-section="13-explore"] [data-card]')?.parentElement;
  const card = t.querySelector('[data-card]').getBoundingClientRect();
  const cs = getComputedStyle(t);
  return { cardLeft: Math.round(card.left), cardW: Math.round(card.width), cardH: Math.round(card.height), pl: cs.paddingLeft, scrollPl: cs.scrollPaddingLeft, trackW: Math.round(t.getBoundingClientRect().width) };
});
console.log('track:', JSON.stringify(track));
await browser.close();
