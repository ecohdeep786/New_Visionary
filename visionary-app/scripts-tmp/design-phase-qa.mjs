// Rendered, fictional-data check for the internal design phase.
// Run after `vite build` with a preview server; VISIONARY_BASE overrides the URL.
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:4187';
const output = 'docs/visionary/baseline/design-2026-09-27';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const roles = ['student', 'teacher', 'parent', 'professional', 'organization'];

async function openRole(role, animation = 'boy') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(({ role, animation }) => {
    const id = `design-${role}`;
    const email = `${id}@visionary.test`;
    const user = { id, email, full_name: role === 'student' ? 'Aarav' : role === 'teacher' ? 'Dev' : role === 'parent' ? 'Anika' : role === 'professional' ? 'Sam' : 'School', identity: role, onboarding_complete: true, age_band: 'adult', roles: [role] };
    const workspaceId = `${id}:${role}`;
    const person = { id, email, name: user.full_name, ageBand: 'adult', roles: [role], learningContext: role === 'student' ? { classLevel: 'Class 10', stage: 'school', board: 'CBSE', subjects: ['Mathematics'] } : undefined };
    const data = { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', bilingual: false, lowBandwidth: false, notifications: 'weekly', memory: true, voice: true, agiAnimation: animation }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: new Date().toISOString().slice(0, 10) }, legacyImported: false };
    localStorage.setItem('visionary_users', JSON.stringify([user]));
    localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'design-session', userId: id, email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
    localStorage.setItem('visionary_session_token', 'design-session');
    localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: [person], workspaces: [{ id: workspaceId, personId: id, role, name: `${role[0].toUpperCase()}${role.slice(1)}`, lastPath: '/dashboard/home' }], active: { [id]: workspaceId }, relationships: [], data: { [workspaceId]: data } }));
  }, { role, animation });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(`${base}/dashboard/home`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /Welcome back/ }).waitFor();
  return { context, page, errors };
}

