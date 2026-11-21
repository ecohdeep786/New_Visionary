import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync(new URL("../src/components/landing/persona/premium/PremiumExploreSection.jsx", import.meta.url), "utf8");
const landing = readFileSync(new URL("../src/pages/Landing.jsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const audiences = ["student", "teacher", "parent", "professional", "organization"];

test("FHE-01 landing audience directory is reserved for its five defined paths", () => {
  assert.match(component, /eyebrow === "Who it’s for"/);
  assert.match(component, /LANDING_AUDIENCE_SLUGS/);
  assert.match(component, /LandingAudienceDirectory categories=\{categories\} images=\{images\}/);
  assert.match(landing, /eyebrow="Who it’s for"/);
  for (const slug of audiences) {
    assert.ok(landing.includes(`slug: "${slug}"`), `landing defines ${slug}`);
    assert.ok(app.includes(`<Route path="/${slug}"`), `/${slug} has a registered destination`);
  }
});

test("landing audience cards navigate by category and show an explicit path action", () => {
  assert.match(component, /to=\{`\/\$\{category\.slug\}`\}/);
  assert.match(component, /Explore this path/);
  assert.match(component, /focus-visible:ring-2/);
  assert.match(component, /grid-cols-1[^\n]*sm:grid-cols-2[^\n]*lg:grid-cols-6[^\n]*xl:grid-cols-10/);
});

test("persona pages keep their existing swipe-gallery presentation", () => {
  assert.match(component, /<ExploreGallery/);
  assert.match(component, /Previous destinations/);
  assert.match(component, /Next destinations/);
});
