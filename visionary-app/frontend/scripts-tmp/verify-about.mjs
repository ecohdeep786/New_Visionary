/* Verify: /about geometry + chrome after conversion (desktop + phone). */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 140)); });
await page.goto('http://localhost:5173/about', { waitUntil: 'load', timeout: 90000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(700);
const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
const desktop = await page.evaluate(() => {
  const css = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const secs = Array.from(document.querySelectorAll('main > section'));
  const sections = secs.map((s) => ({
    ds: s.dataset.section || null,
    py: css(s, 'padding-block-start') + ' / ' + css(s, 'padding-block-end'),
    bg: css(s, 'background-color'),
    bt: css(s, 'border-top-width') + ' ' + css(s, 'border-top-color'),
  }));
  const all = Array.from(document.querySelectorAll('#main *'));
  const byText = (t, sel = '*') => all.find((el) => el.matches(sel) && (el.textContent || '').replace(/\s+/g, ' ').trim().startsWith(t));
  const dump = (label, el) => el && { label, fs: css(el, 'font-size'), fw: css(el, 'font-weight'), lh: css(el, 'line-height'), color: css(el, 'color'), bg: css(el, 'background-color'), radius: css(el, 'border-top-left-radius'), h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width), txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 26) };
  const heavy = all.filter((el) => el.tagName === 'P' && parseFloat(css(el, 'font-size')) >= 20).map((el) => ({ fs: css(el, 'font-size'), fw: css(el, 'font-weight'), lh: css(el, 'line-height'), txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) }));
  const team = document.querySelector('#team');
  const roleCard = byText('Students', 'h3') ? byText('Students', 'h3').closest('a') : null;
  const exCard = byText('Research', 'h3') ? byText('Research', 'h3').closest('a') : null;
  return {
    docH: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    sections,
    heavy,
    module: dump('module', team),
    moduleCard: dump('module-card', team ? team.querySelector('div') : null),
    quote: dump('quote', team ? team.querySelectorAll('p')[1] : null),
    missionPill: dump('mission-pill', team ? team.querySelector('a') : null),
    heroLink: dump('hero-link', byText('Explore our approach', 'a')),
    fanLabel: dump('fan-label', document.querySelector('.hero-fan-track span')),
    roleCard: dump('role-card', roleCard),
    rolePill: dump('role-pill', byText('Explore', 'span')),
    impactCard: dump('impact-card', byText('A missed idea', 'h3') ? byText('A missed idea', 'h3').closest('article') : null),
    explorePanel: dump('explore-panel', exCard ? exCard.querySelector('div:nth-child(2)') : null),
    lifeCard: dump('life-card', byText('Find a way in', 'h3') ? byText('Find a way in', 'h3').closest('li') : null),
    stripDiv: (() => { const p = byText('Wherever someone begins', 'p'); const d = p ? p.parentElement : null; return d ? { bt: css(d, 'border-top-color') } : null; })(),
    cta: dump('cta-section', document.querySelector('[data-section="07-cta"]')),
    ctaPill: dump('cta-pill', byText('Get started', 'a')),
    ctaLink: dump('cta-link', byText('Contact Visionary', 'a')),
    ctaFine: dump('cta-fine', byText('Explore the view', 'p')),
  };
});
console.log('DESKTOP', JSON.stringify(desktop, null, 1));

const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
await phone.goto('http://localhost:5173/about', { waitUntil: 'load', timeout: 90000 });
await phone.waitForSelector('#main h1', { timeout: 30000 });
await phone.waitForTimeout(700);
const mobile = await phone.evaluate(() => {
  const css = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const all = Array.from(document.querySelectorAll('#main *'));
  const byText = (t, sel = '*') => all.find((el) => el.matches(sel) && (el.textContent || '').replace(/\s+/g, ' ').trim().startsWith(t));
  const team = document.querySelector('#team');
  const pill = byText('Get started', 'a');
  const tray = document.querySelector('[data-section="05-roles"] > div > div');
  return {
    docH: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    module: team ? { w: Math.round(team.getBoundingClientRect().width), radius: css(team, 'border-top-left-radius'), bg: css(team, 'background-color') } : null,
    roleTray: tray ? { w: Math.round(tray.getBoundingClientRect().width), bg: css(tray, 'background-color') } : null,
    ctaPillW: pill ? Math.round(pill.getBoundingClientRect().width) : null,
  };
});
console.log('MOBILE', JSON.stringify(mobile, null, 1));
console.log('consoleErrors:', consoleErrors.slice(0, 6));
await browser.close();
