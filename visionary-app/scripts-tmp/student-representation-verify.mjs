// Production-preview check for the authored cube lesson inside the saved learning unit.
import { chromium } from 'playwright-core';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:4190';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(() => {
 if (localStorage.getItem('visionary_workspace_v2')) return;
 const id = 'representation-student'; const email = `${id}@visionary.test`; const workspaceId = `${id}:student`;
 const user = { id, email, full_name: 'Aarav', identity: 'student', onboarding_complete: true, age_band: 'adult', roles: ['student'] };
 const person = { id, email, name: 'Aarav', ageBand: 'adult', roles: ['student'], learningContext: { classLevel: 'Class 10', stage: 'school', board: 'CBSE', subjects: ['Mathematics'] } };
 const data = { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', bilingual: false, lowBandwidth: false, notifications: 'weekly', memory: true, voice: false }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: '2026-09-28' }, legacyImported: false };
 localStorage.setItem('visionary_users', JSON.stringify([user]));
 localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'representation-session', userId: id, email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
 localStorage.setItem('visionary_session_token', 'representation-session');
 localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: [person], workspaces: [{ id: workspaceId, personId: id, role: 'student', name: 'Learner', lastPath: '/dashboard/learn' }], active: { [id]: workspaceId }, relationships: [], data: { [workspaceId]: data } }));
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
try {
 await page.goto(`${base}/dashboard/learn`, { waitUntil: 'networkidle' });
 await page.getByRole('button', { name: 'Try authored learning sample' }).click();
 await page.getByRole('heading', { name: 'Mathematics' }).waitFor();
 await page.getByRole('region', { name: 'Subject chapters' }).getByRole('button').nth(1).click();
 await page.locator('section[aria-label$="learning path"]').getByRole('button', { name: /^Start / }).click();
 const representation = page.getByRole('region', { name: 'Concept representation' });
 await representation.getByRole('button', { name: 'Interactive 3D' }).waitFor();
 await representation.getByRole('slider', { name: /Side length/ }).fill('5');
 await representation.getByText('5 × 5 × 5 = 125 cubic units').waitFor();
 await page.reload({ waitUntil: 'networkidle' });
 await representation.getByRole('slider', { name: /Side length/ }).waitFor();
 if (await representation.getByRole('slider', { name: /Side length/ }).inputValue() !== '5') throw Error('Saved side length did not resume');
 await representation.getByRole('button', { name: 'Read description' }).click();
 await representation.getByText(/A cube has equal length/).waitFor();
 await representation.getByRole('button', { name: 'Interactive 3D' }).click();
 await page.getByRole('button', { name: 'Start this learning unit' }).click();
 await page.getByRole('button', { name: 'Check my understanding' }).click();
 await page.getByRole('radio', { name: '9 cubic units' }).check();
 await page.getByRole('button', { name: 'Check answer' }).click();
 await page.getByText(/Not yet. Review the idea/).waitFor();
 await page.getByRole('button', { name: 'Review explanation and model' }).click();
 await representation.getByText('5 × 5 × 5 = 125 cubic units').waitFor();
 for (const width of [390, 1440]) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (overflow > 1) throw Error(`Lesson overflow at ${width}px: ${overflow}`);
  await page.screenshot({ path: `docs/visionary/baseline/design-2026-09-27/student-cube-unit-${width}.png`, fullPage: width === 390 });
 }
 const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('visionary_learning_pipeline_v1')));
 const unit = saved.spaces['representation-student:student'].units[0];
 if (unit.stage !== 'explain' || unit.answer?.correct !== false || unit.representation.size !== 5) throw Error('Review lost answer or representation');
 await page.getByText('Review 1 saved attempt').click();
 await page.getByText('Your answer: 9 cubic units').waitFor();
 await page.getByRole('button', { name: 'Check my understanding' }).click();
 await page.getByRole('radio', { name: '27 cubic units' }).check();
 await page.getByRole('button', { name: 'Check answer' }).click();
 await page.getByText('Review 2 saved attempts').waitFor();
 await page.getByRole('button', { name: 'Continue practice' }).click();
 const question = await page.locator('fieldset legend').innerText();
 await page.goto(`${base}/dashboard/practice`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Ready to revisit' }).waitFor();
 await page.getByText(/Next review/).waitFor();
 await page.setViewportSize({ width: 390, height: 844 });
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/student-practice-queue-390.png' });
 await page.getByRole('button', { name: 'Resume practice' }).click();
 if (await page.locator('fieldset legend').innerText() !== question) throw Error('Practice did not resume the pending question');
 const connectedUnit = new URL(page.url()).searchParams.get('unit');
 await page.goto(`${base}/dashboard/explore`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Explore cube volume in your lesson' }).waitFor();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/student-cube-entry-390.png' });
 await page.getByRole('button', { name: 'Continue saved activity' }).click();
 if (new URL(page.url()).searchParams.get('unit') !== connectedUnit) throw Error('Explore created a second cube unit');
 await page.goto(`${base}/dashboard/practice?subject=Geometry&topic=Understanding%20cube%20volume`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Practice cube volume in your lesson' }).waitFor();
 await page.getByRole('button', { name: 'Continue saved activity' }).click();
 if (new URL(page.url()).searchParams.get('unit') !== connectedUnit) throw Error('Previous cube topic created a second practice unit');
 await page.goto(`${base}/dashboard/practice?subject=History&topic=Local%20history`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Reviewed questions are not available here yet' }).waitFor();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/student-unsupported-practice-390.png' });
 if (await page.getByText('Think in three dimensions').count()) throw Error('Unrelated previous topic showed cube questions');
 await page.goto(`${base}/dashboard/explore?legacy=1`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Small change. Another dimension.' }).waitFor();
 if (errors.length) throw Error(`Page errors: ${errors.join('; ')}`);
 console.log('student cube: saved model, retry/history, due queue, Explore/Practice bridge, honest unknown-topic fallback and previous lab; 0 page errors');
} finally {
 await context.close(); await browser.close();
}
