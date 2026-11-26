import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.LANDING_REVIEW_URL || 'http://127.0.0.1:5200';
const out = process.env.LANDING_EVIDENCE_DIR || fileURLToPath(new URL('../../../shots/apple-pass-2026-11-24/five-audiences/', import.meta.url));
await mkdir(out, { recursive: true });

const roles = [
  {
    slug: 'student', label: 'Students', story: 'to a project',
    questionRole: 'For every student, at every stage',
    question: /Why doesn’t this make sense yet\?/, example: /equivalent fractions/,
    destination: 'Learning,', workspace: 'One half, from a picture to a recipe.', steps: ['Learn', 'Ask', 'Practice', 'Build'],
  },
  {
    slug: 'teacher', label: 'Teachers', story: 'to a lesson',
    questionRole: 'For every teacher, in every classroom',
    question: /Did it land with everyone\?/, example: /draw two ways/,
    destination: 'Teaching.', workspace: 'From a lesson plan to one learner’s drawing.', steps: ['Prepare', 'Assign', 'Review'],
  },
  {
    slug: 'parent', label: 'Parents', story: 'to a conversation',
    questionRole: 'For every parent, at every age',
    question: /What did they really understand\?/, example: /practice/,
    destination: 'Parenting.', workspace: 'A shared summary. A conversation at home.', steps: ['Connect', 'Summary', 'Guidance'],
  },
  {
    slug: 'professional', label: 'Professionals', story: 'to a new skill',
    questionRole: 'For every professional, in every field',
    question: /How do I use this in my work\?/, example: /spreadsheet budget/,
    destination: 'Building.', workspace: 'Give a skill a job to do.', steps: ['Goal', 'Skill', 'Project'],
  },
  {
    slug: 'organization', label: 'Organizations', story: 'to a team plan',
    questionRole: 'For every organization, across every team',
    question: /Where are the gaps across our teams\?/, example: /team-level results/i,
    destination: 'Leading.', workspace: 'One cohort. One shared handoff.', steps: ['Cohort', 'Content', 'Evidence'],
  },
];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const receipt = { base, generatedAt: new Date().toISOString(), journeys: [], keyboard: null, reducedMotion: null, pause: null, errors: [] };

async function open(width, height, reducedMotion = 'reduce', hasTouch = false) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion, hasTouch });
  page.on('pageerror', error => receipt.errors.push(String(error)));
  await page.route('**/api/auth/me*', route => route.fulfill({ status: 401, json: { error: 'audience-audit' } }));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.locator('.home-hero h1').waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function assertNoOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 0, `${label} overflows horizontally by ${overflow}px`);
}

