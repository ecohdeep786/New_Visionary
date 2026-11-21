import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

const BASE = 'http://127.0.0.1:5174'
const OUT = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t07-final-bands.json'
const ROUTES = ['/', '/student', '/teacher', '/parent', '/professional', '/organization',
  '/how-it-works', '/about', '/careers', '/research', '/community', '/contact',
  '/partners', '/updates', '/download', '/pricing']

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

const results = []
for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'load', timeout: 30000 })
  await page.waitForSelector('body', { timeout: 10000 })
  await page.waitForTimeout(500)
  const data = await page.evaluate(() => {
    const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '')
    const footer = document.querySelector('footer')
    // collect sections; pick the last one fully above the footer
    const secs = [...document.querySelectorAll('section')].filter(s => !footer || (s.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING))
    const last = secs[secs.length - 1]
    if (!last) return { band: null }
    const links = [...last.querySelectorAll('a[href]')].map(a => ({ text: text(a).slice(0, 50), href: a.getAttribute('href') }))
    const heads = [...last.querySelectorAll('h2, h3')].map(h => text(h).slice(0, 90))
    const paras = [...last.querySelectorAll('p')].map(p => text(p).slice(0, 130)).slice(0, 3)
    return { band: { h2s: heads, paras, links }, secCount: secs.length }
  })
  results.push({ route, ...data })
  console.log(`${route}: final band h2=${(data.band && data.band.h2s[0]) || '(none)'}`)
}
await browser.close()
fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
console.log('WROTE ' + OUT)
