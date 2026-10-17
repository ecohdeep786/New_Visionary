/* Ground truth for /contact — sections + every element the conversion touches. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/contact', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(900);

const out = await page.evaluate(() => {
  const css = (el, prop) => getComputedStyle(el)[prop];
  const clip = (s) => (s && s.length > 34 ? s.slice(0, 34) : s);
  const dump = (label, el) => {
    if (!el) return { label, missing: true };
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      label, tag: el.tagName.toLowerCase(),
      fs: c.fontSize, fw: c.fontWeight, lh: c.lineHeight, ls: c.letterSpacing,
      tt: c.textTransform, color: c.color, bg: c.backgroundColor, radius: c.borderTopLeftRadius,
      bw: c.borderTopWidth, bc: c.borderTopColor, shadow: c.boxShadow === 'none' ? null : 'shadow',
      h: Math.round(r.height), w: Math.round(r.width),
      txt: clip(el.textContent.trim()),
    };
  };
  const t = (sel) => document.querySelector(sel);
  const sections = [...document.querySelectorAll('main > section')].map((s, i) => ({
    i, id: s.id || null, ds: s.dataset.section || null,
    py: `${css(s, 'paddingTop')}/${css(s, 'paddingBottom')}`,
    bg: css(s, 'backgroundColor'), bt: `${css(s, 'borderTopWidth')} ${css(s, 'borderTopColor')}`,
    h: Math.round(s.getBoundingClientRect().height),
  }));
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const active = tabs.find((b) => b.getAttribute('aria-selected') === 'true');
  const idle = tabs.find((b) => b.getAttribute('aria-selected') !== 'true');
  const hero = t('main > section:first-of-type');
  return {
    docH: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    sections,
    d: [
      dump('breadcrumb', t('main nav')),
      dump('h1', t('#main h1')),
      dump('hero-sub', hero?.querySelector('p')),
      dump('hero-link', hero?.querySelector('a')),
      dump('tabs-wrap', t('[role="tablist"]')),
      dump('tab-active', active),
      dump('tab-idle', idle),
      dump('resources-h2', t('#resources h2')),
      dump('resources-sub', t('#resources h2 + p')),
      dump('res-card', t('#resources a.group')),
      dump('res-tile', t('#resources a.group span')),
      dump('res-label', t('#resources a.group p')),
      dump('res-title', t('#resources a.group h4, #resources a.group h3')),
      dump('res-arrow', t('#resources a.group span:last-of-type')),
      dump('more-link', [...document.querySelectorAll('#resources a')].pop()),
      dump('faq-h2', t('#faq h2')),
      dump('faq-sub', t('#faq h2 + p')),
      dump('faq-pill', t('#faq a')),
      dump('help-h2', t('main > section:nth-of-type(4) h2')),
      dump('help-copy', t('main > section:nth-of-type(4) h2 + p')),
      dump('help-pill', t('main > section:nth-of-type(4) a')),
      dump('help-email', t('main > section:nth-of-type(4) a[href^="mailto"]')),
      dump('routes-kicker', t('#routes p.uppercase')),
      dump('routes-h2', t('#routes h2')),
      dump('routes-copy', t('#routes h2 + p')),
      dump('route-card', t('#routes article')),
      dump('route-cat', t('#routes article p.uppercase, #routes article span.uppercase')),
      dump('route-title', t('#routes article h3')),
      dump('route-desc', t('#routes article h3 + p')),
      dump('route-email', t('#routes article a')),
      dump('grievance-kicker', t('#grievance p.uppercase')),
      dump('grievance-h2', t('#grievance h2')),
      dump('grievance-copy', t('#grievance h2 + p')),
      dump('g-card', t('#grievance .g-card')),
      dump('g-label', t('#grievance .g-card p.uppercase, #grievance .g-card span.uppercase, #grievance .g-card p')),
      dump('g-name', t('#grievance h3')),
      dump('g-resp', t('#grievance h3 + p')),
      dump('g-email', t('#grievance a')),
      dump('hyg-h2', t('main > section:last-of-type h2')),
      dump('hyg-copy', t('main > section:last-of-type h2 + p')),
      dump('hyg-link', t('main > section:last-of-type a')),
    ],
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
