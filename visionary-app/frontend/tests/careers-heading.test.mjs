/** FAP-71 — /careers must expose exactly one h1, independent of viewport.
 *  The responsive hero composed a desktop card (`hero-desktop`, hidden < lg)
 *  and a mobile card (`hero-mobile`, hidden >= lg), each carrying its own
 *  <h1>, so the static DOM owned two level-1 sections. The law: the page's
 *  single h1 lives at the section level as an sr-only heading; the visible
 *  card titles are presentation <p aria-hidden="true"> so screen readers
 *  never hear the page title twice. Pixel parity: the unified h1 role law
 *  (apple-typography.css) retags the marked presentation title to the same
 *  44/64/80 · 600 · 1.05 · -0.015em hero profile the old <h1> rendered. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/landing/CareersPage.jsx", import.meta.url), "utf8");
const law = readFileSync(new URL("../src/styles/apple-typography.css", import.meta.url), "utf8");

test("careers page exists", () => {
  assert.ok(source.includes("export default function CareersPage"), "CareersPage default export must stay");
});

test("careers page authors exactly one h1 — the sr-only section heading", () => {
  const openings = source.match(/<h1(?=[\s>\/])/g) || [];
  assert.equal(openings.length, 1, `CareersPage must have exactly one <h1>, found ${openings.length}`);
  const h1Tag = source.slice(source.indexOf("<h1"), source.indexOf("</h1>") + 5);
  assert.match(h1Tag, /className="[^"]*sr-only/, "the single careers h1 must be the sr-only section heading");
  assert.match(h1Tag, /Build the future of learning\./, "the sr-only h1 must keep the approved page title");
});

test("hero cards keep their responsive composition but author no h1", () => {
  assert.match(source, /<HeroCard idPrefix="hero-desktop" \/>/, "desktop hero card variant preserved");
  assert.match(source, /<HeroCard idPrefix="hero-mobile" \/>/, "mobile hero card variant preserved");
  assert.doesNotMatch(source.slice(source.indexOf("function HeroCard"), source.indexOf("export default function CareersPage")), /<h1/, "hero card must not author an h1");
});

test("card titles remain visible presentation text under the h1 law profile", () => {
  const title = source.match(/<p aria-hidden="true" data-hero-law="careers" className="max-w-\[700px\][^>]*>/);
  assert.ok(title, "card title stays a styled aria-hidden <p> marked data-hero-law=\"careers\" so the visible heading is unchanged and screen readers never read the title twice");
  for (const token of ["text-[48px]", "sm:text-[64px]", "lg:text-[76px]", "leading-[1.06]", "tracking-[-0.045em]"]) {
    assert.ok(title[0].includes(token), `card title keeps the composed legacy token ${token}`);
  }
  const gradient = source.slice(source.indexOf('data-hero-law="careers"'), source.indexOf("Interested in")).indexOf('<span className="accent-gradient">future of learning.</span>');
  assert.ok(gradient > -1, "the accent-gradient child span composes the same two-tone title");
});

test("the unified h1 role law covers the marked presentation title with the identical hero profile", () => {
  const three = law.match(/main p\[data-hero-law="careers"\]/g) || [];
  assert.equal(three.length, 3, "the careers marker must appear in all three law blocks (base, sm, lg) like the legacy h1 ladder");
  const base = law.match(/main p\[data-hero-law="careers"\] \{[\s\S]*?\}/);
  assert.ok(base, "the base law block must include the careers marker");
  for (const token of ["2.75rem", "600", "1.05", "-0.015em"]) {
    assert.ok(base[0].includes(token), `the base profile retains ${token} (identical to the former h1 rendering)`);
  }
  const heroLaw = law.match(/@media \(min-width: 1280px\) \{[\s\S]*?main p\[data-hero-law="careers"\] \{ font-size: 5rem !important; \}[\s\S]*?\}/);
  assert.ok(heroLaw, "the lg step keeps 5rem/80px for the careers title");
});
