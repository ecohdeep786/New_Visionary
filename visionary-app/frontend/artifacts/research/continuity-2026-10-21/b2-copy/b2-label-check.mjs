import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(readFileSync(path.join(OUT, 'b2-dump-after.json'), 'utf8'));
let n = 0, bad = 0;
for (const [r, rows] of Object.entries(j)) for (const x of rows) {
  if (x.dt !== 'label') continue;
  n++;
  const ok = x.fs === '21px' && x.fw === '600' && x.tt === 'none' && x.ls === '0.231px' && x.lh === '24.99px';
  if (!ok) { bad++; console.log('BAD', r, JSON.stringify(x.text), x.fs, x.fw, x.ls, x.lh, x.tt); }
  else console.log('ok', r, JSON.stringify(x.text));
}
console.log('label sites:', n, 'bad:', bad);