for (const [viewportName, width, height, hasTouch] of [
  ['mobile', 390, 844, true], ['tablet', 834, 1112, true],
  ['laptop', 1280, 800, false], ['desktop', 1440, 900, false],
]) {
  for (const role of roles) {
    const page = await open(width, height, 'reduce', hasTouch);
    const rail = page.locator(`.hero-path[href="/${role.slug}"]`);
    assert.equal(await rail.count(), 1, `${role.label} rail door`);
    await rail.focus();
    await page.waitForFunction(label => document.querySelector('.hero-path[data-active="true"]')?.textContent === label, role.label);
    await page.waitForFunction(story => document.querySelector('.home-hero h1')?.innerText.toLowerCase().includes(story), role.story);
    assert.equal(await page.locator('.cast-person[data-current="true"]').count(), 1, `${role.label} portrait highlighted`);
    await assertNoOverflow(page, `${role.label} hero`);
    await page.screenshot({ path: path.join(out, `${viewportName}-${role.slug}-hero.png`) });

    const choice = page.getByRole('group', { name: 'Explore examples by audience' }).getByRole('button', { name: role.label, exact: true });
    await choice.click();
    assert.equal(await choice.getAttribute('aria-pressed'), 'true');
    const questionCard = page.locator(`#question-example-panel[data-audience="${role.slug}"]`);
    await questionCard.scrollIntoViewIfNeeded();
    const questionRole = await questionCard.locator('.question-role').innerText();
    const question = await questionCard.locator('.question-text').innerText();
    const questionImage = questionCard.locator('img');
    await questionImage.evaluate(image => image.decode());
    assert.equal(questionRole.toLowerCase(), role.questionRole.toLowerCase(), `${role.label} is named on their question`);
    assert.match(question, role.question, `${role.label} can recognize a real question`);
    assert.match(await questionCard.locator('.question-example').innerText(), role.example);
    assert.ok(await questionImage.evaluate(image => image.complete && image.naturalWidth > 0), `${role.label} question portrait loads`);
    const questionLink = questionCard.getByRole('link', { name: `Explore for ${role.label.toLowerCase()}`, exact: true });
    assert.equal(await questionLink.getAttribute('href'), `/${role.slug}`);
    await assertNoOverflow(page, `${role.label} question`);
    await page.screenshot({ path: path.join(out, `${viewportName}-${role.slug}-question.png`) });

    const pathLink = page.getByRole('navigation', { name: 'Audience pages' }).locator(`[href="/${role.slug}"]`);
    await pathLink.scrollIntoViewIfNeeded();
    const roleLabel = await pathLink.locator('.path-title').innerText();
    const pathImage = pathLink.locator('img');
    await pathImage.evaluate(image => image.decode());
    assert.equal(roleLabel, role.label, `${role.label} is named on their path`);
    assert.ok(await pathImage.evaluate(image => image.complete && image.naturalWidth > 0), `${role.label} path portrait loads`);
    assert.ok((await pathLink.locator('.path-outcome').innerText()).trim(), `${role.label} path explains what the visitor will find`);
    assert.match(await page.locator('#path-status').innerText(), /in development/);
    await assertNoOverflow(page, `${role.label} path`);
    await page.screenshot({ path: path.join(out, `${viewportName}-${role.slug}-path.png`) });
    await pathLink.click();
    await page.waitForURL(url => url.pathname === `/${role.slug}`);
    await page.locator('.home-hero').waitFor({ state: 'detached' });
    const h1 = page.locator('main h1').first();
    await h1.waitFor();
    const heading = await h1.innerText();
    assert.ok(heading.toLowerCase().includes(role.destination.toLowerCase()), `${role.label} destination continues the story (got ${heading})`);
    assert.equal(new URL(page.url()).pathname, `/${role.slug}`);
    await assertNoOverflow(page, `${role.label} destination`);
    await page.screenshot({ path: path.join(out, `${viewportName}-${role.slug}-destination.png`) });
    const workspace = page.getByRole('region', { name: role.workspace, exact: true });
    await workspace.getByRole('tablist').waitFor();
    const availability = await workspace.getByText(/workspace in development/i).innerText();
    const screens = new Set();
    for (const label of role.steps) {
      await workspace.getByRole('tab', { name: label, exact: true }).click();
      const panel = workspace.getByRole('tabpanel', { name: label, exact: true });
      const image = panel.getByRole('img');
      const source = await image.evaluate(async element => {
        await element.decode();
        return element.currentSrc;
      });
      assert.ok(source.includes(role.slug + '-'), role.label + ' shows its own product');
      assert.equal(source.includes('-phone'), width < 600, role.label + ' screen matches the viewport');
      screens.add(source);
      await assertNoOverflow(page, role.label + ' ' + label);
    }
    assert.equal(screens.size, role.steps.length, role.label + ' has a different screen for each step');
    await workspace.getByRole('button', { name: 'Enlarge screenshot' }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    const action = page.locator('.cs-next .cs-action');
    assert.equal(await action.getAttribute('href'), role.slug === 'organization' ? '/contact#organization-enquiries' : '/register');
    receipt.journeys.push({
      viewport: viewportName, role: role.slug, story: role.story, question, destination: `/${role.slug}`,
      destinationHeading: heading.split('\n')[0], workspace: role.workspace, steps: role.steps, availability,
    });
    if (viewportName === 'desktop') {
      await page.goBack();
      await rail.click();
      await page.waitForURL(url => url.pathname === `/${role.slug}`);
      await page.locator('.home-hero').waitFor({ state: 'detached' });
    }
    await page.close();
  }
}

/* Long family-sharing headings must still fit when only text is enlarged. */
{
  const page = await open(320, 844);
  await page.getByRole('navigation', { name: 'Audience pages' }).getByRole('link', { name: /^Parents / }).click();
  const story = page.locator('.category-story[data-audience="parent"]');
  await story.getByRole('tab', { name: 'Guidance' }).click();
  await story.getByRole('button', { name: 'বাংলা' }).click();
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.documentElement.style.fontSize = '200%';
  });
  const widths = await story.evaluate(element => ({ content: element.scrollWidth, available: element.clientWidth }));
  assert.ok(widths.content <= widths.available + 1, 'Parent sharing headings overflow at 200% text size');
  receipt.parentTextReflow = widths;
  await page.close();
}

