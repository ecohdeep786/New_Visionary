import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright-core';

const base = process.env.LANDING_REVIEW_URL || 'http://127.0.0.1:4310';
const output = process.env.LANDING_EVIDENCE_DIR
  ? path.resolve(process.env.LANDING_EVIDENCE_DIR)
  : fileURLToPath(new URL('../../../shots/fhe-01-landing-v10/current/', import.meta.url));
const engine = process.env.LANDING_REVIEW_BROWSER || 'chromium';
const browsers = { chromium, firefox, webkit };
assert.ok(Object.hasOwn(browsers, engine), 'Choose chromium, firefox or webkit');
const browser = await browsers[engine].launch(engine === 'chromium' ? { channel: 'msedge' } : {});
const roles = ['student', 'teacher', 'parent', 'professional', 'organization'];
const sections = ['01-hero', '05-intelligence', '13-explore', '11-trust', '12-cta'];
const receipt = { base, engine, viewports: [], interactions: [], errors: [], failedRequests: [] };
await mkdir(output, { recursive: true });

async function openPage(width, height, reducedMotion = 'reduce') {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
  page.setDefaultTimeout(9000);
  page.on('pageerror', error => receipt.errors.push(String(error)));
  page.on('requestfailed', request => {
    const reason = request.failure()?.errorText || '';
    if (!/abort|cancel|NS_BINDING_ABORTED|Frame load interrupted/i.test(reason)) {
      receipt.failedRequests.push({ path: new URL(request.url()).pathname, reason });
    }
  });
  await page.goto(base);
  await page.locator('.home-hero h1').waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function checkHeader(page) {
  const geometry = await page.locator('[data-public-nav-bar]').evaluate(bar => {
    const visible = Array.from(bar.querySelectorAll('a,button')).filter(el =>
      !el.closest('[id^="mega-"]') && el.getBoundingClientRect().width && getComputedStyle(el).visibility !== 'hidden'
    ).map(el => {
      const { left, right, top, bottom } = el.getBoundingClientRect();
      return { label: el.innerText || el.getAttribute('aria-label'), left, right, top, bottom };
    }).sort((a, b) => a.left - b.left);
    return { width: innerWidth, visible };
  });
  for (const [i, current] of geometry.visible.entries()) {
    assert.ok(current.left >= -1 && current.right <= geometry.width + 1, 'Header item outside the viewport: ' + current.label);
    if (i) assert.ok(geometry.visible[i - 1].right <= current.left + 1, 'Header collision: ' + JSON.stringify(geometry.visible));
  }
}

async function inspectViewport(width, height) {
  const page = await openPage(width, height);
  const hero = page.locator('.home-hero');
  assert.deepEqual(await page.locator('main > section').evaluateAll(nodes => nodes.map(n => n.dataset.section)), sections);
  assert.equal(await hero.getByRole('link').count(), 1);
  assert.equal(await page.locator('main select, main [role="combobox"], main details').count(), 0);
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await checkHeader(page);
  const geometry = await hero.evaluate(el => {
    const family = el.querySelector('.family-stage').getBoundingClientRect();
    const copy = el.querySelector('.home-hero-copy').getBoundingClientRect();
    return {
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      clearance: family.top - copy.bottom,
      portraits: [...el.querySelectorAll('.cast-person')].map(person => {
        const rect = person.getBoundingClientRect();
        return { center: (rect.left + rect.right) / 2, height: rect.height };
      }),
    };
  });
  assert.ok(geometry.scrollWidth <= width && geometry.clearance >= 0, 'Hero reflow at ' + width);
  assert.equal(geometry.portraits.length, 5);
  assert.ok(geometry.portraits.every(p => p.height > 0 && p.center > 0 && p.center < width), 'Cast framing at ' + width);
  const capture = width === 390 || width === 1440;
  if (capture) await page.screenshot({ path: path.join(output, 'hero-' + width + '.png') });
  for (const section of sections) {
    const target = page.locator('[data-section="' + section + '"]');
    await target.scrollIntoViewIfNeeded();
    for (const img of await target.locator('img').all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(image => image.decode());
    }
    if (capture) await target.screenshot({ path: path.join(output, section + '-' + width + '.png') });
  }
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.locator('[data-scroll-action]:not([aria-hidden])').waitFor();
  await checkHeader(page);
  if (capture) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: path.join(output, 'landing-' + width + '.png'), fullPage: true });
  }
  receipt.viewports.push({ width, height, ...geometry });
  await page.close();
}

