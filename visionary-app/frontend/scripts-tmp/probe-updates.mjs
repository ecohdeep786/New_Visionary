/* Ground truth for /updates — every element the conversion touches.
   Usage: node scripts-tmp/probe-updates.mjs */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/updates', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(900);

const out = await page.evaluate(() => {
  const clip = (s) => (s && s.length > 70 ? s.slice(0, 70) : s);
  const dump = (label, el) => {
    if (!el) return { label, missing: true };
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      label, tag: el.tagName.toLowerCase(),
      cls: clip(typeof el.className === 'string' ? el.className : ''),
      fs: c.fontSize, fw: c.fontWeight, lh: c.lineHeight, ls: c.letterSpacing,
      tt: c.textTransform, color: c.color, bg: c.backgroundColor, radius: c.borderTopLeftRadius,
      bw: c.borderTopWidth, bc: c.borderTopColor, bbw: c.borderBottomWidth, bbc: c.borderBottomColor,
      shadow: c.boxShadow === 'none' ? null : 'shadow',
      minH: c.minHeight, pad: `${c.paddingTop}/${c.paddingRight}/${c.paddingBottom}/${c.paddingLeft}`,
      margin: `${c.marginTop}/${c.marginBottom}`,
      h: Math.round(r.height), w: Math.round(r.width),
      txt: (el.textContent || '').trim().slice(0, 40),
    };
  };
  const t = (sel) => document.querySelector(sel);
  const tn = (sel, i) => document.querySelectorAll(sel)[i] || null;
  const sections = [...document.querySelectorAll('main > section')].map((s, i) => ({
    i, id: s.id || null, ds: s.dataset.section || null, cls: clip(s.className),
    py: `${getComputedStyle(s).paddingTop}/${getComputedStyle(s).paddingBottom}`,
    bg: getComputedStyle(s).backgroundColor,
    bt: `${getComputedStyle(s).borderTopWidth} ${getComputedStyle(s).borderTopColor}`,
    h: Math.round(s.getBoundingClientRect().height),
  }));
  return {
    docH: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    sections,
    d: [
      /* hero */
      dump('hero-section', t('main > section:nth-of-type(1)')),
      dump('eyebrow', t('#main section p.uppercase')),
      dump('h1', t('#main h1')),
      dump('h1-accent', t('#main h1 span')),
      dump('hero-dek', t('#main h1 + p')),
      dump('hero-primary', t('main > section a[href="#signup"]')),
      dump('hero-secondary', t('main > section a[href="#latest"]')),
      /* featured */
      dump('feat-section', t('main > section:nth-of-type(2)')),
      dump('feat-card', t('main > section:nth-of-type(2) article')),
      dump('feat-chip1', tn('main > section:nth-of-type(2) article span', 0)),
      dump('feat-chip2', tn('main > section:nth-of-type(2) article span', 1)),
      dump('feat-h2', t('#featured-title')),
      dump('feat-copy', t('#featured-title + p')),
      dump('feat-date', t('#featured-title + p + p')),
      dump('feat-mat', t('[class*="h-[220px]"]')),
      dump('feat-curve', t('[class*="rounded-tl-[20px]"]')),
      dump('feat-link', t('main > section:nth-of-type(2) a[href="/how-it-works"]')),
      dump('feat-illus', t('main > section:nth-of-type(2) svg')),
      /* latest */
      dump('latest-section', t('#latest')),
      dump('latest-eyebrow', t('#latest p.uppercase')),
      dump('latest-h2', t('#latest h2')),
      dump('latest-lead', t('#latest h2 + p')),
      dump('chip-all', tn('#latest button[aria-pressed]', 0)),
      dump('chip-cat', tn('#latest button[aria-pressed]', 1)),
      dump('card', t('#latest article')),
      dump('card-tag', tn('#latest article span', 0)),
      dump('card-date', tn('#latest article span', 1)),
      dump('card-h3', t('#latest article h3')),
      dump('card-copy', t('#latest article h3 + p')),
      dump('card-illus', t('#latest article svg')),
      dump('latest-grid', t('#latest [class*="sm:grid-cols-2"]')),
      /* research band */
      dump('band-section', t('main > section:nth-of-type(4)')),
      dump('band-eyebrow', t('main > section:nth-of-type(4) p.uppercase')),
      dump('band-h2', t('#research-band-title')),
      dump('band-copy', t('#research-band-title + p')),
      dump('band-circle', t('main > section:nth-of-type(4) div[class*="rounded-full"]')),
      dump('band-link', t('main > section:nth-of-type(4) a[href="/research"]')),
      dump('band-card', t('main > section:nth-of-type(4) div[class*="sm:p-12"]')),
      /* signup */
      dump('signup-section', t('#signup')),
      dump('signup-eyebrow', t('#signup p.uppercase')),
      dump('signup-h2', t('#signup h2')),
      dump('signup-lead', t('#signup h2 + p')),
      dump('toggle-card', t('#signup [role="group"]')),
      dump('toggle-row', t('#signup [role="checkbox"]')),
      dump('toggle-tile', tn('#signup [role="checkbox"] span', 0)),
      dump('toggle-label', tn('#signup [role="checkbox"] span span', 0)),
      dump('toggle-helper', tn('#signup [role="checkbox"] span span', 1)),
      dump('toggle-dot', t('#signup [role="checkbox"] > span:last-child')),
      dump('form-card', t('#signup form') ? t('#signup form').parentElement : null),
      dump('input-name', t('#updates-name')),
      dump('label-name', t('label[for="updates-name"]')),
      dump('receive-label', tn('#signup div.mt-6 > div', 0)),
      dump('receive-chip', tn('#signup button[aria-pressed]', 0)),
      dump('consent', t('#signup input[type="checkbox"]')),
      dump('consent-text', t('#signup input[type="checkbox"] + span')),
      dump('submit', t('#signup button[type="submit"]')),
      dump('fineprint', t('#signup button[type="submit"] + p')),
      dump('privacy-p', t('#signup p.mt-8')),
      dump('privacy-link', t('#signup a[href="/privacy"]')),
      /* contact */
      dump('contact-section', t('main > section:nth-of-type(6)')),
      dump('contact-p', t('main > section:nth-of-type(6) p')),
      dump('contact-link', t('main > section:nth-of-type(6) a')),
    ],
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
