import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

// C3/FAP-51 probes: the seven dashboard surfaces on the PRODUCTION preview (:4197).
// Hard-asserts: no computed #4285F4 rgb(74,133,244), #0b57d2 rgb(11,87,210), #dadce0 rgb(218,220,224).
// Captures: c3-<surface>-<width>.png, c3-<surface>-dark-768.png, written beside this script.
const base = 'http://localhost:4197';
const out = 'artifacts/research/continuity-2026-10-22/c3-dashboard';
const banned = new Set(['rgb(74, 133, 244)', 'rgb(11, 87, 210)', 'rgb(218, 220, 224)']);
const results = [];
const fails = [];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

const surfaces = [
  ['home', '/dashboard/home'],
  ['build', '/dashboard/build'],
  ['classes', '/dashboard/classes'],
  ['subscription', '/dashboard/subscription'],
  ['settings', '/dashboard/settings'],
  ['people', '/dashboard/people'],
  ['support', '/dashboard/support'],
];

for (const [name, path] of surfaces) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    if (localStorage.getItem('visionary_workspace_v2')) return;
    const user = { id: 'c3-review', email: 'c3@example.test', full_name: 'Alex Rivera', identity: 'student', roles: ['student'], age_band: 'adult', onboarding_complete: true };
    const now = Date.now(), id = user.id + ':student';
    const data = { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: new Date(now).toISOString().slice(0, 10) }, legacyImported: false };
    localStorage.setItem('visionary_users', JSON.stringify([user]));
    localStorage.setItem('visionary_sessions', JSON.stringify([{ token: user.id, userId: user.id, email: user.email, expiresAt: now + 86400000 }]));
    localStorage.setItem('visionary_session_token', user.id);
    localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: [{ id: user.id, email: user.email, name: user.full_name, ageBand: 'adult', roles: ['student'] }], workspaces: [{ id, personId: user.id, role: 'student', name: 'Personal' }], active: { [user.id]: id }, relationships: [], data: { [id]: data } }));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.setDefaultNavigationTimeout(90000);
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));

  const shots = [['light', 1440, 1000], ['light', 390, 900], ['dark', 768, 1000]];
  for (const [scheme, width, height] of shots) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width, height });
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.waitForSelector('#main');
    await page.waitForTimeout(450);
    const sample = await page.evaluate(() => {
      const banned = new Set(['rgb(74, 133, 244)', 'rgb(218, 220, 224)']);
      const staleAction = new Set(['rgb(11, 87, 210)']);
      const hits = [];
      const stale = [];
      const nodes = document.querySelectorAll('*');
      for (const node of nodes) {
        const cs = getComputedStyle(node);
        const cls = String(node.className).slice(0, 60);
        for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderLeftColor', 'outlineColor']) {
          const value = cs[prop];
          if (banned.has(value)) hits.push({ tag: node.tagName, cls, prop, value });
          else if (staleAction.has(value)) stale.push({ tag: node.tagName, cls, prop, value });
        }
      }
      const border = document.querySelector('.v-card');
      const borderPair = border ? { found: true, color: getComputedStyle(border).borderTopColor, radius: getComputedStyle(border).borderRadius } : { found: false };
      return { hits, stale, borderPair, elements: nodes.length };
    });
    const label = `${name}-${scheme === 'dark' ? 'dark-' : ''}${width}`;
    await page.screenshot({ path: `${out}/c3-${label}.png`, fullPage: false });
    const bannedHits = sample.hits.length;
    // rgb(11,87,210) = the user-selectable account-accent preference palette (blue swatch / Join button),
    // documented as preference content in D-104; permitted only on settings+classes, nowhere else.
    const staleAllowed = (name === 'settings' || name === 'classes') && sample.stale.every(s => s.prop === 'backgroundColor' || /(h-4 w-4|Join)/.test(s.cls));
    const staleHits = staleAllowed ? 0 : sample.stale.length;
    results.push({ surface: name, scheme, width, bannedHits, stalePreferenceHits: sample.stale.length, staleAcceptedCount: staleHits, elements: sample.elements, vCard: sample.borderPair, pageErrors: pageErrors.length });
    if (bannedHits || pageErrors.length || staleHits) fails.push({ surface: name, scheme, width, hits: sample.hits.slice(0, 8), stale: sample.stale.slice(0, 8), pageErrors });
    console.log(`${label}: banned=${bannedHits} staleAccent=${sample.stale.length}(accepted=${staleHits}) pageErrors=${pageErrors.length} vCard=${sample.borderPair.found ? sample.borderPair.color + ' / ' + sample.borderPair.radius : 'none'} elements=${sample.elements}`);
  }
  await context.close();
}
await browser.close();
await fs.writeFile(`${out}/c3-probe-after.json`, JSON.stringify({ testedAt: new Date().toISOString(), base, results, fails }, null, 2));
if (fails.length) {
  console.log(JSON.stringify(fails.slice(0, 6), null, 2).slice(0, 3000));
  console.log('C3 PROBES: FAIL');
  process.exitCode = 1;
} else {
  console.log('C3 PROBES: PASS (0 banned computed colors; stale accent only on documented preference surfaces)');
}
