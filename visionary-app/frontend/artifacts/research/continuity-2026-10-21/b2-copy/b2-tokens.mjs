import { readFileSync } from 'node:fs';

const S = 'C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/gl-kan-201-b2-kickers/visionary-app/frontend/src/styles/';
const grep = (p, rx, cap = 60) => {
  const out = [];
  readFileSync(S + p, 'utf8').split('\n').forEach((l, i) => {
    if (rx.test(l)) out.push(`${i + 1}: ${l.trim().slice(0, 140)}`);
  });
  return out.slice(0, cap).join('\n');
};

console.log('== caption/meta tokens (rhythm.css) ==');
console.log(grep('rhythm.css', /(--fs-caption|--fs-meta|--track-meta|--weight-heading|--lh-caption|--track-caption)\s*:/));

console.log('\n== hero-family + label rules (apple-typography.css) ==');
console.log(grep('apple-typography.css', /section:has\(h1\)|01-hero"\]|\[data-type="label|public"\]/, 40));
