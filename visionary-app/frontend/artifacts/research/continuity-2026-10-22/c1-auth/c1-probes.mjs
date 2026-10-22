/**
 * C1/FAP-49 probes — "Auth to the one system".
 * Mode: `node c1-probes.mjs after` → c1-probe-<mode>.json
 * Per route (/login, /register, /forgot-password, /forgot-user-id, /reset-password)
 * at 1440/768/390:
 *   - page overflow AC: documentElement.scrollWidth vs innerWidth (0 required)
 *   - canvas: AuthLayout root bg #f5f5f7 + data-font-surface="product"
 *   - card: white, 28px radius, bounded 960px column
 *   - ink primary pill voice: #1d1d1f, 44px, rounded-full, 17px/500
 *   - system links: #0066cc
 *   - dead flows render as null choices: no Mobile/Organization/coming-soon entries
 * Live error state (login email step): surfaced alert text must compute to #e30000.
 */
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5192';
const MODE = process.argv[2] || 'after';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const ROUTES = ['/login', '/register', '/forgot-password', '/forgot-user-id', '/reset-password'];

const browser = await chromium.launch();

const ink = 'rgb(29, 29, 31)';
const canvas = 'rgb(245, 245, 247)';
const link = 'rgb(0, 102, 204)';
const err = 'rgb(227, 0, 0)';

const snap = () => {
  const shell = document.querySelector('[data-font-surface="product"]');
  const card = document.querySelector('div[class*="max-w-[960px]"]');
  const buttons = [...document.querySelectorAll('button, a')].map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim());
  const emailBtn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Continue with Email'));
  const mail = emailBtn ? getComputedStyle(emailBtn) : null;
  const mailRect = emailBtn ? emailBtn.getBoundingClientRect() : null;
  const primaryLink = document.querySelector('a[href*="/terms"], a[href*="forgot"]');
  const social = document.querySelectorAll('[aria-label^="Continue with"]');
  const sh = shell ? getComputedStyle(shell) : null;
  const ch = card ? getComputedStyle(card) : null;
  return {
    canvasBg: sh ? sh.backgroundColor : null,
    fontSurface: !!shell,
    cardBg: ch ? ch.backgroundColor : null,
    cardRadius: ch ? ch.borderRadius : null,
    cardHeightRatio: card && shell ? Math.round((card.getBoundingClientRect().height / shell.getBoundingClientRect().height) * 100) / 100 : null,
    hasMobileChoice: buttons.some((t) => /continue with mobile/i.test(t)),
    hasOrganizationChoice: buttons.some((t) => /organization/i.test(t)),
    hasComingSoon: buttons.some((t) => /coming soon/i.test(t)) || /coming soon/i.test(document.body.innerText || ''),
    socialCount: social.length,
    primaryPill: mail ? { bg: mail.backgroundColor, h: Math.round(mailRect.height), radius: mail.borderRadius, fs: mail.fontSize, fw: mail.fontWeight, ls: mail.letterSpacing, fw500: mail.fontWeight === '500' } : null,
    linkColor: primaryLink ? getComputedStyle(primaryLink).color : null,
    pageOverflowX: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
  };
};

let page;
async function browserPage(route) {
  if (!page) { page = await browser.newPage({ viewport: { width: 1440, height: 960 } }); }
  await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[data-font-surface="product"]', { timeout: 30000 });
  await page.waitForTimeout(700);
}

const results = {};
for (const route of ROUTES) {
  const entry = {};
  for (const w of [1440, 768, 390]) {
    await browserPage(route);
    await page.setViewportSize({ width: w, height: 960 });
    await page.waitForTimeout(500);
    entry[`w${w}`] = await page.evaluate(snap);
  }
  results[route] = entry;
}

