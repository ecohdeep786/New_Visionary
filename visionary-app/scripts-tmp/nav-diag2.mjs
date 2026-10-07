import puppeteer from "puppeteer";
const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:4173/", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise(r => setTimeout(r, 1800));
await page.evaluate(() => window.scrollTo(0, 600));
await new Promise(r => setTimeout(r, 800));
const diag = await page.evaluate(() => {
  const top = document.elementFromPoint(60, 28);
  const path = [];
  let cur = top;
  while (cur && path.length < 6) {
    path.push(`${cur.tagName?.toLowerCase()}.${(cur.className || "").toString().slice(0, 60)}`);
    cur = cur.parentElement;
  }
  const header = document.querySelector("header");
  const first = header?.children[0];
  const frame = header?.children[1];
  return {
    topElementChain: path,
    firstChild: { tag: first?.tagName, cls: (first?.className || "").slice(0, 80), bg: first ? getComputedStyle(first).backgroundColor : null, z: first ? getComputedStyle(first).zIndex : null },
    secondChild: { tag: frame?.tagName, cls: (frame?.className || "").slice(0, 80) },
    premiumCssLoaded: [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => r.selectorText?.includes?.("btn-premium")); } catch { return false; } }),
    easeVar: getComputedStyle(document.documentElement).getPropertyValue("--ease-out-apple") || "(missing)",
  };
});
console.log(JSON.stringify(diag, null, 2));
await browser.close();
