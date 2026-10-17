/* Probe: computed styles of key pricing elements before conversion. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/pricing', { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(900);
const out = await page.evaluate(() => {
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const rows = [];
  const dump = (label, el) => el && rows.push({
    label, fs: cs(el, 'font-size'), fw: cs(el, 'font-weight'), lh: cs(el, 'line-height'),
    ls: cs(el, 'letter-spacing'), color: cs(el, 'color'), bg: cs(el, 'background-color'),
    br: `${cs(el, 'border-top-width')} ${cs(el, 'border-top-color')}`,
    cls: (el.className || '').toString().slice(0, 96),
    txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
  });
  const all = Array.from(document.querySelectorAll('#main *'));
  const byText = (text, sel = '*') => all.find((el) => el.matches(sel) && (el.textContent || '').replace(/\s+/g, ' ').trim().startsWith(text));
  dump('hero sub', byText('Start free. Find', 'p'));
  dump('toggle monthly btn', byText('Monthly', 'button'));
  dump('toggle annual btn', byText('Annual', 'button'));
  dump('badge 2mo', byText('2 months free', 'span'));
  dump('plan h3', byText('Start', 'h3'));
  dump('price span', byText('₹0', 'span'));
  dump('per month', byText('/ month', 'span'));
  dump('plan tagline', byText('Begin with one question', 'p'));
  dump('plan fine print', byText('Free forever', 'p'));
  dump('plan cta btn', byText('Start for free', 'a'));
  dump('personal cta', byText('Get Personal', 'a'));
  dump('whats included', byText('What’s included', 'p') || byText("What's included", 'p'));
  dump('feature span', byText('Ask & explore — 20', 'span'));
  dump('note prices inr', byText('Prices in INR', 'p'));
  dump('persona label', byText('Student', 'p'));
  dump('persona plan', byText('Start or Personal', 'p'));
  dump('persona note', byText('Begin free. Upgrade', 'p'));
  dump('compare th features', byText('Features', 'th'));
  dump('compare th personal', byText('Personal', 'th'));
  dump('compare row th', byText('Ask & explore', 'th'));
  dump('compare cell', byText('20/day', 'span'));
  dump('trust p', byText('Cancel anytime', 'p'));
  dump('faq eyebrow', byText('FAQ', 'p'));
  dump('faq h2', byText('Questions about', 'h2'));
  dump('faq question', byText('Can I start free?', 'span'));
  dump('faq chevron span?', byText('Can I start free?', 'button'));
  dump('cta h2', byText('Your journey is already', 'h2'));
  dump('cta sub', byText('Begin with a question', 'p'));
  dump('cta primary', byText('Get started', 'a'));
  dump('cta secondary', byText('Talk to sales', 'a'));
  return rows;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
