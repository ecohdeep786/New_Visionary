import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migration = JSON.parse(fs.readFileSync(path.join(root, 'docs/architecture/restructure-2026-10-13.json'), 'utf8'));
const verifyPreservation = process.argv.includes('--preserved-source');
if (verifyPreservation) for (const file of migration.PreservedFiles) {
  const bytes = fs.readFileSync(path.join(root, file.Path));
  if (createHash('sha256').update(bytes).digest('hex') !== file.Sha256) throw new Error(`Relocation changed frontend source, assets or tests: ${file.Path}`);
}
for (const old of ['src', 'public', 'tests', 'node_modules', 'dist', 'vite.config.js']) {
  if (fs.existsSync(path.join(root, old))) throw new Error(`Old frontend location remains at product root: ${old}`);
}
for (const required of ['frontend/package.json', 'frontend/vite.config.js', 'infrastructure/local/compose.yml', 'integration/upstream-lock.json']) {
  if (!fs.existsSync(path.join(root, required))) throw new Error(`Missing component entry: ${required}`);
}
const product = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (product.dependencies || product.devDependencies) throw new Error('The product command package must not own frontend/backend/ML dependencies.');
console.log(verifyPreservation
  ? `PASS: ${migration.PreservedFiles.length} frontend source, asset and test files preserved; component/configuration roots separated.`
  : 'PASS: frontend, service, tooling and configuration roots are separated.');
