/**
 * B2 drift v2 — pairs b2-bank-before.json rows against the RAW after-dump
 * (b2-dump-after.json) by (tag, case-insensitive text, path-with-renames),
 * consuming candidates in DOM order. Reports every computed delta.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.dirname(fileURLToPath(import.meta.url));
const A = JSON.parse(readFileSync(path.join(OUT, 'b2-bank-before.json'), 'utf8'));
const B = JSON.parse(readFileSync(path.join(OUT, 'b2-dump-after.json'), 'utf8'));

const RENAMES = [
  [/text-\[15px\]/g, 'text-[16px]'],
  [/text-\[17\.5px\]/g, 'text-[17px]'],
  [/text-\[16\.5px\]/g, 'text-[16px]'],
  [/text-\[14\.5px\]/g, 'text-[14px]'],
];

const variants = (pathStr) => {
  const base = RENAMES.reduce((s, [rx, to]) => s.replace(rx, to), pathStr || '');
  const out = new Set([base, base.replace(/uppercase/g, 'apple-eyebrow'), base.replace(/uppercase/g, 'label')]);
  return [...out];
};

// ancestors only — the element's own class segment is renamed by the recipes
const tailOf = (p) => { const s = String(p || ''); const i = s.indexOf(' > '); return i < 0 ? '' : s.slice(i + 3); };

const PROPS = ['fs', 'fw', 'ls', 'lh', 'tt', 'color'];
const lines = [];
let paired = 0, unresolved = 0, realDrift = 0;

for (const route of Object.keys(A)) {
  const before = A[route] || [];
  const dump = [...(B[route] || [])];
  const used = new Set();
  for (let i = 0; i < before.length; i++) {
    const ra = before[i];
    const keyText = (ra.text || '').toLowerCase();
    const tails = variants(tailOf(ra.path));
    let hit = -1;
    // pass 1: tag+text+ancestor path; pass 2: tag+text; pass 3: tag+ancestor path
    const passes = [
      (d) => d.tag === ra.tag && d.text.toLowerCase() === keyText && tails.includes(tailOf(d.path)),
      (d) => d.tag === ra.tag && d.text.toLowerCase() === keyText,
      (d) => d.tag === ra.tag && tails.includes(tailOf(d.path)),
    ];
    for (const test of passes) {
      hit = dump.findIndex((d, idx) => !used.has(idx) && test(d));
      if (hit >= 0) break;
    }
    if (hit < 0) { unresolved++; lines.push(`UNRESOLVED ${route}#${i} ${ra.tag} "${ra.text}"`); continue; }
    used.add(hit);
    paired++;
    const rb = dump[hit];
    const deltas = [];
    for (const p of PROPS) if ((ra[p] || '') !== (rb[p] || '')) deltas.push(`${p}: ${ra[p]} -> ${rb[p]}`);
    if (deltas.length) {
      realDrift++;
      lines.push(`${route}#${i} ${ra.tag} "${ra.text}"`);
      lines.push(`    path: ${String(ra.path).slice(0, 80)}`);
      for (const d of deltas) lines.push('    ' + d);
    }
  }
}
console.log(`paired=${paired} unresolved=${unresolved}driftRows=${realDrift}`);
console.log(lines.join('\n'));
