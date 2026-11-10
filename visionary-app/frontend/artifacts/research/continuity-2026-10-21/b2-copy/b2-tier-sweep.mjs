import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = 'C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/gl-kan-201-b2-kickers/visionary-app/frontend/src';
const SKIP = ['dashboard'];
const MAP = [
  ['text-[15px]', 'text-[16px]'],
  ['text-[16.5px]', 'text-[16px]'],
  ['text-[14.5px]', 'text-[14px]'],
  ['text-[17.5px]', 'text-[17px]'],
];
const exts = new Set(['.jsx', '.tsx', '.js']);
let files = 0, subs = 0;

const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.some((s) => p.toLowerCase().includes(s))) walk(p); continue; }
    if (!exts.has(path.extname(e.name))) continue;
    const t = readFileSync(p, 'utf8');
    let changed = 0;
    let out = t;
    for (const [a, b] of MAP) {
      const n = out.split(a).length - 1;
      if (n) { out = out.split(a).join(b); changed += n; }
    }
    if (changed) {
      writeFileSync(p, out);
      files++; subs += changed;
      console.log(p.replace(root, ''), changed);
    }
  }
};
walk(root);
console.log('FILES:', files, 'SUBS:', subs);
