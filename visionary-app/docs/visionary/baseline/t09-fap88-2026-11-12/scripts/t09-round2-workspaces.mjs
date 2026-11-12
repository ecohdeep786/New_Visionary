import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// T09 research round 2: same-account multi-workspace behavior on preview beta (5174).
// Account A: adult student onboards -> seeds a project -> adds Teacher role -> creates a class
//   -> checks cross-workspace isolation (student sees no class, teacher sees no project)
//   -> lastPath continuity on switch -> reload restore -> mobile 390 shell.
// Account B: minor student -> switcher must not render (no add-role) -> FAP-87 spot check.
// All fixtures labeled t09-*; preview OTP '000000' is simulated, never email delivery.
const OUT = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-round2-workspaces.json'
const SHOTS = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-shots-r2'
const BASE = 'http://127.0.0.1:5174'
const ts = Date.now()
fs.mkdirSync(SHOTS, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const results = { base: BASE, ts: new Date().toISOString(), accounts: {} }
const save = () => fs.writeFileSync(OUT, JSON.stringify(results, null, 2))

const snap = (page) => page.evaluate(() => ({
  url: location.pathname + location.search,
  h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim())[0] ?? null,
  main: (document.querySelector('main')?.innerText || document.body.innerText).slice(0, 300).replace(/\n+/g, ' | '),
}))

