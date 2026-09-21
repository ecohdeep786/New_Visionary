// Patch story-convert-4.mjs: strip dangerous replaces, simplify grab().
import { readFileSync, writeFileSync } from "node:fs";
const f = "scripts-tmp/story-convert-4.mjs";
let s = readFileSync(f, "utf8");
const lines = s.split("\n").filter((l) => !l.includes(".replace(/,?"));
s = lines.join("\n");
const grabOld = /const re = new RegExp\(` {16}\\\{\\\/\\\* \[\^\*\]\* \\\*\\\/\\}\\\r\?\\\n\( {16}<section id="\$\{id\}"\[\\s\\S\]\*\?\\r\?\\n {16}<\\\/section>\)`\);/;
s = s.replace(grabOld, 'const start = src.indexOf(`<section id="${id}"`);\n  if (start === -1) throw new Error("grab failed: " + id);\n  const end = src.indexOf("</section>", start);\n  return src.slice(start, end + "</section>".length);');
// replace the match usage (m[1]) — new grab returns directly
s = s.replace("const m = src.match(re);\n  if (!m) throw new Error(\"grab failed: \" + id);\n  return m[1];\n", "const start = src.indexOf(`<section id=\"${id}\"`);\n  if (start === -1) throw new Error(\"grab failed: \" + id);\n  const end = src.indexOf(\"</section>\", start);\n  return src.slice(start, end + \"</section>\".length);\n");
writeFileSync(f, s);
console.log("patched");
