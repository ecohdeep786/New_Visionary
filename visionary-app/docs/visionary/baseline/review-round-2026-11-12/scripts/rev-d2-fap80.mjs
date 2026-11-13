import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// INDEPENDENT REVIEW — FAP-80 retry (2026-11-13). Dark-mode token contract on the
// legacy Learn surface, on MERGED beta at 127.0.0.1:5175 (head f8c3fd1d).
// Flow: learner (dark context) -> Profile adds a learning area -> legacy Learn
// (?legacy=1&subject=...) -> Add topic -> measure TopicCard paints -> open the
// topic detail (CourseViewer) -> measure the two FAP-80-fixed inline paints.
// The receipt's AFTER values: text links -> rgb(170,199,255); borders -> token.
const DIR = 'C:/Users/Administrator/nv-worktrees/review-beta-serve/visionary-app/docs/visionary/baseline/review-round-2026-11-12'
const OUT = DIR + '/rev-d2-fap80.json'
const SHOTS = DIR + '/shots'
const BASE = 'http://127.0.0.1:5175'
fs.mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const results = { base: BASE, betaHead: 'f8c3fd1d' }
const save = () => fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
const log = (k, v) => { console.log(`rev-d2/${k}: ` + JSON.stringify(v).slice(0, 400)); save() }
const ts = Date.now()

