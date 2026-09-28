/* Verify the breath anatomy: button/arrow floats in the notch with breathing room. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/curve-shots";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5177";

const shots = [
  { file: "b-about-mission.png", path: "/about", kw: "understanding should open" },
  { file: "b-about-roles.png", path: "/about", kw: "different people. one connected" },
  { file: "b-about-explore.png", path: "/about", kw: "the work around the product" },
  { file: "b-pricing.png", path: "/pricing", kw: "every journey has a plan" },
  { file: "b-research.png", path: "/research", kw: "help us shape the future" },
  { file: "b-referral.png", path: "/referral", kw: "start from what they need" },
  { file: "b-safety.png", path: "/safety", kw: "right for your family" },
  { file: "b-privacy.png", path: "/privacy", kw: "essentials, at a glance" },
  { file: "b-security.png", path: "/security", kw: "essentials, at a glance" },
  { file: "b-community.png", path: "/community", kw: "more ways to engage" },
  { file: "b-contact.png", path: "/contact", kw: "get help learning with visionary" },
  { file: "b-download.png", path: "/download", kw: "on every device" },
  { file: "b-careers.png", path: "/careers", kw: "", top: 0 },
  { file: "b-partners.png", path: "/partners", kw: "start with the support" },
  { file: "b-updates.png", path: "/updates", kw: "one intelligence, every learner" },
];

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  for (const { file, path, kw, top = 150 } of shots) {
    await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 1700));
    const found = await page.evaluate(({ kw, top }) => {
      if (!kw) { window.scrollTo({ top }); return "top"; }
      const el = [...document.querySelectorAll("h1,h2")].find((x) => x.textContent.toLowerCase().includes(kw));
      if (!el) return false;
      const r = el.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top - top });
      return true;
    }, { kw, top });
    await new Promise((r) => setTimeout(r, 850));
    await page.screenshot({ path: `${OUT}/${file}` });
    console.log(file, found === false ? "NOT FOUND" : "ok");
  }
} finally {
  await browser.close();
}
console.log("DONE");
