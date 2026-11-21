import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
await page.goto('https://www.apple.com/in/education/', { waitUntil: 'load', timeout: 60000 });
await page.evaluate(() => document.fonts?.ready);
const h = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < h; y += 700) { await page.evaluate(t => window.scrollTo({ top: t, behavior: 'instant' }), y); await page.waitForTimeout(140); }
await page.waitForTimeout(500);
// Find the "Real stories" section and the black K-12 chapter; capture each
const shots = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('section, div[class*="section"]')) {
    const t = (el.innerText || '');
    if (t.includes('Real stories') && el.getBoundingClientRect().height > 400) out.push({ name: 'stories', top: Math.round(el.getBoundingClientRect().top + scrollY), h: Math.round(el.getBoundingClientRect().height) });
    if (t.includes('grade school to grad school') && el.getBoundingClientRect().height > 300 && el.getBoundingClientRect().height < 1400) out.push({ name: 'k12', top: Math.round(el.getBoundingClientRect().top + scrollY), h: Math.round(el.getBoundingClientRect().height) });
  }
  return out;
});
for (const s of shots.slice(0, 4)) {
  await page.evaluate(top => window.scrollTo({ top: top - 60, behavior: 'instant' }), s.top);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `C:/Users/Administrator/nv-worktrees/fhe-01-landing-v10/shots/fhe-01-landing-v10/reference/apple-${s.name}.png` });
  console.log(s.name, 'captured at', s.top, 'h', s.h);
}
// Extract the story card anatomy: captions, controls, quote styling
const anatomy = await page.evaluate(() => {
  const stories = [...document.querySelectorAll('section, div')].find(el => (el.innerText || '').includes('Real stories. Real impact.'));
  if (!stories) return null;
  const cards = [...stories.querySelectorAll('li, figure, article, a')].filter(c => c.querySelector('img') && c.getBoundingClientRect().height > 150).slice(0, 4);
  return {
    sectionText: stories.innerText.replace(/\s+/g, ' ').slice(0, 400),
    dots: stories.querySelectorAll('[role="tab"], button[aria-label*="lide"], [class*="paginat"]').length,
    buttons: [...stories.querySelectorAll('button')].map(b => b.getAttribute('aria-label') || b.textContent.trim().slice(0, 30)).slice(0, 6),
    cardText: cards.map(c => c.innerText.replace(/\s+/g, ' ').slice(0, 120)),
  };
});
console.log(JSON.stringify(anatomy, null, 2));
await browser.close();
