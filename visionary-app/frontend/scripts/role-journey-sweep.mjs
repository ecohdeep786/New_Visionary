/* FAP-D5 (FAP-29): role fixtures + rendered journey sweep.
 * Seeds a valid workspace fixture per role (relationship-bearing where the
 * local model requires it: FamilyLink for parent<->child, Classroom for the
 * teacher, org memberships for the organization), then walks each role's
 * journey surfaces asserting: page loads, h1 present, no page errors, honest
 * states recorded, rendered contrast + 44px audit sampled (recorded).
 * The 2026-10-20 finding this fixes: teacher/parent surfaces answered
 * "Workspace unavailable" with empty fixtures.
 * Env: JOURNEY_URL (default http://127.0.0.1:5179), JOURNEY_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.JOURNEY_URL || 'http://127.0.0.1:5179';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = path.resolve(productRoot, process.env.JOURNEY_EVIDENCE_DIR || 'docs/visionary/baseline/role-journeys-2026-10-30');
await mkdir(evidenceDir, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const fixtureUser = (role) => ({ id: `qa-${role}`, email: `qa-${role}@example.test`, full_name: 'Alex', identity: role, roles: [role], age_band: 'adult', onboarding_complete: true });
const now = () => Date.now();
const ws = (user, role, extra = {}) => ({ id: `${user.id}:${role}`, personId: user.id, role, name: 'Personal', ...extra });
const baseData = () => ({ conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: new Date(now()).toISOString().slice(0, 10) }, legacyImported: false });

/* Relationship-bearing fixtures. The child is a full person+workspace so the
   parent's /child surface can render a real shared view, not "unavailable". */
const childUser = { id: 'qa-child', email: 'qa-child@example.test', full_name: 'Sam', identity: 'student', roles: ['student'], age_band: 'adult', onboarding_complete: true };
const member = (id, email, name, role) => ({ id, email, name, ageBand: 'adult', roles: [role] });

const FIXTURES = {
  student: { user: fixtureUser('student'), people: [], entities: {} },
  teacher: {
    user: fixtureUser('teacher'), people: [],
    entities: { Classroom: [{ id: 'cls-1', name: 'Physics 9A', subject: 'Physics', teacher_email: 'qa-teacher@example.test', teacher_name: 'Alex', join_code: 'JOIN9A', created_at: new Date(now()).toISOString() }] },
  },
  parent: {
    user: fixtureUser('parent'),
    people: [childUser],
    childWorkspaces: [childUser],
    entities: { FamilyLink: [{ id: 'fl-1', parent_email: 'qa-parent@example.test', child_email: 'qa-child@example.test', status: 'active', requested_at: new Date(now()).toISOString(), responded_at: new Date(now()).toISOString() }] },
  },
  professional: { user: fixtureUser('professional'), people: [], entities: {} },
  organization: {
    user: fixtureUser('organization'),
    people: [member('qa-member-1', 'qa-teacher@example.test', 'Alex Teacher', 'teacher'), member('qa-member-2', 'qa-student@example.test', 'Alex Student', 'student')],
    entities: {},
  },
};

const JOURNEYS = {
  student: ['/dashboard/home', '/dashboard/learn', '/dashboard/ask', '/dashboard/progress'],
  teacher: ['/dashboard/home', '/dashboard/classes', '/dashboard/prepare', '/dashboard/insights'],
  parent: ['/dashboard/home', '/dashboard/child', '/dashboard/reports', '/dashboard/notifications'],
  professional: ['/dashboard/home', '/dashboard/career', '/dashboard/build', '/dashboard/settings'],
  organization: ['/dashboard/home', '/dashboard/people', '/dashboard/curriculum', '/dashboard/analytics'],
};

/* Rendered audit (the FAP-30 law, recorded here per surface). */
const renderedAudit = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((s) => parseFloat(s)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: fg.a + bg.a * (1 - fg.a) });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratioOf = (a, b) => { const l1 = lum(a), l2 = lum(b); const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]; return (hi + 0.05) / (lo + 0.05); };
  const bgChain = (el) => {
    const layers = []; let node = el;
    while (node && node !== document.documentElement) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0) layers.push(c);
      if (c && c.a >= 1) break;
      node = node.parentElement;
    }
    if (!layers.length || layers[layers.length - 1].a < 1) { const b = parse(getComputedStyle(document.body).backgroundColor); if (b) layers.push(b); }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
    return bg;
  };
  const texts = [...document.querySelectorAll('#main p,#main li,#main label,#main span,#main a,#main button,#main h1,#main h2,#main h3,#main td,#main th,#main dt,#main dd')]
    .filter((el) => el.offsetParent !== null && !el.closest('[aria-hidden="true"],.sr-only') && (el.textContent || '').trim().length > 1 && ![...el.childNodes].some((n) => n.nodeType === 1));
  const seen = new Map();
  for (const el of texts) {
    const cs = getComputedStyle(el);
    let fg = parse(cs.color); const bg = bgChain(el);
    if (!fg || !bg) continue;
    if (fg.a < 1) fg = over(fg, bg);
    const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight, 10) || 400;
    const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
    const key = `${cs.color}|${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}|${fs}|${fw}`;
    if (!seen.has(key)) seen.set(key, { color: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, fs, fw, large, required: large ? 3 : 4.5, ratio: Math.round(ratioOf(fg, bg) * 100) / 100, sample: (el.textContent || '').trim().slice(0, 40), html: el.outerHTML.slice(0, 200) });
  }
  const controls = [...document.querySelectorAll('#main a[href],#main button')]
    .filter((el) => el.offsetParent !== null)
    .map((el) => { const r = el.getBoundingClientRect(); return { text: (el.textContent || '').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), html: el.outerHTML.slice(0, 220) }; })
    .filter((c) => c.w > 0);
  return {
    worst: [...seen.values()].sort((a, b) => a.ratio - b.ratio).slice(0, 3),
    lowContrast: [...seen.values()].filter((s) => s.ratio < s.required),
    smallControls: controls.filter((c) => Math.min(c.w, c.h) < 44),
  };
};

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const receipt = { at: new Date().toISOString(), base, roles: [], note: 'local fixture journeys - the "real-user" hosted journeys need a signed-in founder session (honest boundary); the FAP-30 rendered audit is recorded per surface, and lowContrast/smallControls are findings, not gates here' };

