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
const sections = ['01-hero', '05-intelligence', '06-journey', '07-loop', '13-explore', '11-trust', '12-cta'];
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
      const target = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
      return { hit: el.contains(target), label: el.innerText || el.getAttribute('aria-label'), left, right, top, bottom };
    }).sort((a, b) => a.left - b.left);
    return { width: innerWidth, visible };
  });
  for (const [i, current] of geometry.visible.entries()) {
    assert.ok(current.hit, "Header center is obstructed: " + current.label);
    assert.ok(current.left >= -1 && current.right <= geometry.width + 1, 'Header item outside the viewport: ' + current.label);
    if (i) assert.ok(geometry.visible[i - 1].right <= current.left + 1, 'Header collision: ' + JSON.stringify(geometry.visible));
  }
}

async function checkScrolledHeader(page) {
  await page.locator('footer').scrollIntoViewIfNeeded();
  // WebKit can reserve a scrollbar at this CSS breakpoint.
  const compact = await page.evaluate(() => matchMedia('(max-width: 639px)').matches);
  const action = page.locator('[data-scroll-action]');
  if (compact) await action.waitFor({ state: 'hidden' });
  else await page.locator('[data-scroll-action]:not([aria-hidden])').waitFor();
  await checkHeader(page);
}

async function inspectViewport(width, height) {
  const page = await openPage(width, height);
  const hero = page.locator('.home-hero');
  assert.deepEqual(await page.locator('main > section').evaluateAll(nodes => nodes.map(n => n.dataset.section)), sections);
  assert.equal(await hero.getByRole('link').count(), 6, 'Hero carries the path CTA and five audience doors');
  assert.deepEqual(
    await hero.locator('.hero-path').evaluateAll(links => links.map(link => link.pathname)),
    roles.map(role => '/' + role),
  );
  assert.equal(await page.locator('main select, main [role="combobox"], main details').count(), 0);
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await checkHeader(page);
  const introduction = await hero.locator(".home-hero-copy p").innerText();
  for (const role of roles) assert.ok(introduction.toLowerCase().includes(role + "s"), "Hero identifies " + role);
  const loopLead = await page.locator(".home-loop .loop-lead").innerText();
  for (const role of roles) assert.ok(loopLead.toLowerCase().includes(role), "The shared loop names " + role);
  const steps = page.getByRole('list', { name: 'Learning loop steps' });
  assert.deepEqual(await steps.getByRole('heading').allTextContents(), ['Ask', 'Understand', 'Practise', 'Build']);
  const geometry = await hero.evaluate(el => {
    const familyEl = el.querySelector('.family-stage');
    const family = familyEl.getBoundingClientRect();
    const familyVisible = familyEl.getClientRects().length > 0;
    const copy = el.querySelector('.home-hero-copy').getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const next = el.nextElementSibling.getBoundingClientRect();
    return {
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      castVisible: familyVisible,
      clearance: familyVisible ? family.top - copy.bottom : null,
      heroBottom: rect.bottom,
      pathsBottom: el.querySelector('.hero-paths').getBoundingClientRect().bottom,
      playbackVisible: !!el.querySelector('.hero-playback')?.getClientRects().length,
      playbackTop: el.querySelector('.hero-playback').getBoundingClientRect().top,
      playbackBottom: el.querySelector('.hero-playback').getBoundingClientRect().bottom,
      actionHeight: el.querySelector('.home-action').getBoundingClientRect().height,
      pathHeights: [...el.querySelectorAll('.hero-path')].map(link => link.getBoundingClientRect().height),
      pathGaps: (() => {
        const cards = [...el.querySelectorAll('.path-card')];
        return cards.slice(1).map((card, index) => Math.round(card.getBoundingClientRect().left - cards[index].getBoundingClientRect().right));
      })(),
      nextTop: next.top,
      viewport: innerHeight,
      portraits: [...el.querySelectorAll('.cast-person')].map(person => {
        const rect = person.getBoundingClientRect();
        return { center: (rect.left + rect.right) / 2, height: rect.height };
      }),
    };
  });
  assert.ok(geometry.scrollWidth <= width && (!geometry.castVisible || geometry.clearance >= 0), 'Hero reflow at ' + width);
  assert.ok(geometry.heroBottom >= geometry.viewport - 1, 'Hero fills the first screen at ' + width + 'x' + height);
  assert.ok(geometry.pathsBottom <= geometry.viewport + 1, 'Five audience doors inside the first screen at ' + width + 'x' + height);
  assert.ok(geometry.playbackVisible && geometry.playbackTop >= 0 && geometry.playbackBottom <= geometry.viewport, 'Pause/play control stays fully visible at ' + width + 'x' + height);
  assert.ok(geometry.actionHeight >= 43.5, 'Primary action keeps a 44px target at ' + width + 'x' + height);
  assert.ok(geometry.pathHeights.every(value => value >= 43.5), 'Audience doors keep a 44px target at ' + width + 'x' + height);
  if (width >= 1280) assert.ok(geometry.pathGaps.every(gap => gap >= 28), 'Path cards keep at least 28px of breathing room at ' + width + ': ' + geometry.pathGaps.join(', '));
  assert.ok(geometry.nextTop >= geometry.viewport - 1, 'The next chapter intrudes into the first screen at ' + width + 'x' + height);
  if (geometry.castVisible) {
    assert.equal(geometry.portraits.length, 5);
    assert.ok(geometry.portraits.every(p => p.height > 0 && p.center > 0 && p.center < width), 'Cast framing at ' + width);
  }
  const capture = [390, 768, 1280, 1440].includes(width);
  if (capture) await page.screenshot({ path: path.join(output, 'hero-' + width + '.png') });
  for (const section of sections) {
    const target = page.locator('[data-section="' + section + '"]');
    await target.scrollIntoViewIfNeeded();
    for (const img of await target.locator('img').all()) {
      if (!(await img.isVisible())) continue;
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(async image => {
        if (!image.complete) {
          await new Promise(resolve => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
          });
        }
        try { await image.decode(); }
        catch (error) {
          if (!image.naturalWidth) throw new Error('Image failed to decode: ' + image.currentSrc);
        }
      });
    }
    if (capture) await target.screenshot({ path: path.join(output, section + '-' + width + '.png') });
  }
  await checkScrolledHeader(page);
  if (capture) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: path.join(output, 'landing-' + width + '.png'), fullPage: true });
  }
  receipt.viewports.push({ width, height, ...geometry });
  await page.close();
}

