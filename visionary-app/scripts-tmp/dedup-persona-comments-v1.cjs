/* Collapse adjacent duplicated doc-comment blocks in PersonaSections.jsx
   (run-2 anchor artifact: each component's doc comment appears twice back
   to back). Idempotent. */
const fs = require("node:fs");
const P = "src/components/landing/persona/PersonaSections.jsx";
let s = fs.readFileSync(P, "utf8");
const before = s.length;

const heads = ["The journey gallery on persona pages", "The stage's story popup"];
for (const head of heads) {
  const marker = "/* " + head;
  let idx = s.indexOf(marker);
  while (idx >= 0) {
    const close = s.indexOf("*/\n", idx);
    if (close < 0) break;
    const block = s.slice(idx, close + 3);
    const rest = s.slice(close + 3);
    // if the SAME block immediately follows, drop the second copy
    if (rest.startsWith(block)) {
      s = s.slice(0, close + 3) + rest.slice(block.length);
      console.log("collapsed duplicate comment:", head.slice(0, 30));
      idx = s.indexOf(marker, idx + block.length);
    } else {
      idx = s.indexOf(marker, close + 3);
    }
  }
}
fs.writeFileSync(P, s);
console.log("dedup delta:", s.length - before, "chars");
