import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// INDEPENDENT REVIEW ROUND 2026-11-12 — script C (role identities, dashboard deep links).
// Reviewer probes on MERGED beta at 127.0.0.1:5174 (head f8c3fd1d):
//   FAP-87 restricted deep links keep their URL and explain themselves (student/professional)
//   FAP-89 organization identity: personal-learning routes are honest, capability routes open
//   FAP-90 organization/parent keep /dashboard/classes with the teaching-workspace explanation
// OTP '000000' is the disclosed preview simulation (FAP-70 law) — no email claim.
const DIR = 'C:/Users/Administrator/New_Visionary/visionary-app/docs/visionary/baseline/review-round-2026-11-12'
const OUT = DIR + '/rev-c-identities.json'
const SHOTS = DIR + '/shots'
const BASE = 'http://127.0.0.1:5174'
fs.mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errs = []
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 200)))
const results = { base: BASE, betaHead: 'f8c3fd1d', identities: {} }
const save = () => fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
const log = (step, info) => { console.log(`rev-c/${step}: ` + JSON.stringify(info).slice(0, 360)); save() }
const ts = Date.now()

async function registerAndOnboard(identity) {
  const email = `rev-rl-${identity}-${ts}@visionary.test`
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
  const card = {
    student: 'I am a Learner',
    professional: 'I am a Professional',
    teacher: 'I am a Teacher',
    parent: 'I am a Parent',
    organization: 'We are an Organization',
  }[identity]
  await page.getByRole('button', { name: card }).first().click()
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  await page.locator('main input').first().fill(`Review RL ${identity} user`)
  await page.locator('select').first().selectOption('adult')
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  if (identity === 'organization') {
    await page.locator('main input').first().fill(`Review Academy ${ts}`)
    await page.locator('main select').first().selectOption({ index: 1 })
    await page.locator('button[type="submit"]').last().click()
    await page.waitForTimeout(900)
  }
  if (identity === 'teacher') {
    await page.locator('main select').first().selectOption({ index: 1 })
    await page.locator('button[type="submit"]').last().click()
    await page.waitForTimeout(900)
  }
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

async function probePath(path) {
  const before = new URL(page.url()).pathname
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1500)
  return await page.evaluate(() => ({
    url: location.pathname,
    h1: document.querySelector('h1')?.textContent.trim() ?? null,
    main: (document.querySelector('main') || document.body).innerText.replace(/\n+/g, ' | ').slice(0, 300),
  }))
}

async function signOutAndClear() {
  await page.goto(BASE + '/dashboard/settings', { waitUntil: 'load', timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(1200)
  const signOut = page.getByRole('button', { name: /sign out|Sign out/i }).first()
  if (await signOut.count()) { await signOut.click(); await page.waitForTimeout(1800) }
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 30000 }).catch(() => {})
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch (e) {} })
  await page.waitForTimeout(600)
}

