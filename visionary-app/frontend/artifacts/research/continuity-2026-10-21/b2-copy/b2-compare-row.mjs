// Precision probe: every row whose text contains a needle, per dump.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const A = JSON.parse(readFileSync(path.join(OUT, 'b2-dump-b3-doorsless.json'), 'utf8'));
const B = JSON.parse(readFileSync(path.join(OUT, 'b2-dump-after.json'), 'utf8'));
const route = process.argv[2] || 'pricing';
const needle = process.argv[3] || 'How it works';
const show = (name, rows) => {
  const hits = rows.map((r, i) => ({ i, ...r })).filter((r) => (r.text || '').includes(needle));
  console.log(`${name}: ${hits.length} rows`);
  for (const r of hits) console.log(`  #${r.i} [${r.tag}] fs=${r.fs} ls=${r.ls} lh=${r.lh} tt=${r.tt} cls="${(r.cls || '').slice(0, 60)}" path="${(r.path || '').slice(0, 80)}"`);
};
show('b3(no-doors)', A[route] || []);
show('b5(doors)', B[route] || []);
