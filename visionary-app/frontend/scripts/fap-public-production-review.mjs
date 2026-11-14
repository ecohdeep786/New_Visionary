import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const origin = process.env.VISIONARY_REVIEW_ORIGIN || 'http://localhost:5173';
const browser = await puppeteer.launch({headless:true});
try {
  for (const width of [390, 1440]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({width, height:900});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.origin !== origin) return request.abort();
      if (url.pathname === '/api/auth/me') return request.respond({status:401,contentType:'application/json',body:'{}'});
      if (url.pathname === '/api/auth/methods') return request.respond({status:200,contentType:'application/json',body:'{}'});
      return request.continue();
    });
    for (const route of ['/', '/student', '/teacher', '/parent', '/professional', '/organization', '/how-it-works', '/about', '/careers', '/privacy', '/accessibility']) {
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
    console.log(width + 'px: 11 public routes and protected class deep link passed.');
  }
} finally { await browser.close(); }
