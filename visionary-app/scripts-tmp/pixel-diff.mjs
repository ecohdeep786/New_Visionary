import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
const [aPath, bPath] = process.argv.slice(2);
const a = PNG.sync.read(readFileSync(aPath));
const b = PNG.sync.read(readFileSync(bPath));
if (a.width !== b.width || a.height !== b.height) { console.log('SIZE-DIFF'); process.exit(0); }
let diff = 0, maxDelta = 0;
for (let i = 0; i < a.data.length; i += 4) {
  const d = Math.max(Math.abs(a.data[i]-b.data[i]), Math.abs(a.data[i+1]-b.data[i+1]), Math.abs(a.data[i+2]-b.data[i+2]));
  if (d > 8) { diff++; if (d > maxDelta) maxDelta = d; }
}
const pct = (100 * diff / (a.width*a.height)).toFixed(3);
console.log(`${aPath}: ${diff} px differ (${pct}%), maxDelta=${maxDelta}`);