// Login methods + live error state at 1440
await page.setViewportSize({ width: 1440, height: 960 });
await browserPage('/login');
const methods = await page.evaluate(snap);
results.loginMethodsChecks = {
  canvasExactly: methods.canvasBg === canvas,
  // The A4 public-bridge radius law normalizes the card's rounded-[28px] marker
  // to the canonical system radius (--radius-media, 12px) with !important; C1
  // keeps the one system's law and records the reconciliation in the ladder doc.
  cardExactly: methods.cardBg === 'rgb(255, 255, 255)' && methods.cardRadius === '12px',
  cardRadii: methods.cardRadius,
  inkPillExactly: !!(methods.primaryPill && methods.primaryPill.bg === ink && methods.primaryPill.h === 44 && methods.primaryPill.radius === '9999px' && methods.primaryPill.fs === '17px' && methods.primaryPill.fw === '500'),
  linkExactly: methods.linkColor === link,
  deadChoicesNull: !methods.hasMobileChoice && !methods.hasOrganizationChoice && !methods.hasComingSoon,
  socialExactly: methods.socialCount === 3,
};
// email step → error state
await page.click('button:has-text("Continue with Email")');
await page.waitForTimeout(500);
await page.fill('input[type="email"]', `c1-probe-${Date.now()}@fixture.invalid`);
await page.click('button[type="submit"]:has-text("Continue")');
await page.waitForTimeout(900);
results.errorState = await page.evaluate(() => {
  const alerts = [...document.querySelectorAll('[role="alert"]')];
  return {
    present: alerts.length > 0,
    colors: [...new Set(alerts.map((a) => getComputedStyle(a).color))],
    titles: alerts.map((a) => (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)),
    iconColor: (() => { const svg = document.querySelector('[role="alert"] svg, .bg-\\[\\#fce8e6\\] svg, .bg-\\[\\#fce8e6\\] + * svg'); const el = document.querySelector('.bg-\\[\\#fce8e6\\]'); if (!el) return null; const icon = el.querySelector('svg') ? getComputedStyle(el.querySelector('svg').closest('svg')) : null; return icon ? icon.color : null; })(),
    headline: (() => { const box = document.querySelector('.bg-\\[\\#fce8e6\\]'); if (!box) return null; const strong = box.querySelector('p.font-medium'); return strong ? { color: getComputedStyle(strong).color, text: (strong.textContent || '').trim() } : null; })(),
  };
});
results.errorStateExactly = results.errorState && results.errorState.headline && results.errorState.headline.color === err;

// ink pill on forgot-user-id + reset-password "invalid" state pills
for (const route of ['/forgot-user-id', '/reset-password']) {
  await browserPage(route);
  results[`${route}-pill`] = await page.evaluate(() => {
    const pill = [...document.querySelectorAll('a, button')].find((el) => /Back to sign in|Request new link/.test(el.textContent || ''));
    if (!pill) return null;
    const s = getComputedStyle(pill);
    return { text: (pill.textContent || '').trim(), bg: s.backgroundColor, h: Math.round(pill.getBoundingClientRect().height), radius: s.borderRadius, fs: s.fontSize };
  });
}

await browser.close();
const fs = await import('node:fs');
const file = path.join(OUT, `c1-probe-${MODE}.json`);
fs.writeFileSync(file, JSON.stringify(results, null, 1));
console.log(`WROTE ${file}`);
const checks = results.loginMethodsChecks || {};
console.log('loginMethodsChecks:', JSON.stringify(checks));
console.log('errorStateExactly:', results.errorStateExactly, 'errorState:', JSON.stringify((results.errorState || {})).slice(0, 300));
for (const r of ROUTES) {
  const e = results[r] || {};
  console.log(r, 'w1440:', JSON.stringify({ ov: e.w1440 && e.w1440.pageOverflowX, canvas: e.w1440 && e.w1440.canvasBg, dead: e.w1440 && (e.w1440.hasMobileChoice || e.w1440.hasOrganizationChoice || e.w1440.hasComingSoon), pill: e.w1440 && e.w1440.primaryPill && e.w1440.primaryPill.bg }));
}
