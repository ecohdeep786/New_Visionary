import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* F-09 (Principal Motion, Interaction & Microfeedback Engineer): motion law.
 * Behavioral evidence lives in the recorded browser probes; these assertions
 * pin the source mechanisms so a refactor cannot silently drop them. */

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(frontendRoot, relative), 'utf8');

test('direct hash loads re-land below the sticky header, honoring reduced motion (F-09-D1)', () => {
  const source = read('src/components/ScrollToTop.jsx');
  assert.match(source, /pendingHashLanding/, 'the initial hash landing must be re-run after content settles');
  assert.match(source, /prefersReducedMotion\(\) \? "auto" : "smooth"/, 'the re-land must respect prefers-reduced-motion');
  assert.match(source, /document\.getElementById\(id\)\?\.scrollIntoView/, 'the re-land must target the real section');
});

test('the persona hero cycle holds under reduced motion (F-31 guard stays)', () => {
  const persona = read('src/components/landing/NewPersona.jsx');
  assert.match(persona, /prefers-reduced-motion|matchMedia/, 'the hero cycle guard must respect prefers-reduced-motion');
});

test('auth submissions guard against duplicate activation (S05)', () => {
  const login = read('src/pages/Login.jsx');
  assert.match(login, /submitting\.current/, 'login must guard double-submit');
  const register = read('src/pages/Register.jsx');
  const guard = /submitting\.current|disabled=\{/.test(register);
  assert.ok(guard, 'register must guard double-submit (ref flag or disabled state)');
});

test('the mobile drawer lock restore is unconditional (no invisible overlay left behind)', () => {
  const nav = read('src/components/landing/LandingNav/index.jsx');
  assert.match(nav, /document\.body\.style\.overflow = mobileOpen \? "hidden" : ""/, 'body overflow restores on close');
  assert.match(nav, /return \(\) => \{\s*document\.body\.style\.overflow = "";\s*\};/, 'cleanup restores body overflow');
});
