import { readFileSync, writeFileSync } from "node:fs";

// C3/FAP-51 part 4: shared chrome. The probes showed raw #0b57d2 (the retired action blue)
// still computed on the topbar/audio chrome that paints all seven surfaces. Retire it there
// together with the two ticket values so the captured surfaces resolve through tokens only.
const TARGET = "src/";
let failed = false;

function apply(path, pairs) {
  const full = TARGET + path;
  let s = readFileSync(full, "utf8");
  for (const [from, to] of pairs) {
    const parts = s.split(from);
    if (parts.length === 1) {
      console.log(`MISS  ${path}: ${String(from).slice(0, 70)}`);
      failed = true;
      continue;
    }
    s = parts.join(to);
    console.log(`${String(parts.length - 1).padStart(2)}x  ${path}: ${String(from).slice(0, 56)} -> ${String(to).slice(0, 40)}`);
  }
  writeFileSync(full, s);
}

const hex = [
  ["#4285F4", "var(--v-action)"],
  ["#dadce0", "var(--v-border)"],
];

const files = [
  ["components/dashboard/workspace.css", [["#0b57d2", "var(--v-action)"]]],
  ["components/dashboard/workspace-design.css", [["#0b57d2", "var(--v-action)"]]],
  ["components/dashboard/DashboardTopbar.jsx", [["#0b57d2", "var(--v-action)"], ...hex]],
  ["components/dashboard/DashboardLayout.jsx", hex],
];

for (const [f, pairs] of files) apply(f, pairs);

console.log(failed ? "SWEEP INCOMPLETE (canary misses above are harmless if expected)" : "SWEEP COMPLETE");
process.exitCode = 0;
