import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR " + String(e).slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.type() + ": " + m.text().slice(0, 200)); });

await page.goto("http://localhost:4173/", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
await page.waitForTimeout(4000);
errors.length = 0; // ignore warmup noise

await page.evaluate(() => {
  const a = [...document.querySelectorAll("a")].find((x) => x.getAttribute("href") === "/careers");
  a.click();
});
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(300);
  const state = await page.evaluate(() => ({
    path: location.pathname,
    h1: Boolean(document.querySelector("h1")),
    root: document.getElementById("root")?.children.length || 0,
    body: document.body.innerText.slice(0, 60).replace(/\n/g, " | "),
  }));
  console.log((i + 1) * 300 + "ms", JSON.stringify(state));
}
console.log("errors:", errors.length ? errors.slice(0, 8) : "none");
await browser.close();
