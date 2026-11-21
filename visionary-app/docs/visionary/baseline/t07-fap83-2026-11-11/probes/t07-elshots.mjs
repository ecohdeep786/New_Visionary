import { chromium } from 'file:///C:/Users/Administrator/nv-worktrees/fap-83-public-language-truth/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })

async function elShot(base, route, sel, file, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(base + route, { waitUntil: 'load', timeout: 30000 })
  await page.waitForSelector('body', { timeout: 10000 })
  await page.waitForTimeout(600)
  // scroll the section fully into view and settle before the element shot
  await page.evaluate((s) => {
    const el = document.querySelector(s)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' })
  }, sel)
  await page.waitForTimeout(1400)
  const loc = page.locator(sel).first()
  await loc.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
  await loc.screenshot({ path: file })
  await ctx.close()
  console.log('shot ' + file)
}

const SEL = '[data-section="07-language"]'
const A = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t07-after'
const B = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t07-before'

await elShot('http://127.0.0.1:5174', '/organization', SEL, `${B}/before-org-language-1440.png`, 1440)
await elShot('http://127.0.0.1:5174', '/organization', SEL, `${B}/before-org-language-390.png`, 390)
await elShot('http://127.0.0.1:5174', '/professional', SEL, `${B}/before-prof-language-1440.png`, 1440)
await elShot('http://127.0.0.1:5174', '/student', SEL, `${B}/before-student-language-1440.png`, 1440)
await elShot('http://127.0.0.1:5173', '/organization', SEL, `${A}/after-org-language-1440.png`, 1440)
await elShot('http://127.0.0.1:5173', '/organization', SEL, `${A}/after-org-language-390.png`, 390)
await elShot('http://127.0.0.1:5173', '/professional', SEL, `${A}/after-prof-language-1440.png`, 1440)
await elShot('http://127.0.0.1:5173', '/student', SEL, `${A}/after-student-language-1440.png`, 1440)

await browser.close()
console.log('DONE')