async function follow(page, link, suffix, destination = page.locator('main h1, [role="main"] h1, h1').first()) {
  await link.click();
  await page.waitForURL(url => url.pathname + url.hash === suffix);
  await page.locator(".home-hero").waitFor({ state: "detached" });
  await destination.waitFor();
  await page.goBack();
  await page.locator('.home-hero h1').waitFor();
}

async function journeys(width, height) {
  const page = await openPage(width, height);
  await page.locator('.home-hero').getByRole('link', { name: 'Find your path' }).click();
  await page.waitForFunction(() => document.activeElement?.id === 'audiences');
  await page.keyboard.press('Tab');
  if (await page.evaluate(() => document.activeElement?.id === 'audience-paths')) {
    await page.keyboard.press('Tab');
  }
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('href')), '/student');
  const directory = page.getByRole('navigation', { name: 'Audience pages' });
  assert.deepEqual(await directory.locator('a').evaluateAll(links => links.map(link => link.pathname)), roles.map(r => '/' + r));
  for (const role of roles) await follow(page, directory.locator('[href="/' + role + '"]'), '/' + role);
  await follow(page, page.locator('#intelligence').getByRole('link'), '/how-it-works');
  await follow(page, page.locator('.home-loop').getByRole('link', { name: 'See the full learning loop', exact: true }), '/how-it-works');
  await follow(page, page.locator('.home-privacy').getByRole('link', { name: 'How sharing works', exact: true }), '/privacy#sharing');
  await follow(page, page.locator('.home-privacy').getByRole('link', { name: 'How safety works', exact: true }), '/safety');
  await follow(page, page.locator('.home-privacy').getByRole('link', { name: 'Accessibility', exact: true }), '/accessibility');
  await follow(page, page.getByRole('link', { name: 'Create an account', exact: true }), '/register', page.getByRole('button', { name: 'Continue with Email' }));
  await page.goto(new URL('/#lesson-example', base).href);
  await page.waitForFunction(() => document.activeElement?.id === 'intelligence');
  receipt.interactions.push(width + 'px: five role journeys, product, privacy, registration, keyboard anchor and legacy deep link');
  if (width < 640) {
    for (const [id, label] of [['audience-paths', 'audience'], ['trust-values', 'value']]) {
      const rail = page.locator('#' + id);
      const previous = page.getByRole('button', { name: 'Previous ' + label, exact: true });
      const next = page.getByRole('button', { name: 'Next ' + label, exact: true });
      await previous.waitFor();
      assert.equal(await previous.isEnabled(), false, 'Previous is disabled at the beginning of ' + id);
      await next.click();
      await page.waitForFunction(id => document.getElementById(id)?.scrollLeft > 1, id);
      await previous.click();
      await page.waitForFunction(id => document.getElementById(id)?.scrollLeft < 1, id);
      await rail.evaluate(row => { row.scrollLeft = row.scrollWidth; });
      await page.waitForFunction(id =>
        document.querySelector('button[aria-label^="Next"][aria-controls="' + id + '"]')?.getAttribute('aria-disabled') === 'true', id);
      assert.equal(await next.isEnabled(), false, 'Next is disabled at the end of ' + id);
    }
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
    /* A role locator stops matching as soon as the desktop breakpoint hides
       the drawer; the resize handler's inert/scroll-lock release lands in the
       following commit. Wait for the settled a11y state instead of racing
       that single frame. */
    await page.waitForFunction(() =>
      document.querySelector('main')?.inert === false && document.body.style.overflow === '',
      null,
      { timeout: 3000 },
    );
    assert.equal(await page.locator('main').evaluate(el => el.inert), false);
    receipt.interactions.push('Path and trust rail endpoints, mobile menu, resize, focus restoration and five footer disclosures');
  }
  const who = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'For you', exact: true });
  await who.focus();
  await page.locator('#mega-who').waitFor();
  await page.keyboard.press('Escape');
  await page.locator('#mega-who').waitFor({ state: 'detached' });
  assert.ok(await who.evaluate(el => el === document.activeElement));
  await page.close();
}

