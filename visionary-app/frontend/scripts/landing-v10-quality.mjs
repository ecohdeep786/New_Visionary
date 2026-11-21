import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.LANDING_REVIEW_URL || 'http://127.0.0.1:4310';
const output = fileURLToPath(new URL(process.env.LANDING_EVIDENCE_DIR || '../../../shots/fhe-01-landing-v10/current/', import.meta.url));
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const receipt = { base, viewports: [], interactions: [], errors: [], failedRequests: [] };

async function settle(page) {
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(350);
}

try {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 1000 },
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => receipt.errors.push(`${viewport.width}: ${error}`));
    page.on('requestfailed', request => receipt.failedRequests.push(`${viewport.width}: ${request.url()} — ${request.failure()?.errorText}`));
    await page.goto(base, { waitUntil: 'load' });
    await settle(page);

    const geometry = await page.evaluate(() => {
      const hero = document.querySelector('[data-section="01-hero"]');
      const audience = hero?.querySelector('.audience-rail')?.getBoundingClientRect();
      const family = hero?.querySelector('.cast-slot-2')?.getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        heroHeight: hero?.getBoundingClientRect().height,
        audienceBottom: audience?.bottom,
        familyTop: family?.top,
        heroPadding: hero ? getComputedStyle(hero).padding : null,
      };
    });
    assert.equal(geometry.horizontalOverflow, false, `${viewport.width}: horizontal overflow`);
    assert.ok(geometry.audienceBottom <= geometry.familyTop, `${viewport.width}: audience links overlap the family`);

    await page.screenshot({ path: path.join(output, `hero-${viewport.width}.png`), animations: 'disabled' });

    /* A full-page capture does not itself scroll the document. Walk the real
       reader journey first so IntersectionObserver media mounts and every
       current image finishes decoding before visual evidence is captured. */
    const sections = await page.locator('main section[data-section]').evaluateAll(nodes => nodes.map(node => node.dataset.section));
    for (const section of sections) {
      const locator = page.locator(`main section[data-section="${section}"]`);
      await locator.scrollIntoViewIfNeeded();
      await settle(page);
      await page.waitForFunction(id => {
        const root = document.querySelector(`main section[data-section="${id}"]`);
        return root && [...root.querySelectorAll('img')].every(image => image.complete && image.naturalWidth > 0);
      }, section, { timeout: 5000 });
      if (viewport.width === 390 || viewport.width === 1440) {
        await locator.screenshot({ path: path.join(output, `${section}-${viewport.width}.png`), animations: 'disabled' });
      }
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await settle(page);
    await page.screenshot({ path: path.join(output, `landing-${viewport.width}.png`), fullPage: true, animations: 'disabled' });

    if (viewport.width === 390 || viewport.width === 1440) {
      receipt.viewports.push({ ...viewport, ...geometry, sections });
    } else {
      receipt.viewports.push({ ...viewport, ...geometry });
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => receipt.errors.push(`interaction: ${error}`));
  page.on('requestfailed', request => receipt.failedRequests.push(`interaction: ${request.url()} — ${request.failure()?.errorText}`));
  await page.goto(base, { waitUntil: 'load' });
  await settle(page);

  const trigger = page.getByRole('button', { name: 'Open menu' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Site menu' });
  await dialog.waitFor({ state: 'visible' });
  assert.equal(await dialog.getAttribute('id'), 'public-mobile-navigation');
  assert.equal(await page.locator('[data-public-nav-bar] button[aria-controls]').getAttribute('aria-controls'), 'public-mobile-navigation');
  assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
  assert.equal(await page.locator('main').evaluate(node => node.inert), true);
  await page.screenshot({ path: path.join(output, 'mobile-menu-390.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  assert.equal(await trigger.evaluate(node => node === document.activeElement), true);
  receipt.interactions.push('Mobile menu opens with a labelled modal, locks background, and Escape restores focus and scroll');

  await trigger.click();
  await dialog.waitFor({ state: 'visible' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await dialog.waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  assert.equal(await page.locator('main').evaluate(node => node.inert), false);
  receipt.interactions.push('Mobile-to-desktop resize closes the dialog and restores the page');

  const audienceTrigger = page.getByRole('link', { name: 'For you', exact: true });
  await audienceTrigger.focus();
  const audiencePanel = page.getByText('One connected journey. Five ways to begin.', { exact: true });
  await audiencePanel.waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await audiencePanel.waitFor({ state: 'detached' });
  assert.equal(await audienceTrigger.evaluate(node => node === document.activeElement), true);
  receipt.interactions.push('Desktop audience navigation opens from keyboard focus and Escape restores its trigger');

  const problem = page.locator('main section[data-section="02-problem"]');
  await problem.scrollIntoViewIfNeeded();
  await problem.getByRole('button', { name: 'Previous story' }).waitFor({ state: 'visible' });
  assert.equal(await problem.getByRole('button', { name: 'Previous story' }).isEnabled(), false);
  await problem.getByRole('button', { name: 'Next story' }).click();
  await page.getByRole('heading', { name: 'Knowledge is everywhere. Turning it into capability isn’t.' }).waitFor({ state: 'visible' });
  assert.equal(await problem.getByRole('button', { name: 'Next story' }).isEnabled(), false);
  await problem.getByRole('button', { name: 'Previous story' }).click();
  receipt.interactions.push('Problem story switches only through the manual prev/next controls (bounds disable)');

  const gallery = page.locator('main section[data-section="13-explore"]');
  await gallery.scrollIntoViewIfNeeded();
  const firstCard = gallery.locator('[data-card]').first();
  const initialScroll = await firstCard.evaluate(node => node.parentElement.scrollLeft);
  await gallery.getByRole('button', { name: 'Next destinations' }).click();
  await page.waitForFunction(before => document.querySelector('main section[data-section="13-explore"] [data-card]')?.parentElement.scrollLeft > before, initialScroll);
  const previous = gallery.getByRole('button', { name: 'Previous destinations' });
  await page.waitForFunction(() => !document.querySelector('main section[data-section="13-explore"] button[aria-label="Previous destinations"]')?.disabled);
  assert.equal(await previous.isEnabled(), true);
  await previous.click();
  await page.waitForFunction(before => document.querySelector('main section[data-section="13-explore"] [data-card]')?.parentElement.scrollLeft <= before + 1, initialScroll);
  receipt.interactions.push('Audience gallery next/previous controls move and restore the card track');

  await context.close();

  assert.deepEqual(receipt.errors, [], 'No browser page errors');
  await writeFile(path.join(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(`PASS landing visual/smoke review: ${receipt.viewports.length} viewports, ${receipt.interactions.length} interaction groups. Evidence: ${output}`);
} finally {
  await browser.close();
}
