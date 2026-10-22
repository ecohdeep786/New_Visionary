import { readFileSync } from 'node:fs';

const j = JSON.parse(readFileSync('C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/gl-kan-201-b2-kickers/visionary-app/frontend/artifacts/research/continuity-2026-10-21/b2-copy/b2-bank-before.json', 'utf8'));

const key = (r) => JSON.stringify([
  r.cls.split(' ').filter((c) => /^(text-\[1[4567]|uppercase|font-|tracking-|leading-)/.test(c)).sort().join(' '),
  r.fs, r.lw || '', r.lh, r.ls, r.fw, r.tt, (r.color || '').replace(/rgb\((\d+), (\d+), (\d+)\)/, '$1/$2/$3').replace('29/29/31', 'INK').replace('110/110/115', 'GREY').replace(/rgb\(.*, (0\.\d+\)?)/, 'rgba'),
  r.inMain ? 1 : 0, r.leadCand ? 1 : 0,
]);

const groups = new Map();
for (const [route, rows] of Object.entries(j)) {
  for (const r of rows) {
    if (r.error) { console.log('ERR', route, r.error); continue; }
    const k = key(r);
    if (!groups.has(k)) groups.set(k, { n: 0, routes: new Set(), ex: r });
    const g = groups.get(k);
    g.n++;
    g.routes.add(route);
  }
}

const arr = [...groups.entries()].sort((a, b) => b[1].n - a[1].n);
console.log('=== RENDER SIGNATURES (authored->computed) ===');
for (const [k, g] of arr) {
  const sig = JSON.parse(k);
  console.log(`n=${g.n} routes=${g.routes.size} | authored: ${sig[0] || '-'} | computed fs=${sig[1]} lh=${sig[3]} ls=${sig[4]} fw=${sig[5]} tt=${sig[6]} ink=${sig[7]} inMain=${sig[8]} h2+lead=${sig[9]}`);
  if (g.n <= 40) console.log('   ex:', JSON.stringify(g.ex.text).slice(0, 44), '@', (g.ex.path || '').slice(0, 90));
}
