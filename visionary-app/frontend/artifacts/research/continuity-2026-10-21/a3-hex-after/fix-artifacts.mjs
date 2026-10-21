/**
 * A3 artifact fixer — the tint-wash map produced '#rgba(...)' when the hex had a
 * '#' prefix. A leading '#' before rgba() is invalid CSS. Strips it universally
 * across the public set. Safe: no valid construct contains '#rgba('.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'src');

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

let files = 0, fixes = 0;
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = path.join(d, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(jsx|css|js)$/.test(f)) continue;
    const rel = path.relative(SRC, p);
    if (!isPublic(rel)) continue;
    const before = readFileSync(p, 'utf8');
    const n = before.split('#rgba(').length - 1;
    if (n > 0) { writeFileSync(p, before.replaceAll('#rgba(', 'rgba(')); files++; fixes += n; console.log(`${rel}: ${n} artifacts fixed`); }
  }
})(SRC);
console.log(`FIXED ${fixes} artifacts in ${files} files`);
