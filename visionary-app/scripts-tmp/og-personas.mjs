import { chromium } from "playwright-core";
import { writeFileSync } from "fs";

/* Wave L6 — per-persona OG share cards (1200×630). Taglines by 02-copy, ≤60 chars. */
const CARDS = [
  { file: "og-image.png", badge: "Visionary", title: "Learn, ask, practice, and build.", sub: "One intelligence that helps anyone learn, teach, support, and build." },
  { file: "og-student.png", badge: "Visionary for students", title: "Understand deeply. Build real things.", sub: "Every concept you understand becomes the foundation for the next one." },
  { file: "og-teacher.png", badge: "Visionary for teachers", title: "Visionary assists. You stay in control.", sub: "Prepare lessons, assign practice, and see evidence-backed insights." },
  { file: "og-parent.png", badge: "Visionary for parents", title: "Know how to help, each week.", sub: "Plain-language summaries of your child's learning — and how to support it." },
  { file: "og-professional.png", badge: "Visionary for professionals", title: "Turn what you learn into work that ships.", sub: "Skills, projects, and evidence that compound across your career." },
  { file: "og-organization.png", badge: "Visionary for organizations", title: "One workspace for every learner.", sub: "Classes, cohorts, insights, and safety controls your people can trust." },
];

const html = (c) => `<!doctype html><html><head><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden;
    background: linear-gradient(135deg, #ffffff 0%, #E9EFFA 62%, #D2E3FC 100%);
    font-family: "Google Sans", "Segoe UI", system-ui, sans-serif;
    display: flex; align-items: center; justify-content: space-between; padding: 0 90px; }
  .left { flex-shrink: 0; max-width: 660px; }
  .badge { display: inline-block; margin-bottom: 26px; padding: 8px 22px; border-radius: 999px;
    border: 1px solid #dadce0; background: #fff; color: #1a73e8; font-size: 21px; }
  h1 { font-size: 76px; font-weight: 500; color: #121317; letter-spacing: -0.02em; line-height: 1.08; }
  p { margin-top: 20px; font-size: 27px; color: #5f6368; line-height: 1.5; }
  .circle { flex-shrink: 0; width: 320px; height: 320px; border-radius: 50%; background: #4285F4;
    display: flex; align-items: center; justify-content: center; box-shadow: 0 24px 70px rgba(66,133,244,.35); }
  .circle span { color: #fff; font-size: 140px; font-weight: 500; }
</style></head><body>
  <div class="left">
    <div class="badge">${c.badge}</div>
    <h1>${c.title}</h1>
    <p>${c.sub}</p>
  </div>
  <div class="circle"><span>V</span></div>
</body></html>`;

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const c of CARDS) {
  await page.setContent(html(c), { waitUntil: "load" });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "public/" + c.file });
  console.log(c.file, "written");
}
await browser.close();
