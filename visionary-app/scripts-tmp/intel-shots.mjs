import puppeteer from "puppeteer";

const BASE = "http://localhost:5175";
const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});

const jobs = [
  { url: "/student", tag: "student-intel", w: 1440, h: 900 },
  { url: "/teacher", tag: "teacher-intel", w: 1440, h: 900 },
  { url: "/professional", tag: "college-intel", w: 1440, h: 900 },
  { url: "/student", tag: "student-intel-390", w: 390, h: 844 },
  { url: "/teacher", tag: "teacher-intel-390", w: 390, h: 844 },
];

for (const j of jobs) {
  const p = await browser.newPage();
  await p.setViewport({ width: j.w, height: j.h, deviceScaleFactor: 2 });
  await p.goto(BASE + j.url, { waitUntil: "networkidle2", timeout: 60000 });
  const found = await p.evaluate(() => {
    const eyebrow = Array.from(document.querySelectorAll("section p")).find(
      (el) => el.textContent.trim().toLowerCase().startsWith("the intelligence behind"),
    );
    const section = eyebrow?.closest("section");
    if (!section) return false;
    // scroll past the heading so a step visual is in frame
    const steps = section.querySelectorAll("[data-step]");
    (steps[1] || section).scrollIntoView({ behavior: "instant", block: "center" });
    return true;
  });
  await new Promise((r) => setTimeout(r, 1500));
  const overflow = await p.evaluate(() => document.scrollingElement.scrollWidth > document.documentElement.clientWidth);
  await p.screenshot({ path: `scripts-tmp/shots/landing-matrix/${j.tag}.png` });
  console.log(`${j.tag}: sectionFound=${found} overflow=${overflow}`);
  await p.close();
}

await browser.close();
