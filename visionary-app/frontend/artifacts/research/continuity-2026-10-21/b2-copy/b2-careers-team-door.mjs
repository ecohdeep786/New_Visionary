// B2/FAP-47 — careers 03-teams door insertion (anchor-based, indentation-safe).
import { readFileSync, writeFileSync } from 'node:fs';

const p = 'C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/gl-kan-201-b2-kickers/visionary-app/frontend/src/pages/landing/CareersPage.jsx';
let t = readFileSync(p, 'utf8');

if (t.includes('The story behind the work')) {
  console.log('ALREADY PRESENT — aborting');
  process.exit(0);
}

const hiringComment = t.indexOf('{/* HOW WE HIRE');
if (hiringComment < 0) { console.log('hiring comment not found'); process.exit(1); }

// The </Reveal> that closes the teams module sits shortly before the comment.
const reveal = t.lastIndexOf('</Reveal>', hiringComment);
if (reveal < 0 || hiringComment - reveal > 400) { console.log('reveal not adjacent:', reveal, hiringComment); process.exit(1); }

// Indent: reuse the </Reveal> line's indent, minus two spaces.
const lineStart = t.lastIndexOf('\n', reveal) + 1;
const indent = (t.slice(lineStart, reveal).match(/^ */) || [''])[0];
const ind = indent.length >= 2 ? indent.slice(0, -2) : indent;

const door =
  ind + '<div className="mt-10 flex justify-center">\n' +
  ind + '  <QuietLink to="/about">\n' +
  ind + '    The story behind the work <ChevronIcon className="h-4 w-4" aria-hidden="true" />\n' +
  ind + '  </QuietLink>\n' +
  ind + '</div>\n';

t = t.slice(0, reveal) + door + t.slice(reveal);
writeFileSync(p, t);

const at = t.indexOf(door);
console.log('INSERTED at', at);
console.log(t.slice(at - 260, at + 340));
