import { chromium } from "playwright-core";

/* OG cards matching the product identity (L6-IMG fix): white canvas, ink
   #121317 favicon mark + grey wordmark, Google Sans type, ink headline with a
   blue accent phrase, ink pill CTA. Blue is an accent only, never the surface. */
const V_PATH = "M49 551 c-16 -16 -29 -40 -29 -53 0 -14 42 -98 93 -187 l92 -163 6 38 c13 76 99 118 159 77 33 -22 44 -41 50 -83 5 -33 9 -28 98 128 60 105 92 172 92 192 0 34 -28 67 -66 76 -41 10 -72 -22 -149 -154 -38 -66 -72 -123 -75 -126 -4 -3 -41 55 -83 128 -95 164 -128 186 -188 127z";

const CARDS = [
  { file: "og-image.jpg", badge: "", title: ["Learn, ask, practice,", "and build."], accent: "and build.", sub: "One intelligence that helps anyone learn, teach, support, and build." },
  { file: "og-student.jpg", badge: "For students", title: ["Understand deeply.", "Build real things."], accent: "Build real things.", sub: "Every concept you understand becomes the foundation for the next one." },
  { file: "og-teacher.jpg", badge: "For teachers", title: ["Visionary assists.", "You stay in control."], accent: "You stay in control.", sub: "Prepare lessons, assign practice, and see evidence-backed insights." },
  { file: "og-parent.jpg", badge: "For parents", title: ["Know how to help,", "each week."], accent: "each week.", sub: "Plain-language summaries of your child's learning — and how to support it." },
  { file: "og-professional.jpg", badge: "For professionals", title: ["Turn what you learn into", "work that ships."], accent: "work that ships.", sub: "Skills, projects, and evidence that compound across your career." },
  { file: "og-organization.jpg", badge: "For organizations", title: ["One workspace for", "every learner."], accent: "every learner.", sub: "Classes, cohorts, insights, and safety controls your people can trust." },
];

const html = (c) => `<!doctype html><html><head><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #ffffff;
    font-family: "Google Sans", "Segoe UI", system-ui, sans-serif;
    display: flex; flex-direction: column; justify-content: space-between; padding: 68px 90px 64px; }
  .brand { display: flex; align-items: center; gap: 18px; }
  .mark { width: 62px; height: 62px; border-radius: 14px; background: #121317; display: flex; align-items: center; justify-content: center; }
  .word { font-size: 44px; font-weight: 500; letter-spacing: -0.5px; color: #121317; }
  .word span { color: #9B9B9E; }
  .badge { margin-left: auto; border: 1.5px solid #dadce0; border-radius: 999px; padding: 10px 26px; font-size: 22px; color: #5f6368; }
  h1 { font-size: 70px; font-weight: 500; letter-spacing: -0.02em; line-height: 1.12; color: #121317; }
  h1 b { color: #4285F4; font-weight: 500; }
  .sub { font-size: 26px; color: #5f6368; line-height: 1.5; max-width: 920px; margin-top: 24px; }
  .cta { display: inline-flex; align-items: center; gap: 12px; background: #121317; color: #ffffff;
    border-radius: 999px; padding: 15px 34px; font-size: 22px; font-weight: 500; width: fit-content; }
  .cta svg { width: 20px; height: 20px; }
</style></head><body>
  <div class="brand">
    <div class="mark">
      <svg width="36" height="36" viewBox="1.5 6 60 44"><g transform="translate(0,64) scale(0.1,-0.1)" fill="#ffffff"><path d="${V_PATH}"/></g></svg>
    </div>
    <div class="word">V<span>isionary</span></div>
    ${c.badge ? `<div class="badge">${c.badge}</div>` : ""}
  </div>
  <div>
    <h1>${c.title[0]}<br><b>${c.accent}</b></h1>
    <p class="sub">${c.sub}</p>
  </div>
  <div class="cta">Start learning free
    <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
  </div>
</body></html>`;

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const c of CARDS) {
  await page.setContent(html(c), { waitUntil: "load" });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "public/" + c.file, type: "jpeg", quality: 90 });
  console.log(c.file, "rendered");
}
await browser.close();
