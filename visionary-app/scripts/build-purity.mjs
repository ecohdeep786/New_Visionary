// ACCEPT-06 (KAN-122) — production build purity: production builds cannot
// activate fictional data, fixture routes, emulator bypasses or legacy
// startup. Verified against the REAL product facts:
//   - frontend: the demo/fixture surface is DEV-only (DemoPreview route is
//     `import.meta.env.DEV ? lazy(...) : null`; enterDemo throws outside DEV,
//     admits only fictional demo-* @visionary.test accounts, and dynamically
//     imports demoFixtures) — so a PRODUCTION BUNDLE must contain neither the
//     DemoPreview chunk nor the demoFixtures module,
//   - backend: the Firestore emulator is fail-closed (live auth REFUSES an
//     emulator, emulator mode requires an explicit loopback host and prohibits
//     live fallback) and ONLY the two firebase services may read the emulator
//     env at all.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const BACKEND_SRC = 'backend/upstream/backend/src';
const EMULATOR_READERS_ALLOWED = [
  'auth/firebase/firebase-admin.service.ts',
  'auth/firebase-product/firebase-product.service.ts',
];
/** Each allowed reader carries ITS OWN fail-closed contract (verified against the real sources). */
const FAIL_CLOSED_MARKERS = {
  'auth/firebase-product/firebase-product.service.ts': [
    'Live authentication cannot use a Firestore emulator',
    'Firestore emulator mode requires an explicit loopback host; live fallback is prohibited',
  ],
  'auth/firebase/firebase-admin.service.ts': [
    'Auth Emulator configuration cannot be used with a live project or production runtime',
    'Emulator mode requires FIREBASE_AUTH_EMULATOR_HOST; live fallback is prohibited',
  ],
};

export function checkBackendEmulatorGating(repoRoot) {
  const problems = [];
  const base = resolve(repoRoot, BACKEND_SRC);
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!name.endsWith('.ts') || name.endsWith('.d.ts')) continue;
      const rel = full.slice(base.length + 1).replace(/\\/g, '/');
      const src = readFileSync(full, 'utf8');
      const readsEmulator = /FIRESTORE_EMULATOR_HOST|FIREBASE_AUTH_EMULATOR_HOST|USE_EMULATOR/.test(src);
      if (readsEmulator && !EMULATOR_READERS_ALLOWED.includes(rel)) {
        problems.push(`ungated emulator reader outside the allowed services: ${rel}`);
      }
    }
  };
  walk(base);
  for (const rel of EMULATOR_READERS_ALLOWED) {
    const src = readFileSync(resolve(base, rel), 'utf8');
    for (const marker of FAIL_CLOSED_MARKERS[rel]) {
      if (!src.includes(marker)) problems.push(`fail-closed marker missing in ${rel}: "${marker.slice(0, 60)}…"`);
    }
  }
  return { check: 'backend-emulator-gating', problems };
}

export function checkFrontendFixtureGating(repoRoot) {
  const problems = [];
  const appClient = readFileSync(resolve(repoRoot, 'frontend/src/api/appClient.js'), 'utf8');
  const app = readFileSync(resolve(repoRoot, 'frontend/src/App.jsx'), 'utf8');
  if (!/if \(!enterDemoDev\) throw new Error\('Demo account selection is available only in development\.'\)/.test(appClient)) {
    problems.push('enterDemo is not DEV-gated in appClient.js');
  }
  if (!/person\.id\.startsWith\('demo-'\)/.test(appClient) || !/person\.email\.endsWith\('@visionary\.test'\)/.test(appClient)) {
    problems.push('enterDemo does not restrict to fictional demo-* @visionary.test accounts');
  }
  if (!/await import\('\.\/demoFixtures\.js'\)/.test(appClient)) {
    problems.push('demoFixtures must be reached only through the DEV-gated dynamic import');
  }
  if (!/const enterDemoDev = import\.meta\.env\?\.DEV \? async function/.test(appClient) || !/scenarioPersonas = import\.meta\.env\?\.DEV \? \[/.test(readFileSync(resolve(repoRoot, 'frontend/src/services/workspaceService.ts'), 'utf8'))) {
    problems.push('the enterDemo implementation must be statically DEV-only (enterDemoDev) so production bundles eliminate it');
  }
  if (!/import\.meta\.env\.DEV \? lazy\(\(\) => import\('@\/pages\/DemoPreview'\)\) : null/.test(app)) {
    problems.push('the DemoPreview route is not statically DEV-only in App.jsx');
  }
  return { check: 'frontend-fixture-gating', problems };
}

export function checkBuiltDist(repoRoot, distDir) {
  const problems = [];
  /* Activation-surface markers only: the @visionary.test placeholders in Children/FamilyBilling are inert UI copy (recorded as a product note, not a purity failure). */
  const markers = ['demoFixtures', 'seedConnectedFixtures', 'DemoPreview', 'seedDemo', 'scenarioPersonas'];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!name.endsWith('.js')) continue;
      const src = readFileSync(full, 'utf8');
      for (const marker of markers) {
        if (src.includes(marker)) problems.push(`production bundle carries fixture surface "${marker}" in ${name}`);
      }
    }
  };
  walk(resolve(repoRoot, distDir));
  return { check: 'built-dist-purity', scanned: distDir, problems };
}
