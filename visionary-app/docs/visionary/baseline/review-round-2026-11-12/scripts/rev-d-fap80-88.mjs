import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// INDEPENDENT REVIEW ROUND 2026-11-12 — script D (FAP-88 class-list dedupe + FAP-80 dark tokens).
// Reviewer probes on MERGED beta at 127.0.0.1:5175 (head f8c3fd1d):
//   FAP-88 the teacher class-creation repro journey emits no duplicate-key render
//   FAP-80 dashboard Learn in dark mode: remapped tokens, no legacy literal paints
// OTP '000000' is the disclosed preview simulation (FAP-70 law) — no email claim.
const DIR = 'C:/Users/Administrator/nv-worktrees/review-beta-serve/visionary-app/docs/visionary/baseline/review-round-2026-11-12'
const OUT = DIR + '/rev-d-fap80-88.json'
const SHOTS = DIR + '/shots'
const BASE = 'http://127.0.0.1:5175'
fs.mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const results = { base: BASE, betaHead: 'f8c3fd1d', fap88: {}, fap80: {} }
const save = () => fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
const log = (k, v) => { console.log(`rev-d/${k}: ` + JSON.stringify(v).slice(0, 400)); save() }
const ts = Date.now()

async function registerAndOnboard(page, email, card) {
  await page.goto(BASE + '/register', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(2000)
  await page.getByRole('button', { name: 'Continue with Email' }).first().click()
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
  await page.getByRole('button', { name: card }).first().click()
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  await page.locator('main input').first().fill('Review RD fixture')
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
  return email
}

// ---------- FAP-88 ----------
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const issues = []
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') issues.push({ type: m.type(), text: m.text().slice(0, 200) }) })
  page.on('pageerror', e => issues.push({ type: 'pageerror', text: String(e).slice(0, 200) }))
  const email = `rev-fap88-${ts}@visionary.test`
  await registerAndOnboard(page, email, 'I am a Learner')
  results.fap88.landed = new URL(page.url()).pathname
  // add a Teacher role to the same account
  await page.locator('select[aria-label="Active workspace"]').selectOption({ value: 'add' })
  await page.waitForTimeout(900)
  await page.locator('[role="dialog"] select[aria-label="Role"]').selectOption('teacher')
  await page.getByRole('button', { name: 'Add role' }).click()
  await page.waitForTimeout(2000)
  await page.goto(BASE + '/dashboard/classes', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1800)
  // creation sample 1: empty-state CTA
  await page.getByRole('button', { name: 'Create your first class' }).click()
  await page.waitForTimeout(900)
  await page.locator('[role="dialog"] input').first().fill(`Review RD Class One ${ts}`)
  await page.locator('[role="dialog"] button[type="submit"]').last().click()
  await page.waitForTimeout(3000)
  const s1 = await page.evaluate(() => ({
    url: location.pathname,
    cards: [...document.querySelectorAll('.v-class-card h3')].map(h => h.textContent.trim()),
  }))
  results.fap88.sample1 = s1
  // creation sample 2: header "Create class"
  await page.getByRole('button', { name: 'Create class' }).first().click()
  await page.waitForTimeout(900)
  await page.locator('[role="dialog"] input').first().fill(`Review RD Class Two ${ts}`)
  await page.locator('[role="dialog"] button[type="submit"]').last().click()
  await page.waitForTimeout(3000)
  const s2 = await page.evaluate(() => ({
    url: location.pathname,
    cards: [...document.querySelectorAll('.v-class-card h3')].map(h => h.textContent.trim()),
  }))
  results.fap88.sample2 = s2
  await page.screenshot({ path: `${SHOTS}/rev-fap88-classes-1440.png` })
  results.fap88.duplicateKeyWarnings = issues.filter(x => /two children with the same key/i.test(x.text)).length
  results.fap88.consoleIssues = issues
  results.fap88.ok = results.fap88.duplicateKeyWarnings === 0 && s2.cards.length === 2 &&
    new Set(s2.cards).size === 2 && issues.length === 0
  log('fap88', { dupKey: results.fap88.duplicateKeyWarnings, cards: s2.cards.length, issues: issues.length, ok: results.fap88.ok })
  await ctx.close()
} catch (e) { results.fap88.error = String(e).slice(0, 300); log('fap88-ERROR', { message: results.fap88.error }) }

// ---------- FAP-80 (dark context) ----------
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
  const page = await ctx.newPage()
  const issues = []
  page.on('console', m => { if (m.type() === 'error') issues.push(m.text().slice(0, 150)) })
  page.on('pageerror', e => issues.push('PAGEERROR: ' + String(e).slice(0, 150)))
  const email = `rev-fap80-${ts}@visionary.test`
  await registerAndOnboard(page, email, 'I am a Learner')
  results.fap80.landed = new URL(page.url()).pathname
  await page.goto(BASE + '/dashboard/learn', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1800)
  const dark = await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)
  results.fap80.darkMedia = dark
  // create a topic through the Add-topic dialog
  await page.getByRole('button', { name: 'Add topic' }).first().click()
  await page.waitForTimeout(900)
  await page.locator('[role="dialog"] input').first().fill(`Review RD dark topic ${ts}`)
  await page.locator('[role="dialog"] button[type="submit"]').last().click()
  await page.waitForTimeout(2500)
  const measured = await page.evaluate(() => {
    const pick = (el, prop) => el ? getComputedStyle(el)[prop] : null
    const badge = [...document.querySelectorAll('span')].find(s => s.textContent.trim() === 'Not started')
    const card = document.querySelector('.v-class-card, [class*="border-[#dadce0]"]') ||
      (badge ? badge.closest('article, div[class*="rounded"]') : null)
    return {
      badgeBg: pick(badge, 'backgroundColor'),
      badgeColor: pick(badge, 'color'),
      cardBorder: pick(card, 'borderTopColor'),
      cardBg: pick(card, 'backgroundColor'),
    }
  })
  results.fap80.measurements = measured
  // open the topic detail and measure the primary action links
  const cardBtn = page.locator('button:has-text("Review RD dark topic")').first()
  if (await cardBtn.count()) {
    await cardBtn.click({ timeout: 5000 })
    await page.waitForTimeout(1800)
    measured.topicDetail = await page.evaluate(() => {
      const pick = el => el ? getComputedStyle(el).color : null
      const practice = [...document.querySelectorAll('a, button')].find(a => /practice this topic/i.test(a.textContent))
      const explain = [...document.querySelectorAll('button, a')].find(a => /request explanation/i.test(a.textContent))
      return { practiceColor: pick(practice), explainColor: pick(explain), h1: document.querySelector('h1')?.textContent.trim() ?? null }
    })
  }
  await page.screenshot({ path: `${SHOTS}/rev-fap80-dark-learn-1440.png` })
  results.fap80.consoleErrors = issues
  const m = measured
  results.fap80.ok = dark && m.badgeBg !== 'rgb(218, 220, 224)' && m.badgeColor !== 'rgb(182, 189, 202)' &&
    m.cardBorder !== 'rgb(218, 220, 224)' && (!m.topicDetail || m.topicDetail.practiceColor !== 'rgb(11, 87, 210)')
  log('fap80', { dark, badgeBg: m.badgeBg, badgeColor: m.badgeColor, cardBorder: m.cardBorder, practice: m.topicDetail?.practiceColor, ok: results.fap80.ok })
  await ctx.close()
} catch (e) { results.fap80.error = String(e).slice(0, 300); log('fap80-ERROR', { message: results.fap80.error }) }

save()
await browser.close()
console.log('WROTE ' + OUT)
