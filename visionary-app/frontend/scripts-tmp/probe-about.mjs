/* Probe: computed styles of key about elements before conversion. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/about', { waitUntil: 'load', timeout: 90000 });
await page.waitForSelector('#main h1', { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(700);
const out = await page.evaluate(() => {
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const rows = [];
  const dump = (label, el) => el && rows.push({
    label, fs: cs(el, 'font-size'), fw: cs(el, 'font-weight'), lh: cs(el, 'line-height'),
    ls: cs(el, 'letter-spacing'), tt: cs(el, 'text-transform'), color: cs(el, 'color'),
    bg: cs(el, 'background-color'), radius: cs(el, 'border-top-left-radius'),
    bd: `${cs(el, 'border-top-width')} ${cs(el, 'border-top-color')}`,
    shadow: cs(el, 'box-shadow').slice(0, 40),
    txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 34),
  });
  const all = Array.from(document.querySelectorAll('#main *'));
  const byText = (t, sel = '*') => all.find((el) => el.matches(sel) && (el.textContent || '').replace(/\s+/g, ' ').trim().startsWith(t));
  dump('hero eyebrow', byText('About Visionary', 'p'));
  dump('hero h1', document.querySelector('#main h1'));
  dump('hero sub', byText('A learning product', 'p'));
  dump('hero pill', byText('See how it works', 'a'));
  dump('hero link', byText('Explore our approach', 'a'));
  dump('mission eyebrow', byText('Why Visionary exists', 'p'));
  dump('mission h2', byText('Understanding should open', 'h2'));
  dump('mission para', byText('People move between', 'p'));
  dump('mission module', document.querySelector('#team'));
  dump('quote kicker', byText('Our mission', 'p'));
  dump('quote p', byText('Build AI intelligence', 'p'));
  dump('quote footnote', byText('Visionary · the mission', 'p'));
  dump('module pill', byText('See how it works', 'a') && byText('See how it works', 'a').closest('#team')?.querySelector('a'));
  const illPanel = document.querySelector('#team')?.querySelector('.bg-\\[\\#f8fbff\\]') || document.querySelector('#team > div:nth-child(2)');
  dump('ill panel', illPanel);
  dump('life eyebrow', byText('A life in motion', 'p'));
  dump('life h2', byText('One journey', 'h2'));
  dump('life para', byText('A first lesson', 'p'));
  dump('life card', byText('Find a way in', 'h3')?.closest('li'));
  dump('life number', byText('01 / 04', 'span'));
  dump('life h3', byText('Find a way in', 'h3'));
  dump('life copy', byText('An early question', 'p'));
  dump('strip statement', byText('Wherever someone begins', 'p'));
  dump('strip link', byText('See how it works', 'a') && byText('Wherever someone begins', 'p')?.parentElement?.querySelector('a'));
  dump('impact eyebrow', byText('The difference we want to make', 'p'));
  dump('impact h2', byText('AI can make the next', 'h2'));
  dump('impact para', byText('The challenge is bigger', 'p'));
  dump('impact card1', byText('A missed idea', 'h3')?.closest('article'));
  dump('impact label', byText('01 / The challenge', 'span'));
  dump('impact h3', byText('A missed idea', 'h3'));
  dump('answer label', byText('What Visionary is building toward', 'p'));
  dump('answer p', byText('Give each person', 'p'));
  dump('impact link', byText('See how Visionary works', 'a'));
  dump('roles eyebrow', byText('For every perspective', 'p'));
  dump('roles h2', byText('Different people, one connected', 'h2'));
  dump('roles para', byText('Find the experience', 'p'));
  const roleCard = byText('Students', 'h3')?.closest('a');
  dump('role card', roleCard);
  dump('role imgwrap', roleCard?.querySelector('div'));
  dump('role h3', byText('Students', 'h3'));
  dump('role pill', byText('Explore', 'span'));
  dump('explore eyebrow', byText('Explore further', 'p'));
  dump('explore h2', byText('The work around', 'h2'));
  const exCard = byText('Research', 'h3')?.closest('a');
  dump('explore card', exCard);
  dump('explore h3', byText('Research', 'h3'));
  dump('explore copy', byText('The questions and ideas', 'p'));
  dump('explore panel', byText('Research', 'h3')?.closest('a')?.querySelector('div[style]'));
  dump('cta eyebrow', byText('Start where you are', 'p'));
  dump('cta h2', byText('There is a place', 'h2'));
  dump('cta sub', byText('Explore the view that fits', 'p'));
  dump('cta pill', byText('Get started', 'a'));
  dump('cta link', byText('Contact Visionary', 'a'));
  dump('fan card', byText('Students', 'span')?.closest('a'));
  return rows;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