async function checkTextScaling() {
  for (const [width, height] of [[320, 568], [390, 844], [640, 900], [700, 900], [768, 1024], [1024, 768], [1280, 800]]) {
    const page = await openPage(width, height);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await page.waitForFunction(() => getComputedStyle(document.documentElement).fontSize === '32px');
    await checkHeader(page);
    const overflow = await page.evaluate(() => {
      const elements = document.querySelectorAll('main h1, main h2, main h3, main p, main a, main button, .hero-path');
      return [...elements].flatMap(element => {
        /* Off-screen rail cards are reachable by swipe or keys. Visible cards
           still have to contain their own text at 200%; a card that continues
           beyond the viewport is checked against its own box, not the viewport. */
        let bounds = { left: -1, right: innerWidth + 1 };
        const card = element.closest('.path-card, .trust-card');
        if (card) {
          const rect = card.getBoundingClientRect();
          if (rect.right < 0 || rect.left > innerWidth) return [];
          const rail = card.closest('.path-row, .trust-row');
          if (rail && rail.scrollWidth > rail.clientWidth + 1) bounds = { left: rect.left - 1, right: rect.right + 1 };
        }
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const clipped = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent.trim() || getComputedStyle(node.parentElement).visibility === 'hidden') continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          if ([...range.getClientRects()].some(rect => rect.left < bounds.left || rect.right > bounds.right)) {
            clipped.push(node.textContent.trim());
          }
        }
        return clipped;
      });
    });
    assert.deepEqual(overflow, [], 'Visible text fits at 200% on ' + width + 'px');
    const broken = await page.evaluate(() => {
      const broken = [];
      for (const element of document.querySelectorAll('.path-title strong, .loop-step h3')) {
        const card = element.closest('.path-card');
        if (card) {
          const rect = card.getBoundingClientRect();
          if (rect.right < 0 || rect.left > innerWidth) continue;
        }
        const node = element.firstChild;
        if (!node || node.nodeType !== Node.TEXT_NODE) continue;
        const text = node.textContent || '';
        let from = 0;
        for (const word of text.match(/\S+/g) || []) {
          const start = text.indexOf(word, from);
          from = start + word.length;
          const range = document.createRange();
          range.setStart(node, start);
          range.setEnd(node, start + word.length);
          if ([...range.getClientRects()].filter(rect => rect.width || rect.height).length > 1) broken.push(word);
        }
      }
      return broken;
    });
    assert.deepEqual(broken, [], 'Role and stage names stay whole at 200% on ' + width + 'px');
    const pathChrome = await page.evaluate(() => {
      const row = document.querySelector('#audience-paths');
      const controls = document.querySelector('.path-controls');
      const visibleCards = [...document.querySelectorAll('.path-card')].filter(card => {
        const rect = card.getBoundingClientRect();
        return rect.right > 0 && rect.left < innerWidth;
      });
      const titleOverflow = visibleCards.flatMap(card => {
        const rect = card.getBoundingClientRect();
        const strong = card.querySelector('.path-title strong');
        const arrow = card.querySelector('.path-arrow');
        const strongRect = strong?.getBoundingClientRect();
        const arrowRect = arrow && getComputedStyle(arrow).display !== 'none' ? arrow.getBoundingClientRect() : null;
        return (strongRect && strongRect.right > rect.right + 1) || (arrowRect && arrowRect.right > rect.right + 1) ? [strong?.textContent] : [];
      });
      return {
        scrollable: row.scrollWidth > row.clientWidth + 1,
        controlsVisible: !!controls && controls.getClientRects().length > 0 && getComputedStyle(controls).display !== 'none',
        titleOverflow,
      };
    });
    assert.ok(!pathChrome.controlsVisible || pathChrome.scrollable, 'Path controls only appear when the path row scrolls at 200% on ' + width + 'px');
    assert.deepEqual(pathChrome.titleOverflow, [], 'Path titles stay inside their cards at 200% on ' + width + 'px');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await checkScrolledHeader(page);
    await page.close();
  }
  receipt.interactions.push('200% text, header reflow and pointer targets across seven widths');
}

