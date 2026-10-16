/* Ground truth for /careers — sections, rail, hero card, and every element the conversion touches. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/careers', { waitUntil: 'load', timeout: 120000 });
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
  const parentOf = (sel) => { const el = document.querySelector(sel); return el ? el.parentElement : null; };
  const sections = [...document.querySelectorAll('main > section')].map((s, i) => ({
    i, id: s.id || null, ds: s.dataset.section || null,
    py: `${css(s, 'paddingTop')}/${css(s, 'paddingBottom')}`,
    bg: css(s, 'backgroundColor'), bt: `${css(s, 'borderTopWidth')} ${css(s, 'borderTopColor')}`,
    h: Math.round(s.getBoundingClientRect().height),
  }));
  const rail = t('nav[aria-label="Careers sections"]');
  return {
    docH: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    sections,
    d: [
      dump('rail', rail),
      dump('rail-active', t('nav[aria-label="Careers sections"] a[aria-current="true"]')),
      dump('rail-label', t('nav[aria-label="Careers sections"] a span')),
      dump('h1', t('#main h1')),
      dump('hero-card', t('#overview .relative > div:nth-of-type(2)')),
      dump('hero-label', t('#overview label')),
      dump('hero-select', t('#overview select')),
      dump('hero-input', t('#overview input')),
      dump('hero-submit', t('#overview button[type="submit"]')),
      dump('strip-img', t('main > section:nth-of-type(2) img')),
      dump('why-h2', t('#why h2')),
      dump('why-sub', t('#why h2 + p')),
      dump('why-card', t('#why article')),
      dump('why-tile', parentOf('#why article svg')),
      dump('why-h3', t('#why article h3')),
      dump('why-copy', t('#why article h3 + p')),
      dump('teams-h2', t('#teams h2')),
      dump('team-card', t('#teams article')),
      dump('team-img', t('#teams article img')),
      dump('team-h3', t('#teams article h3')),
      dump('team-link', t('#teams article a[href^="mailto:"]')),
      dump('team-arrow', t('#teams article a[aria-label]')),
      dump('hiring-bg', t('#hiring')),
      dump('story-img', t('#hiring img')),
      dump('hiring-eyebrow', t('#hiring p.uppercase')),
      dump('hiring-h2', t('#hiring h2')),
      dump('hiring-sub', t('#hiring h2 + p')),
      dump('steps-ol', t('#hiring ol')),
      dump('step-li', t('#hiring ol li')),
      dump('step-num', t('#hiring ol li span')),
      dump('step-h3', t('#hiring ol li h3')),
      dump('step-copy', t('#hiring ol li p')),
      dump('roles-h2', t('#roles h2')),
      dump('roles-card', t('#roles .mt-12')),
      dump('roles-tile', parentOf('#roles svg')),
      dump('roles-h3', t('#roles h3')),
      dump('roles-copy', t('#roles h3 + p')),
      dump('roles-link1', t('#roles a[href^="mailto:"]')),
      dump('roles-link2', t('#roles a[href^="#hiring"], #roles a[href="#hiring"]')),
      dump('contact-h2', t('#contact h2')),
      dump('contact-p', t('#contact p')),
      dump('contact-link', t('#contact a[href^="mailto:"]')),
      dump('cta-bg', t('main > section:last-of-type')),
      dump('cta-h2', t('main > section:last-of-type h2')),
      dump('cta-sub', t('main > section:last-of-type h2 + p')),
      dump('cta-pill', t('main > section:last-of-type a[href^="mailto:"]')),
      dump('cta-secondary', t('main > section:last-of-type a[href="/about"]')),
    ],
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