/* The directory presents the full set of audience destinations. */
{
  const page = await open(390, 844);
  const directory = page.getByRole('navigation', { name: 'Audience pages' });
  for (const role of roles) {
    const link = directory.locator(`[href="/${role.slug}"]`);
    assert.equal(await link.count(), 1);
    await link.scrollIntoViewIfNeeded();
    const img = link.locator('img');
    await img.evaluate(image => image.decode());
    assert.ok(await img.evaluate(image => image.complete && image.naturalWidth > 0), `${role.label} portrait loads`);
    assert.ok((await link.innerText()).toLowerCase().includes(role.label.toLowerCase()), `${role.label} directory label`);
  }
  await page.close();
}

/* Keyboard: five rail doors are in order and Enter opens the focused one. */
{
  const page = await open(390, 844);
  await page.locator('.hero-path').first().focus();
  const order = [];
  for (let i = 0; i < roles.length; i++) {
    order.push(await page.evaluate(() => document.activeElement?.textContent));
    if (i < roles.length - 1) await page.keyboard.press('Tab');
  }
  assert.deepEqual(order, roles.map(role => role.label));
  await page.keyboard.press('Enter');
  await page.waitForURL(url => url.pathname === '/organization');
  receipt.keyboard = { order, destination: '/organization' };
  await page.close();
}

/* Reduced motion holds the first story, with a working Play control. */
{
  const page = await open(390, 844, 'reduce');
  const first = await page.locator('.hero-path[data-active="true"]').innerText();
  await page.getByRole('button', { name: 'Play audience rotation' }).waitFor();
  await page.waitForTimeout(7000);
  assert.equal(await page.locator('.hero-path[data-active="true"]').innerText(), first);
  receipt.reducedMotion = { active: first, autoAdvanced: false };
  await page.close();
}

/* Pause stops the clock and leaves the focused story on screen. */
{
  const page = await open(390, 844, 'no-preference');
  await page.getByRole('button', { name: 'Pause audience rotation' }).click();
  const paused = await page.locator('.hero-path[data-active="true"]').innerText();
  await page.waitForTimeout(7000);
  assert.equal(await page.locator('.hero-path[data-active="true"]').innerText(), paused);
  await page.getByRole('button', { name: 'Play audience rotation' }).click();
  await page.getByRole('button', { name: 'Pause audience rotation' }).waitFor();
  receipt.pause = { pausedAt: paused, held: true };
  await page.close();
}

await writeFile(path.join(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
await browser.close();
assert.deepEqual(receipt.errors, [], 'No browser errors');
console.log('PASS five audience journeys', receipt.journeys.length, 'screens; keyboard, reduced motion, pause');