try {
  for (const role of roles) {
    const { context, page, errors } = await openRole(role);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.waitForTimeout(200);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      const active = await page.locator('.workspace-nav-link[aria-current="page"]').count();
      if (errors.length || overflow > 1 || (width === 1440 && active !== 1)) throw new Error(`${role}@${width}: ${JSON.stringify({ errors, overflow, active })}`);
      await page.screenshot({ path: `${output}/${role}-home-${width}.png` });
      console.log(`${role}@${width}: home visible, overflow ${overflow}, errors ${errors.length}`);
    }
    await context.close();
  }

  for (const [route, heading] of [['learn', 'Your learning outline'], ['practice', 'Your next practice'], ['build', 'Build something of your own']]) {
    const { context, page, errors } = await openRole('student');
    await page.goto(`${base}/dashboard/${route}`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: heading }).waitFor();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.waitForTimeout(200);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (errors.length || overflow > 1) throw new Error(`${route}@${width}: ${JSON.stringify({ errors, overflow })}`);
      await page.screenshot({ path: `${output}/student-${route}-${width}.png` });
      console.log(`${route}@${width}: work area visible, overflow ${overflow}, errors ${errors.length}`);
    }
    await context.close();
  }

  {
    const { context, page, errors } = await openRole('student');
    await page.goto(`${base}/dashboard/ask`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Visionary Guide' }).waitFor();
    for (const width of [1440, 720, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (errors.length || overflow > 1) throw new Error(`ask@${width}: ${JSON.stringify({ errors, overflow })}`);
      await page.screenshot({ path: `${output}/student-ask-${width}.png` });
      console.log(`ask@${width}: composer visible, overflow ${overflow}, errors ${errors.length}`);
    }
    await page.getByRole('button', { name: /Open Visionary voice panel/ }).click();
    await page.getByRole('link', { name: 'Use text instead' }).click();
    if (await page.getByRole('heading', { name: 'Your voice presence' }).count()) throw new Error('Text fallback left the voice panel over Ask');
    await page.getByRole('textbox', { name: 'Message Visionary Guide' }).focus();
    const focused = await page.evaluate(() => document.activeElement?.id);
    if (focused !== 'guide-input') throw new Error('Ask composer did not accept keyboard focus');
    await context.close();
  }

  {
    const { context, page, errors } = await openRole('student');
    await page.goto(`${base}/dashboard/build`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'New project' }).click();
    await page.getByRole('textbox', { name: 'Project title' }).fill('Water quality model');
    await page.getByRole('textbox', { name: 'Your working document' }).fill('Compare two sources and record the evidence.');
    for (const width of [1440, 720, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (errors.length || overflow > 1) throw new Error(`build editor@${width}: ${JSON.stringify({ errors, overflow })}`);
      await page.screenshot({ path: `${output}/student-build-editor-${width}.png` });
      console.log(`build editor@${width}: populated, overflow ${overflow}, errors ${errors.length}`);
    }
    await context.close();
  }

  {
    const { context, page, errors } = await openRole('student');
    await page.goto(`${base}/dashboard/learn`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Try authored learning sample' }).click();
    await page.getByRole('heading', { name: 'Mathematics' }).waitFor();
    const chapter = page.getByRole('region', { name: 'Subject chapters' }).getByRole('button').first();
    await chapter.click();
    await page.locator('section[aria-label$="learning path"]').getByRole('button', { name: /^Start / }).first().click();
    await page.getByRole('heading', { name: 'Understand one idea' }).waitFor();
    for (const width of [1440, 720, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (errors.length || overflow > 1) throw new Error(`learn unit@${width}: ${JSON.stringify({ errors, overflow })}`);
      await page.screenshot({ path: `${output}/student-learn-unit-${width}.png` });
      console.log(`learn unit@${width}: sample and source visible, overflow ${overflow}, errors ${errors.length}`);
    }
    await context.close();
  }

  for (const animation of ['boy', 'girl']) {
    const { context, page, errors } = await openRole('student', animation);
    const before = await page.evaluate(() => localStorage.getItem('visionary_mentor_v1'));
    await page.getByRole('button', { name: /Open Visionary voice panel/ }).click();
    await page.getByRole('heading', { name: 'Your voice presence' }).waitFor();
    await page.waitForTimeout(250);
    const after = await page.evaluate(() => localStorage.getItem('visionary_mentor_v1'));
    if (before !== after) throw new Error(`${animation}: opening the visual presence created learning evidence`);
    const selected = await page.getByRole('button', { name: animation === 'boy' ? 'Vision Boy' : 'Vision Girl', exact: true }).getAttribute('aria-pressed');
    if (selected !== 'true') throw new Error(`${animation} selection is not visible`);
    const preview = page.locator('.workspace-voice-preview');
    const firstFrame = await preview.screenshot();
    await page.waitForTimeout(450);
    const secondFrame = await preview.screenshot();
    if (firstFrame.equals(secondFrame)) throw new Error(`${animation}: preview has no visible motion`);
    await page.screenshot({ path: `${output}/voice-${animation}-1440.png` });
    await page.getByRole('button', { name: 'Turn audio off' }).click();
    await page.getByText('Audio off', { exact: true }).first().waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${output}/voice-${animation}-390.png` });
    if (errors.length) throw new Error(`${animation}: ${errors.join('; ')}`);
    console.log(`${animation}: panel, selection, audio-off and mobile layout pass`);
    await page.keyboard.press('Escape');
    if (await page.getByRole('heading', { name: 'Your voice presence' }).count()) throw new Error(`${animation}: Escape did not close the panel`);
    await context.close();
  }

  const { context, page } = await openRole('student', 'girl');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: /Open Visionary voice panel/ }).click();
  const animationName = await page.locator('.workspace-voice-preview-bars i').first().evaluate(node => getComputedStyle(node).animationName);
  if (animationName !== 'none') throw new Error(`Reduced motion still animates: ${animationName}`);
  console.log('reduced motion: preview animation disabled');
  await context.close();
} finally {
  await browser.close();
}
