#!/usr/bin/env node
/* FAP-65 icon-weight consolidation: the one icon family (lucide/Feather
 * geometry) carries one UI-glyph weight (1.8). The 1.7/1.75 call sites were
 * accidental near-duplicates (<3% off, visually identical) — they join 1.8
 * so the family voices exactly its sanctioned idioms:
 *   1.8 UI glyphs · ~1.5 display glyphs · 2.4-3 check-in-disc. */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [
  'src/components/dashboard/DashboardSidebar.jsx',
  'src/pages/Landing.jsx',
  'src/pages/dashboard/DecisionHome.jsx',
  'src/pages/dashboard/LearningWorkspace.jsx',
  'src/pages/landing/CookiesPage.jsx',
  'src/pages/landing/SecurityPage.jsx',
  'src/components/landing/persona/premium/PremiumTrustSection.jsx',
  'src/components/landing/persona/sections/JourneyModal.jsx',
  'src/components/landing/persona/sections/TrustCard.jsx',
  'src/pages/landing/AccessibilityPage.jsx',
  'src/pages/landing/PrivacyPage.jsx',
  'src/pages/landing/TermsPage.jsx',
];
let total = 0;
for (const rel of files) {
  const f = path.join(root, rel);
  let t = fs.readFileSync(f, 'utf8');
  const before = (t.match(/strokeWidth=\{1\.7\}|strokeWidth=\{1\.75\}/g) || []).length;
  t = t.replaceAll('strokeWidth={1.75}', 'strokeWidth={1.8}').replaceAll('strokeWidth={1.7}', 'strokeWidth={1.8}');
  fs.writeFileSync(f, t);
  total += before;
  console.log(rel, before);
}
console.log('total replaced:', total);
