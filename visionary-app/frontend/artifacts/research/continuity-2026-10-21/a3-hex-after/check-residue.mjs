/**
 * A3 residue checker — asserts zero legacy hexes across the PUBLIC surface set.
 * Sanctioned exceptions: tokens.js (source of alias table), Google G-brand glyph
 * colors inside GoogleIcon.jsx / SocialAuthButtons.jsx (brand assets).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'src');

const TARGETS = ['4285f4', '3367d6', '0b57d0', '5f6368', '9aa0a6', 'dadce0', 'f8f9fa', 'f1f3f4', '202124', '121317', '2c2d31', '3c4043', 'ea4335', '34a853', 'fbbc04', 'e8f0fe', 'e8f0fd', 'e6f4ea', '174ea6', '8ab4f8', '7baaf7', '66, 133, 244'];
const BRAND_FILES = ['components/GoogleIcon.jsx', 'components/SocialAuthButtons.jsx'];
const BRAND_ONLY = ['4285f4', 'ea4335', 'fbbc04', '34a853'];

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

const rows = [];
let sanctioned = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = path.join(d, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(jsx|css|js)$/.test(f)) continue;
    const rel = path.relative(SRC, p);
    if (!isPublic(rel)) continue;
    const text = readFileSync(p, 'utf8').toLowerCase();
    const relNorm = rel.replaceAll('\\', '/');
    if (relNorm === 'components/landing/system/tokens.js') { sanctioned.push('components/landing/system/tokens.js: alias source — legacy strings live only as documented "was #..." comments/values mapped to law'); continue; }
    for (const h of TARGETS) {
      const count = text.split(h).length - 1;
      if (count > 0) {
        if (BRAND_FILES.includes(relNorm) && BRAND_ONLY.includes(h)) { sanctioned.push(`${relNorm}: ${h} x${count} (brand glyph — sanctioned)`); continue; }
        rows.push(`${relNorm}: ${h} x${count}`);
      }
    }
  }
})(SRC);

console.log(rows.length ? rows.join('\n') : 'PUBLIC SET CLEAN — 0 legacy hexes');
console.log(`violations=${rows.length} · sanctionedBrand=${sanctioned.length}`);
if (sanctioned.length) console.log(sanctioned.join('\n'));
