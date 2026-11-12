import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// T09 spot probe: locate the duplicate-key warning + verify reload-active-workspace
// and the learner-workspace state after the ClassDetail ?class= bounce.
const OUT = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-r2-spot.json'
const BASE = 'http://127.0.0.1:5174'
const ts = Date.now()
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errs = []
let phase = 'start'
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push({ phase, type: m.type(), text: m.text().slice(0, 220) }) })
page.on('pageerror', e => errs.push({ phase, type: 'pageerror', text: String(e).slice(0, 220) }))
const results = { email: `t09-r2-spot-${ts}@visionary.test`, phases: [] }
const save = () => fs.writeFileSync(OUT, JSON.stringify({ results, errs }, null, 2))

try {
  await page.goto(BASE + '/register', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(2200)
  await page.getByRole('button', { name: 'Continue with Email' }).first().click()
  await page.locator('input[type="email"]').first().fill(results.email)
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
  await page.waitForTimeout(1500)
  phase = 'wizard'
  await page.getByRole('button', { name: 'I am a Learner' }).first().click()
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  await page.locator('input[type="text"]').first().fill('T09 Spot fixture')
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
  console.log('onboarded: ' + page.url())

  phase = 'add-teacher-role'
  await page.locator('select[aria-label="Active workspace"]').selectOption({ value: 'add' })
  await page.waitForTimeout(900)
  await page.locator('[role="dialog"] select[aria-label="Role"]').selectOption('teacher')
  await page.getByRole('button', { name: 'Add role' }).click()
  await page.waitForTimeout(2000)
  console.log('teacher: ' + page.url())

  phase = 'create-class'
  await page.goto(BASE + '/dashboard/classes', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1800)
  await page.getByRole('button', { name: 'Create your first class' }).click()
  await page.waitForTimeout(900)
  await page.locator('[role="dialog"] input').first().fill(`T09 Spot Class ${ts}`)
  await page.locator('[role="dialog"] button[type="submit"]').last().click()
  await page.waitForTimeout(2000)
  const card = page.locator('a[href*="/dashboard/class/"]').first()
  if (await card.count()) { await card.click(); await page.waitForTimeout(2000) }
  console.log('class-detail: ' + page.url())

  phase = 'switch-to-student'
  const opts = await page.locator('select[aria-label="Active workspace"] option').evaluateAll(os => os.map(o => ({ v: o.value, t: o.textContent.trim() })))
  const student = opts.find(o => /learner/i.test(o.t))
  await page.locator('select[aria-label="Active workspace"]').selectOption({ value: student.v })
  await page.waitForTimeout(2200)
  const afterSwitch = await page.evaluate(() => ({ url: location.pathname + location.search, h1: document.querySelector('h1')?.textContent.trim() }))
  console.log('after-switch: ' + JSON.stringify(afterSwitch))
  results.phases.push({ phase: 'after-switch', ...afterSwitch })

  phase = 'student-db'
  results.studentDb = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('visionary_workspace_v2') || 'null')
    return db?.workspaces?.map(w => ({ role: w.role, lastPath: w.lastPath }))
  })
  console.log('student-lastPaths: ' + JSON.stringify(results.studentDb))

  // does the ?class= param produce any notice on the learner classes page?
  phase = 'student-classes-param'
  await page.goto(BASE + '/dashboard/classes?class=nonexistent-id-123', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1800)
  const paramState = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent.trim(),
    main: (document.querySelector('main')?.innerText || '').slice(0, 400).replace(/\n+/g, ' | '),
    url: location.pathname + location.search,
  }))
  results.phases.push({ phase: 'student-classes-param', ...paramState })
  console.log('param-state: ' + JSON.stringify(paramState))

  phase = 'switch-back-teacher-reload'
  const opts2 = await page.locator('select[aria-label="Active workspace"] option').evaluateAll(os => os.map(o => ({ v: o.value, t: o.textContent.trim() })))
  const teacher = opts2.find(o => /teacher/i.test(o.t))
  await page.locator('select[aria-label="Active workspace"]').selectOption({ value: teacher.v })
  await page.waitForTimeout(2000)
  results.afterTeacherSwitch = await page.evaluate(() => ({ url: location.pathname + location.search, h1: document.querySelector('h1')?.textContent.trim() }))
  await page.reload({ waitUntil: 'load' })
  await page.waitForTimeout(2500)
  results.afterReload = await page.evaluate(() => ({
    url: location.pathname + location.search,
    h1: document.querySelector('h1')?.textContent.trim(),
    activeSelectValue: document.querySelector('select[aria-label="Active workspace"]')?.value || null,
    dbActive: (JSON.parse(localStorage.getItem('visionary_workspace_v2') || 'null'))?.active || null,
  }))
  console.log('after-reload: ' + JSON.stringify(results.afterReload))
  results.phases.push({ phase: 'after-reload', ...results.afterReload })
} catch (e) {
  results.error = String(e).slice(0, 300)
  console.log('ERROR: ' + results.error)
}
save()
await browser.close()
console.log('WROTE ' + OUT)
console.log('ERRS: ' + JSON.stringify(errs, null, 1))
