/* One-off: computed styles of key how-it-works elements before conversion. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/how-it-works', { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(900);
await page.evaluate(async () => {
  const step = Math.max(400, Math.floor(innerHeight * 0.8));
  for (let y = 0; y < document.body.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); }
  scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 400));
});

const out = await page.evaluate(() => {
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const rows = [];
  const dump = (label, el) => {
    if (!el) return rows.push({ label, found: false });
    rows.push({
      label, found: true,
      fs: cs(el, 'font-size'), fw: cs(el, 'font-weight'), lh: cs(el, 'line-height'),
      ls: cs(el, 'letter-spacing'), tt: cs(el, 'text-transform'), color: cs(el, 'color'),
      bg: cs(el, 'background-color'), br: cs(el, 'border-top-width'),
      cls: (el.className || '').toString().slice(0, 90),
    });
  };
  const byText = (text, sel = '*') => Array.from(document.querySelectorAll(`#main ${sel}`)).find((el) => (el.textContent || '').replace(/\s+/g, ' ').trim().startsWith(text));
  dump('hero h1', document.querySelector('#main h1'));
  dump('hero sub', byText('Understand, ask, practise', 'p'));
  dump('grey tag (loop)', byText('The learning loop'));
  dump('loop h2', document.querySelectorAll('#main h2')[0]);
  dump('loop sub', byText('Every subject in Visionary', 'p'));
  dump('loop chip inactive', byText('Teach', 'button'));
  dump('loop chip active', byText('Goal', 'button'));
  dump('stage label p', byText('Goal', 'p'));
  dump('stage copy p', byText('You set the goal', 'p'));
  dump('stage micro p', byText('Step 1 of 8', 'p'));
  dump('people h2', document.querySelectorAll('#main h2')[1]);
  dump('people tab btn', byText('Student', 'button'));
  dump('scenario prompt p', byText('"Explain this simply."', 'p'));
  dump('scenario ui p', byText('I need to understand fractions.', 'p'));
  dump('scenario outcome p', byText('The explanation clicks', 'p'));
  dump('scenario link', byText('See the student page', 'a'));
  dump('cta h2', document.querySelectorAll('#main h2')[2]);
  dump('cta sub', byText('Ask a question', 'p'));
  dump('cta primary', byText('Get started', 'a'));
  dump('cta secondary', byText('See pricing', 'a'));
  dump('page h3 step', document.querySelector('#main h3'));
  return rows;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
