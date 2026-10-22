/**
 * B3 equality proof — b2-dump-b2.json (pre law-deletion) vs b2-dump-after.json
 * (post deletion). Rows align by (route, DOM order); every computed delta is a
 * regression from the law retirement. Expect ZERO.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.dirname(fileURLToPath(import.meta.url));
const A = JSON.parse(readFileSync(path.join(OUT, 'b2-dump-b2.json'), 'utf8'));
const B = JSON.parse(readFileSync(path.join(OUT, 'b2-dump-after.json'), 'utf8'));

const PROPS = ['fs', 'fw', 'ls', 'lh', 'tt', 'color'];
let sites = 0, deltas = 0;
for (const route of Object.keys(A)) {
  const ra = A[route] || [];
  const rb = B[route] || [];
  if (ra.length !== rb.length) { console.log(`LENGTH MISMATCH ${route}: ${ra.length} vs ${rb.length}`); deltas++; continue; }
  for (let i = 0; i < ra.length; i++) {
    sites++;
    const changed = PROPS.filter((p) => (ra[i][p] || '') !== (rb[i][p] || ''));
    if (changed.length) {
      deltas++;
      console.log(`${route}#${i} ${ra[i].tag} "${ra[i].text}" :: ${changed.map((p) => `${p}: ${ra[i][p]} -> ${rb[i][p]}`).join(', ')}`);
    }
  }
}
console.log(`sites=${sites} deltas=${deltas}`);
console.log(deltas === 0 ? 'B3 EQUAL — law retirement is render-neutral on every measured site.' : 'B3 NOT EQUAL — investigate above.');
