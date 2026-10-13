import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const migration = JSON.parse(fs.readFileSync(path.join(root, 'docs/architecture/restructure-2026-10-13.json'), 'utf8'));
const moves = [...migration.Moves].sort((a, b) => b.From.length - a.From.length);
const historical = new Set(['STATUS.md', 'DECISIONS.md', 'QA.md']);
let changed = 0;
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'Frontend(Head Of Product Agent)') continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filename);
    else if (entry.name.endsWith('.md') && !historical.has(entry.name)) {
      const before = fs.readFileSync(filename, 'utf8');
      const after = before.replace(/\]\(([^)]+)\)/g, (link, target) => {
        if (/^(?:https?:|app:|codex:|#)/.test(target)) return link;
        const clean = target.replace(/^<|>$/g, '');
        const split = clean.search(/[?#]/);
        const suffix = split < 0 ? '' : clean.slice(split);
        const location = split < 0 ? clean : clean.slice(0, split);
        const resolved = path.resolve(path.dirname(filename), location);
        const old = path.relative(root, resolved).replaceAll(path.sep, '/');
        const move = moves.find(item => old === item.From || old.startsWith(`${item.From}/`));
        if (!move) return link;
        const mapped = path.join(root, move.To, old.slice(move.From.length).replace(/^\//, ''));
        const relative = path.relative(path.dirname(filename), mapped).replaceAll(path.sep, '/');
        return `](${relative.includes(' ') ? `<${relative}${suffix}>` : relative + suffix})`;
      });
      if (after !== before) { fs.writeFileSync(filename, after); changed++; }
    }
  }
}
walk(path.join(root, 'docs'));
walk(path.join(root, 'integration'));
console.log(`Updated ${changed} first-party Markdown files; append-only logs and protected product-owner documentation excluded.`);
