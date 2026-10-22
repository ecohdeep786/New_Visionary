/**
 * B2 drift check — pairs before/after bank rows by (route, DOM ordinal) and
 * reports every computed delta, plus unpaired rows (scan-widening = newly
 * visible 16px/17px-authored sites without a "before" counterpart).
 */
import { readFileSync } from 'node:fs';

const base = 'C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/gl-kan-201-b2-kickers/visionary-app/frontend/artifacts/research/continuity-2026-10-21/b2-copy/';
const A = JSON.parse(readFileSync(base + 'b2-bank-before.json', 'utf8'));
const B = JSON.parse(readFileSync(base + `b2-bank-${process.argv[2] || 'after'}.json`, 'utf8'));

const PROPS = ['fs', 'fw', 'ls', 'lh', 'tt', 'color'];
let drifts = 0, paired = 0, unpairedA = 0, unpairedB = 0;
const lines = [];
for (const route of Object.keys(B)) {
  const a = A[route] || [], b = B[route] || [];
  if (a.length !== b.length) lines.push(`${route}: count ${a.length} -> ${b.length}`);
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    paired++;
    const ra = a[i], rb = b[i];
    const deltas = [];
    for (const p of PROPS) {
      if ((ra[p] || '') !== (rb[p] || '')) deltas.push(`${p}: ${ra[p]} -> ${rb[p]}`);
    }
    if (deltas.length) {
      drifts++;
      lines.push(`${route}#${i} ${ra.tag} "${ra.text}" path=${String(ra.path && ra.path).slice(0, 70)}`);
      for (const d of deltas) lines.push('    ' + d);
    }
  }
  for (let i = n; i < a.length; i++) { unpairedA++; lines.push(`UNPAIRED-A ${route}#${i} "${a[i].text}"`); }
  for (let i = n; i < b.length; i++) { unpairedB++; lines.push(`UNPAIRED-B ${route}#${i} "${b[i].text}"`); }
}
console.log(`paired=${paired} driftRows=${drifts} unpairedA=${unpairedA} unpairedB=${unpairedB}`);
console.log(lines.join('\n'));
