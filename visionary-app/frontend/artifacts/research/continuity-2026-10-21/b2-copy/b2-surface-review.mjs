// B2 — add QuietLink.jsx to the product-surface review registry + regenerate inventory.
import { readFileSync, writeFileSync } from 'node:fs';

const root = 'C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/gl-kan-201-b2-kickers/';
const reviewPath = root + 'visionary-app/integration/contracts/product-surface-review.json';
const raw = readFileSync(reviewPath, 'utf8');

// Detect indent from a nested line.
const m = raw.match(/\n(\s+)"files"/);
const indent = m ? m[1].slice(String(indentKeyHasNested)) : null;
function indentKeyHasNested() { return 0; } // placeholder (never used)

const j = JSON.parse(raw);
console.log('top keys:', Object.keys(j).join(','));
console.log('file indent of first nested line:', (raw.match(/\n(\s+)"/) || [])[1]?.length ?? '?');

const KEY = 'frontend/src/components/landing/QuietLink.jsx';
if (!j.files[KEY]) {
  const REASON = 'Client presentation/navigation/input control; callbacks delegate domain work to the caller. This does not establish a server connection or educational coverage.';
  j.files[KEY] = { profile: 'client-presentation', state: 'connected', execution: 'client', reason: REASON, followUp: ['SCOPE-06', 'PLAT-01'] };
  // Keep keys sorted for a stable diff (the file's other keys are grouped; re-sort only our block neighborhood).
  const files = j.files;
  const ordered = {};
  for (const k of Object.keys(files).sort()) ordered[k] = files[k];
  j.files = ordered;
  console.log('QuietLink record ADDED');
} else console.log('record already present');

// Preserve the file's own indent: find the longest leading-space run in the original.
const indents = [...raw.matchAll(/\n([ ]+)/g)].map(x => x[1].length);
const likelyIndent = Math.min(...indents) || 2;
writeFileSync(reviewPath, JSON.stringify(j, null, likelyIndent) + '\n');
console.log('wrote review with indent', likelyIndent);
