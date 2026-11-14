import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

// Run against a production build served by vite preview. All auth responses
// are fictional and no external service is contacted.
const origin = process.env.VISIONARY_REVIEW_ORIGIN || 'http://localhost:5173';
const browser = await puppeteer.launch({ headless: true });
try {
  const context = await browser.createBrowserContext();
  let profile = { id: 'fap93-review', full_name: 'Review Account', identity: 'student', onboarding_complete: true };
  async function open(path) {
    const page = await context.newPage();
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
  const home = await open('/dashboard/home');
  await home.page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Your Visionary account');
  await home.page.reload();
  await home.page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Your Visionary account');
  const workspace = await open('/dashboard/classes');
  await workspace.page.waitForFunction(() => document.querySelector('h1')?.textContent === 'This workspace page is unavailable');
  const cookies = await open('/cookies');
  await cookies.page.waitForFunction(() => [...document.querySelectorAll('[role="switch"]')].length === 3);
  assert.equal(await cookies.page.$$eval('[role="switch"]:not(:disabled)', switches => switches.length), 0);
  for (const { page } of [home, workspace, cookies]) {
    assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
  }
  await home.page.bringToFront(); await home.page.click('header button');
  await workspace.page.bringToFront(); await workspace.page.waitForFunction(() => location.pathname === '/login', { polling: 100 }).catch(async error => { throw new Error('Cross-tab logout: ' + workspace.page.url() + ' / ' + await home.page.evaluate(() => document.body.innerText), { cause: error }); });
  await home.page.waitForFunction(() => location.pathname === '/login', { polling: 100 });
  for (const { errors } of [home, workspace, cookies]) assert.deepEqual(errors, []);
  profile = { id: 'new-fap93-review', full_name: 'New Account', onboarding_complete: false };
  const setup = await open('/onboarding');
  await setup.page.waitForFunction(() => document.body.innerText.includes('I am a Learner'));
  assert.deepEqual(await setup.page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
  assert.deepEqual(setup.errors, []);
  console.log('Production browser: account reload, workspace denial, cookies, cross-tab logout and first-run setup passed.');
} finally {
  await browser.close();
}
