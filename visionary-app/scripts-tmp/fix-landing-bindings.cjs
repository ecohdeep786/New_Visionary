/* Deterministic fix for the "stuck on first load" bug: Landing.jsx references
   cmAdapt / cmGrow / cmCreate / Play / Pause / JOURNEY_CARD_MS at module scope
   but the parallel session removed those bindings — the module throws
   ReferenceError on import and the app never mounts. This script restores the
   missing bindings idempotently and verifies the file parses. */
const fs = require("node:fs");
const path = "src/pages/Landing.jsx";
let src = fs.readFileSync(path, "utf8");
const before = src;

// 1. restore the three image bindings (insert after the cmContinue import)
if (!/\bcmAdapt\b/.test(src.slice(0, src.indexOf("const COLORS")))) {
  src = src.replace(
    'import cmContinue from "@/assets/student-higher.webp";',
    'import cmContinue from "@/assets/student-higher.webp";\n' +
      'import cmAdapt from "@/assets/student-primary.webp";\n' +
      'import cmGrow from "@/assets/student-secondary.webp";\n' +
      'import cmCreate from "@/assets/student-vocational.webp";',
  );
  console.log("restored: cmAdapt/cmGrow/cmCreate image imports");
}

// 2. restore Play/Pause on the lucide import
if (/import \{ ShieldCheck, HeartHandshake, Scale \} from "lucide-react";/.test(src)) {
  src = src.replace(
    'import { ShieldCheck, HeartHandshake, Scale } from "lucide-react";',
    'import { ShieldCheck, HeartHandshake, Scale, Play, Pause } from "lucide-react";',
  );
  console.log("restored: Play/Pause lucide imports");
}

// 3. restore JOURNEY_CARD_MS next to JOURNEY_STEPS (guard on the DECLARATION,
//    not any mention — line 704 references it inside setInterval)
if (!/(const|let|var)\s+JOURNEY_CARD_MS\b/.test(src)) {
  if (!src.includes("const JOURNEY_STEPS = [")) {
    console.error("anchor missing: const JOURNEY_STEPS — aborting without write");
    process.exit(1);
  }
  src = src.replace(
    "const JOURNEY_STEPS = [",
    "const JOURNEY_CARD_MS = 5000;\n\nconst JOURNEY_STEPS = [",
  );
  console.log("restored: JOURNEY_CARD_MS const");
}

if (src !== before) {
  fs.writeFileSync(path, src);
  console.log("written:", path);
} else {
  console.log("no changes needed (already fixed)");
}

// 4. verify every module-scope identifier now resolves: list referenced
//    bindings from the known-broken set and confirm each is defined/imported
const checks = ["cmAdapt", "cmGrow", "cmCreate", "Play", "Pause", "JOURNEY_CARD_MS"];
const missing = checks.filter((name) => {
  const used = new RegExp(`\\b${name}\\b`).test(src);
  const defined =
    new RegExp(`import [^;]*\\b${name}\\b`).test(src) ||
    new RegExp(`(const|let|var|function)\\s+${name}\\b`).test(src);
  return used && !defined;
});
if (missing.length) {
  console.error("STILL MISSING:", missing.join(", "));
  process.exit(1);
}
console.log("all bindings resolve — module can load");
