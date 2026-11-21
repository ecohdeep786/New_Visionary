import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync(new URL("../src/components/landing/persona/premium/PremiumExploreSection.jsx", import.meta.url), "utf8");
const landing = readFileSync(new URL("../src/pages/Landing.jsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const nav = readFileSync(new URL("../src/components/landing/LandingNav/index.jsx", import.meta.url), "utf8");
const categoryData = readFileSync(new URL("../src/data/landingCategories.js", import.meta.url), "utf8");
const audiences = ["student", "teacher", "parent", "professional", "organization"];

test("FHE-01 landing audience directory is an explicit layout for its five defined paths", () => {
  assert.match(component, /presentation === "directory"/);
  assert.match(component, /LANDING_AUDIENCE_SLUGS/);
  assert.match(component, /LandingAudienceDirectory categories=\{categories\} images=\{images\}/);
  assert.ok(landing.includes('eyebrow="Who it\u2019s for"'));
  assert.match(landing, /presentation="directory"/);
  assert.match(landing, /sectionId="who-its-for"/);
  for (const slug of audiences) {
    assert.ok(landing.includes(`slug: "${slug}"`), `landing defines ${slug}`);
    assert.ok(app.includes(`<Route path="/${slug}"`), `/${slug} has a registered destination`);
  }
  assert.match(categoryData, /label: "Parent \/ Guardian"/);
});

test("audience cards navigate by category and show an explicit path action", () => {
  assert.match(component, /to=\{`\/\$\{category\.slug\}`\}/);
  assert.match(component, /Explore this path/);
  assert.match(component, /focus-visible:ring-2/);
  assert.match(component, /sm:grid-cols-2/);
  assert.match(component, /lg:grid-cols-6/);
  assert.match(component, /xl:grid-cols-10/);
});

test("the shared navigation offers all audience choices instead of defaulting to Student", () => {
  assert.ok(nav.includes('to={activeCategory ? activeCategory.path : "/#who-its-for"}'));
  assert.match(landing, /sectionId="who-its-for"/);
  assert.match(component, /id=\{sectionId\}/);
});

test("the landing tells the language-to-practice-to-building story without invented testimonials", () => {
  assert.match(landing, /learning in a familiar language/i);
  assert.match(landing, /Visionary brings learning, practice, and project-building together/);
  assert.match(landing, /From understanding to building/);
  assert.match(landing, /Try an idea for yourself, step by step/);
  assert.match(landing, /Use what you understand in a project or practical task/);
  assert.match(landing, /Illustrative student moment/);
  assert.match(landing, /Illustrative professional moment/);
  assert.doesNotMatch(landing, /quote:\s*"|I watched eight hours|I read every article/);
  assert.doesNotMatch(landing, /Free to start|Private by design|Secure by design/);
  assert.ok(landing.indexOf("<LandingProblemSection />") < landing.indexOf("<LandingIntelligenceSection />"));
  assert.ok(landing.indexOf("<LandingIntelligenceSection />") < landing.indexOf("<LandingRouterSection />"));
});

test("persona pages keep their existing swipe-gallery presentation", () => {
  assert.match(component, /<ExploreGallery/);
  assert.match(component, /Previous destinations/);
  assert.match(component, /Next destinations/);
});