async function checkDirectoryEntry() {
  const page = await openPage(1280, 720);
  await page.locator('.home-hero').getByRole('link', { name: 'Find your path' }).click();
  await page.waitForFunction(() => document.activeElement?.id === 'audiences');
  const copy = page.locator('#audience-paths .path-outcome');
  assert.equal(await copy.count(), 5);
  assert.ok(await copy.evaluateAll(outcomes => outcomes.every(outcome => outcome.getBoundingClientRect().bottom <= innerHeight)),
    'A laptop visitor can read every role outcome directly after using Find your path');
  receipt.interactions.push('Direct audience entry shows five complete outcomes at 1280×720');
  await page.close();
}

async function checkPreloadLifecycle() {
  const page = await openPage(390, 844);
  const preload = page.locator('link[rel="preload"][data-page-lcp]');
  const studentSource = page.locator('.cast-slot-2 picture source');
  const assertHomePreload = async () => {
    assert.equal(await preload.count(), 1);
    assert.equal(await preload.getAttribute('imagesrcset'), await studentSource.getAttribute('srcset'));
    assert.equal(await preload.getAttribute('imagesizes'), await studentSource.getAttribute('sizes'));
  };
  await assertHomePreload();
  await follow(page, page.locator('#intelligence').getByRole('link'), '/how-it-works');
  await assertHomePreload();
  await page.locator('#intelligence').getByRole('link').click();
  await preload.waitFor({ state: 'detached' });
  receipt.interactions.push('The homepage preload matches its responsive picture, clears on exit and returns with browser Back');
  await page.close();
}

