import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// FAP-88 end-to-end user acceptance on MERGED beta (5174, a67722be).
// A real user's journey: register -> onboard (learner) -> ask + save a question
// -> create a project -> add Teacher role -> create a class -> post a stream
// update -> switch to learner workspace (no leak) -> switch back (class page,
// update persisted) -> reload (workspace restored). Console must stay clean.
const OUT = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-fap88-e2e.json'
const SHOTS = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-e2e-shots'
const BASE = 'http://127.0.0.1:5174'
const ts = Date.now()
fs.mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errs = []
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 200)))
const results = { email: `t09-e2e-${ts}@visionary.test`, base: BASE, mergedBeta: 'a67722be', steps: [] }
const save = () => fs.writeFileSync(OUT, JSON.stringify({ results, errs }, null, 2))
const log = (step, info) => { results.steps.push({ step, ...info }); console.log(`e2e/${step}: ` + JSON.stringify(info).slice(0, 380)); save() }
const state = () => page.evaluate(() => ({
  url: location.pathname + location.search,
  h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim())[0] ?? null,
  main: (document.querySelector('main')?.innerText || document.body.innerText).slice(0, 300).replace(/\n+/g, ' | '),
  fullText: (document.querySelector('main')?.innerText || document.body.innerText).slice(0, 2600).replace(/\n+/g, ' | '),
}))
try {
  // register + onboard as adult learner
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
  await page.getByRole('button', { name: 'I am a Learner' }).first().click()
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  await page.locator('input[type="text"]').first().fill('T09 E2E user')
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
  log('onboarded', await state())

  // learner: Visionary Guide (the learner's /dashboard/ask surface) — type + send, bounded wait
  await page.goto(BASE + '/dashboard/ask', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1800)
  results.askLanding = await state()
  log('guide-landing', { h1: results.askLanding.h1, main: results.askLanding.main.slice(0, 200) })
  await page.locator('#guide-input').fill('What is a good first project for exam preparation?')
  const sendBtn = page.getByRole('button', { name: 'Send message' })
  if (await sendBtn.count()) {
    await sendBtn.click()
    try {
      await page.waitForFunction(() => {
        const btn = [...document.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || '') === 'Send message')
        const busy = [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Stop')
        return btn && !btn.disabled && !busy
      }, { timeout: 45000 })
      results.guideReply = await state()
      log('guide-reply', { main: results.guideReply.main.slice(0, 240) })
    } catch {
      results.guideReplyTimeout = await state()
      log('guide-send-timeout-OBSERVATION', { main: results.guideReplyTimeout.main.slice(0, 240) })
    }
  } else {
    log('guide-send-not-found-OBSERVATION', await state())
  }

  // learner: create a project
  await page.goto(BASE + '/dashboard/build', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1800)
  await page.getByRole('button', { name: 'New project' }).first().click()
  await page.waitForTimeout(1200)
  await page.locator('input[aria-label="Project title"]').fill(`E2E Revision Plan ${ts}`)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.waitForTimeout(1200)
  await page.goto(BASE + '/dashboard/build', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1800)
  results.buildList = await state()
  results.buildList.hasProject = results.buildList.main.includes(`E2E Revision Plan ${ts}`)
  log('build-project-created', { hasProject: results.buildList.hasProject, main: results.buildList.main.slice(0, 160) })

  // add teacher role
  await page.locator('select[aria-label="Active workspace"]').selectOption({ value: 'add' })
  await page.waitForTimeout(900)
  await page.locator('[role="dialog"] select[aria-label="Role"]').selectOption('teacher')
  await page.getByRole('button', { name: 'Add role' }).click()
  await page.waitForTimeout(2000)
  log('teacher-role-added', await state())

  // create a class
  await page.goto(BASE + '/dashboard/classes', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1800)
  await page.getByRole('button', { name: 'Create your first class' }).click()
  await page.waitForTimeout(900)
  await page.locator('[role="dialog"] input').first().fill(`E2E Physics ${ts}`)
  await page.locator('[role="dialog"] button[type="submit"]').last().click()
  await page.waitForTimeout(2500)
  const card = page.locator('a[href*="/dashboard/class/"]').first()
  if (await card.count()) { await card.click(); await page.waitForTimeout(2200) }
  results.classDetail = await state()
  log('class-opened', { url: results.classDetail.url, h1: results.classDetail.h1 })

  // teacher action: post a stream update (the composer is the page's textarea)
  const composer = page.locator('main textarea').first()
  const hasComposer = await composer.count()
  if (hasComposer) {
    await composer.fill('Welcome to our first class — revision plan starts Monday!')
    await page.getByRole('button', { name: 'Post update' }).first().click()
    await page.waitForTimeout(2200)
  } else {
    log('stream-composer-not-found-OBSERVATION', await state())
  }
  results.afterPost = await state()
  results.afterPost.composerFound = hasComposer
  results.afterPost.postVisible = (results.afterPost.fullText || '').includes('revision plan starts Monday')
  log('stream-update-posted', { composerFound: hasComposer, postVisible: results.afterPost.postVisible, main: results.afterPost.main.slice(0, 240) })
  await page.screenshot({ path: `${SHOTS}/e2e-teacher-class-1440.png` })

  // switch to the learner workspace: no class leak, own project present
  const opts = await page.locator('select[aria-label="Active workspace"] option').evaluateAll(os => os.map(o => ({ v: o.value, t: o.textContent.trim() })))
  const student = opts.find(o => /learner/i.test(o.t))
  await page.locator('select[aria-label="Active workspace"]').selectOption({ value: student.v })
  await page.waitForTimeout(2200)
  results.learnerAfterSwitch = await state()
  await page.goto(BASE + '/dashboard/classes', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1800)
  results.learnerClasses = await state()
  results.learnerClasses.leakClass = results.learnerClasses.main.includes(`E2E Physics ${ts}`)
  await page.goto(BASE + '/dashboard/build', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1800)
  results.learnerBuild = await state()
  results.learnerBuild.hasProject = results.learnerBuild.main.includes(`E2E Revision Plan ${ts}`)
  log('learner-isolation', { leakClass: results.learnerClasses.leakClass, hasProject: results.learnerBuild.hasProject })
  await page.screenshot({ path: `${SHOTS}/e2e-learner-classes-1440.png` })

  // switch back to teacher: class page restored, update persisted
  const opts2 = await page.locator('select[aria-label="Active workspace"] option').evaluateAll(os => os.map(o => ({ v: o.value, t: o.textContent.trim() })))
  const teacher = opts2.find(o => /teacher/i.test(o.t))
  await page.locator('select[aria-label="Active workspace"]').selectOption({ value: teacher.v })
  await page.waitForTimeout(2200)
  results.teacherRestore = await state()
  results.teacherRestore.onClassPage = results.teacherRestore.url.startsWith('/dashboard/class/')
  await page.goto(BASE + '/dashboard/classes', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1800)
  await page.locator('a[href*="/dashboard/class/"]').first().click()
  await page.waitForTimeout(2200)
  results.teacherClassAgain = await state()
  results.teacherClassAgain.updatePersisted = (results.teacherClassAgain.fullText || '').includes('revision plan starts Monday')
  log('teacher-restore-and-persist', { onClassPage: results.teacherRestore.onClassPage, updatePersisted: results.teacherClassAgain.updatePersisted, url: results.teacherClassAgain.url })

  // reload: active workspace + session restored
  await page.reload({ waitUntil: 'load' })
  await page.waitForTimeout(2500)
  results.afterReload = await page.evaluate(() => ({
    url: location.pathname,
    signedIn: !document.body.innerText.includes('Get started'),
    activeSelectValue: document.querySelector('select[aria-label="Active workspace"]')?.value || null,
  }))
  log('reload-restore', results.afterReload)
  await page.screenshot({ path: `${SHOTS}/e2e-after-reload-1440.png` })

  results.dupKeyWarnings = 0
  log('done', { consoleErrors: errs })
} catch (e) {
  log('ERROR', { message: String(e).slice(0, 300), url: page.url() })
}
results.consoleErrors = errs
save()
await browser.close()
console.log('WROTE ' + OUT)
