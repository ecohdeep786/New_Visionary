/* Verify /download conversion: chapter rhythm, joins, chrome, mobile. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/download', { waitUntil: 'load', timeout: 90000 });
await page.waitForSelector('#main h1', { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(800);

const desktop = await page.evaluate(() => {
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const r = {};
  r.overflowX = document.documentElement.scrollWidth - window.innerWidth;
  r.docH = document.documentElement.scrollHeight;
  r.chapters = Array.from(document.querySelectorAll('main > section[data-section]')).map((s) => ({
    id: s.dataset.section,
    pt: cs(s, 'padding-top'),
    pb: cs(s, 'padding-bottom'),
    bg: cs(s, 'background-color'),
    borderTop: `${cs(s, 'border-top-width')} ${cs(s, 'border-top-color')}`,
    radius: cs(s, 'border-top-left-radius'),
  }));
  const byText = (t, sel = '*') => Array.from(document.querySelectorAll('#main *'))
    .find((el) => el.matches(sel) && (el.textContent || '').replace(/\s+/g, ' ').trim().startsWith(t));
  const box = (label, el) => el && (r[label] = {
    radius: cs(el, 'border-top-left-radius'), bg: cs(el, 'background-color'),
    bd: `${cs(el, 'border-top-width')} ${cs(el, 'border-top-color')}`,
    h: Math.round(el.getBoundingClientRect().height), color: cs(el, 'color'), fs: cs(el, 'font-size'),
  });
  box('trayChoice', byText('Continue on web', 'h2')?.closest('div[class*="rounded-[30px]"]'));
  box('cardChoice', byText('Continue on web', 'h2')?.closest('div[class*="rounded-[20px]"]'));
  box('pillOpen', byText('Open Visionary', 'a'));
  box('pillPlatforms', byText('See platforms', 'button'));
  box('chip', byText('Continue on web', 'h2')?.closest('div')?.querySelector('span'));
  box('trayPlatforms', document.querySelector('[data-section="02-platforms"] div[class*="rounded-[30px]"]'));
  box('cardPlatform', byText('Web', 'h3')?.closest('div[class*="rounded-[20px]"]'));
  box('badge', byText('Recommended', 'span'));
  box('pillWeb', byText('Open in browser', 'a'));
  box('pillSoon', byText('Windows app coming soon', 'button'));
  box('notifyBox', byText('Be first in line', 'p')?.closest('div[class*="rounded-[30px]"]'));
  box('notifyBtn', byText('Prepare email request', 'button'));
  box('notifyInput', document.querySelector('#notify-email'));
  box('syncBand', document.querySelector('[data-section="03-sync"]'));
  box('reqTray', document.querySelector('[data-section="04-requirements"] div[class*="rounded-[30px]"]'));
  box('reqCard', byText('Windows', 'h3')?.closest('div[class*="rounded-[20px]"]'));
  box('trustPill', byText('Signed builds', 'p')?.closest('div[class*="rounded-full"]'));
  box('ctaSection', document.querySelector('[data-section="05-cta"]'));
  box('ctaPrimary', byText('Continue on web', 'a'));
  const quiet = byText('See how it works', 'a');
  r.quietLink = quiet ? { color: cs(quiet, 'color'), fs: cs(quiet, 'font-size'), chevron: !!quiet.querySelector('svg') } : null;
  r.ctaFinePrint = byText('No install, no waiting. Pick', 'p')?.textContent.trim() || null;
  r.ctaSubGone = !byText('Open Visionary in your browser', 'p');
  return r;
});
console.log('DESKTOP');
console.log(JSON.stringify(desktop, null, 1));

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(700);
const mobile = await page.evaluate(() => {
  const r = {};
  r.overflowX = document.documentElement.scrollWidth - window.innerWidth;
  const byText = (t, sel = '*') => Array.from(document.querySelectorAll('#main *'))
    .find((el) => el.matches(sel) && (el.textContent || '').replace(/\s+/g, ' ').trim().startsWith(t));
  const w = (label, el) => el && (r[label] = Math.round(el.getBoundingClientRect().width));
  w('trayChoice', byText('Continue on web', 'h2')?.closest('div[class*="rounded-[30px]"]'));
  w('trayPlatforms', document.querySelector('[data-section="02-platforms"] div[class*="rounded-[30px]"]'));
  w('ctaPrimary', byText('Continue on web', 'a'));
  w('ctaQuiet', byText('See how it works', 'a'));
  const hero = document.querySelector('#main h1');
  r.heroFs = getComputedStyle(hero).fontSize;
  return r;
});
console.log('MOBILE');
console.log(JSON.stringify(mobile, null, 1));
await browser.close();
