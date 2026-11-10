import { readFileSync, writeFileSync } from "node:fs";

// C3/FAP-51: retire leaked Material values #4285F4 -> var(--v-action), #dadce0 -> var(--v-border)
// in the seven ticket surfaces + the two shared dashboard sheets. Byte-safe (no BOM, no ending flips).
const TARGET = "src/";
let failed = false;

function apply(path, pairs) {
  const full = TARGET + path;
  let s = readFileSync(full, "utf8");
  for (const [from, to] of pairs) {
    const parts = s.split(from);
    if (parts.length === 1) {
      console.log(`MISS  ${path}: ${JSON.stringify(from.slice(0, 70))}`);
      failed = true;
      continue;
    }
    s = parts.join(to);
    console.log(`${String(parts.length - 1).padStart(2)}x  ${path}: ${JSON.stringify(from.slice(0, 56))} -> ${JSON.stringify(to.slice(0, 40))}`);
  }
  writeFileSync(full, s);
}

const hex = [
  ["#4285F4", "var(--v-action)"],
  ["#dadce0", "var(--v-border)"],
];

// Pages with pure 1:1 token swaps (Settings gets its selected-chip pair first).
const pages = [
  ["pages/dashboard/Ask.jsx", hex],
  ["pages/dashboard/Build.jsx", hex],
  ["pages/dashboard/StudentClasses.jsx", hex],
  ["pages/dashboard/RoleWorkspace.jsx", hex],
  ["pages/dashboard/Guide.jsx", hex],
  ["pages/dashboard/Settings.jsx", [
    ["border-[#4285F4] bg-[#e8f0fd]", "border-[var(--v-action)] bg-[var(--v-soft)]"],
    ...hex,
  ]],
];
for (const [f, pairs] of pages) apply(f, pairs);

// Subscription.jsx -> v-cards first (structural strings carry the hexes), then raw hex pass.
apply("pages/dashboard/Subscription.jsx", [
  ["flex flex-wrap items-center gap-5 rounded-2xl border border-[#dadce0] p-6", "v-card flex flex-wrap items-center gap-5"],
  ["<section className=\"rounded-2xl border border-[#dadce0] p-6\">", "<section className=\"v-card\">"],
  ["flex flex-col rounded-2xl border p-6 ${plan.name === \"Premium\" ? \"border-[#dadce0] bg-[#ffffff]\" : \"border-[#dadce0]\"}", "v-card flex flex-col"],
  ["rounded-2xl bg-[#e8f0fd] p-3 text-[#4285F4]", "rounded-2xl bg-[var(--v-soft)] p-3 text-[var(--v-action)]"],
  ["self-start rounded-full bg-[#e8f0fd] px-3 py-1 text-xs text-[#4285F4]", "self-start rounded-full bg-[var(--v-soft)] px-3 py-1 text-xs text-[var(--v-action)]"],
  ["className=\"rounded-full border border-[#dadce0] px-5 py-2.5 text-sm text-[#4285F4]\">Back to workspace", "className=\"v-button\">Back to workspace"],
  ...hex,
]);

// workspace.css: retire the forked token DEFINITIONS (canonical values load from workspace-design.css),
// alias the brand consumers to the action token, then sweep the raw style rules.
apply("components/dashboard/workspace.css", [
  [/^[ \t]*--v-border:#dadce0;(?:\r?\n|\n)/m, ""],
  [/^[ \t]*--v-action:#0b57d2;(?:\r?\n|\n)/m, ""],
  [/^[ \t]*--v-action-hover:#0842a0;(?:\r?\n|\n)/m, ""],
  ["--v-brand:#4285F4;", "--v-brand:var(--v-action);"],
  ...hex,
]);

// workspace-design.css: the DECISION (light action blue = #0071e3, hover #0077ed), then raw hex sweep.
apply("components/dashboard/workspace-design.css", [
  ["--v-action: #0b57d2;", "--v-action: #0071e3;"],
  ["--v-action-hover: #0842a0;", "--v-action-hover: #0077ed;"],
  ...hex,
]);

console.log(failed ? "SWEEP INCOMPLETE" : "SWEEP COMPLETE");
process.exitCode = failed ? 1 : 0;
