/** FAP-82 — the display type ladder must survive text-scale changes on phones.
 *
 *  Defect at beta 35b77791: the phone (<=734px) and tablet (<=1068px) ladders
 *  set display-scale tokens as fixed rem values (--fs-display 2.5rem/3.5rem,
 *  --fs-h2, --fs-product-section, --fs-hero-headline, --fs-category-statement).
 *  At 200% root text those values double while the viewport stays 320-430px,
 *  so the /pricing FAQ h2 computed at 80px — its longest word alone needed
 *  396px — and the FAQ grid track (min-width: auto) expanded past the
 *  viewport. The page clips overflow instead of scrolling, so every FAQ
 *  question row and its disclosure chevron was cut off: content and
 *  functionality lost at 200% text (WCAG 1.4.4; Apple HIG Layout: adapt to
 *  text-size changes).
 *
 *  The law (rhythm.css + apple-typography.css): every display-scale token in
 *  the phone/tablet ladder carries a viewport cap min(<rem step>, <vw>) —
 *  including --fs-hero-eyebrow (the home hero's "One intelligence" prefix
 *  line) and the unified h1 role law's hardcoded 44/64/80 steps. The vw side
 *  is chosen ABOVE the rem step at every supported width (>=320px phone,
 *  >=735px tablet), so default text renders pixel-identical; under text
 *  scaling the cap keeps the largest display word inside the viewport. The
 *  pricing FAQ grid track fails closed with an explicit minmax(0,1fr) base
 *  column, and the billing toggle's phone padding is viewport-aware
 *  (min(1rem,5vw)).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const rhythm = readFileSync(join(root, "src/styles/rhythm.css"), "utf8");
const appleTypography = readFileSync(join(root, "src/styles/apple-typography.css"), "utf8");
const pricingPage = readFileSync(join(root, "src/pages/landing/AILearningPage.jsx"), "utf8");

/** Brace-matched body of each `@media (max-width: NNNpx)` block, with a flag
 *  for whether the block scopes to :root or to the public section ladder. */
function mediaBlocks(text, maxWidth) {
  const blocks = [];
  const re = new RegExp(`@media\\s*\\(\\s*max-width:\\s*${maxWidth}px\\s*\\)\\s*\\{`, "g");
  let m;
  while ((m = re.exec(text))) {
    let depth = 0;
    for (let i = m.index + m[0].length - 1; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          const body = text.slice(m.index + m[0].length, i);
          blocks.push({ start: m.index, body, rootScope: /(^|\n)\s*:root\s*\{/.test(body), sectionScope: body.includes(":where(section") });
          break;
        }
      }
    }
  }
  return blocks;
}

function declaration(block, token) {
  const re = new RegExp(`--fs-${token}\\s*:\\s*([^;]+);`);
  const m = block.body.match(re);
  return m ? m[1].trim() : null;
}

const TABLET = 1068;
const PHONE = 734;

/** Display tokens each ladder scope must define. The :root tokens are split
 *  across two sibling media blocks at the same width (hero complements,
 *  category-hero complements), so they must be aggregated per scope. */
const REQUIRED = {
  root: ["hero-eyebrow", "hero-headline", "category-statement"],
  section: ["display", "product-section", "h2", "hero-eyebrow", "hero-headline"],
};

/** Aggregate the display tokens across every media block of a given width and
 *  scope (first declaration wins). */
function ladderValues(width, scope) {
  const tokens = new Map();
  for (const block of mediaBlocks(rhythm, width)) {
    const isTarget = scope === "root" ? block.rootScope : block.sectionScope;
    if (!isTarget) continue;
    for (const token of REQUIRED[scope]) {
      const value = declaration(block, token);
      if (value && !tokens.has(token)) tokens.set(token, value);
    }
  }
  return tokens;
}

/** min(Xrem, Yvw) must not bind at default text: X*16 <= Y*smallest supported
 *  width of the ladder (320px phone, 735px tablet). */
function capNeverBindsAtDefault(value, minSupportedWidth) {
  const m = value.match(/^min\(([\d.]+)rem,\s*([\d.]+)vw\)$/);
  if (!m) return false;
  return Number(m[1]) * 16 <= Number(m[2]) * minSupportedWidth;
}

test("the tablet ladder caps every display-scale token with a viewport min()", () => {
  for (const scope of ["root", "section"]) {
    const values = ladderValues(TABLET, scope);
    for (const token of REQUIRED[scope]) {
      const value = values.get(token);
      assert.ok(value, `tablet ladder (${scope}) must define --fs-${token}`);
      assert.match(value, /^min\([\d.]+rem,\s*[\d.]+vw\)$/, `--fs-${token} at tablet must carry the FAP-82 viewport cap, got: ${value}`);
    }
  }
});