async function register(page, log, email, ageBand, roleCard) {
  await page.goto(BASE + '/register', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(2200)
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
  await page.waitForTimeout(1500)
  log('registered', { url: page.url() })

  await page.getByRole('button', { name: roleCard }).first().click()
  await page.locator('button[type="submit"]').last().click() // Continue
  await page.waitForTimeout(800)
  await page.locator('input[type="text"]').first().fill(`T09 Round2 fixture (${ageBand})`)
  const ageSel = page.locator('select').first()
  const opts = await ageSel.locator('option').evaluateAll(os => os.map(o => ({ v: o.value, t: o.textContent })))
  // option VALUES are 'adult'/'minor'; visible text is '18 or older'/'Under 18'
  if (!opts.some(o => o.v === ageBand)) throw new Error(`age option ${ageBand} not found: ` + JSON.stringify(opts))
  await ageSel.selectOption(ageBand)
  log('age-selected', { wanted: ageBand, options: opts })
  await page.locator('button[type="submit"]').last().click() // Continue
  await page.waitForTimeout(800)
  // advance generic steps until review; learning-goal cards gate Continue
  for (let step = 0; step < 10; step++) {
    const s = await snap(page)
    if (/dashboard/.test(s.url)) { log('onboarded', s); return }
    const start = page.getByRole('button', { name: 'Start using Visionary' })
    if (await start.count()) { await start.first().click(); await page.waitForURL('**/dashboard/**', { timeout: 25000 }); await page.waitForTimeout(2500); log('onboarded', await snap(page)); return }
    const card = page.getByRole('button', { name: 'Exam preparation' }).first()
    const cardName = 'Exam preparation'
    const hasCard = await card.count() > 0
    if (hasCard) { await card.click(); await page.waitForTimeout(500) }
    else {
      const school = page.getByRole('button', { name: /^School/ }).first()
      if (await school.count()) { await school.click(); await page.waitForTimeout(500) }
    }
    const sel = page.locator('main select').first()
    if (await sel.count()) { await sel.selectOption({ index: 1 }) }
    const submit = page.locator('button[type="submit"]').last()
    if (await submit.isEnabled()) {
      await submit.click()
    } else if (!hasCard) {
      log(`wizard-step-${step}-stuck`, await snap(page))
    }
    await page.waitForTimeout(800)
    log(`wizard-step-${step}`, await snap(page))
  }
  log('onboard-LOOP-EXIT', await snap(page))
}

async function switcherOptions(page) {
  return page.locator('select[aria-label="Active workspace"]').locator('option')
    .evaluateAll(os => os.map(o => ({ v: o.value, t: o.textContent.trim() })))
}

// ---------------- Account A: adult student -> adds teacher role ----------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 200)))
  const bad = []
  page.on('response', r => { if (r.status() >= 400) bad.push({ status: r.status(), url: r.url().slice(0, 160) }) })
  const email = `t09-r2-adult-${ts}@visionary.test`
  const data = { email, steps: [] }
  const log = (step, info) => { data.steps.push({ step, ...info }); console.log(`A/${step}: ` + JSON.stringify(info).slice(0, 400)); save() }
  results.accounts.adult = data
  try {
    await register(page, log, email, 'adult', 'I am a Learner')

    // seed a student project (ArtifactStudio: "New project" creates an instant draft + editor, no dialog)
    await page.goto(BASE + '/dashboard/build', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1800)
    await page.getByRole('button', { name: 'New project' }).first().click()
    await page.waitForTimeout(1200)
    await page.locator('input[aria-label="Project title"]').fill(`T09 R2 Student Project ${ts}`)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await page.waitForTimeout(1500)
    data.seed = await snap(page)
    log('student-project-saved', { url: data.seed.url, main: data.seed.main.slice(0, 160) })
    // confirm it appears in the list view
    await page.goto(BASE + '/dashboard/build', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1800)
    data.seedList = await snap(page)
    data.seedList.hasProject = data.seedList.main.includes(`T09 R2 Student Project ${ts}`)
    log('student-project-listed', { main: data.seedList.main.slice(0, 200), hasProject: data.seedList.hasProject })

    data.switcherBefore = await switcherOptions(page)
    log('switcher-before', { options: data.switcherBefore })

    // add teacher role
    await page.locator('select[aria-label="Active workspace"]').selectOption({ value: 'add' })
    await page.waitForTimeout(900)
    await page.locator('[role="dialog"] select[aria-label="Role"]').selectOption('teacher')
    const adultBox = page.locator('[role="dialog"] input[type="checkbox"]')
    data.adultCheckboxShown = (await adultBox.count()) > 0
    if (data.adultCheckboxShown) await adultBox.check()
    await page.getByRole('button', { name: 'Add role' }).click()
    await page.waitForTimeout(2000)
    data.afterAddRole = await snap(page)
    log('added-teacher-role', { ...data.afterAddRole, adultCheckboxShown: data.adultCheckboxShown })

    // teacher: create a class
    await page.goto(BASE + '/dashboard/classes', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1800)
    data.teacherClassesEmpty = await snap(page)
    log('teacher-classes-empty', { main: data.teacherClassesEmpty.main.slice(0, 200) })
    await page.getByRole('button', { name: 'Create your first class' }).click()
    await page.waitForTimeout(900)
    await page.locator('[role="dialog"] input').first().fill(`T09 R2 Class ${ts}`)
    await page.locator('[role="dialog"] button[type="submit"]').last().click()
    await page.waitForTimeout(2000)
    data.afterCreate = await snap(page)
    log('class-created', { main: data.afterCreate.main.slice(0, 200) })
    // open the class detail so lastPath records a deep page
    const card = page.locator('a[href*="/dashboard/classes/"]').first()
    if (await card.count()) {
      await card.click(); await page.waitForTimeout(2000)
    } else {
      log('no-class-link', { note: 'no a[href*=classes] found; clicking card instead' })
      await page.locator('.v-project-card, [class*="class-card"]').first().click().catch(() => {})
      await page.waitForTimeout(2000)
    }
    data.classDetail = await snap(page)
    log('class-detail', data.classDetail)

    data.lastPathBefore = await page.evaluate(() => {
      const db = JSON.parse(localStorage.getItem('visionary_workspace_v2') || 'null')
      return db?.workspaces?.map(w => ({ id: w.id, role: w.role, lastPath: w.lastPath })) ?? null
    })
    log('lastPath-before-switch', { workspaces: data.lastPathBefore })

    // switch back to the student workspace
    data.switcherAfter = await switcherOptions(page)
    const studentOpt = data.switcherAfter.find(o => /learner/i.test(o.t))
    await page.locator('select[aria-label="Active workspace"]').selectOption({ value: studentOpt.v })
    await page.waitForTimeout(2000)
    data.backToStudent = await snap(page)
    log('switched-to-student', data.backToStudent)

    // isolation: student workspace must not show the teacher class
    await page.goto(BASE + '/dashboard/classes', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1800)
    data.studentClasses = await snap(page)
    const clsName = `T09 R2 Class ${ts}`
    data.studentClasses.leakClass = data.studentClasses.main.includes(clsName)
    log('student-classes', { main: data.studentClasses.main.slice(0, 200), LEAK_CLASS: data.studentClasses.leakClass })
    await page.screenshot({ path: `${SHOTS}/r2-student-classes-1440.png` })

    // student project still present in student workspace
    await page.goto(BASE + '/dashboard/build', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1800)
    data.studentBuild = await snap(page)
    data.studentBuild.hasProject = data.studentBuild.main.includes(`T09 R2 Student Project ${ts}`)
    log('student-build', { main: data.studentBuild.main.slice(0, 200), hasProject: data.studentBuild.hasProject })

    // switch back to teacher: expect lastPath restore to the class detail page
    const teacherOpt = data.switcherAfter.find(o => /teacher/i.test(o.t))
    await page.locator('select[aria-label="Active workspace"]').selectOption({ value: teacherOpt.v })
    await page.waitForTimeout(2000)
    data.backToTeacher = await snap(page)
    const expectedLast = data.lastPathBefore?.find(w => w.role === 'teacher')?.lastPath
    data.backToTeacher.lastPathRestored = expectedLast
      ? data.backToTeacher.url.startsWith(expectedLast.split('?')[0])
      : null
    log('switched-to-teacher', data.backToTeacher)
    await page.screenshot({ path: `${SHOTS}/r2-teacher-restore-1440.png` })

    // isolation: teacher workspace must not show the student project
    await page.goto(BASE + '/dashboard/build', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1800)
    data.teacherBuild = await snap(page)
    data.teacherBuild.leakProject = data.teacherBuild.main.includes(`T09 R2 Student Project ${ts}`)
    log('teacher-build', { main: data.teacherBuild.main.slice(0, 200), LEAK_PROJECT: data.teacherBuild.leakProject })

    // reload restore: still teacher workspace, still signed in
    await page.reload({ waitUntil: 'load' })
    await page.waitForTimeout(2500)
    data.afterReload = await snap(page)
    data.afterReload.switcher = await switcherOptions(page)
    log('after-reload', { ...data.afterReload, main: data.afterReload.main.slice(0, 200) })

    // mobile 390 shell
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BASE + '/dashboard/classes', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1800)
    data.mobile = await page.evaluate(() => {
      const headerButtons = [...document.querySelectorAll('header button, header [role="button"]')].map(b => b.getAttribute('aria-label') || b.textContent.trim()).filter(Boolean).slice(0, 10)
      return { ...{ url: location.pathname }, scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, headerButtons, h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim())[0] ?? null }
    })
    log('mobile-classes', data.mobile)
    await page.screenshot({ path: `${SHOTS}/r2-mobile-classes-390.png`, fullPage: false })
    const menuBtn = page.locator('header button[aria-label*="menu" i]').first()
    if (await menuBtn.count()) {
      await menuBtn.click(); await page.waitForTimeout(900)
      data.mobileDrawer = await page.evaluate(() => {
        const links = [...document.querySelectorAll('a[href^="/dashboard"]')]
        return { dashboardLinks: links.length, anyVisible: links.some(a => a.offsetParent !== null) }
      })
      log('mobile-drawer', data.mobileDrawer)
      await page.screenshot({ path: `${SHOTS}/r2-mobile-drawer-390.png` })
    }
    await page.setViewportSize({ width: 1440, height: 900 })

    // raw storage evidence: entity rows + workspace stamping
    data.storage = await page.evaluate(() => {
      const out = {}
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (!k.startsWith('visionary_entity_')) continue
        let rows = []
        try { rows = JSON.parse(localStorage.getItem(k) || '[]') } catch { rows = ['PARSE-ERROR'] }
        out[k] = rows.map(r => ({ id: r?.id, owner: r?.owner_email || r?.student_email || null, ws: r?.workspace_id || null, name: r?.name || r?.title || r?.question || null }))
      }
      return out
    })
    log('storage-dump', { entities: Object.fromEntries(Object.entries(data.storage).map(([k, v]) => [k, v.length])) })
  } catch (e) {
    log('ERROR', { message: String(e).slice(0, 300), url: page.url() })
  }
  data.consoleErrors = errs
  data.badResponses = bad
  await ctx.close()
}

