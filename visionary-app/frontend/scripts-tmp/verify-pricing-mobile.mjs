/* Mobile verify: overflow, tray/toggle/card widths, CTA stack. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:5173/pricing', { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(900);
const out = await page.evaluate(() => {
  const r = (el) => el ? { w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height), x: Math.round(el.getBoundingClientRect().x) } : null;
  const all = Array.from(document.querySelectorAll('#main *'));
  const byText = (t, sel = '*') => all.find((el) => el.matches(sel) && (el.textContent || '').replace(/\s+/g, ' ').trim().startsWith(t));
  const toggle = byText('Annual', 'button');
  const tray = byText('Plans for', 'section')?.querySelector('[class*="rounded-[30px]"]');
  const card = byText('Start', 'h3')?.closest('div[class*="rounded-[20px]"]');
  const ctaP = byText('Get started', 'a');
  const ctaL = byText('Talk to sales', 'a');
  const soc = document.documentElement.scrollWidth - innerWidth;
  const wide = all.filter((el) => el.getBoundingClientRect().width > innerWidth + 1 && el.getBoundingClientRect().height > 8)
    .slice(0, 6).map((el) => `${el.tagName}.${(el.className || '').toString().split(' ')[0]} w=${Math.round(el.getBoundingClientRect().width)}`);
  return {
    scrollOverflow: soc,
    toggle: r(toggle), tray: r(tray), card: r(card), ctaPrimary: r(ctaP), ctaLink: r(ctaL),
    toggleRight: toggle ? Math.round(toggle.getBoundingClientRect().right) : null,
    wideEls: wide,
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
