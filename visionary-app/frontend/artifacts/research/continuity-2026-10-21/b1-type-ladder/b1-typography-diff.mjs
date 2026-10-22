/**
 * B1 fingerprint diff — field-by-field compare of b1-typography-before.json
 * against b1-typography-after.json (tag/dt/fs/fw/lh/ls/h + text). Prints one
 * line per changed slot with the identifying text so every drift can be
 * receipted against the voice-type ladder.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const before = JSON.parse(readFileSync(path.join(DIR, 'b1-typography-before.json'), 'utf8'));
const after = JSON.parse(readFileSync(path.join(DIR, 'b1-typography-after.json'), 'utf8'));

const FIELDS = ['dt', 'fs', 'fw', 'lh', 'ls', 'h'];
const KINDS = ['h1', 'h2', 'h3', 'p', 'pill'];
let changes = 0;
const summary = {};

for (const key of Object.keys(before)) {
  const lines = [];
  const b = before[key];
  const a = after[key];
  for (const kind of KINDS) {
    const bl = Array.isArray(b[kind]) ? b[kind] : [];
    const al = Array.isArray(a[kind]) ? a[kind] : [];
    const n = Math.max(bl.length, al.length);
    for (let i = 0; i < n; i++) {
      const bi = bl[i] || { missing: true };
      const ai = al[i] || { missing: true };
      if (bi.missing || ai.missing) {
        lines.push(`${kind}[${i}] list-size ${bl.length}\u2192${al.length} (${(ai.text || bi.text || '').slice(0, 28)})`);
        changes += 1;
        continue;
      }
      const diffs = FIELDS.filter((f) => bi[f] !== ai[f]);
      if (diffs.length) {
        const detail = diffs.map((f) => `${f}:${bi[f]}\u2192${ai[f]}`).join(' ');
        lines.push(`${kind}[${i}] ${detail} \u2014 "${(ai.text || '').slice(0, 34)}"`);
        for (const f of diffs) {
          const k = `${kind}:${f}`;
          summary[k] = (summary[k] || 0) + 1;
        }
        changes += 1;
      }
    }
  }
  if (lines.length) console.log(`\n${key}\n  ${lines.join('\n  ')}`);
}
console.log(`\nchanged slots: ${changes}`);
console.log(Object.entries(summary).map(([k, v]) => `${k}\u00d7${v}`).sort().join(' · '));
