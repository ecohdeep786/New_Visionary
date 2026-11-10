/**
 * C2/FAP-50 onboarding probes — "onboarding joins the one system".
 * `node c2-probes.mjs` against the :5192 preview build.
 * Seeds a preview account, walks the student journey (identity → about → focus
 * → context → review → getting-started overlay at each of 1440/768/390), and
 * records c2-probe-after.json with the canvas/card/pill/label/control law plus
 * an off-law color sweep per stage.
 */
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5192';
const ORIGIN = `http://localhost:${PORT}`;
const OUT = path.dirname(fileURLToPath(import.meta.url));
const EMAIL = 'c2-onboarding-probe@fixture.invalid';
const OFF_LAW = ['rgb(11, 87, 208)', 'rgb(66, 133, 244)', 'rgb(232, 240, 253)'];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await context.newPage();

const seed = async () => {
  await page.goto(`${ORIGIN}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[data-font-surface="product"]', { timeout: 30000 });
  await page.evaluate(email => {
    const user = { id: 'c2-probe-user', email, full_name: 'C2 Probe', identity: null, onboarding_complete: false, getting_started_complete: false, preferred_language: 'English', created_at: new Date().toISOString() };
    const token = 'c2-probe-token';
    localStorage.setItem('visionary_users', JSON.stringify([user]));
    localStorage.setItem('visionary_sessions', JSON.stringify([{ token, userId: user.id, email, expiresAt: Date.now() + 7200000, createdAt: Date.now() }]));
    localStorage.setItem('visionary_session_token', token);
  }, EMAIL);
};

const snap = () => {
  const form = document.querySelector('form[data-font-surface="product"]');
  const card = document.querySelector('div[class*="rounded-[28px]"]');
  const cardStyle = card ? getComputedStyle(card) : null;
  const submit = [...document.querySelectorAll('button[type="submit"]')].find(element => /Continue|Start|Saving/.test(element.textContent || ''));
  const submitStyle = submit ? getComputedStyle(submit) : null;
  const labels = [...document.querySelectorAll('ol[aria-label="Setup steps"] li span:last-child')].map(span => getComputedStyle(span).fontSize);
  const sizes = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!el.childElementCount && (el.textContent || '').trim()) sizes.push(parseFloat(getComputedStyle(el).fontSize));
  }
  const bar = document.querySelector('[role="progressbar"] > div');
  const offLaw = ['rgb(11, 87, 208)', 'rgb(66, 133, 244)', 'rgb(232, 240, 253)'];
  const colors = {};
  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    for (const key of ['backgroundColor', 'color', 'borderColor']) {
      if (offLaw.includes(style[key])) colors[style[key]] = (colors[style[key]] || 0) + 1;
    }
  }
  return {
    canvas: form ? getComputedStyle(form).backgroundColor : null,
    cardBg: cardStyle ? cardStyle.backgroundColor : null,
    cardRadius: cardStyle ? cardStyle.borderRadius : null,
    pillBg: submitStyle ? submitStyle.backgroundColor : null,
    pillHeight: submitStyle ? parseInt(submitStyle.height, 10) : null,
    pillRadius: submitStyle ? submitStyle.borderRadius : null,
    stepLabelSizes: [...new Set(labels)],
    minFontSize: sizes.length ? Math.min(...sizes) : null,
    progressFill: bar ? getComputedStyle(bar).backgroundColor : null,
    offLawColorHits: colors,
  };
};

const gsSnap = () => {
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) return { open: false };
  const card = dialog.querySelector('div[class*="rounded-[28px]"]') || dialog;
  const cardStyle = getComputedStyle(card);
  const close = dialog.querySelector('button[aria-label="Close introduction"]');
  const closeSize = close ? getComputedStyle(close).width : null;
  const primary = [...dialog.querySelectorAll('button')].find(element => /Continue|Start exploring/.test(element.textContent || ''));
  const primaryStyle = primary ? getComputedStyle(primary) : null;
  const sizes = [];
  for (const el of dialog.querySelectorAll('*')) {
    if (!el.childElementCount && (el.textContent || '').trim()) sizes.push(parseFloat(getComputedStyle(el).fontSize));
  }
  const offLaw = ['rgb(11, 87, 208)', 'rgb(66, 133, 244)', 'rgb(232, 240, 253)'];
  const colors = {};
  for (const el of dialog.querySelectorAll('*')) {
    const style = getComputedStyle(el);
    for (const key of ['backgroundColor', 'color', 'borderColor']) {
      if (offLaw.includes(style[key])) colors[style[key]] = (colors[style[key]] || 0) + 1;
    }
  }
  return {
    open: true,
    cardRadius: cardStyle.borderRadius,
    cardBg: cardStyle.backgroundColor,
    closeControl: closeSize,
    pillBg: primaryStyle ? primaryStyle.backgroundColor : null,
    pillHeight: primaryStyle ? parseInt(primaryStyle.height, 10) : null,
    pillRadius: primaryStyle ? primaryStyle.borderRadius : null,
    minFontSize: sizes.length ? Math.min(...sizes) : null,
    offLawColorHits: colors,
  };
};

const clickButton = async label => {
  try {
    await page.waitForFunction(l => [...document.querySelectorAll('button')].some(element => (element.textContent || '').trim() === l && !element.disabled), label, {});
  } catch (error) {
    const state = await page.evaluate(() => ({ url: location.pathname, buttons: [...document.querySelectorAll('button')].map(element => ({ text: (element.textContent || '').trim().slice(0, 30), disabled: element.disabled })) }));
    console.error('CLICK-STATE', JSON.stringify(state));
    throw error;
  }
  await page.evaluate(l => [...document.querySelectorAll('button')].find(element => (element.textContent || '').trim() === l && !element.disabled).click(), label);
};

const journey = {
  identity: () => page.waitForSelector('button[aria-pressed]', { timeout: 30000 }),
  enterStudent: async () => {
    await page.click('button[aria-pressed]:has-text("I am a Learner")');
    await page.waitForSelector('button[aria-pressed="true"]', { timeout: 8000 });
    await page.waitForTimeout(300); // let the 150ms transition-colors settle
    const selected = await page.evaluate(() => {
      const card = [...document.querySelectorAll('button[aria-pressed="true"]')][0];
      if (!card) return null;
      const style = getComputedStyle(card);
      return { border: style.borderColor, background: style.backgroundColor, check: getComputedStyle(card.querySelector('div[style], :scope > div:last-child') || card).color };
    });
    return selected;
  },
  about: async () => {
    await page.fill('section[aria-labelledby="onboarding-title"] input[type="text"]', 'C2 Probe');
    await page.selectOption('section[aria-labelledby="onboarding-title"] select', 'adult');
  },
  focus: async () => {
    await page.click('button[aria-pressed]:has-text("School")');
  },
  context: async () => {
    const selects = await page.$$('section[aria-labelledby="onboarding-title"] select');
    const boards = ['CBSE', 'California', 'Grade 6'];
    for (let i = 0; i < Math.min(selects.length, 3); i++) await selects[i].selectOption({ index: 1 });
  },
  review: () => page.waitForFunction(() => [...document.querySelectorAll('button')].some(element => (element.textContent || '').trim() === 'Start using Visionary'), {}, { timeout: 30000 }),
};

// Walk the whole journey at each width, snapshotting every phase.
const results = {};
for (const width of [1440, 768, 390]) {
  await page.setViewportSize({ width, height: Math.max(760, Math.round(width * 0.72)) });
  await seed();
  const entry = {};
  await page.goto(`${ORIGIN}/onboarding`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[data-font-surface="product"]', { timeout: 30000 });
  await page.waitForTimeout(300);
  await journey.identity();
  entry.identity = { ...await page.evaluate(snap), selected: await journey.enterStudent() };
  await clickButton('Continue');
  await page.waitForSelector('section[aria-labelledby="onboarding-title"] input[type="text"]', { timeout: 30000 });
  await page.waitForTimeout(300);
  entry.about = { ...await page.evaluate(snap), fieldHeight: await page.evaluate(() => parseInt(getComputedStyle(document.querySelector('section[aria-labelledby="onboarding-title"] input')).height, 10)) };
  await journey.about();
  await clickButton('Continue');
  await page.waitForSelector('button[aria-pressed]:has-text("School")', { timeout: 30000 });
  await page.waitForTimeout(300);
  entry.focus = await page.evaluate(snap);
  await journey.focus();
  await clickButton('Continue');
  await page.waitForSelector('section[aria-labelledby="onboarding-title"] select', { timeout: 30000 });
  await page.waitForTimeout(300);
  entry.context = { ...await page.evaluate(snap), selectHeight: await page.evaluate(() => parseInt(getComputedStyle(document.querySelector('section[aria-labelledby="onboarding-title"] select')).height, 10)) };
  await journey.context();
  await clickButton('Continue');
  await journey.review();
  await page.waitForTimeout(400);
  entry.review = { ...await page.evaluate(snap), linkColor: await page.evaluate(() => getComputedStyle([...document.querySelectorAll('button')].find(element => (element.textContent || '').trim() === 'Change role')).color) };
  await clickButton('Start using Visionary');
  await page.waitForTimeout(1500);
  entry.gettingStarted = await page.evaluate(gsSnap);
  results[`w${width}`] = entry;
}

await browser.close();
const file = path.join(OUT, 'c2-probe-after.json');
const { writeFileSync } = await import('node:fs');
writeFileSync(file, JSON.stringify(results, null, 2));
console.log('C2 probes written to', file);
