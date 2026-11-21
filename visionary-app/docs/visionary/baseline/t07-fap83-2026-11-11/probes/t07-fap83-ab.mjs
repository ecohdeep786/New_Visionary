import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

const AFTER = 'http://127.0.0.1:5173'
const BEFORE = 'http://127.0.0.1:5174'
const OUT = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t07-fap83-ab.json'
const ROUTES = ['/student', '/teacher', '/parent', '/professional', '/organization']

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })

async function probe(base) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const warns = []
  page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') warns.push(m.text().slice(0, 120)) })
  const out = []
  for (const route of ROUTES) {
    await page.goto(base + route, { waitUntil: 'load', timeout: 30000 })
    await page.waitForSelector('body', { timeout: 10000 })
    await page.waitForTimeout(700)
    const data = await page.evaluate(() => {
      const sec = document.querySelector('[data-section="07-language"]')
      if (!sec) return { found: false }
      const chips = [...sec.querySelectorAll('button[aria-label^="Show"]')].map(b => b.getAttribute('aria-label'))
      const eyebrow = sec.querySelector('p') ? sec.querySelector('p').textContent.trim() : null
      const h2 = sec.querySelector('h2') ? sec.querySelector('h2').textContent.replace(/\s+/g, ' ').trim() : null
      const legend = [...sec.querySelectorAll('p')].map(p => p.textContent.trim()).filter(t => /Listening|roadmap|voice or text/.test(t))
      const dots = sec.querySelectorAll('button[aria-label^="Show"]').length
      return { found: true, chips, chipCount: dots, eyebrow, h2, legend }
    })
    out.push({ route, ...data, warnings: warns.length })
  }
  await ctx.close()
  return out
}

const before = await probe(BEFORE)
const after = await probe(AFTER)
await browser.close()
fs.writeFileSync(OUT, JSON.stringify({ before, after }, null, 2))

for (let i = 0; i < ROUTES.length; i++) {
  const b = before[i], a = after[i]
  console.log(`=== ${ROUTES[i]}`)
  console.log(`  BEFORE chips=${b.chipCount} [${b.chips ? b.chips.map(c => c.replace('Show ', '')).join(',') : '-'}] eyebrow=${JSON.stringify(b.eyebrow)}`)
  console.log(`          h2=${JSON.stringify(b.h2)} legend=${JSON.stringify(b.legend)}`)
  console.log(`  AFTER  chips=${a.chipCount} [${a.chips ? a.chips.map(c => c.replace('Show ', '')).join(',') : '-'}] eyebrow=${JSON.stringify(a.eyebrow)}`)
  console.log(`          h2=${JSON.stringify(a.h2)} legend=${JSON.stringify(a.legend)} warns=${a.warnings}`)
}
console.log('WROTE ' + OUT)
