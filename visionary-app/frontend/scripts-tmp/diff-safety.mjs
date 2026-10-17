/* Compact before/after diff for the /safety probe. Usage: node scripts-tmp/diff-safety.mjs */
import { readFileSync } from 'node:fs';

const before = JSON.parse(readFileSync('scripts-tmp/probe-safety-before.json', 'utf8').replace(/^\uFEFF/, ''));
const after = JSON.parse(readFileSync('scripts-tmp/probe-safety-after.json', 'utf8').replace(/^\uFEFF/, ''));

console.log(`docH ${before.docH} -> ${after.docH}`);
console.log(`overflowX ${before.overflowX} -> ${after.overflowX}`);
console.log('\nsections:');
after.sections.forEach((s, i) => {
  const b = before.sections[i] || {};
  const bits = [
    `ds ${b.ds} -> ${s.ds}`,
    `py ${b.py} -> ${s.py}`,
    `bg ${b.bg} -> ${s.bg}`,
    `bt ${b.bt} -> ${s.bt}`,
  ];
  console.log(`  [${i}] ${(s.id || 'hero')} | ${bits.join(' | ')} | h ${b.h} -> ${s.h}`);
});

const fields = ['tag', 'fs', 'fw', 'lh', 'tt', 'color', 'bg', 'radius', 'bw', 'bc', 'shadow', 'minH', 'pad', 'margin', 'h', 'w'];
const beforeMap = new Map(before.d.map((x) => [x.label, x]));
console.log('\nelements:');
for (const a of after.d) {
  const b = beforeMap.get(a.label);
  if (!b) { console.log(`  ${a.label}: (not in before) ${a.missing ? 'MISSING' : a.tag}`); continue; }
  if (a.missing) { console.log(`  ${a.label}: present(before,${b.tag}) -> MISSING(after)`); continue; }
  if (b.missing) { console.log(`  ${a.label}: MISSING(before) -> present(after,${a.tag})`); continue; }
  const diffs = fields.filter((f) => String(b[f]) !== String(a[f])).map((f) => `${f}: ${b[f]} -> ${a[f]}`);
  if (diffs.length) console.log(`  ${a.label}: ${diffs.join(' | ')}`);
}
