/* council/manifest.mjs — CHANGE_SET detector (Director DETECT phase).
   Usage: node scripts-tmp/manifest.mjs [--diff]
   --diff: compares frontend-scope file hashes against manifest.json and prints
   the changed set; otherwise (re)writes the snapshot. */
import { createHash } from "crypto";
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, relative } from "path";

const ROOTS = ["src", "public", "index.html"];
const OUT = "scripts-tmp/manifest.json";

function walk(dir, acc) {
  if (!existsSync(dir)) return acc;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const files = ROOTS.flatMap((r) => (statSync(r).isFile() ? [r] : walk(r, [])));
const snapshot = {};
for (const f of files) {
  snapshot[relative(".", f).replace(/\\/g, "/")] = createHash("sha1").update(readFileSync(f)).digest("hex").slice(0, 12);
}

if (process.argv.includes("--diff")) {
  const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
  const changed = Object.keys(snapshot).filter((k) => prev[k] !== snapshot[k]);
  const removed = Object.keys(prev).filter((k) => !(k in snapshot));
  console.log("CHANGE_SET:", changed.length ? changed.join(", ") : "(empty)");
  if (removed.length) console.log("REMOVED:", removed.join(", "));
  console.log(`files: ${Object.keys(snapshot).length} tracked`);
} else {
  writeFileSync(OUT, JSON.stringify(snapshot, null, 1));
  console.log(`manifest written: ${Object.keys(snapshot).length} files hashed`);
}
