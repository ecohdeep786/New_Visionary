// Renders every sub-category profile in the production bundle and captures its Home.
const { chromium } = await import('playwright-core');
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const profiles = [
  { id: 'sub-p3', name: 'Aarav Kumar', grade: 'Class 3', age: 'minor', stage: 'school', label: 'student-school-primary' },
  { id: 'sub-p7', name: 'Meera Singh', grade: 'Class 7', age: 'minor', stage: 'school', label: 'student-school-middle' },
  { id: 'sub-p10', name: 'Rohan Das', grade: 'Class 10', age: 'minor', stage: 'school', label: 'student-school-secondary' },
  { id: 'sub-jee', name: 'Riya Sharma', grade: 'Class 12', age: 'minor', stage: 'competitive', exam: 'JEE Advanced', label: 'student-competitive' },
  { id: 'sub-high', name: 'Kabir Roy', grade: '', age: 'adult', stage: 'higher_ed', label: 'student-highered' },
  { id: 'sub-pro', name: 'Sam Verma', grade: '', age: 'adult', identity: 'professional', stage: '', label: 'professional' },
  { id: 'sub-teach', name: 'Dev Nair', grade: '', age: 'adult', identity: 'teacher', stage: '', label: 'teacher' },
  { id: 'sub-parent', name: 'Anika Rao', grade: '', age: 'adult', identity: 'parent', stage: '', label: 'parent' },
  { id: 'sub-org', name: 'Vikram Shah', grade: '', age: 'adult', identity: 'organization', stage: '', label: 'organization' },
];
for (const profile of profiles) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(`(() => {
    const user = { id: '${profile.id}', email: '${profile.id}@visionary.test', full_name: '${profile.name}', identity: '${profile.identity || 'student'}', onboarding_complete: true, age_band: '${profile.age}', education_stage: '${profile.stage}', grade_level: '${profile.grade}', subjects: ['Mathematics'], roles: ['${profile.identity || 'student'}'] };
    localStorage.setItem('visionary_users', JSON.stringify([user]));
    localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'qa-token', userId: user.id, email: user.email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
    localStorage.setItem('visionary_session_token', 'qa-token');
    const wsId = '${profile.id}:${profile.identity || 'student'}';
    const empty = { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', bilingual: false, lowBandwidth: false, notifications: 'weekly', memory: true, voice: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: '2026-09-26' }, legacyImported: false };
    const lc = '${profile.grade}' ? { board: 'CBSE', classLevel: '${profile.grade}', subjects: ['Mathematics'], stage: '${profile.stage}'${profile.exam ? `, exam: '${profile.exam}'` : ''} } : undefined;
    const db = { version: 2, people: [{ id: '${profile.id}', email: '${profile.id}@visionary.test', name: '${profile.name}', ageBand: '${profile.age}', roles: ['${profile.identity || 'student'}'], learningContext: lc || undefined }], workspaces: [{ id: wsId, personId: '${profile.id}', role: '${profile.identity || 'student'}', name: '${profile.identity || 'student'}' === 'organization' ? 'My organization' : '${profile.identity || 'Learner'}', lastPath: '/dashboard/home' }], active: { '${profile.id}': wsId }, relationships: [], data: { [wsId]: { ...empty } } };
    localStorage.setItem('visionary_workspace_v2', JSON.stringify(db));
  })()`);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 100)));
  await page.goto('http://localhost:4173/dashboard/home', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const stage = await page.evaluate(() => document.querySelector('.workspace-shell')?.className.match(/stage-(\w+)/)?.[1] || 'none');
  await page.screenshot({ path: `scripts-tmp/subcat-${profile.label}.png`, clip: { x: 0, y: 0, width: 1440, height: 620 } });
  console.log(`${profile.label}: stage=${stage} errors=${errors.length} ${errors[0] || ''}`);
  await context.close();
}
await browser.close();
