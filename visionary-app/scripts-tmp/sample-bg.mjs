import { chromium } from "playwright-core";

/* Sample the background color of each hero image at its edges (canvas pixel read). */
const IMAGES = ["student-hero-main", "teacher-hero-main", "parent-hero-main", "pro-face-main", "org-face-main", "student-face-main", "organization-face-main"];
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const page = await browser.newPage();
for (const name of IMAGES) {
  const out = await page.evaluate(async (name) => {
    const img = new Image();
    img.src = "file:///" + location.href.replace("file:///", "").split("visionary-app")[0] + "visionary-app/src/assets/" + name + ".webp";
    await img.decode();
    const c = document.createElement("canvas");
    const S = 256;
    c.width = S; c.height = S;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, S, S);
    const px = (x, y) => {
      const d = ctx.getImageData(x, y, 1, 1).data;
      return "#" + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
    };
    return {
      topLeft: px(3, 3), topRight: px(S - 4, 3), topMid: px(S / 2, 3),
      midLeft: px(3, S / 2), midRight: px(S - 4, S / 2),
      botLeft: px(3, S - 4), botRight: px(S - 4, S - 4),
    };
  }, name).catch((e) => "ERR " + String(e).slice(0, 60));
  console.log(name, JSON.stringify(out));
}
await browser.close();