test("the phone ladder caps every display-scale token with a viewport min()", () => {
  for (const scope of ["root", "section"]) {
    const values = ladderValues(PHONE, scope);
    for (const token of REQUIRED[scope]) {
      const value = values.get(token);
      assert.ok(value, `phone ladder (${scope}) must define --fs-${token}`);
      assert.match(value, /^min\([\d.]+rem,\s*[\d.]+vw\)$/, `--fs-${token} at phone must carry the FAP-82 viewport cap, got: ${value}`);
    }
  }
});

test("no display-scale token in the phone/tablet ladder regresses to a fixed rem value", () => {
  for (const width of [PHONE, TABLET]) {
    for (const block of mediaBlocks(rhythm, width)) {
      for (const token of ["display", "product-section", "h2", "hero-headline", "category-statement"]) {
        const value = declaration(block, token);
        if (!value) continue;
        assert.doesNotMatch(
          value,
          /^[\d.]+rem$/,
          `--fs-${token} at <=${width}px regressed to fixed rem (${value}); the FAP-82 viewport cap is required`,
        );
      }
    }
  }
});

test("the caps never bind at default text on any supported width", () => {
  for (const width of [PHONE, TABLET]) {
    const minSupported = width === PHONE ? 320 : 735;
    for (const scope of ["root", "section"]) {
      const values = ladderValues(width, scope);
      for (const [token, value] of values) {
        if (!/^min\(/.test(value)) continue;
        assert.ok(
          capNeverBindsAtDefault(value, minSupported),
          `--fs-${token} cap ${value} would change default text below ${minSupported}px (the vw side must exceed the rem step there)`,
        );
      }
    }
  }
});

test("the unified h1 role law carries the same viewport cap on every hardcoded step", () => {
  /* apple-typography.css hardcodes the hero h1 ladder (44/64/80) outside the
   * token system; before FAP-82 the steps were fixed rem, so /pricing and
   * /help h1s computed 88px at 320/200% and overflowed the viewport. */
  const steps = [
    { media: null, cap: "min(2.75rem, 14vw)", minSupported: 320 },
    { media: "min-width: 640px", cap: "min(4rem, 14vw)", minSupported: 640 },
    { media: "min-width: 1280px", cap: "min(5rem, 14vw)", minSupported: 1280 },
  ];
  for (const { media, cap, minSupported } of steps) {
    const pattern = media
      ? new RegExp(`@media\\s*\\(${media.replace(/[()]/g, "\\$&")}\\)\\s*\\{[^}]*font-size:\\s*${cap.replace(/[(),]/g, "\\$&")}\\s*!important`)
      : new RegExp(`font-size:\\s*${cap.replace(/[(),]/g, "\\$&")}\\s*!important`);
    assert.match(appleTypography, pattern, `the h1 role law step (${media ?? "base"}) must carry the FAP-82 viewport cap ${cap}`);
    const rem = Number(cap.match(/([\d.]+)rem/)[1]);
    const vw = Number(cap.match(/([\d.]+)vw/)[1]);
    assert.ok(rem * 16 <= vw * minSupported, `the ${cap} cap must never bind at default text at ${minSupported}px`);
  }
  assert.doesNotMatch(appleTypography, /font-size:\s*[\d.]+rem\s*!important/, "no hardcoded rem step may return to the h1 role law without a viewport cap");
});

test("the pricing FAQ grid track fails closed with an explicit minmax base column", () => {
  assert.match(
    pricingPage,
    /mx-auto grid max-w-\[1280px\] grid-cols-\[minmax\(0,1fr\)\] gap-10/,
    "the FAQ grid must declare a minmax(0,1fr) base track so a min-content heading can never expand it past the viewport",
  );
});

test("the billing toggle keeps its desktop padding and uses viewport-aware phone padding", () => {
  assert.match(pricingPage, /px-\[min\(1rem,5vw\)\]/, "phone padding must be min(1rem,5vw) so the toggle fits 200% text at 320px");
  assert.match(pricingPage, /sm:px-5/, "the accepted sm:px-5 desktop padding must stay");
  /* 5vw at 320px = 16px = the rem step: identical at default text, halved at
   * 200% so Monthly + Annual + chip fit the 256px content box. */
  assert.ok(1 * 16 <= 5 * 3.2, "5vw must reach 1rem at 320px so default text is unchanged");
});
