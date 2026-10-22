/**
 * B2/FAP-47 doors closure — multiset rewrite (duplicate texts are real:
 * nav/footer pills repeat). Diff of measured-voice tuples per route:
 *   key = text | fs | ls | lh | tt
 * Lost tuple = regression. Extra tuples must be the 29 door rows (+ the four
 * legal lead-in questions and case/whitespace variants), all fs 17px.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.dirname(fileURLToPath(import.meta.url));
const A = JSON.parse(readFileSync(path.join(OUT, 'b2-dump-b3-doorsless.json'), 'utf8'));
const B = JSON.parse(readFileSync(path.join(OUT, 'b2-dump-after.json'), 'utf8'));

const key = (r) => [r.text, r.fs, r.ls, r.lh, r.tt].join('\u0001');
const tally = (rows) => {
  const m = new Map();
  for (const r of rows) { const k = key(r); m.set(k, (m.get(k) || 0) + 1); }
  return m;
};
const LEGAL_Q = 'Questions about this policy?';

let lostTotal = 0, extraTotal = 0;
for (const route of Object.keys(A)) {
  const da = tally(A[route] || []), db = tally(B[route] || []);
  for (const [k, n] of da) {
    const got = db.get(k) || 0;
    if (got < n) { lostTotal += n - got; console.log(`LOST ${route}: ${k.replace(/\u0001/g, ' | ')} (${n}→${got})`); }
  }
  for (const [k, n] of db) {
    const had = da.get(k) || 0;
    if (had >= n) continue;
    const extra = n - had;
    const [text, fs, ls, lh, tt] = k.split('\u0001');
    const doorish = fs === '17px' && (text === LEGAL_Q || text.startsWith('Questions about this policy') || [
      'See who we partner with', 'What the programme covers', 'Begin the conversation', 'Straight answers, before you writ',
      'See how it keeps going across devices', 'Reading-setup guides in the Help cen', 'Hear how asking works',
      'Try the web build, keyboard-first', 'Ask us about your language', 'Tell us what is missing',
      'See how the product works first', 'Questions about your devices', 'Setup guides live in the Help cente',
      'Meet the areas of work', 'The story behind the work', 'Ask a hiring question',
      'What the intelligence does today', 'The research areas, role by role', 'The same work, announced politely',
      'The same work, announced plainly', 'Ask a referral question', 'The protections, up close',
      'Ask the safety team a question fir', 'Try the loop yourself', 'See how the loop remembers your plac',
      'Talk to a person',
    ].some((d) => (text || '').startsWith(d)));
    if (!doorish) { extraTotal += extra; console.log(`EXTRA(non-door) ${route}: ${k.replace(/\u0001/g, ' | ')} ×${extra}`); }
  }
}
console.log(lostTotal === 0 && extraTotal === 0 ? 'DOORS CLOSURE ✓ — every pre-door voice tuple intact; all new tuples are door rows' : `lost=${lostTotal} extra=${extraTotal}`);