async function follow(page, link, suffix) {
  await link.click();
  await page.waitForURL(url => url.pathname + url.hash === suffix);
  await page.locator('main h1, [role="main"] h1, h1').first().waitFor();
  await page.goBack();
  await page.locator('.home-hero h1').waitFor();
}

async function journeys(width, height) {
  const page = await openPage(width, height);
  await page.locator('.home-hero').getByRole('link', { name: 'Find your path' }).click();
  await page.waitForFunction(() => document.activeElement?.id === 'audiences');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('href')), '/student');
  const directory = page.getByRole('navigation', { name: 'Audience pages' });
  assert.deepEqual(await directory.locator('a').evaluateAll(links => links.map(link => link.pathname)), roles.map(r => '/' + r));
  for (const role of roles) await follow(page, directory.locator('[href="/' + role + '"]'), '/' + role);
  await follow(page, page.locator('#intelligence').getByRole('link'), '/how-it-works');
  await follow(page, page.locator('.home-privacy').getByRole('link'), '/privacy#sharing');
  await follow(page, page.getByRole('link', { name: 'Create an account', exact: true }), '/register');
  await page.goto(new URL('/#lesson-example', base).href);
  await page.waitForFunction(() => document.activeElement?.id === 'intelligence');
  receipt.interactions.push(width + 'px: five role journeys, product, privacy, registration, keyboard anchor and legacy deep link');
  if (width < 640) {
    const groups = page.locator('footer button[aria-controls]');
    assert.equal(await groups.count(), 5);
    for (const group of await groups.all()) {
      await group.click();
      const panel = page.locator('#' + await group.getAttribute('aria-controls'));
      assert.ok(await panel.getByRole('link').first().isVisible());
      await group.press('Enter');
      assert.equal(await panel.isVisible(), false);
    }
    const menu = page.getByRole('button', { name: 'Open menu' });
    await menu.click();
    const dialog = page.getByRole('dialog', { name: 'Site menu' });
    await dialog.waitFor();
    assert.equal(await page.locator('[data-public-nav-bar] button[aria-controls]').getAttribute('aria-controls'), await dialog.getAttribute('id'));
    assert.ok(await page.locator('main').evaluate(el => el.inert));
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    assert.ok(await menu.evaluate(el => el === document.activeElement));
    await menu.click();
    await dialog.waitFor();
    await page.setViewportSize({ width: 1280, height: 800 });
    await dialog.waitFor({ state: 'detached' });
    assert.equal(await page.locator('main').evaluate(el => el.inert), false);
    receipt.interactions.push('Mobile menu, resize, focus restoration and five footer disclosures');
  }
  const who = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'For you', exact: true });
  await who.focus();
  await page.locator('#mega-who').waitFor();
  await page.keyboard.press('Escape');
  await page.locator('#mega-who').waitFor({ state: 'detached' });
  assert.ok(await who.evaluate(el => el === document.activeElement));
  await page.close();
}

async function checkRotation() {
  const page = await openPage(390, 844);
  const next = page.getByRole('button', { name: 'Next audience', exact: true });
  const caption = page.locator('.cast-active');
  await page.getByRole('button', { name: 'Play audience rotation' }).waitFor();
  for (const role of roles) {
    assert.equal(await caption.innerText(), 'For ' + role + 's');
    assert.equal(await page.locator('.cast-person[data-current="true"]').count(), 1);
    await next.press('Enter');
  }
  assert.equal(await caption.innerText(), 'For students');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Pause audience rotation' }).waitFor();
  await page.waitForFunction(() => document.querySelector('.cast-active').textContent === 'For teachers', null, { timeout: 8500 });
  await page.getByRole('button', { name: 'Pause audience rotation' }).press('Enter');
  await page.getByRole('button', { name: 'Play audience rotation' }).waitFor();
  receipt.interactions.push('Five manual hero stories, reduced motion, automatic advance and explicit pause');
  await page.close();
}

try {
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [844, 390], [900, 750], [1024, 768], [1280, 800], [1440, 900], [1920, 1080]]) {
    await inspectViewport(width, height);
  }
  await journeys(390, 844);
  await journeys(1440, 900);
  await checkRotation();
  assert.deepEqual(receipt.errors, [], 'No browser errors');
  assert.deepEqual(receipt.failedRequests, [], 'No failed resources');
  console.log('PASS ' + engine + ': ' + receipt.viewports.length + ' viewports, ' + receipt.interactions.length + ' interaction groups');
} finally {
  await writeFile(path.join(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  await browser.close();
}