try {
  // ---- student identity (FAP-87) ----
  {
    const errsBefore = errs.length
    const email = await registerAndOnboard('student')
    const e = { email, landed: new URL(page.url()).pathname }
    e.prepare = await probePath('/dashboard/prepare')
    e.child = await probePath('/dashboard/child')
    await page.screenshot({ path: `${SHOTS}/rev-fap87-student-prepare-1440.png` })
    e.newConsoleErrors = errs.slice(errsBefore)
    e.ok = e.prepare.url === '/dashboard/prepare' && /teaching workspace/i.test(e.prepare.main) &&
      e.child.url === '/dashboard/child' && /family workspace/i.test(e.child.main)
    results.identities.student = e
    log('student', { prepare: e.prepare.url + ' | ' + (e.prepare.h1 || ''), child: e.child.url, ok: e.ok })
    await signOutAndClear()
  }
  // ---- professional identity (FAP-87) ----
  {
    const errsBefore = errs.length
    const email = await registerAndOnboard('professional')
    const e = { email, landed: new URL(page.url()).pathname }
    e.child = await probePath('/dashboard/child')
    e.prepare = await probePath('/dashboard/prepare')
    await page.screenshot({ path: `${SHOTS}/rev-fap87-professional-child-1440.png` })
    e.newConsoleErrors = errs.slice(errsBefore)
    e.ok = e.child.url === '/dashboard/child' && /family workspace/i.test(e.child.main) &&
      e.prepare.url === '/dashboard/prepare' && /teaching workspace/i.test(e.prepare.main)
    results.identities.professional = e
    log('professional', { child: e.child.url, prepare: e.prepare.url, ok: e.ok })
    await signOutAndClear()
  }
  // ---- organization identity (FAP-89 + FAP-90) ----
  {
    const errsBefore = errs.length
    const email = await registerAndOnboard('organization')
    const e = { email, landed: new URL(page.url()).pathname }
    for (const p of ['/dashboard/learn', '/dashboard/practice', '/dashboard/build', '/dashboard/ask']) {
      e[p.split('/').pop()] = await probePath(p)
    }
    await page.screenshot({ path: `${SHOTS}/rev-fap89-org-learn-1440.png` })
    e.people = await probePath('/dashboard/people')
    e.analytics = await probePath('/dashboard/analytics')
    e.classes = await probePath('/dashboard/classes')
    await page.screenshot({ path: `${SHOTS}/rev-fap90-org-classes-1440.png` })
    const personal = ['learn', 'practice', 'build', 'ask'].map(k => e[k])
    e.personalHonest = personal.every(x => x.url && /Not available in this workspace/i.test(x.h1 || '') && /personal learning workspaces/i.test(x.main))
    e.capabilityOpen = !/Permission required/i.test(e.people.h1 || '') && !/Permission required/i.test(e.analytics.h1 || '')
    e.classesExplained = e.classes.url === '/dashboard/classes' && /Classes/i.test(e.classes.h1 || '') && /teaching workspace/i.test(e.classes.main)
    e.newConsoleErrors = errs.slice(errsBefore)
    e.ok = e.personalHonest && e.capabilityOpen && e.classesExplained
    results.identities.organization = e
    log('organization', { personalHonest: e.personalHonest, capabilityOpen: e.capabilityOpen, classes: e.classes.url + ' | ' + (e.classes.h1 || ''), ok: e.ok })
    await signOutAndClear()
  }
  // ---- parent identity (FAP-90) ----
  {
    const errsBefore = errs.length
    const email = await registerAndOnboard('parent')
    const e = { email, landed: new URL(page.url()).pathname }
    e.classes = await probePath('/dashboard/classes')
    await page.screenshot({ path: `${SHOTS}/rev-fap90-parent-classes-1440.png` })
    e.newConsoleErrors = errs.slice(errsBefore)
    e.ok = e.classes.url === '/dashboard/classes' && /Classes/i.test(e.classes.h1 || '') && /family workspace/i.test(e.classes.main)
    results.identities.parent = e
    log('parent', { classes: e.classes.url + ' | ' + (e.classes.h1 || ''), ok: e.ok })
    await signOutAndClear()
  }
  // ---- teacher identity (FAP-90 control: real Classes page) ----
  {
    const errsBefore = errs.length
    const email = await registerAndOnboard('teacher')
    const e = { email, landed: new URL(page.url()).pathname }
    e.classes = await probePath('/dashboard/classes')
    await page.screenshot({ path: `${SHOTS}/rev-fap90-teacher-classes-1440.png` })
    e.newConsoleErrors = errs.slice(errsBefore)
    e.ok = e.classes.url === '/dashboard/classes' && !/opens with a teaching workspace/i.test(e.classes.main)
    results.identities.teacher = e
    log('teacher', { classes: e.classes.url + ' | ' + (e.classes.h1 || ''), ok: e.ok })
  }
  results.consoleErrors = errs
  results.allOk = Object.values(results.identities).every(x => x.ok)
  log('done', { allOk: results.allOk, consoleErrors: errs.length })
} catch (e) {
  log('ERROR', { message: String(e).slice(0, 300), url: page.url() })
}
save()
await ctx.close()
await browser.close()
console.log('WROTE ' + OUT)
