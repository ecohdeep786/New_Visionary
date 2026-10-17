/* Probe paragraph tiers on the converted how-it-works page. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/how-it-works', { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(800);
const out = await page.evaluate(() => {
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const rows = [];
  const dump = (label, el) => el && rows.push({
    label, fs: cs(el, 'font-size'), fw: cs(el, 'font-weight'), lh: cs(el, 'line-height'),
    color: cs(el, 'color'), cls: (el.className || '').toString().slice(0, 90),
    txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 36),
  });
  const all = Array.from(document.querySelectorAll('#main p'));
  dump('do p', all.find((p) => p.textContent.startsWith('Your learning never resets')));
  dump('do p (signup)', all.find((p) => p.textContent.startsWith('Sign up free with your email')));
  dump('micro p', all.find((p) => p.textContent.startsWith('Yesterday')));
  dump('mock label', all.find((p) => p.textContent.trim() === 'Sign up'));
  dump('mock email label', all.find((p) => p.textContent.trim() === 'Email address'));
  dump('stage copy', all.find((p) => p.textContent.startsWith('You set the goal')));
  dump('stage micro', all.find((p) => p.textContent.startsWith('Step 1 of 8')));
  dump('loop sub', all.find((p) => p.textContent.startsWith('Every subject')));
  dump('people sub', all.find((p) => p.textContent.startsWith('The product')));
  dump('cta sub', all.find((p) => p.textContent.startsWith('Ask a question')));
  dump('fine print', all.find((p) => p.textContent.startsWith('Free to start')));
  return rows;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
