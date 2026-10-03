/* Quick computed-style check of the Apple pass. Run: node scripts-tmp/apple-pass-check.mjs */
import puppeteer from "puppeteer";

const b = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e).slice(0, 120)));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 120)); });
await p.goto("http://localhost:5175/student", { waitUntil: "networkidle2", timeout: 60000 });
await p.evaluate(() => document.fonts?.ready);
await new Promise((r) => setTimeout(r, 1800));
await p.screenshot({ path: "scripts-tmp/apple-pass/check-hero.png" });

const probe = await p.evaluate(() => {
  const h2 = document.querySelector("main section:nth-of-type(3) h2, main h2");
  const cs = h2 ? getComputedStyle(h2) : null;
  const eb = document.querySelector("main p.uppercase");
  const ebcs = eb ? getComputedStyle(eb) : null;
  const lead = document.querySelector('main p[class*="17.5px"]');
  const leadcs = lead ? getComputedStyle(lead) : null;
  return {
    h2: cs ? { size: cs.fontSize, weight: cs.fontWeight, ls: cs.letterSpacing, lh: cs.lineHeight } : null,
    eyebrow: ebcs ? { size: ebcs.fontSize, weight: ebcs.fontWeight, transform: ebcs.textTransform, text: (eb.innerText || "").slice(0, 40) } : "none",
    lead: leadcs ? { size: leadcs.fontSize, color: leadcs.color, text: (lead.innerText || "").slice(0, 40) } : "none",
  };
});
console.log(JSON.stringify(probe, null, 2));
console.log("ERRORS:", errs.slice(0, 3));
await b.close();
