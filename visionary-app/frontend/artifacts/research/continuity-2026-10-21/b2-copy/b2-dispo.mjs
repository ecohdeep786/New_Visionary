import { readFileSync } from 'node:fs';

const j = JSON.parse(readFileSync('C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/gl-kan-201-b2-kickers/visionary-app/frontend/artifacts/research/continuity-2026-10-21/b2-copy/b2-bank-before.json', 'utf8'));

console.log('=== 21px LABEL SITES (bridge mask winners) ===');
for (const [route, rows] of Object.entries(j)) {
  for (const r of rows) {
    if (r.fs === '21px') console.log(`${route} | ${r.tag} | "${r.text}" | ${String(r.path).slice(0, 80)}`);
  }
}

console.log('\n=== 14.5px riders ===');
let n145 = 0;
for (const [route, rows] of Object.entries(j)) {
  for (const r of rows) {
    if ((r.cls || '').includes('text-[14.5px]')) { n145++; console.log(`${route} | r=${r.tag} lead=${r.leadCand} | "${r.text}" | fs=${r.fs} | pat=${String(r.path).slice(0, 90)}`); }
  }
}
console.log('total 14.5:', n145);

console.log('\n=== 16.5px riders ===');
for (const [route, rows] of Object.entries(j)) {
  for (const r of rows) {
    if ((r.cls || '').includes('text-[16.5px]')) console.log(`${route} | r=${r.tag} lead=${r.leadCand} | "${r.text}" | fs=${r.fs} | inMain=${r.inMain}`);
  }
}