// ---------------- Account B: minor student ----------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 200)))
  const bad = []
  page.on('response', r => { if (r.status() >= 400) bad.push({ status: r.status(), url: r.url().slice(0, 160) }) })
  const email = `t09-r2-minor-${ts}@visionary.test`
  const data = { email, steps: [] }
  const log = (step, info) => { data.steps.push({ step, ...info }); console.log(`B/${step}: ` + JSON.stringify(info).slice(0, 400)); save() }
  results.accounts.minor = data
  try {
    await register(page, log, email, 'minor', 'I am a Learner')
    data.switcherCount = await page.locator('select[aria-label="Active workspace"]').count()
    if (data.switcherCount > 0) data.switcherOptions = await switcherOptions(page)
    log('minor-switcher-check', { switcherCount: data.switcherCount, options: data.switcherOptions ?? 'n/a (not rendered)' })

    // FAP-87 spot check on the minor: restricted deep link keeps URL + explains
    await page.goto(BASE + '/dashboard/prepare', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1600)
    data.minorPrepare = await snap(page)
    log('minor-prepare', { ...data.minorPrepare, main: data.minorPrepare.main.slice(0, 220) })
    await page.screenshot({ path: `${SHOTS}/r2-minor-prepare-1440.png` })
  } catch (e) {
    log('ERROR', { message: String(e).slice(0, 300), url: page.url() })
  }
  data.consoleErrors = errs
  data.badResponses = bad
  await ctx.close()
}

await browser.close()
save()
console.log('WROTE ' + OUT)
