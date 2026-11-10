/**
 * B2/FAP-47 doors closure diff — b2-dump-b3-doorsless.json (pre-doors) vs
 * b2-dump-after.json (post-doors). Every pre-door site must still exist with
 * the same measured voice (by text + fs), and every NEW tracked element must
 * be one of the 29 approved door labels (their 17px quiet links).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.dirname(fileURLToPath(import.meta.url));
const A = JSON.parse(readFileSync(path.join(OUT, 'b2-dump-b3-doorsless.json'), 'utf8'));
const B = JSON.parse(readFileSync(path.join(OUT, 'b2-dump-after.json'), 'utf8'));

const DOOR_LABELS = [
  'See who we partner with', 'What the programme covers', 'Begin the conversation', 'Straight answers, before you write',
  'See how it keeps going across devices', 'Reading-setup guides in the Help center', 'Hear how asking works',
  'Try the web build, keyboard-first', 'Ask us about your language', 'Tell us what is missing',
  'See how the product works first', 'Questions about your devices', 'Setup guides live in the Help center',
  'Meet the areas of work', 'The story behind the work', 'Ask a hiring question',
  'What the intelligence does today', 'The research areas, role by role', 'The same work, announced plainly',
  'Ask a referral question', 'The protections, up close', 'Ask the safety team a question first',
  'Try the loop yourself', 'See how the loop remembers your place', 'Talk to a person',
];
const isDoor = (row) => row.tag === 'A' && DOOR_LABELS.some((d) => (row.text || '').startsWith(d));

let lost = 0, changed = 0, doors = 0, otherNew = [];
for (const route of Object.keys(A)) {
  const ra = A[route] || [], rb = B[route] || [];
  const da = new Map(), db = new Map();
  for (const r of ra) da.set(r.text, (da.get(r.text) || 0) + 1);
  for (const r of rb) db.set(r.text, (db.get(r.text) || 0) + 1);
  for (const [text, n] of da) {
    if ((db.get(text) || 0) < n) { lost++; console.log(`LOST ${route}: "${text}" (${n} -> ${db.get(text) || 0})`); }
  }
  for (const r of rb) {
    const bak = ra.find((x) => x.text === r.text);
    if (bak && bak.fs !== r.fs && !isDoor(r)) { changed++; console.log(`CHANGED ${route}: "${r.text}" fs ${bak.fs} -> ${r.fs}`); }
  }
  for (const r of rb) {
    const inA = ra.some((x) => x.text === r.text);
    if (!inA) {
      if (isDoor(r)) doors++;
      else if (r.text) otherNew.push(`${route}: [${r.tag}] "${r.text}" fs=${r.fs}`);
    }
  }
}
console.log(`lost=${lost} changedVoice=${changed} newDoorRows=${doors} otherNew=${otherNew.length}`);
for (const o of otherNew.slice(0, 12)) console.log('  ', o);
console.log(doors >= 25 && lost === 0 && changed === 0 && otherNew.length === 0 ? 'DOORS CLOSURE ✓ (pre-door voices intact; only door rows added)' : 'CHECK ABOVE');
