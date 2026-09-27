// Interconnect E2E (single context, one device — the real product pattern): all four
// identities share one storage; switching session tokens switches accounts. Walks the
// full interconnect: learner studies+posts → teacher sees/moderates/promotes → the
// learner's Home shows the transition notice → parent report → organization aggregate.
const { chromium } = await import('playwright-core');
const BASE = 'http://localhost:4173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(`(() => {
  const teacherUser = { id: 'ic-teacher', email: 'ic-teacher@visionary.test', full_name: 'Dev Nair', identity: 'teacher', onboarding_complete: true, age_band: 'adult', roles: ['teacher'] };
  const learnerUser = { id: 'ic-aarav', email: 'ic-aarav@visionary.test', full_name: 'Aarav Kumar', identity: 'student', onboarding_complete: true, age_band: 'minor', board: 'CBSE', grade_level: 'Class 7', subjects: ['Mathematics'], roles: ['student'] };
  const parentUser = { id: 'ic-parent', email: 'ic-parent@visionary.test', full_name: 'Anika Rao', identity: 'parent', onboarding_complete: true, age_band: 'adult', roles: ['parent'] };
  const orgUser = { id: 'ic-org', email: 'ic-org@visionary.test', full_name: 'Vikram Shah', identity: 'organization', onboarding_complete: true, age_band: 'adult', roles: ['organization'] };
  localStorage.setItem('visionary_users', JSON.stringify([teacherUser, learnerUser, parentUser, orgUser]));
  localStorage.setItem('visionary_sessions', JSON.stringify([
    { token: 'ic-tok-teacher', userId: teacherUser.id, email: teacherUser.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() },
    { token: 'ic-tok-learner', userId: learnerUser.id, email: learnerUser.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() },
    { token: 'ic-tok-parent', userId: parentUser.id, email: parentUser.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() },
    { token: 'ic-tok-org', userId: orgUser.id, email: orgUser.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() },
  ]));
  const tWs = 'ic-teacher:teacher', lWs = 'ic-aarav:student', pWs = 'ic-parent:parent', oWs = 'ic-org:organization';
  const empty = { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', bilingual: false, lowBandwidth: false, notifications: 'weekly', memory: true, voice: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: '2026-09-26' }, legacyImported: false };
  const db = {
    version: 2,
    people: [
      { id: 'ic-teacher', email: teacherUser.email, name: 'Dev Nair', ageBand: 'adult', roles: ['teacher'] },
      { id: 'ic-aarav', email: learnerUser.email, name: 'Aarav Kumar', ageBand: 'minor', roles: ['student'], learningContext: { board: 'CBSE', classLevel: 'Class 7', subjects: ['Mathematics'] } },
      { id: 'ic-parent', email: parentUser.email, name: 'Anika Rao', ageBand: 'adult', roles: ['parent'] },
      { id: 'ic-org', email: orgUser.email, name: 'Vikram Shah', ageBand: 'adult', roles: ['organization'] },
    ],
    workspaces: [
      { id: tWs, personId: 'ic-teacher', role: 'teacher', name: 'Teacher', lastPath: '/dashboard/home' },
      { id: lWs, personId: 'ic-aarav', role: 'student', name: 'Learner', lastPath: '/dashboard/home' },
      { id: pWs, personId: 'ic-parent', role: 'parent', name: 'Parent', lastPath: '/dashboard/home' },
      { id: oWs, personId: 'ic-org', role: 'organization', name: 'My organization', lastPath: '/dashboard/home' },
    ],
    active: { 'ic-teacher': tWs, 'ic-aarav': lWs, 'ic-parent': pWs, 'ic-org': oWs },
    relationships: [{ id: 'ic-guardian', from: 'ic-parent', to: 'ic-aarav', type: 'guardian', scope: ['progress-summary'], status: 'active' }],
    data: { [tWs]: { ...empty }, [lWs]: { ...empty }, [pWs]: { ...empty }, [oWs]: { ...empty } },
  };
  localStorage.setItem('visionary_workspace_v2', JSON.stringify(db));
  localStorage.setItem('visionary_entity_Classroom', JSON.stringify([{ id: 'ic-class', name: 'Space, shape and reasoning', subject: 'Geometry', teacher_email: 'ic-teacher@visionary.test', teacher_id: 'ic-teacher', teacher_name: 'Dev Nair', join_code: 'IC-CLASS', organization_email: 'ic-org@visionary.test', color: '#1967d2', createdAt: Date.now() }]));
  localStorage.setItem('visionary_entity_Enrollment', JSON.stringify([{ id: 'ic-enrollment', class_id: 'ic-class', student_email: 'ic-aarav@visionary.test', student_id: 'ic-aarav', student_name: 'Aarav Kumar', status: 'active', createdAt: Date.now() }]));
  localStorage.setItem('visionary_entity_Assignment', JSON.stringify([{ id: 'ic-assignment', class_id: 'ic-class', teacher_email: 'ic-teacher@visionary.test', title: 'Volume investigation', status: 'published', points: 10, createdAt: Date.now() }]));
  localStorage.setItem('visionary_entity_OrganizationInvite', JSON.stringify([{ id: 'ic-org-invite', organization_email: 'ic-org@visionary.test', organization_name: 'IC School', email: 'ic-teacher@visionary.test', role: 'teacher', status: 'active' }]));
  localStorage.setItem('visionary_session_token', 'ic-tok-learner');
})()`);
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
const goto = async url => { for (let attempt = 1; attempt <= 3; attempt++) { try { await page.goto(BASE + url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 }); return; } catch (e) { console.log('goto retry ' + attempt + ': ' + String(e).slice(0, 80)); if (attempt === 3) throw new Error('goto failed: ' + url); await page.waitForTimeout(1500); } } };
const asUser = async (token, userId, wsId) => { await page.evaluate(([tok, uid, ws]) => { localStorage.setItem('visionary_session_token', tok); const db = JSON.parse(localStorage.getItem('visionary_workspace_v2')); db.active[uid] = ws; localStorage.setItem('visionary_workspace_v2', JSON.stringify(db)); }, [token, userId, wsId]); };
const log = [];

// 1. LEARNER: developing-tier Home (class 7), posts to the class community.
// The seed already sets the learner's session token; no account switch needed first.
await goto('/dashboard/home');
await page.waitForTimeout(2000);
const loaded = await page.evaluate(() => document.body.innerText.includes('Welcome back'));
console.log('home loaded:', loaded);
await page.waitForTimeout(500);
const tier = await page.evaluate(() => document.querySelector('.workspace-shell')?.className.match(/stage-(\w+)/)?.[1]);
const orb = await page.locator('.v-audio-orb-button').count();
console.log("LOG:", `1. learner home: tier=${tier} orb=${orb === 1}`);
await goto('/dashboard/classes?class=ic-class');
await page.waitForTimeout(1500);
await page.getByRole('button', { name: 'Community' }).click();
await page.waitForTimeout(700);
await page.locator('textarea').fill('Why does doubling the side multiply the volume by eight?');
await page.getByRole('button', { name: 'Post' }).click();
await page.waitForTimeout(800);
const posted = await page.getByText('Why does doubling the side').count();
console.log("LOG:", `2. learner community post: visible=${posted > 0}`);
await page.screenshot({ path: 'scripts-tmp/net-learner-post.png', clip: { x: 0, y: 0, width: 1440, height: 560 } });

// 2. TEACHER: sees the learner with a tier badge, sees the post, records the class promotion.
await page.evaluate(() => { localStorage.setItem('visionary_session_token', 'ic-tok-teacher'); const db = JSON.parse(localStorage.getItem('visionary_workspace_v2')); db.active['ic-teacher'] = 'ic-teacher:teacher'; localStorage.setItem('visionary_workspace_v2', JSON.stringify(db)); });
await goto('/dashboard/learners');
await page.waitForTimeout(2000);
const badge = await page.getByText('Developing · classes 6–8').count();
console.log("LOG:", `3. teacher learners: tierBadge=${badge > 0}`);
await goto('/dashboard/classes?class=ic-class');
await page.waitForTimeout(1500);
await page.getByRole('button', { name: 'Community' }).click();
await page.waitForTimeout(700);
const modView = await page.getByText('Why does doubling the side').count();
await goto('/dashboard/class/ic-class');
await page.waitForTimeout(1500);
await page.getByText('Record class promotion').first().click();
await page.getByLabel('Next class level').fill('8');
await page.getByLabel('Promotion reason').fill('End of year promotion');
await page.getByRole('button', { name: 'Record promotion' }).click();
await page.waitForTimeout(800);
const promoted = await page.getByText(/learner moved to class 8/).count();
console.log("LOG:", `4. teacher: communityPostVisible=${modView > 0} promotionSummary=${promoted > 0}`);
await page.screenshot({ path: 'scripts-tmp/net-teacher-promotion.png', clip: { x: 0, y: 0, width: 1440, height: 560 } });

// 3. LEARNER: the transition notice renders with Undo/Postpone.
await page.evaluate(() => { localStorage.setItem('visionary_session_token', 'ic-tok-learner'); const db = JSON.parse(localStorage.getItem('visionary_workspace_v2')); db.active['ic-aarav'] = 'ic-aarav:student'; localStorage.setItem('visionary_workspace_v2', JSON.stringify(db)); });
await goto('/dashboard/home');
await page.waitForTimeout(2000);
const notice = await page.getByText('Your stage changed').count();
const undo = await page.getByRole('button', { name: 'Undo this change' }).count();
const newTier = await page.evaluate(() => document.querySelector('.workspace-shell')?.className.match(/stage-(\w+)/)?.[1]);
console.log("LOG:", `5. learner after promotion: notice=${notice > 0} undo=${undo > 0} shellTier=${newTier}`);
await page.screenshot({ path: 'scripts-tmp/net-learner-notice.png', clip: { x: 0, y: 0, width: 1440, height: 620 } });

// 4. PARENT: consent-scoped report shows the child.
await page.evaluate(() => { localStorage.setItem('visionary_session_token', 'ic-tok-parent'); const db = JSON.parse(localStorage.getItem('visionary_workspace_v2')); db.active['ic-parent'] = 'ic-parent:parent'; localStorage.setItem('visionary_workspace_v2', JSON.stringify(db)); });
await goto('/dashboard/reports');
await page.waitForTimeout(2000);
const child = await page.evaluate(() => document.body.innerText.includes('Aarav'));
console.log("LOG:", `6. parent report: childVisible=${child}`);
await page.screenshot({ path: 'scripts-tmp/net-parent-report.png', clip: { x: 0, y: 0, width: 1440, height: 620 } });

// 5. ORGANIZATION: aggregate analytics over the connected class.
await page.evaluate(() => { localStorage.setItem('visionary_session_token', 'ic-tok-org'); const db = JSON.parse(localStorage.getItem('visionary_workspace_v2')); db.active['ic-org'] = 'ic-org:organization'; localStorage.setItem('visionary_workspace_v2', JSON.stringify(db)); });
await goto('/dashboard/analytics');
await page.waitForTimeout(2000);
const orgText = await page.evaluate(() => document.body.innerText.length);
console.log("LOG:", `7. organization analytics: rendered=${orgText > 100}`);

// 6. The learner returns: everything still theirs, no leaks.
await page.evaluate(() => { localStorage.setItem('visionary_session_token', 'ic-tok-learner'); const db = JSON.parse(localStorage.getItem('visionary_workspace_v2')); db.active['ic-aarav'] = 'ic-aarav:student'; localStorage.setItem('visionary_workspace_v2', JSON.stringify(db)); });
await goto('/dashboard/home');
await page.waitForTimeout(2000);
const leak = await page.evaluate(() => document.body.innerText.includes('Dev Nair') || document.body.innerText.includes('Anika Rao'));
const orbFinal = await page.locator('.v-audio-orb-button').count();
console.log("LOG:", `8. learner return: noLeak=${!leak} orb=${orbFinal === 1}`);
await page.screenshot({ path: 'scripts-tmp/net-final.png', fullPage: true });
await browser.close();
console.log(log.join('\n'));
