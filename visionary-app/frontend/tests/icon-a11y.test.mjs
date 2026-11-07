import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* F-07 (Principal Brand, Logo, Icon & Illustration Systems Engineer): icon
 * semantics contract. The pricing comparison glyphs ARE cell content (each
 * carries its own accessible name), content-adjacent decorative Lucide icons
 * are aria-hidden, and the official logo component stays the single brand
 * source. */

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(frontendRoot, relative), 'utf8');

test('pricing comparison boolean cells announce Included / Not included', () => {
  const source = read('src/pages/landing/AILearningPage.jsx');
  assert.match(source, /<Check role="img" aria-label="Included"/, 'the check glyph is the cell content and must be named');
  assert.match(source, /<Minus role="img" aria-label="Not included"/, 'the minus glyph is the cell content and must be named');
});

test('content-adjacent decorative icons are aria-hidden', () => {
  const download = read('src/pages/landing/DownloadPage.jsx');
  assert.match(download, /<Globe className="h-5 w-5" strokeWidth=\{1\.8\} aria-hidden="true" \/>/);
  assert.match(download, /<Download className="h-5 w-5" strokeWidth=\{1\.8\} aria-hidden="true" \/>/);
  const privacy = read('src/pages/landing/PrivacyPage.jsx');
  assert.match(privacy, /<ShieldCheck className="mt-0\.5 h-5 w-5 shrink-0" strokeWidth=\{1\.8\} style=\{\{ color: COLORS\.navy \}\} aria-hidden="true" \/>/);
});

test('the named mobile menu trigger renders no unhidden duplicate icon', () => {
  const nav = read('src/components/landing/LandingNav/index.jsx');
  assert.match(nav, /<X className="h-5 w-5" aria-hidden="true" \/>/);
  assert.match(nav, /<Menu className="h-5 w-5" aria-hidden="true" \/>/);
  assert.match(nav, /aria-label=\{mobileOpen \? "Close menu" : "Open menu"\}/, 'the trigger keeps its accessible name');
});

test('the official logo stays a single brand source with no invented mark', () => {
  const logo = read('src/components/VisionaryLogo.jsx');
  assert.ok(logo.length > 0 && !/placeholder|TODO/i.test(logo));
  const users = ['src/components/AuthLayout.jsx', 'src/components/dashboard/DashboardTopbar.jsx', 'src/components/landing/LandingNav/index.jsx', 'src/components/onboarding/OnboardingLayout.jsx'];
  for (const file of users) {
    assert.match(read(file), /VisionaryLogo/, `${file} must render the shared brand component, not an inline copy`);
    assert.ok(!/<svg[^>]*Visionary|Visionary.{0,40}placeholder/i.test(read(file).replace(/VisionaryLogo/g, '')), `${file} must not inline a substitute mark`);
  }
});
