/* QA internal dashboard sweep — student-role fixture audit (2026-10-20).
 * Usage: node artifacts/qa-2026-10-20/qa-dashboard-sweep.mjs [--base http://127.0.0.1:4197]
 * Walks the seeded student workspace through every public dashboard route, capturing
 * screenshots, layout geometry and console errors.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const argIdx = process.argv.indexOf('--base');
const base = argIdx >= 0 && process.argv[argIdx + 1] ? process.argv[argIdx + 1] : 'http://127.0.0.1:4197';
const outDir = path.resolve('artifacts/qa-2026-10-20/evidence/internal');
await fs.mkdir(outDir, { recursive: true });

const ROUTES = [
  'home', 'learn', 'classes', 'practice', 'build', 'subscription',
  'explore', 'support', 'settings', 'profile', 'connections',
  'progress', 'prepare', 'library', 'reports', 'notifications', 'personalization', 'privacy', 'audit'
];

const FIFTURE = (user) => {
  const now = Date.now();
  const id = user.id + ':' + user.identity;
  const data = { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: new Date(now).toISOString().slice(0, 10) }, legacyImported: false };
  return JSON.stringify({
    version: 2,
    people: [{ id: user.id, email: user.email, name: user.full_name, ageBand: 'adult', roles: user.roles }],
    workspaces: [{ id, personId: user.id, role: user.identity, name: 'Personal' }],
    active: { [user.id]: id },
    relationships: [],
    data: { [id]: data }
  });
};

const USER = { id: 'qa-int', email: 'internal@example.test', full_name: 'Ria', identity: 'student', roles: ['student'], age_band: 'adult', onboarding_complete: true };
const TEACHER = { id: 'qa-teach', email: 'teach@example.test', full_name: 'Sam', identity: 'teacher', roles: ['teacher'], age_band: 'adult', onboarding_complete: true };

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);
page.setDefaultNavigationTimeout(60000);
const errors = [], warnings = [];
page.on('pageerror', (e) => errors.push('pageerror ' + String(e).slice(0, 120)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console ' + m.text().slice(0, 120)); if (m.type() === 'warning') warnings.push(m.text().slice(0, 90)); });

await page.addInitScript((fixture) => {
  if (localStorage.getItem('visionary_workspace_v2')) return;
  localStorage.setItem('visionary_users', JSON.stringify([fixture.user]));
  localStorage.setItem('visionary_sessions', JSON.stringify([{ token: fixture.user.id, userId: fixture.user.id, email: fixture.user.email, expiresAt: Date.now() + 86400000 }]));
  localStorage.setItem('visionary_session_token', fixture.user.id);
  localStorage.setItem('visionary_workspace_v2', fixture.workspace);
}, { user: USER, workspace: FIFTURE(USER) });

const report = [];
await page.goto(base + '/dashboard/home', { waitUntil: 'load' });
await page.waitForTimeout(700);

for (const route of ROUTES) {
  try {
    await page.goto(base + '/dashboard/' + route, { waitUntil: 'load' });
    await page.waitForTimeout(650);
    const info = await page.evaluate(() => {
      const de = document.documentElement;
      const h1 = document.querySelector('h1,h2');
      const shell = document.querySelector('[class*=workspace], [data-testid], main');
      const nav = Array.from(document.querySelectorAll('aside a, nav a, [role=navigation] a')).filter(a => a.offsetParent !== null).length;
      return {
        title: document.title,
        firstHeading: h1 ? (h1.textContent || '').trim().slice(0, 60) : null,
        h: de.scrollHeight,
        overflowX: de.scrollWidth > de.clientWidth + 1,
        sidebarLinks: nav,
        font: getComputedStyle(document.body).fontFamily.split(',')[0].replace(/"/g, '')
      };
    });
    await page.screenshot({ path: path.join(outDir, route + '-1440.jpeg'), type: 'jpeg', quality: 62, fullPage: true });
    report.push({ route, ...info });
  } catch (e) {
    report.push({ route, error: String(e).slice(0, 100) });
  }
}

/* teacher identity: classes + workspace areas */
await page.evaluate(() => {
  const users = JSON.parse(localStorage.getItem('visionary_users'));
  const t = { id: 'qa-teach', email: 'teach@example.test', full_name: 'Sam', identity: 'teacher', roles: ['teacher'], age_band: 'adult', onboarding_complete: true };
  if (!users.some(u => u.id === t.id)) users.push(t);
  localStorage.setItem('visionary_users', JSON.stringify(users));
  localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'qa-teach', userId: 'qa-teach', email: t.email, expiresAt: Date.now() + 86400000 }]));
  localStorage.setItem('visionary_session_token', 'qa-teach');
  localStorage.setItem('visionary_workspace_v2', JSON.parse(JSON.stringify({
    version: 2,
    people: [{ id: 'qa-teach', email: 'teach@example.test', name: 'Sam', ageBand: 'adult', roles: ['teacher'] }],
    workspaces: [{ id: 'qa-teach:teacher', personId: 'qa-teach', role: 'teacher', name: 'Personal' }],
    active: { 'qa-teach': 'qa-teach:teacher' },
    relationships: [],
    data: { 'qa-teach:teacher': { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [] }, legacyImported: false } }
  })));
});
await page.goto(base + '/dashboard/home', { waitUntil: 'load' });
await page.waitForTimeout(700);
for (const route of ['classes', 'people', 'curriculum', 'analytics', 'insights', 'cohorts']) {
  try {
    await page.goto(base + '/dashboard/' + route, { waitUntil: 'load' });
    await page.waitForTimeout(650);
    const info = await page.evaluate(() => ({ title: document.title, firstHeading: document.querySelector('h1,h2') ? (document.querySelector('h1,h2').textContent || '').trim().slice(0, 50) : null, h: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }));
    await page.screenshot({ path: path.join(outDir, 'teacher-' + route + '-1440.jpeg'), type: 'jpeg', quality: 62, fullPage: true });
    report.push({ route: 'teacher/' + route, ...info });
  } catch (e) {
    report.push({ route: 'teacher/' + route, error: String(e).slice(0, 100) });
  }
}

await ctx.close();
await browser.close();
await fs.writeFile(path.join(outDir, 'internal-report.json'), JSON.stringify({ errors: [...new Set(errors)], warnings: [...new Set(warnings)].slice(0, 10), pages: report }, null, 2));
console.log('== internal sweep ==');
console.log('pages: ' + report.length);
console.log('errors: ' + (errors.length ? [...new Set(errors)].slice(0, 6).join(' | ') : 'none'));
for (const r of report) console.log((r.route || '?').padEnd(16), String(r.h ?? '-').padStart(6), (r.firstHeading || r.error || '').slice(0, 48), r.overflowX ? ' OVERFLOW!' : '');
