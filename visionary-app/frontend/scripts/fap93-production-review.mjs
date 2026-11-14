import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

// Run against a production build served by vite preview. All auth responses
// are fictional and no external service is contacted.
const origin = process.env.VISIONARY_REVIEW_ORIGIN || 'http://localhost:5173';
const browser = await puppeteer.launch({ headless: true });
try {
  const context = await browser.createBrowserContext();
  let profile = { id: 'fap93-review', full_name: 'Review Account', identity: 'student', onboarding_complete: true };
  async function open(path, device = context) {
    const page = await device.newPage();
    await page.setViewport({ width: 390, height: 844 });
    const errors = []; page.setDefaultTimeout(8000);
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      for (const method of ['setItem', 'getItem', 'removeItem']) {
        Storage.prototype[method] = () => { throw Error('Browser storage accessed'); };
      }
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.origin !== origin) return request.abort();
      if (url.pathname === '/api/auth/me') return request.respond({
        status: profile ? 200 : 401, contentType: 'application/json',
        body: JSON.stringify(profile || { message: 'Sign in to continue.' }),
      });
      if (url.pathname === '/api/auth/csrf') return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'fixture' }) });
      if (url.pathname === '/api/auth/profile') {
        const input = JSON.parse(request.postData());
        assert.equal(request.headers()['x-visionary-account'], profile.id);
        if (input.expectedProfileName !== profile.full_name) return request.respond({ status: 409, contentType: 'application/json', body: '{}' });
        profile = { ...profile, full_name: input.full_name };
        return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) });
      }
      if (url.pathname === '/api/account/learning/sessions') {
        assert.equal(request.headers()['x-visionary-account'], profile.id);
        return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({
          version: 1, uid: profile.id, nextCursor: null,
          items: [{ uid: profile.id, sessionId: '30ec069b-f5c7-41c1-820d-d487a666d838', concept: { conceptId: 'Measurement uncertainty' }, status: 'active', phase: 'check_passed', updatedAt: '2026-11-14T12:00:00Z' }],
        }) });
      }
      if (url.pathname === '/api/auth/logout') {
        profile = null;
        return request.respond({ status: 200, contentType: 'application/json', body: '{}' });
      }
      if (url.pathname.startsWith('/api/')) return request.abort();
      return request.continue();
    });
    await page.goto(origin + path);
    return { page, errors };
  }
  for (const [identity, path, capability] of [
    ['student', 'practice', 'Practice, projects'],
    ['teacher', 'classes', 'Classrooms, assignments'],
    ['parent', 'child', 'Guardian connections'],
    ['professional', 'career', 'Career goals'],
    ['organization', 'cohorts', 'Cohorts, curriculum'],
  ]) {
    profile = { ...profile, identity };
    const role = await open('/dashboard/' + path);
    await role.page.waitForFunction(text => document.body.innerText.includes(text), {}, capability);
    assert.equal(new URL(role.page.url()).pathname, '/dashboard/' + path);
    assert.deepEqual(await role.page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
    assert.deepEqual(role.errors, []);
    await role.page.close();
  }
  profile = { ...profile, identity: 'student' };
  const home = await open('/dashboard/home');
  await home.page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Your Visionary account');
  await home.page.reload();
  await home.page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Your Visionary account');
  const workspace = await open('/dashboard/classes');
  await workspace.page.waitForFunction(() => document.querySelector('h1')?.textContent === 'This workspace page is unavailable');
  const learning = await open('/dashboard/learn');
  await learning.page.waitForFunction(() => document.body.innerText.includes('Measurement uncertainty'));
  const edit = await open('/dashboard/profile');
  const secondContext = await browser.createBrowserContext();
  const second = await open('/dashboard/profile', secondContext);
  await second.page.waitForSelector('#connected-display-name');
  await edit.page.bringToFront();
  await edit.page.locator('#connected-display-name').fill('Updated account');
  await edit.page.click('form button');
  await edit.page.waitForFunction(() => document.body.innerText.includes('Display name saved to your account.'));
  await second.page.bringToFront();
  await second.page.locator('::-p-aria(Refresh profile)').click();
  await second.page.waitForFunction(() => document.querySelector('#connected-display-name')?.value === 'Updated account');
  await second.page.reload();
  await second.page.waitForFunction(() => document.querySelector('#connected-display-name')?.value === 'Updated account');
  const cookies = await open('/cookies');
  await cookies.page.waitForFunction(() => [...document.querySelectorAll('[role="switch"]')].length === 3);
  assert.equal(await cookies.page.$$eval('[role="switch"]:not(:disabled)', switches => switches.length), 0);
  for (const { page } of [home, workspace, cookies, edit, learning, second]) {
    assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
  }
  await home.page.bringToFront(); await home.page.click('header button');
  await workspace.page.bringToFront(); await workspace.page.waitForFunction(() => location.pathname === '/login', { polling: 100 }).catch(async error => { throw new Error('Cross-tab logout: ' + workspace.page.url() + ' / ' + await home.page.evaluate(() => document.body.innerText), { cause: error }); });
  await home.page.waitForFunction(() => location.pathname === '/login', { polling: 100 });
  for (const { errors } of [home, workspace, cookies, edit, learning, second]) assert.deepEqual(errors, []);
  profile = { id: 'new-fap93-review', full_name: 'New Account', onboarding_complete: false };
  const setup = await open('/onboarding');
  await setup.page.waitForFunction(() => document.body.innerText.includes('I am a Learner'));
  assert.deepEqual(await setup.page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
  assert.deepEqual(setup.errors, []);
  console.log('Production browser: profile sync and reload, saved learning, five role boundaries, cookies, cross-tab logout and first-run setup passed.');
} finally {
  await browser.close();
}
