import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise((r) => setTimeout(r, 2000));

const snap = async () => page.evaluate(() => {
  const panels = [...document.querySelectorAll('[data-section="04-meet"] [data-step]')];
  const visible = panels.filter((p) => !p.hasAttribute("hidden"));
  const activeIdx = panels.findIndex((p) => p.getAttribute("aria-hidden") === "false");
  const chips = [...document.querySelectorAll('[data-section="04-meet"] [role="tab"]')];
  const activeChip = chips.find((c) => c.getAttribute("aria-selected") === "true")?.textContent || "?";
  return { visCount: visible.length, activeIdx, activeChip, total: panels.length };
});

const steps = ["Student", "Teacher", "Parent", "Professional", "Organization"];
const out = [];
out.push({ action: "initial", snap: await snap() });
for (const label of steps) {
  const idx = steps.indexOf(label);
  await page.evaluate((i) => {
    document.querySelector('[data-section="04-meet"] [role="tablist"]').children[i].click();
  }, idx);
  await new Promise((r) => setTimeout(r, 700));
  out.push({ action: `click ${label} (idx ${idx})`, snap: await snap() });
}
// also test: only ONE panel visible
const onlyOne = await page.evaluate(() =>
  [...document.querySelectorAll('[data-section="04-meet"] [data-step]')]
    .filter((p) => !p.hasAttribute("hidden")).length === 1
);
out.push({ action: "only-one-visible", onlyOne });
console.log(JSON.stringify(out, null, 2));
await browser.close();