async function checkReturningVisitor() {
  const scenarios = [".home-hero", ".home-closing", null];
  for (const section of scenarios) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const profile = { id: 'homepage-qa', identity: 'student', onboarding_complete: section === null };
    await page.route('**/api/auth/me*', route => route.fulfill({ json: profile }));
    try {
      await page.goto(base);
      if (section) {
        await page.locator(section).getByRole('link', { name: 'Open Visionary', exact: true }).click();
      }
      await page.waitForURL(url => url.pathname === (section ? '/onboarding' : '/dashboard/home'));
      await page.locator('.home-hero').waitFor({ state: 'detached' });
    } finally {
      await page.close();
    }
  }
  receipt.interactions.push('Signed-in fixtures: both actions continue setup and completed profiles enter the workspace');
}


async function checkRotation() {
  const page = await openPage(390, 844);
  const active = page.locator('.hero-path[data-active="true"]');
  const heroHeading = page.locator('.home-hero h1');
  await page.getByRole('button', { name: 'Play audience rotation' }).waitFor();
  const story = { student: 'project', teacher: 'lesson', parent: 'conversation', professional: 'new skill', organization: 'team plan' };
  for (const [i, role] of roles.entries()) {
    await page.locator('.hero-path').nth(i).focus();
    await page.waitForFunction(label => document.querySelector('.hero-path[data-active="true"]')?.textContent.toLowerCase() === label, role + 's');
    assert.equal((await active.innerText()).toLowerCase(), role + 's');
    assert.equal(await page.locator('.cast-person[data-current="true"]').count(), 1);
    await page.waitForFunction(word => document.querySelector('.home-hero h1')?.innerText.toLowerCase().includes(word), story[role]);
    assert.ok((await heroHeading.innerText()).toLowerCase().includes(story[role]), 'The ' + role + ' story is visible');
  }
  await page.evaluate(() => document.activeElement?.blur());
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Pause audience rotation' }).waitFor();
  const before = (await active.innerText()).toLowerCase();
  await page.waitForFunction(previous => document.querySelector('.hero-path[data-active="true"]')?.textContent.toLowerCase() !== previous, before, { timeout: 8500 });
  await page.getByRole('button', { name: 'Pause audience rotation' }).press('Enter');
  await page.getByRole('button', { name: 'Play audience rotation' }).waitFor();
  receipt.interactions.push('Five audience paths preview their story, reduced motion holds the first, automatic advance and explicit pause');
  await page.close();
}

try {
  for (const [width, height] of [
    [320, 568], [360, 568], [375, 568], [390, 844], [768, 1024], [834, 1112],
    [844, 390], [900, 750], [1024, 768], [1280, 800], [1366, 768], [1440, 900], [1920, 1080],
  ]) {
    await inspectViewport(width, height);
  }
  await journeys(390, 844);
  await journeys(1440, 900);
  await checkDirectoryEntry();
  await checkRotation();
  await checkTextScaling();
  await checkPreloadLifecycle();
  await checkReturningVisitor();
  assert.deepEqual(receipt.errors, [], 'No browser errors');
  assert.deepEqual(receipt.failedRequests, [], 'No failed resources');
  console.log('PASS ' + engine + ': ' + receipt.viewports.length + ' viewports, ' + receipt.interactions.length + ' interaction groups');
} finally {
  await writeFile(path.join(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  await browser.close();
}
