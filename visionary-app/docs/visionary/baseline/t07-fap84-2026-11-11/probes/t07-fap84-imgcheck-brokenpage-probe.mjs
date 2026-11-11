import { chromium } from 'file:///C:/Users/Administrator/nv-worktrees/fap-84-hero-fetchpriority/visionary-app/frontend/node_modules/playwright-core/index.mjs'

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:5173/research', { waitUntil: 'load', timeout: 30000 })
await page.waitForSelector('body', { timeout: 10000 })
await page.waitForTimeout(2500)
const info = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].map((i) => ({
    src: (i.currentSrc || i.src || '').split('/').pop().slice(0, 60),
    fetchpriority: i.getAttribute('fetchpriority'),
    loading: i.getAttribute('loading'),
    complete: i.complete,
    naturalWidth: i.naturalWidth,
  }))
  return { count: imgs.length, imgs }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
