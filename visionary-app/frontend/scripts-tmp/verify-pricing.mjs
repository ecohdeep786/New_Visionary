/* Verify converted pricing: chapter geometry, joins, controls, CTA. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const failed = [];
page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/api/')) failed.push(`${r.status()} ${r.url()}`); });
await page.goto('http://localhost:5173/pricing', { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(900);
await page.evaluate(async () => {
  const step = Math.max(400, Math.floor(innerHeight * 0.8));
  for (let y = 0; y < document.body.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); }
  scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 400));
});

const report = await page.evaluate(() => {
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const secs = Array.from(document.querySelectorAll('#main > section')).map((s) => ({
    id: s.getAttribute('data-section') || s.id || null,
    pad: `${cs(s, 'padding-top')}/${cs(s, 'padding-bottom')}`,
    radius: cs(s, 'border-top-left-radius'),
    bt: `${cs(s, 'border-top-width')} ${cs(s, 'border-top-color')}`,
    bg: cs(s, 'background-color'),
    h: Math.round(s.getBoundingClientRect().height),
  }));
  const all = Array.from(document.querySelectorAll('#main *'));
  const byText = (text, sel = '*') => all.find((el) => el.matches(sel) && (el.textContent || '').replace(/\s+/g, ' ').trim().startsWith(text));
  const dump = (label, el) => el ? {
    label, fs: cs(el, 'font-size'), fw: cs(el, 'font-weight'),
    color: cs(el, 'color'), bg: cs(el, 'background-color'),
    br: `${cs(el, 'border-top-width')} ${cs(el, 'border-top-color')}`,
    radius: cs(el, 'border-top-left-radius'), h: Math.round(el.getBoundingClientRect().height),
  } : { label, missing: true };
  return {
    overflowX: document.documentElement.scrollWidth - innerWidth,
    secs,
    checks: [
      dump('toggle active', byText('Annual', 'button')),
      dump('toggle inactive', byText('Monthly', 'button')),
      dump('badge chip', byText('2 months free', 'span')),
      dump('tray plans', byText('Plans for', 'section')?.querySelector('[class*="rounded-[30px]"]')),
      dump('plan card', byText('Start', 'h3')?.closest('div[class*="rounded-[20px]"]')),
      dump('personal badge', byText('Most popular', 'span')),
      dump('primary cta', byText('Get Personal', 'a')),
      dump('secondary cta', byText('Start for free', 'a')),
      dump('persona card', byText('Student', 'p')?.closest('a')),
      dump('thead', byText('Features', 'th')?.closest('tr')),
      dump('trust pill', byText('Cancel anytime', 'p')?.parentElement),
      dump('faq row border', byText('Can I start free?', 'span')?.closest('div')),
      dump('cta primary', byText('Get started', 'a')),
      dump('cta link', byText('Talk to sales', 'a')),
    ],
  };
});
console.log(JSON.stringify(report, null, 1));
console.log('failed:', failed.join(' | ') || '(none)');
await browser.close();
