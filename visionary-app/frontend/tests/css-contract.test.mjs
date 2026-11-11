import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* F-05 (Principal Design Systems & Component Architecture Engineer): the CSS
 * contract. The continuity law only scans the public landing families, so the
 * GLOBAL stylesheets had no law — the invalid `#rgba(` selection artifact in
 * src/index.css survived two full battery runs inside that blind spot
 * (F-05-D1). These laws cover every stylesheet:
 *
 *   1. No invalid `#rgba(`-family artifacts anywhere in src CSS.
 *   2. index.css keeps the recorded deterministic cascade (import order is
 *      load order; nothing may reorder it silently).
 *   3. No same-selector custom property is defined twice with DIFFERENT
 *      values inside the SAME media context — responsive :root steps across
 *      media queries are the recorded, intentional pattern.
 */

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssFiles = [
  'src/index.css',
  ...fs.readdirSync(path.join(frontendRoot, 'src/styles')).filter(f => f.endsWith('.css')).map(f => `src/styles/${f}`),
  ...fs.readdirSync(path.join(frontendRoot, 'src/components/dashboard')).filter(f => f.endsWith('.css')).map(f => `src/components/dashboard/${f}`),
];

test('no invalid #rgba-family declarations survive in any stylesheet', () => {
  const offenders = [];
  for (const file of cssFiles) {
    const text = fs.readFileSync(path.join(frontendRoot, file), 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      if (/#[a-zA-Z]+\(/.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], 'hex-prefixed functional values are invalid CSS and silently dropped by the browser');
});

test('index.css keeps the recorded deterministic cascade', () => {
  const text = fs.readFileSync(path.join(frontendRoot, 'src/index.css'), 'utf8');
  const imports = [...text.matchAll(/@import\s+"([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(imports, [
    './styles/tokens.css',
    './styles/rhythm.css',
    './styles/public-system.css',
    './styles/public-bridge.css',
    './styles/premium.css',
    './styles/apple-typography.css',
    './styles/public-icons.css',
  ], 'import order is load order — a reorder changes the cascade and needs an explicit review');
});

test('no :root token is defined twice with different values inside the same media context', () => {
  const offenders = [];
  for (const file of cssFiles) {
    const lines = fs.readFileSync(path.join(frontendRoot, file), 'utf8').split('\n');
    const stack = []; // { media, selector } frame stack
    const seen = new Map(); // media+selector+var -> { value, line }
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const media = /@media([^{]*)\{/.exec(line);
      if (media) { stack.push({ media: media[1].trim(), selector: null }); continue; }
      const selector = /^\s*([:a-zA-Z\[][^{\s][^{]*)\{/.exec(line);
      if (selector) { stack.push({ media: stack.at(-1)?.media ?? null, selector: selector[1].trim() }); continue; }
      const openBraces = (line.match(/\{/g) ?? []).length;
      const closeBraces = (line.match(/\}/g) ?? []).length;
      for (let b = 0; b < closeBraces; b += 1) stack.pop();
      if (openBraces > 0 && !selector && !media) stack.push({ media: stack.at(-1)?.media ?? null, selector: stack.at(-1)?.selector ?? 'inline' });
      const frame = stack.at(-1);
      if (!frame || frame.selector !== ':root') continue;
      const decl = /^\s*(--[a-z0-9-]+):\s*([^;]+);/.exec(line);
      if (!decl) continue;
      const key = `${frame.media ?? ''}|${decl[1]}`;
      const value = decl[2].trim();
      if (seen.has(key) && seen.get(key).value !== value) {
        offenders.push(`${file}:${i + 1}: ${decl[1]} = ${value} conflicts with ${seen.get(key).value} at line ${seen.get(key).line} (same media context "${frame.media ?? 'base'}")`);
      } else if (!seen.has(key)) seen.set(key, { value, line: i + 1 });
    }
  }
  assert.deepEqual(offenders, [], 'a same-context token redefinition is drift, not a responsive step');
});

test('the recorded responsive :root steps remain the intentional pattern', () => {
  const rhythm = fs.readFileSync(path.join(frontendRoot, 'src/styles/rhythm.css'), 'utf8');
  assert.match(rhythm, /--fs-hero-headline: 5rem; \/\* desktop 80px — unified h1 role law/, 'the desktop unified h1 law must stay');
  assert.match(rhythm, /--fs-hero-headline: min\(4rem, 14vw\); \/\* tablet 64px — unified h1 law step; FAP-82 vw cap \*\//, 'the tablet step keeps its recorded 4rem value under the FAP-82 viewport cap');
  assert.match(rhythm, /--fs-hero-headline: min\(2\.75rem, 14vw\); \/\* phone 44px — unified h1 law step; FAP-82 vw cap \*\//, 'the phone step keeps its recorded 2.75rem value under the FAP-82 viewport cap');
});
