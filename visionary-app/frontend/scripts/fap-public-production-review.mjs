import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const origin = process.env.VISIONARY_REVIEW_ORIGIN || 'http://localhost:5173';
const publicRoutes = ['/', '/student', '/teacher', '/parent', '/professional', '/organization',
  '/help', '/how-it-works', '/download', '/about', '/pricing', '/careers', '/research',
  '/community', '/contact', '/partners', '/updates', '/referral', '/safety', '/privacy',
  '/terms', '/security', '/accessibility', '/cookies'];
const browser = await puppeteer.launch({headless:true});
try {
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({width, height:900});
    const errors = [];
    let failAboutChunk = false;
    let failedChunks = 0;
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.origin !== origin) return request.abort();
      if (failAboutChunk && /\/assets\/AboutUsPage-.*\.js$/.test(url.pathname)) {
        failAboutChunk = false;
        failedChunks += 1;
        return request.respond({ status: 404 });
      }
      if (url.pathname === '/api/auth/me') return request.respond({status:401,contentType:'application/json',body:'{}'});
      if (url.pathname === '/api/auth/methods') return request.respond({status:200,contentType:'application/json',body:'{}'});
      return request.continue();
    });
    failAboutChunk = true;
    await page.goto(origin + '/about?from=review');
    await page.waitForSelector('h1', { visible: true, timeout: 8000 });
    await page.waitForFunction(() => history.state?.visionaryAssetRetry === location.href && document.querySelector('h1')?.textContent !== 'Something went wrong');
    assert.equal(failedChunks, 1);
    assert.equal(new URL(page.url()).search, '?from=review');
    for (const route of publicRoutes) {
      await page.goto(origin + route);
      await page.waitForSelector('h1', {visible:true,timeout:8000});
      assert.equal(new URL(page.url()).pathname, route);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route + ' overflows at ' + width);
    }
    await page.goto(origin + '/dashboard/classes');
    await page.waitForFunction(() => location.pathname === '/login');
    assert.equal(new URL(page.url()).searchParams.get('returnTo'), '/dashboard/classes');
    assert.deepEqual(errors, []);
    await context.close();
    console.log(width + 'px: ' + publicRoutes.length + ' public routes and protected class deep link passed.');
  }
} finally { await browser.close(); }
