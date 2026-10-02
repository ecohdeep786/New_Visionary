/* Round-2 card fix: white cards on grey bands (Google's grey-band pattern). */
import fs from "node:fs";

const EDITS = [
  ["src/pages/landing/SchoolPage.jsx", "rounded-[24px] g-card p-10 text-center", "rounded-[24px] g-card bg-white p-10 text-center", true],
  ["src/pages/landing/ContactPage.jsx", 'className="rounded-2xl g-card p-6 sm:p-8"', 'className="rounded-2xl g-card bg-white p-6 sm:p-8"', true],
  ["src/pages/landing/PartnersPage.jsx", "flex flex-col rounded-2xl g-card p-6 sm:p-7", "flex flex-col rounded-2xl g-card bg-white p-6 sm:p-7", true],
  ["src/pages/landing/UpdatesPage.jsx", 'self-start rounded-2xl g-card p-2 sm:p-3', 'self-start rounded-2xl g-card bg-white p-2 sm:p-3', true],
  ["src/pages/landing/UpdatesPage.jsx", 'className="rounded-2xl g-card p-6 sm:p-8"', 'className="rounded-2xl g-card bg-white p-6 sm:p-8"', true],
  ["src/pages/landing/UpdatesPage.jsx", "mt-2 h-12 w-full rounded-xl g-card px-4", "mt-2 h-12 w-full rounded-xl g-card border border-[#dadce0] bg-white px-4", true],
  ["src/pages/landing/ReferralPage.jsx", "min-h-[300px] flex-col overflow-hidden rounded-2xl g-card p-6", "min-h-[300px] flex-col overflow-hidden rounded-2xl g-card bg-white p-6", true],
  ["src/pages/landing/ReferralPage.jsx", "rounded-[22px] g-card", "rounded-[22px] g-card bg-white", true],
  ["src/pages/landing/ReferralPage.jsx", 'className="rounded-2xl g-card p-6 sm:p-8"', 'className="rounded-2xl g-card p-6 sm:p-8"', true],
  ["src/pages/landing/SafetyPage.jsx", "min-h-[280px] flex-col overflow-hidden rounded-2xl g-card p-6 pb-14 sm:p-7", "min-h-[280px] flex-col overflow-hidden rounded-2xl g-card bg-white p-6 pb-14 sm:p-7", true],
  /* Accessibility: one template renders on both white and grey bands — conditional */
  ["src/pages/landing/AccessibilityPage.jsx",
    '<article key={title} className="flex min-h-[190px] flex-col rounded-2xl g-card p-6">',
    '<article key={title} className={`flex min-h-[190px] flex-col rounded-2xl g-card ${category.band === "bg-white" ? "" : "bg-white"} p-6`}>', false],
  /* Community: only the MORE destination strip sits on the grey band */
  ["src/pages/landing/CommunityPage.jsx",
    'key={item.title} to={item.to} className="group relative flex h-full flex-col overflow-hidden rounded-2xl g-card focus-visible',
    'key={item.title} to={item.to} className="group relative flex h-full flex-col overflow-hidden rounded-2xl g-card bg-white focus-visible', false],
];

let applied = 0, missed = [];
for (const [file, from, to, g] of EDITS) {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes(from)) { missed.push([file, from.slice(0, 60)]); continue; }
  fs.writeFileSync(file, g ? src.split(from).join(to) : src.replace(from, to));
  applied++;
}
console.log(`applied: ${applied}/${EDITS.length}`);
if (missed.length) { console.log("MISSED:"); missed.forEach((m) => console.log("  " + m.join(" :: "))); process.exitCode = 1; }