let page = null
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
  page = await ctx.newPage()
  const issues = []
  page.on('console', m => { if (m.type() === 'error') issues.push(m.text().slice(0, 150)) })
  page.on('pageerror', e => issues.push('PAGEERROR: ' + String(e).slice(0, 150)))
  // register + onboard a learner in the dark context
  await page.goto(BASE + '/register', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(2000)
  await page.getByRole('button', { name: 'Continue with Email' }).first().click()
  const email = `rev-fap80-${ts}@visionary.test`
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(1100)
  const pw = page.locator('input[type="password"]')
  await pw.first().fill('correct-horse-9', { timeout: 20000 })
  if (await pw.count() > 1) await pw.nth(1).fill('correct-horse-9')
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(1600)
  const otp = page.locator('input[autocomplete="one-time-code"]')
  await otp.click({ timeout: 15000 })
  await otp.fill('000000')
  await page.getByRole('button', { name: 'Verify' }).click()
  await page.waitForURL('**/onboarding', { timeout: 20000 })
  await page.waitForTimeout(1400)
  await page.getByRole('button', { name: 'I am a Learner' }).first().click()
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  await page.locator('main input').first().fill('Review FAP80 learner')
  await page.locator('select').first().selectOption('adult')
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  for (let step = 0; step < 8; step++) {
    if (/dashboard/.test(new URL(page.url()).pathname)) break
    const start = page.getByRole('button', { name: 'Start using Visionary' })
    if (await start.count()) { await start.first().click(); await page.waitForURL('**/dashboard/**', { timeout: 25000 }); await page.waitForTimeout(2500); break }
    const exam = page.getByRole('button', { name: 'Exam preparation' }).first()
    if (await exam.count()) { await exam.click(); await page.waitForTimeout(500) }
    const sel = page.locator('main select').first()
    if (await sel.count()) await sel.selectOption({ index: 1 })
    await page.locator('button[type="submit"]').last().click()
    await page.waitForTimeout(800)
  }
  results.landed = new URL(page.url()).pathname
  results.darkMedia = await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)
  // add a learning area in Profile
  await page.goto(BASE + '/dashboard/profile', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1800)
  await page.locator('input[aria-label="New learning area"]').fill('Mathematics')
  await page.getByRole('button', { name: 'Add area' }).click()
  await page.waitForTimeout(2200)
  // legacy Learn with the subject param
  await page.goto(BASE + '/dashboard/learn?legacy=1&subject=' + encodeURIComponent('Mathematics'), { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(2000)
  await page.getByRole('button', { name: 'Add topic' }).first().click({ timeout: 10000 })
  await page.waitForTimeout(700)
  await page.locator('[role="dialog"] input').first().fill(`Review FAP80 dark topic ${ts}`)
  // the dialog's submit button has no explicit type attr (implicit submit) — take the form's last button
  await page.locator('[role="dialog"] form button').last().click()
  await page.waitForTimeout(2800)
  const legacy = await page.evaluate(() => {
    const pick = (el, prop) => el ? getComputedStyle(el)[prop] : null
    const badge = [...document.querySelectorAll('span')].find(s => s.textContent.trim() === 'Not started')
    const card = badge ? badge.closest('article') : null
    const learningArea = [...document.querySelectorAll('a')].find(a => /learning area/i.test(a.textContent))
    const openLab = [...document.querySelectorAll('span')].find(s => /open lab/i.test(s.textContent))
    const explore = [...document.querySelectorAll('p')].find(p => /explore in 3d/i.test(p.textContent))
    return {
      badgeBg: pick(badge, 'backgroundColor'),
      badgeColor: pick(badge, 'color'),
      cardBorder: pick(card, 'borderTopColor'),
      learningAreaColor: pick(learningArea, 'color'),
      openLabColor: pick(openLab, 'color'),
      exploreColor: pick(explore, 'color'),
    }
  })
  results.legacyList = legacy
  await page.screenshot({ path: `${SHOTS}/rev-fap80-dark-learn-1440.png` })
  // open the topic detail (CourseViewer)
  const cardTitle = page.locator('article h3 a').first()
  await cardTitle.click({ timeout: 8000 })
  await page.waitForTimeout(2200)
  results.topicDetailPath = new URL(page.url()).pathname
  const detail = await page.evaluate(() => {
    const pick = el => el ? getComputedStyle(el).color : null
    const practice = [...document.querySelectorAll('a, button')].find(a => /practice this topic/i.test(a.textContent))
    const explain = [...document.querySelectorAll('button')].find(a => /request explanation/i.test(a.textContent))
    return { practiceColor: pick(practice), explainColor: pick(explain), h1: document.querySelector('h1')?.textContent.trim() ?? null }
  })
  results.topicDetail = detail
  await page.screenshot({ path: `${SHOTS}/rev-fap80-dark-topic-1440.png` })
  results.consoleErrors = issues
  const m = { ...legacy, ...detail }
  // The FAP-80 defect pair was rgb(182,189,202) text on rgb(218,220,224) bg (1.38:1).
  // After the fix the badge bg remaps to the dark token and the text to the dark
  // muted token — so the honest law is measured contrast (FAP-30 4.5:1), plus the
  // absence of the legacy light bg/border literals and the receipt's link after-value.
  const lum = (rgb) => {
    const [r, g, b] = rgb.match(/\d+/g).map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const ratio = (fg, bg) => { const a = lum(fg), b = lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
  results.contrast = {
    badge: ratio(m.badgeColor, m.badgeBg),
    practice: ratio(m.practiceColor, 'rgb(25, 28, 34)'),
    explain: ratio(m.explainColor, 'rgb(25, 28, 34)'),
  }
  results.ok = results.darkMedia &&
    m.badgeBg !== 'rgb(218, 220, 224)' && m.cardBorder !== 'rgb(218, 220, 224)' &&
    results.contrast.badge >= 4.5 && results.contrast.practice >= 4.5 && results.contrast.explain >= 4.5 &&
    m.learningAreaColor === 'rgb(170, 199, 255)' && m.openLabColor === 'rgb(170, 199, 255)' &&
    m.practiceColor === 'rgb(170, 199, 255)' && m.explainColor === 'rgb(170, 199, 255)'
  log('fap80', { ok: results.ok, badgeBg: m.badgeBg, badgeColor: m.badgeColor, badgeContrast: results.contrast.badge, cardBorder: m.cardBorder, learningArea: m.learningAreaColor, openLab: m.openLabColor, practice: m.practiceColor, explain: m.explainColor })
} catch (e) {
  results.error = String(e).slice(0, 300)
  log('ERROR', { message: results.error, url: page ? page.url() : null })
}
save()
await browser.close()
console.log('WROTE ' + OUT)
