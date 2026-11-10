/** A5 fingerprint diff — BEFORE vs AFTER computed typography. */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const before = JSON.parse(readFileSync(path.join(DIR, 'a5-typography-before.json'), 'utf8'));
const after = JSON.parse(readFileSync(path.join(DIR, 'a5-typography-after.json'), 'utf8'));
const FIELDS = ['fs', 'fw', 'lh', 'ls', 'h'];
let diffs = 0;
const lines = [];
for (const key of Object.keys(before)) {
  const b = before[key], a = after[key];
  if (!a) { lines.push(`MISSING in after: ${key}`); diffs++; continue; }
  for (const tier of Object.keys(b)) {
    if (!a[tier]) { lines.push(`${key}: tier ${tier} missing in after`); diffs++; continue; }
    const n = Math.max(b[tier].length, a[tier].length);
    for (let i = 0; i < n; i++) {
      const eb = b[tier][i], ea = a[tier][i];
      if (!eb || !ea) { lines.push(`${key} ${tier}[${i}]: count changed (${b[tier].length}→${a[tier].length})`); diffs++; continue; }
      for (const f of FIELDS) {
        if (String(eb[f]) !== String(ea[f])) {
          lines.push(`${key} ${tier}[${i}] ${f}: ${eb[f]} → ${ea[f]} (${eb.text} / ${ea.text})`);
          diffs++;
        }
      }
    }
  }
}
writeFileSync(path.join(DIR, 'a5-fingerprint-diff.txt'), lines.join('\n') || 'IDENTICAL — zero drift');
console.log(diffs === 0 ? '\nIDENTICAL — zero typography drift across all fingerprinted routes/widths' : `${diffs} DIFFS`);
if (diffs > 0) console.log(lines.slice(0, 40).join('\n'));
