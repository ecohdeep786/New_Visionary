import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTrace, deadEndsOf, SCAN_FILES } from '../scripts/cta-trace.mjs';

/* F-04 (Chief Experience Architecture & Page Journey Engineer): the CTA
 * contract. Fails if any public-page destination stops resolving to a declared
 * route, or if a persona's primary journey promise is re-pointed away from the
 * recorded information architecture. */

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(frontendRoot, relative), 'utf8');

const { rows } = buildTrace({
  appText: read('src/App.jsx'),
  routeMetaText: read('src/lib/routeMeta.js'),
  pageMetaText: read('src/lib/PageMeta.jsx'),
  sitemapXml: read('public/sitemap.xml'),
  robotsTxt: read('public/robots.txt'),
  sources: Object.fromEntries(SCAN_FILES.filter(f => fs.existsSync(path.join(frontendRoot, f))).map(f => [f, read(f)])),
});

test('every public-page CTA resolves to a declared route, alias, external link or contact scheme', () => {
  const deadEnds = deadEndsOf(rows);
  assert.deepEqual(deadEnds, [], `dead-end CTA(s): ${deadEnds.map(r => `${r.source} -> ${r.destination}`).join('; ')}`);
  assert.ok(rows.length > 80, `the trace scanned ${rows.length} controls — the public families must stay covered`);
});

test('the persona primary journey promise holds: the primary label describes its destination on every persona page', () => {
  /* Persona CTAs flow through PersonaHero props (ctaTo/ctaLabel); the shared
   * default in NewPersona is /register, organization overrides to /contact. */
  const personaContract = [
    ['StudentPage', 'Create a free account', '/register'],
    ['TeacherPage', 'Create a free account', '/register'],
    ['ParentPage', 'Create a free account', '/register'],
    ['CollegePage', 'Create a free account', '/register'],
    ['OrganizationPage', 'Talk to us', '/contact'],
  ];
  for (const [page, label, destination] of personaContract) {
    const source = read(`src/pages/landing/${page}.jsx`);
    assert.match(source, new RegExp(`ctaLabel="${label}"`), `${page} must describe its primary action with "${label}"`);
    const explicit = /ctaTo="([^"]*)"/.exec(source);
    if (explicit) assert.equal(explicit[1], destination, `${page} overrides ctaTo; it must stay ${destination}`);
    else assert.equal(destination, '/register', `${page} without ctaTo relies on the shared /register default`);
  }
  const personaSource = read('src/components/landing/NewPersona.jsx');
  assert.match(personaSource, /ctaTo = "\/register"/, 'the shared persona default CTA must stay /register');
  assert.match(personaSource, /secondaryTo = "\/how-it-works"/, 'the shared persona secondary path must stay /how-it-works');
});

test('the secondary journey promise holds: how-it-works stays reachable from the page families', () => {
  const howRows = rows.filter(r => r.destination === '/how-it-works');
  assert.ok(howRows.length >= 8, `how-it-works is traced from ${howRows.length} source doors — the recorded set must stay`);
});

test('the conversion doors stay wired: the shared default serves landing and personas, pricing keeps its explicit door', () => {
  const pricingDoor = rows.find(r => r.source.startsWith('src/pages/landing/AILearningPage.jsx') && r.destination === '/register');
  assert.ok(pricingDoor, 'the pricing page must keep its explicit /register door');
  const landingDoor = rows.find(r => r.source.startsWith('src/pages/Landing.jsx') && r.destination === '/how-it-works');
  assert.ok(landingDoor, 'the landing page must keep its traced how-it-works door');
});

test('trust surfaces keep their truthful contact scheme', () => {
  const contactRows = rows.filter(r => r.class === 'contact-scheme');
  assert.ok(contactRows.length >= 10, `trust/contact surfaces expose ${contactRows.length} contact schemes — expected the recorded set to stay`);
  const mailto = contactRows.filter(r => r.destination.startsWith('mailto:') && r.destination.includes('@visionary.org.in'));
  assert.ok(mailto.length >= 3, 'contact schemes must use the live visionary.org.in identity');
});
