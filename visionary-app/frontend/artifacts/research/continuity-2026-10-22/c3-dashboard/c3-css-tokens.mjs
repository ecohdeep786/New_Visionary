import { readFileSync, writeFileSync } from "node:fs";

// C3/FAP-51 part 2: the shared dashboard sheets.
// workspace.css RETIRES its forked token definitions (canonical values load from workspace-design.css),
// --v-brand aliases the action token; workspace-design.css takes the DECISION (light action #0071e3, hover #0077ed).
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

apply("components/dashboard/workspace.css", [
  [/^[ \t]*--v-border:#dadce0;(?:\r?\n|\n)/m, ""],
  [/^[ \t]*--v-action:#0b57d2;(?:\r?\n|\n)/m, ""],
  [/^[ \t]*--v-action-hover:#0842a0;(?:\r?\n|\n)/m, ""],
  ["--v-brand:#4285F4;", "--v-brand:var(--v-action);"],
  ...hex,
]);

apply("components/dashboard/workspace-design.css", [
  ["--v-action: #0b57d2;", "--v-action: #0071e3;"],
  ["--v-action-hover: #0842a0;", "--v-action-hover: #0077ed;"],
  ...hex,
]);

console.log(failed ? "SWEEP INCOMPLETE" : "SWEEP COMPLETE");
process.exitCode = failed ? 1 : 0;
