/**
 * A4 source-usage cross-check (FAP-44) — which PUBLIC source files still author
 * the classes public-bridge.css retags. Complements the DOM scan (source truth).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'src');

const TARGETS = [
  ['clamp-story', /text-\[clamp\(3[46]px,5vw,72px\)|text-\[clamp\(40px,4\.5vw,72px\)|text-\[clamp\(30px,3\.8vw,56px\)|text-\[clamp\(26px,3\.4vw,48px\)\]/g],
  ['clamp-story-h2-40-80', /h2[^>\n]*text-\[clamp\(40px,5\.55vw,80px\)/g],
  ['clamp-cardtitle', /text-\[clamp\(28px,2\.78vw,40px\)|text-\[clamp\(28px,2\.9vw,4|text-\[clamp\(30px,4vw,46px\)|text-\[clamp\(26px,3\.4vw,38px\)|text-\[clamp\(32px,3\.3vw,44px\)|text-\[clamp\(24px,3vw,34px\)|text-\[clamp\(24px,2\.78vw,40px\)/g],
  ['compact-20', /text-\[clamp\(20px,2vw,2[68]px\)/g],
  ['t15-165-145', /text-\[15px\]|text-\[16\.5px\]|text-\[14\.5px\]/g],
  ['t17-175', /text-\[17\.5px\]|text-\[17px\]/g],
  ['t13', /text-\[13px\]/g],
  ['h1-48', /<h1[^>\n]*text-\[48px\]/g],
  ['h2-step-static', /<h2[^>\n]*text-\[3[0-6]px\]/g],
  ['rounded-14-24-28-32-48-50-60', /rounded-\[14px\]|rounded-\[24px\]|rounded-\[28px\]|rounded-\[32px\]|rounded-\[48px\]|rounded-\[50px\]|rounded-\[60px\]/g],
  ['grey-lead-markers', /95, 99, 104|#5f6368|#6e6e73/g],
];

function isPublic(rel) {
  const n = rel.toLowerCase();
  if (rel.startsWith('pages\\landing\\')) return true;
  if (['app.jsx', 'index.css', 'data\\landingcategories.js', 'lib\\pagenotfound.jsx'].includes(n)) return true;
  if (['components\\authlayout.jsx', 'components\\usernotregisterederror.jsx', 'components\\visionarylogo.jsx', 'components\\protectedroute.jsx', 'components\\socialauthbuttons.jsx'].includes(n)) return true;
  if (rel.startsWith('components\\landing\\')) return true;
  if (rel.startsWith('components\\auth\\')) return true;
  if (['pages\\login.jsx', 'pages\\register.jsx', 'pages\\forgotpassword.jsx', 'pages\\forgotuserid.jsx', 'pages\\resetpassword.jsx'].includes(n)) return true;
  if (rel.startsWith('styles\\public') || ['styles\\rhythm.css', 'styles\\feedback.css'].includes(n)) return true;
  return false;
}

const rows = {};
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = path.join(d, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(jsx|css)$/.test(f)) continue;
    const rel = path.relative(SRC, p);
    if (!isPublic(rel)) continue;
    const text = readFileSync(p, 'utf8');
    for (const [name, re] of TARGETS) {
      const hits = [...text.matchAll(re)].length;
      if (hits > 0) (rows[name] = rows[name] || []).push(`${rel} x${hits}`);
    }
  }
})(SRC);

for (const [name, files] of Object.entries(rows)) {
  console.log(`${name}: ${files.length} public files`); console.log('   ' + files.slice(0, 14).join(' · '));
}
console.log('targets with zero public usage: ' + TARGETS.map(t => t[0]).filter(t => !rows[t]).join(', ') || '(none)');
