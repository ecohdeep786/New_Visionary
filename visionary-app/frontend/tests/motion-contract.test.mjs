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

test('the mobile dialog restores its trigger, background and prior scroll lock on close', () => {
  const nav = read('src/components/landing/LandingNav/index.jsx');
  const mobile = read('src/components/landing/LandingNav/MobileNavigation.jsx');
  assert.match(nav, /<MobileNavigation/, 'the landing nav mounts the owned mobile dialog');
  assert.match(nav, /menuBtnRef\.current\?\.focus/, 'closing returns focus to the menu trigger');
  assert.match(mobile, /const previousOverflow = document\.body\.style\.overflow/, 'the dialog preserves any existing scroll lock');
  assert.match(mobile, /document\.body\.style\.overflow = "hidden"/, 'the open dialog locks background scrolling');
  assert.match(mobile, /document\.body\.style\.overflow = previousOverflow/, 'cleanup restores the prior overflow value');
  assert.match(mobile, /element\.inert = true/, 'the open dialog makes the background inert');
  assert.match(mobile, /element\.inert = false/, 'cleanup makes the background interactive again');
});
