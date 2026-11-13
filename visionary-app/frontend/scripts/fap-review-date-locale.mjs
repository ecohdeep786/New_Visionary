#!/usr/bin/env node
/* Principal-review fix: user-facing workspace dates must format India-first.
 * Sweeps the dashboard call sites that pass the bare interfaceLocale copy key
 * ('en') to toLocaleString/toLocaleDateString — Chromium resolves bare 'en' to
 * en-US order (11/5/2026) — and routes them through dateLocale() ('en-IN').
 * Adds the import to every touched file. */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const grep = execSync('grep -rl "toLocaleString(locale)\\|toLocaleDateString(locale)" src --include=*.jsx', { cwd: root, encoding: 'utf8' });
const files = grep.split('\n').map(s => s.trim()).filter(Boolean);

for (const rel of files) {
  const f = path.join(root, rel);
  let t = fs.readFileSync(f, 'utf8');
  const before = (t.match(/toLocaleString\(locale\)|toLocaleDateString\(locale\)/g) || []).length;
  t = t.replaceAll('toLocaleString(locale)', 'toLocaleString(dateLocale(locale))');
  t = t.replaceAll('toLocaleDateString(locale)', 'toLocaleDateString(dateLocale(locale))');
  if (!t.includes("from '@/lib/datetime'")) {
    // insert the import after the last existing @/ import (or at the top)
    const lines = t.split('\n');
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i])) lastImport = i;
    }
    const imp = "import { dateLocale } from '@/lib/datetime';";
    if (lastImport >= 0) lines.splice(lastImport + 1, 0, imp);
    else lines.unshift(imp);
    t = lines.join('\n');
  }
  fs.writeFileSync(f, t);
  console.log(rel, before, 'sites');
}
console.log('done:', files.length, 'files');
