import { readFileSync, writeFileSync } from "node:fs";

// C3/FAP-51 part 3: case-sensitive leftovers + the recorded decision convergence.
// workspace.css voice/representation rules carry lowercase #4285f4 (same leaked value) plus
// conjugate #0b57d2/#e8f0fd pressed-state tokens; StudentClasses carries raw #0b57d2 action usages.
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

apply("components/dashboard/workspace.css", [
  ["background:#4285f4", "background:var(--v-action)"],                                        // voice-state speaking + girl mark
  ["linear-gradient(#bbd8ff,#4285f4 70%,#2469d7)", "linear-gradient(#bbd8ff,var(--v-action) 70%,#2469d7)"], // preview bars ramp mid-stop
  ["border-color:#4285f4;background:#eef5ff;color:#0b57d2;box-shadow:inset 0 0 0 1px #4285f4", "border-color:var(--v-action);background:#eef5ff;color:var(--v-action);box-shadow:inset 0 0 0 1px var(--v-action)"],
  ["outline:2px solid #4285f4", "outline:2px solid var(--v-action)"],                          // voice panel focus-visible
  ['border-color:#4285f4;background:#e8f0fd;color:#0b57d2', "border-color:var(--v-action);background:var(--v-soft);color:var(--v-action)"], // v-representation + v-learning-step selected states
  ["#4285f4", "var(--v-action)"],                                                              // any remaining lowercase survivors
]);

apply("pages/dashboard/StudentClasses.jsx", [
  ["#0b57d2", "var(--v-action)"], // accept-invitation fill, tab accent, cancel + link action text
]);

console.log(failed ? "SWEEP INCOMPLETE" : "SWEEP COMPLETE");
process.exitCode = failed ? 1 : 0;