for (const [role, fix] of Object.entries(FIXTURES)) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await context.addInitScript(({ fix, role }) => {
    if (localStorage.getItem('visionary_workspace_v2')) return;
    const baseData = () => ({ conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: new Date(Date.now()).toISOString().slice(0, 10) }, legacyImported: false });
    const childUser = { id: 'qa-child', email: 'qa-child@example.test', full_name: 'Sam', identity: 'student', roles: ['student'], age_band: 'adult', onboarding_complete: true };
    const toPerson = (u) => ({ id: u.id, email: u.email, name: u.full_name || u.name, ageBand: u.age_band || u.ageBand || 'adult', roles: u.roles });
    const user = toPerson(fix.user);
    const people = [user, ...fix.people.map(toPerson)];
    const workspaces = [{ id: `${fix.user.id}:${role}`, personId: fix.user.id, role, name: 'Personal' }];
    const active = { [fix.user.id]: workspaces[0].id };
    const data = { [workspaces[0].id]: baseData() };
    for (const p of fix.people) {
      if (p.id === 'qa-child') {
        const cws = { id: 'qa-child:student', personId: 'qa-child', role: 'student', name: 'Personal' };
        workspaces.push(cws); active['qa-child'] = cws.id;
        data[cws.id] = baseData();
        data[cws.id].sessions = [{ id: 'journey-child-check', journeyId: 'cube', stage: 'checking', locale: 'en', position: 0, answers: {}, canvas: { size: 3, rotation: 25 }, notes: '', updatedAt: new Date().toISOString(), interrupted: false, evidence: [{ id: 'journey-ev-1', objectiveId: 'cube', kind: 'check', correct: 2, total: 3, at: new Date().toISOString(), delayed: false }] }];
      }
    }
    localStorage.setItem('visionary_users', JSON.stringify(people.map((u) => ({ id: u.id, email: u.email, full_name: u.name, identity: u.roles[0], roles: u.roles, age_band: 'adult', onboarding_complete: true }))));
    localStorage.setItem('visionary_sessions', JSON.stringify([{ token: fix.user.id, userId: fix.user.id, email: fix.user.email, expiresAt: Date.now() + 86400000 }]));
    localStorage.setItem('visionary_session_token', fix.user.id);
    localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people, workspaces, active, relationships: [], data }));
    for (const [name, rows] of Object.entries(fix.entities || {})) localStorage.setItem(`visionary_entity_${name}`, JSON.stringify(rows));
  }, { fix, role });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  const surfaces = [];
  for (const route of JOURNEYS[role]) {
    const surf = { route };
    try {
      await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
      await page.waitForTimeout(1500);
      const state = await page.evaluate(() => ({
        h1: document.querySelector('#main h1, main h1, .workspace-shell #main h1')?.textContent?.trim() || null,
        body: document.body.innerText.slice(0, 400).replace(/\n+/g, ' | '),
      }));
      surf.h1 = state.h1;
      surf.unavailable = /unavailable|Opening family workspace|Retry workspace|Retry family/i.test(state.body);
      surf.snippet = state.body.slice(0, 180);
      const audit = await page.evaluate(renderedAudit);
      surf.lowContrast = audit.lowContrast;
      surf.smallControls = audit.smallControls;
      surf.worstContrast = audit.worst[0] || null;
      await page.screenshot({ path: path.join(evidenceDir, `${role}${route === '/dashboard/home' ? '-home' : route.replaceAll('/', '-')}.png`) });
    } catch (err) {
      surf.error = String(err).slice(0, 200);
    }
    surfaces.push(surf);
  }
  receipt.roles.push({ role, pageErrors: errors, surfaces });
  await context.close();
}
await browser.close();

/* Gates: every surface renders with an h1 and zero page errors. Findings
   (lowContrast/smallControls/unavailable states) are recorded for triage. */
let failed = 0;
for (const r of receipt.roles) {
  assert.deepEqual(r.pageErrors, [], `${r.role} page errors: ${JSON.stringify(r.pageErrors)}`);
  for (const s of r.surfaces) {
    if (s.error) { console.log(`${r.role} ${s.route}: NAV ERROR ${s.error}`); failed++; continue; }
    if (!s.h1) { console.log(`${r.role} ${s.route}: NO H1 — ${s.snippet}`); failed++; continue; }
    const flags = [s.lowContrast.length && `lowContrast:${s.lowContrast.length}`, s.smallControls.length && `smallControls:${s.smallControls.length}`, s.unavailable && 'unavailable-state'].filter(Boolean);
    console.log(`${r.role} ${s.route}: h1="${s.h1.slice(0, 40)}"${flags.length ? ' [' + flags.join(', ') + ']' : ''}`);
  }
}
await writeFile(path.join(evidenceDir, 'journey-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
if (failed) { console.log(`FAIL ${failed} surface(s) did not render an h1`); process.exit(1); }
console.log('PASS all role journey surfaces render (h1 + zero page errors); contrast/tap findings recorded per surface.');
