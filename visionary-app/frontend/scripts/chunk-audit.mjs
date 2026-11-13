/**
 * F10 chunk-graph probe — where did each split-out module land, and what is
 * each page class's transitive static wire set?
 * Usage: node scripts/chunk-audit.mjs   (reads dist/assets only)
 */
import { readFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = new URL("../dist/assets", import.meta.url).pathname
  .replace(/^\/([A-Za-z]:)/, "$1");
const files = readdirSync(dir).filter((f) => f.endsWith(".js"));
const size = (f) => statSync(join(dir, f)).size;
const read = (f) => readFileSync(join(dir, f), "utf8");

/* unique content marks → modules (data-section ids, class strings, icons) */
const marks = {
  chevron: "public-icon-chevron",
  struggle: "hero-fade-up accent-gradient block min-h",
  "reveal-item": "reveal-item",
  "voice-icon": "voice ways section", // placeholder replaced below if noisy
  "05-intourage": "05-intelligence",
  "07-lang": "07-language",
  "09-ach": "09-achievement",
  "10-jour": "10-journey",
  "11-trust": "11-trust",
  "12-cta": "12-cta",
  "13-explore": "13-explore",
};

for (const [k, m] of Object.entries(marks)) {
  const owners = [];
  for (const f of files) if (read(f).includes(m)) owners.push(`${f} ${size(f)}B`);
  console.log(`MARK ${k}: ${owners.length ? owners.join(" | ") : "NONE"}`);
}

/* representative chunk import graphs (transitive wire floors per page class) */
const prefixes = [
  "UpdatesPage", "TermsPage", "CommunityPage",
  "Landing-", "StudentPage", "TeacherPage",
  "PremiumIntelligenceSection", "PremiumLanguageSection",
  "PremiumAchievementSection", "PremiumJourneyFlowSection",
  "PremiumTrustSection", "PremiumCTASection", "PremiumExploreSection",
];
for (const pref of prefixes) {
  const f = files.find((x) => x.startsWith(pref));
  if (!f) { console.log(`\n${pref}: (no chunk)`); continue; }
  const t = read(f);
  const imps = [...t.matchAll(/from"\.\/([^"]+)"/g)].map((m) => m[1]);
  console.log(`\n${f} ${size(f)}B -> ${imps.length} imports`);
  for (const i of imps) console.log(`   ← ${i} ${size(i)}B`);
}
