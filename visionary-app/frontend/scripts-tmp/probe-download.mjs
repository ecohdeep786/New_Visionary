/* Probe: computed styles of key download elements before conversion. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/download', { waitUntil: 'load', timeout: 90000 });
await page.waitForSelector('#main h1', { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(600);
const out = await page.evaluate(() => {
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const rows = [];
  const dump = (label, el) => el && rows.push({
    label, fs: cs(el, 'font-size'), fw: cs(el, 'font-weight'), lh: cs(el, 'line-height'),
    ls: cs(el, 'letter-spacing'), tt: cs(el, 'text-transform'), color: cs(el, 'color'),
    bg: cs(el, 'background-color'), radius: cs(el, 'border-top-left-radius'),
    bd: `${cs(el, 'border-top-width')} ${cs(el, 'border-top-color')}`,
    txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 36),
  });
  const all = Array.from(document.querySelectorAll('#main *'));
  const byText = (t, sel = '*') => all.find((el) => el.matches(sel) && (el.textContent || '').replace(/\s+/g, ' ').trim().startsWith(t));
  dump('hero eyebrow', byText('Download', 'p'));
  dump('hero h1', document.querySelector('#main h1'));
  dump('hero sub', byText('On the phone', 'p'));
  dump('choice card', byText('Continue on web', 'h2')?.closest('div'));
  dump('choice h2', byText('Continue on web', 'h2'));
  dump('choice p', byText('Full Visionary in your browser', 'p'));
  dump('open visionary btn', byText('Open Visionary', 'a'));
  dump('see platforms btn', byText('See platforms', 'button'));
  dump('chip', byText('Continue on web', 'h2')?.closest('div')?.querySelector('span'));
  dump('platforms eyebrow', byText('Supported platforms', 'p'));
  dump('platforms h2', byText('Choose your platform', 'h2'));
  dump('platforms sub', byText('Use Visionary on the web', 'p'));
  dump('platform h3', byText('Web', 'h3'));
  dump('platform meta', byText('No install', 'p'));
  dump('platform web btn', byText('Open in browser', 'a'));
  dump('platform soon btn', byText('Windows app coming soon', 'button'));
  dump('recommended badge', byText('Recommended', 'span'));
  dump('notify title', byText('Be first in line', 'p'));
  dump('notify sub', byText('Native apps are in final', 'p'));
  dump('notify input', document.querySelector('#notify-email'));
  dump('notify btn', byText('Prepare email request', 'button'));
  dump('sync statement', byText('Start on one device', 'p'));
  dump('sync sub', byText('Conversations, progress', 'p'));
  dump('req eyebrow', byText('System requirements', 'p'));
  dump('req h2', byText('What you need', 'h2'));
  dump('req h3', byText('Windows', 'h3'));
  dump('req p', byText('Windows 10 or later · 4 GB', 'p'));
  dump('trust p', byText('Signed builds', 'p'));
  dump('cta h2', byText('Still deciding', 'h2'));
  dump('cta sub', byText('No install, no waiting. Open', 'p'));
  dump('cta primary', byText('Continue on web', 'a'));
  dump('cta secondary', byText('See how it works', 'a'));
  return rows;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
