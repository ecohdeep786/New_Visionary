import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// Review-round follow-up: are the /pricing plan-card headings ("Start", "Personal",
// "Family") inside the by-design overflow-x-auto swipe rail, and is each reachable
// by horizontal scroll of that rail at 320/390 with 200% root text?
const DIR = 'C:/Users/Administrator/New_Visionary/visionary-app/docs/visionary/baseline/review-round-2026-11-12'
const OUT = DIR + '/rev-a2-pricing-rail.json'
const SHOTS = DIR + '/shots'
const BASE = 'http://127.0.0.1:5174'
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const results = {}
for (const width of [320, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: 720 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/pricing', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1600)
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await page.waitForTimeout(700)
  const m = await page.evaluate(() => {
    const rail = document.querySelector('[data-overflow]')
    if (!rail) return { rail: false }
    const info = { rail: true, scrollable: rail.scrollWidth > rail.clientWidth, scrollWidth: rail.scrollWidth, clientWidth: rail.clientWidth }
    // bring each plan heading into the rail's viewport by scrolling the rail
    info.headings = [...document.querySelectorAll('[data-overflow] h2')].map(h => {
      h.scrollIntoView({ block: 'nearest', inline: 'center' })
      const r = h.getBoundingClientRect()
      return { text: h.textContent.trim(), visible: r.right <= window.innerWidth + 1 && r.left >= -1, right: Math.round(r.right) }
    })
    rail.scrollLeft = 0
    return info
  })
  await page.screenshot({ path: `${SHOTS}/rev-fap82-rail-${width}.png` })
  results[width] = m
  console.log(`rev-a2/${width}: ` + JSON.stringify(m).slice(0, 300))
  await ctx.close()
}
fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
await browser.close()
console.log('WROTE ' + OUT)
