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
/** Only these two services may CONFIGURE a client from the emulator env (each with its own fail-closed contract). */
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
/**
 * Dev evolved three more emulator-env readers; each is a REFUSAL/CONSISTENCY
 * read (never client configuration) and must carry its verified contract:
 *   - overview store: the emulator realm is fenced to the disposable test
 *     schema, and any emulator outside test mode throws;
 *   - production runtime: production refuses every emulator env outright;
 *   - provision links: the runtime mode must AGREE with the intent's declared
 *     firestoreMode or the provision conflicts (409).
 */
const EMULATOR_REFUSERS = {
  'overview/product-overview.store.ts': [
    'No emulator realm may reuse the live bare-UID schema',
    'demo-visionary-kan42',
  ],
  'platform/production-runtime.ts': [
    'Production cannot use an emulator.',
  ],
  'workspaces/firestore-provision-links.ts': [
    "throw new ProvisionError('CONFLICT', 409)",
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
      if (readsEmulator && !EMULATOR_READERS_ALLOWED.includes(rel) && !EMULATOR_REFUSERS[rel]) {
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
  for (const [rel, markers] of Object.entries(EMULATOR_REFUSERS)) {
    let src;
    try { src = readFileSync(resolve(base, rel), 'utf8'); } catch { problems.push(`registered emulator refuser is missing: ${rel}`); continue; }
    for (const marker of markers) {
      if (!src.includes(marker)) problems.push(`refusal contract marker missing in ${rel}: "${marker.slice(0, 60)}…"`);
    }
  }
  return { check: 'backend-emulator-gating', problems };
}

export function checkFrontendFixtureGating(repoRoot) {
  const problems = [];
  const appClient = readFileSync(resolve(repoRoot, 'frontend/src/api/appClient.js'), 'utf8');
  const app = readFileSync(resolve(repoRoot, 'frontend/src/App.jsx'), 'utf8');
  // The demo client surface was REMOVED from appClient.js upstream (dev): no
  // enterDemo method, no demoFixtures import — absent is stronger than gated.
  if (/enterDemo|demoFixtures/.test(appClient)) {
    problems.push('appClient.js carries a demo surface; the client must have none (removed upstream)');
  }
  // The demo route is removed from App.jsx upstream; if it ever returns it
  // must be statically DEV-only again.
  if (/DemoPreview/.test(app) && !/import\.meta\.env\.DEV \? lazy\(\(\) => import\('@\/pages\/DemoPreview'\)\) : null/.test(app)) {
    problems.push('the DemoPreview route is not statically DEV-only in App.jsx');
  }
  // NO production activation path may reference the fixture surface: dev
  // removed both callers (the demo client method and the demo route), so no
  // src file outside workspaceService itself may import seedDemo /
  // scenarioPersonas / demoFixtures — the fictional data is then unreachable
  // in the production graph and the real-build dist scan proves the
  // elimination empirically. (The SCOPE-06 test fixtures seed through
  // seedDemo from frontend/tests — a test-only consumer, never shipped.)
  const srcRoot = resolve(repoRoot, 'frontend/src');
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!/\.(ts|tsx|js|jsx)$/.test(name)) continue;
      const rel = full.slice(srcRoot.length + 1).replace(/\\/g, '/');
      if (rel === 'services/workspaceService.ts' || rel === 'api/demoFixtures.js') continue;
      const src = readFileSync(full, 'utf8');
      if (/seedDemo|scenarioPersonas|demoFixtures/.test(src)) {
        problems.push(`production activation path references the fixture surface: ${rel}`);
      }
    }
  };
  walk(srcRoot);
  return { check: 'frontend-fixture-gating', problems };
}

export function checkBuiltDist(repoRoot, distDir) {
  const problems = [];
  /* Activation-surface markers only: the @visionary.test placeholders in Children/FamilyBilling are inert UI copy (recorded as a product note, not a purity failure). */
  const markers = ['demoFixtures', 'seedConnectedFixtures', 'DemoPreview', 'seedDemo', 'scenarioPersonas', 'demoStages'];
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
