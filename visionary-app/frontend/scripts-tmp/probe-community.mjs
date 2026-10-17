/* Ground truth for /community — every element the conversion touches.
   Usage: node scripts-tmp/probe-community.mjs */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/community', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(900);

const out = await page.evaluate(() => {
  const css = (el, prop) => getComputedStyle(el)[prop];
  const clip = (s) => (s && s.length > 30 ? s.slice(0, 30) : s);
  const dump = (label, el) => {
    if (!el) return { label, missing: true };
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      label, tag: el.tagName.toLowerCase(),
      fs: c.fontSize, fw: c.fontWeight, lh: c.lineHeight, ls: c.letterSpacing,
      tt: c.textTransform, color: c.color, bg: c.backgroundColor, radius: c.borderTopLeftRadius,
      bw: c.borderTopWidth, bc: c.borderTopColor, bbw: c.borderBottomWidth,
      shadow: c.boxShadow === 'none' ? null : 'shadow',
      minH: c.minHeight, pad: `${c.paddingTop}/${c.paddingRight}/${c.paddingBottom}/${c.paddingLeft}`,
      margin: `${c.marginTop}/${c.marginBottom}`,
      h: Math.round(r.height), w: Math.round(r.width),
      txt: clip(el.textContent.trim()),
    };
  };
  const t = (sel) => document.querySelector(sel);
  const sections = [...document.querySelectorAll('main > section')].map((s, i) => ({
    i, id: s.id || null, ds: s.dataset.section || null, cls: clip(s.className),
    py: `${css(s, 'paddingTop')}/${css(s, 'paddingBottom')}`,
    bg: css(s, 'backgroundColor'), bt: `${css(s, 'borderTopWidth')} ${css(s, 'borderTopColor')}`,
    h: Math.round(s.getBoundingClientRect().height),
  }));
  const marqueeImgs = [...document.querySelectorAll('main img')].map((el) => ({
    loading: el.getAttribute('loading') || '(eager)',
    ok: el.complete && el.naturalWidth > 0,
    nat: `${el.naturalWidth}x${el.naturalHeight}`,
    src: (el.currentSrc || el.src || '').split('/').pop().slice(0, 30),
  }));
  const LAST = 'main > section:last-of-type';
  return {
    docH: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    sections,
    marquee: {
      count: marqueeImgs.length,
      broken: marqueeImgs.filter((m) => !m.ok).length,
      sample: marqueeImgs.slice(0, 6),
    },
    d: [
      /* hero */
      dump('hero-section', t('main > section:nth-of-type(1)')),
      dump('eyebrow', t('#main section p.uppercase')),
      dump('h1', t('#main h1')),
      dump('hero-sub', t('#main h1 + p')),
      dump('hero-primary', t('main > section a[href="#learners"]')),
      dump('hero-secondary', t('main > section a[href="/safety"]')),
      /* jump bar */
      dump('chip-bar', t('main > nav[aria-label="Community sections"]')),
      dump('chip-1', t('main > nav[aria-label="Community sections"] a')),
      /* marquee */
      dump('marquee-img-1', t('main > section:nth-of-type(1) img')),
      dump('marquee-row', t('main > section:nth-of-type(1) .overflow-hidden + .overflow-hidden')),
      /* find */
      dump('find-h2', t('main > section:nth-of-type(2) h2')),
      dump('find-squiggle', t('main > section:nth-of-type(2) svg')),
      dump('area-tile', t('#learners span')),
      dump('find-h3', t('#learners h3')),
      dump('find-copy', t('#learners h3 + p')),
      dump('area-tray', t('#learners [class*="rounded-[30px]"]')),
      dump('area-card', t('#learners a.group')),
      dump('area-head', t('#learners a.group > div')),
      dump('area-h4', t('#learners a.group h4')),
      dump('area-copy', t('#learners a.group h4 + p')),
      dump('area-curve', t('#learners a.group [class*="rounded-tl"]')),
      dump('area-arrow', t('#learners a.group > svg')),
      /* more */
      dump('more-band', t('#more')),
      dump('more-h2', t('#more h2')),
      dump('more-sub', t('#more h2 + p')),
      dump('more-card', t('#more a.group')),
      dump('more-head', t('#more a.group > div')),
      dump('more-h3', t('#more a.group h3')),
      dump('more-copy', t('#more a.group h3 + p')),
      dump('more-curve', t('#more a.group [class*="rounded-tl"]')),
      dump('more-arrow', t('#more a.group > svg')),
      /* faq */
      dump('faq-h2', t('#faq h2')),
      /* closer */
      dump('closer-section', t(LAST)),
      dump('closer-h2', t(`${LAST} h2`)),
      dump('closer-sub', t(`${LAST} h2 + p`)),
      dump('closer-primary', t(`${LAST} a[href="/register"]`)),
      dump('closer-secondary', t(`${LAST} a[href="/safety"]`)),
    ],
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
