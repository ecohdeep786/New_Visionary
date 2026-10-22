// Inspect the raw review-file layout around landing keys (no writes).
import { readFileSync } from 'node:fs';
const raw = readFileSync('C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/gl-kan-201-b2-kickers/visionary-app/integration/contracts/product-surface-review.json', 'utf8');
const lines = raw.split('\n');
lines.forEach((l, i) => {
  if (l.includes('components/landing') && i < lines.length) {
    console.log(`line ${i + 1} (indent=${(l.match(/^ */) || ['#'])[0].length}): ${l.trim().slice(0, 80)}`);
  }
});
console.log('total lines:', lines.length);
console.log('first lines:', JSON.stringify(lines.slice(0, 6), null, 1));
