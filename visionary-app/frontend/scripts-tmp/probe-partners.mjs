/* Probe: /partners ground truth (computed values across all sections). */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/partners', { waitUntil: 'load', timeout: 90000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(800);
const out = await page.evaluate(() => {
  const css = (el, p) => (el ? getComputedStyle(el).getPropertyValue(p) : null);
  const all = Array.from(document.querySelectorAll('#main *'));
  const byText = (t, sel = '*') => all.find((el) => el.matches(sel) && (el.textContent || '').replace(/\s+/g, ' ').trim().startsWith(t));
  const dump = (label, el) => el && { label, tag: el.tagName.toLowerCase(), fs: css(el, 'font-size'), fw: css(el, 'font-weight'), lh: css(el, 'line-height'), ls: css(el, 'letter-spacing'), tt: css(el, 'text-transform'), color: css(el, 'color'), bg: css(el, 'background-color'), radius: css(el, 'border-top-left-radius'), bw: css(el, 'border-top-width'), bc: css(el, 'border-top-color'), shadow: css(el, 'box-shadow') === 'none' ? null : 'shadow', h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width), txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28) };
  const clip = (s) => s && s.slice(0, 60);
  const secs = Array.from(document.querySelectorAll('main > section'));
  const sections = secs.map((s, i) => ({ i, id: s.id || null, ds: s.dataset.section || null, py: css(s, 'padding-block-start') + '/' + css(s, 'padding-block-end'), bg: css(s, 'background-color'), bt: css(s, 'border-top-width') + ' ' + css(s, 'border-top-color'), h: Math.round(s.getBoundingClientRect().height) }));
  const hero = secs[0], what = document.querySelector('#what'), who = document.querySelector('#who'), includes = document.querySelector('#includes'), depth = document.querySelector('#depth'), journey = document.querySelector('#journey'), support = document.querySelector('#support'), faq = document.querySelector('#faq'), ctaSec = secs[9];
  const slideT = byText('A source to grow learning capability', 'h3');
  const whoChip = byText('Schools & systems', 'span');
  const whoTile = whoChip ? whoChip.closest('div').parentElement.querySelector('div') : null;
  const incCard = byText('Enablement & onboarding', 'h3') ? byText('Enablement & onboarding', 'h3').closest('article') : null;
  const incTile = incCard ? incCard.querySelector('span') : null;
  const depthCard = depth ? depth.querySelector('table') ? depth.querySelector('table').closest('div') : null : null;
  const check = depth ? Array.from(depth.querySelectorAll('span')).find((s) => css(s, 'background-color') === 'rgb(24, 128, 56)') : null;
  const dash = depth ? Array.from(depth.querySelectorAll('td span')).find((s) => (s.textContent || '').trim() === '—') : null;
  const noteBlock = byText('Every partnership begins with shared expectations', 'p');
  const stmt = secs[6];
  const supportCard = support ? support.querySelector('div > div') : null;
  const supportCircle = support ? Array.from(support.querySelectorAll('div')).find((d) => css(d, 'border-radius') === '50%' || d.className.includes('rounded-full')) : null;
  const ctaBox = ctaSec ? ctaSec.querySelector('div > div') : null;
  const dots = ctaSec ? Array.from(ctaSec.querySelectorAll('span')).filter((s) => css(s, 'border-radius') !== '0px').slice(0, 2) : [];
  const glow = who ? who.querySelector('[aria-hidden]') : null;
  return {
    docH: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    sections,
    d: [
      dump('breadcrumb', document.querySelector('nav + * , main > :first-child')),
      dump('eyebrow', byText('Visionary partnerships', 'p')),
      dump('h1', hero.querySelector('h1')),
      dump('dek', byText('Education, technology', 'p')),
      dump('hero-pill', byText('Discuss a partnership', 'a')),
      dump('hero-secondary', byText('See how it works', 'a')),
      dump('clock-line', byText('Partnership enquiries receive', 'p')),
      dump('hero-chip', byText('Reply within 5 business days', 'p')),
      dump('what-h2', what.querySelector('h2')),
      dump('what-sub', byText('Three things', 'p')),
      dump('slide-title', slideT),
      dump('slide-copy', slideT ? slideT.parentElement.querySelector('p') : null),
      dump('carousel-arrow', what.querySelector('button')),
      dump('who-h2', who.querySelector('h2')),
      dump('who-sub', byText('Partnerships start from', 'p')),
      dump('who-chip', whoChip),
      dump('who-copy', whoChip ? whoChip.closest('div').querySelector('p') : null),
      dump('who-tile', whoTile),
      dump('glow', glow),
      glow ? { label: 'glow-bg', bgImage: clip(css(glow, 'background-image')) } : null,
      dump('includes-h2', includes.querySelector('h2')),
      dump('inc-card', incCard),
      dump('inc-tile', incTile),
      dump('inc-title', byText('Enablement & onboarding', 'h3')),
      dump('inc-dt', incCard ? incCard.querySelector('dt') : null),
      dump('inc-dd', incCard ? incCard.querySelector('dd') : null),
      dump('depth-h2', byText('How deep the work can go', 'h2')),
      dump('depth-deck', byText('Every partnership begins as a', 'p')),
      dump('depth-tile', depth ? depth.querySelector('span') : null),
      dump('depth-dt', byText('Conversation', 'dt')),
      dump('depth-dd', byText('Understand each other', 'dd')),
      dump('depth-divider', byText('Conversation', 'dt') ? byText('Conversation', 'dt').closest('dl') : null),
      dump('table-wrap', depthCard),
      dump('table-chip', byText('Scoped pilot', 'span')),
      dump('row-label', byText('Named point of contact', 'th')),
      dump('check', check),
      dump('dash', dash),
      dump('journey-kicker', byText('The process', 'p')),
      dump('journey-h2', byText('How a partnership begins.', 'h2')),
      dump('journey-sub', byText('Four steps from a first note', 'p')),
      dump('step-label', byText('Step 01', 'p')),
      dump('step-title', byText('Write to us', 'h3')),
      dump('step-copy', byText('Send your organization, the learners', 'p')),
      dump('step-item', byText('Write to us', 'h3') ? byText('Write to us', 'h3').closest('li') : null),
      dump('note-block', noteBlock),
      dump('stmt-h2', stmt.querySelector('h2')),
      dump('stmt-pill', stmt.querySelector('a')),
      dump('stmt-secondary', Array.from(stmt.querySelectorAll('a'))[1]),
      dump('support-kicker', byText('For organizations seeking support', 'p')),
      dump('support-h2', byText('Start with the support you need.', 'h2')),
      dump('support-copy', byText('Tell us about your organization', 'p')),
      dump('support-link', byText('Browse help topics', 'a')),
      dump('support-card', supportCard),
      dump('support-circle', supportCircle),
      dump('faq-h2', faq.querySelector('h2')),
      dump('faq-sub', byText('Straight answers about how partnerships', 'p')),
      dump('cta-h2', byText('Bring Visionary closer', 'h2')),
      dump('cta-copy', byText('A five-minute note', 'p')),
      dump('cta-pill', byText('Email the partnerships team', 'a')),
      dump('cta-secondary', byText('Or use the contact routes', 'a')),
      dump('cta-box', ctaBox),
      dots ? dump('cta-dot0', dots[0]) : null,
    ].filter(Boolean),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
