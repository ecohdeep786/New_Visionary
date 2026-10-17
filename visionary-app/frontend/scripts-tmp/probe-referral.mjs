/* Ground truth for /referral — every element the conversion touches.
   Usage: node scripts-tmp/probe-referral.mjs */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/referral', { waitUntil: 'load', timeout: 120000 });
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
      dump('hero-primary', t('main > section:nth-of-type(1) button')),
      dump('hero-secondary', t('main > section a[href="#how"]')),
      dump('hero-status', t('main > section:nth-of-type(1) p[role="status"]')),
      /* collage */
      dump('collage-panel', t('main div[class*="rounded-[24px]"]')),
      dump('collage-svg', t('main div[class*="rounded-[24px]"] svg')),
      /* how */
      dump('how-section', t('#how')),
      dump('how-kicker', t('#how p.uppercase')),
      dump('how-h2', t('#how-title')),
      dump('how-sub', t('#how-title + p')),
      dump('step-tile', t('#how ol li span')),
      dump('step-icon', t('#how ol li span svg')),
      dump('step-h3', t('#how ol li h3')),
      dump('step-copy', t('#how ol li h3 + p')),
      dump('how-cta', t('main > section a[href="#share"]')),
      /* point */
      dump('point-section', t('main > section[aria-labelledby="point-title"]')),
      dump('point-kicker', t('main > section[aria-labelledby="point-title"] p.uppercase')),
      dump('point-h2', t('#point-title')),
      dump('point-sub', t('#point-title + p')),
      dump('point-card', t('main > section[aria-labelledby="point-title"] article')),
      dump('point-tile', t('main > section[aria-labelledby="point-title"] article > span')),
      dump('point-h3', t('main > section[aria-labelledby="point-title"] article h3')),
      dump('point-copy', t('main > section[aria-labelledby="point-title"] article h3 + p')),
      dump('point-primary', t('main > section[aria-labelledby="point-title"] article a[href="/student"]')),
      dump('point-alt', t('main > section[aria-labelledby="point-title"] article a[href="/parent"]')),
      dump('point-corner', t('main > section[aria-labelledby="point-title"] article a[aria-label]')),
      dump('point-curve', t('main > section[aria-labelledby="point-title"] article div[aria-hidden="true"]')),
      /* share */
      dump('share-section', t('#share')),
      dump('share-kicker', t('#share p.uppercase')),
      dump('share-h2', t('#share-title')),
      dump('share-deck', t('#share-title + p')),
      dump('share-meta', t('#share div > p.flex')),
      dump('share-label', t('label[for="referral-signup-link"]')),
      dump('share-input', t('#referral-signup-link')),
      dump('share-copy-btn', tn('#share button', 0)),
      dump('share-share-btn', tn('#share button', 1)),
      dump('share-register', t('#share a[href="/register"]')),
      dump('share-note', t('#referral-link-note')),
      dump('share-status', t('#share p[role="status"]')),
      /* honesty */
      dump('honest-section', t('main > section[aria-labelledby="honest-title"]')),
      dump('honest-h2', t('#honest-title')),
      dump('honest-copy', t('main > section[aria-labelledby="honest-title"] p')),
      dump('honest-chip', t('main > section[aria-labelledby="honest-title"] span')),
      /* faq */
      dump('faq-section', t('#faq')),
      dump('faq-kicker', t('#faq p.uppercase')),
      dump('faq-h2', t('#faq-title')),
      dump('faq-sub', t('#faq-title + p')),
      dump('faq-mail', t('#faq a[href^="mailto"]')),
      /* privacy */
      dump('privacy-section', t('main > section[aria-label="Privacy reminder"]')),
      dump('privacy-icon', t('main > section[aria-label="Privacy reminder"] svg')),
      dump('privacy-p', t('main > section[aria-label="Privacy reminder"] p')),
      /* closing */
      dump('closing-section', t('main > section[aria-labelledby="closing-title"]')),
      dump('closing-card', t('main > section[aria-labelledby="closing-title"] div[class*="rounded-["]')),
      dump('closing-h2', t('#closing-title')),
      dump('closing-copy', t('#closing-title + p')),
      dump('closing-primary', t('main > section[aria-labelledby="closing-title"] a[href="/updates"]')),
      dump('closing-secondary', t('main > section[aria-labelledby="closing-title"] a[href="/community"]')),
    ],
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
