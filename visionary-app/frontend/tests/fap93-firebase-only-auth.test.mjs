/** FAP-93 — Firebase (visionary-research) is the only identity authority.
 *
 *  Before FAP-93 (beta 1e25f633) the appClient carried a complete local auth
 *  fallback: credential accounts and sessions in localStorage
 *  (visionary_users / visionary_sessions / visionary_session_token), a
 *  simulated OTP register step, local reset tokens, and a per-uid preview
 *  entity namespace (visionary_firebase_preview_<uid>_<Entity>) that forked
 *  the shared visionary_entity_<Entity> store the rest of the product reads.
 *
 *  The law, enforced at the source level so the fallback cannot silently
 *  return:
 *   1. Credentials, sessions and reset tokens never persist anywhere in src —
 *      identity comes only from the connected Firebase adapter's server
 *      session.
 *   2. No src page branches on an auth "mode" — there is exactly one runtime.
 *   3. The preview identity seam (previewSignIn) is exported by appClient for
 *      node tests/preview fixtures alone; production modules never import it,
 *      and production uses the Firebase adapter directly.
 *   4. Entities live in one shared namespace (visionary_entity_<Entity>), the
 *      namespace every classroom/workspace service reads — no per-uid fork.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const srcFiles = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) srcFiles.push(path);
  }
};
walk(join(root, "src"));
const read = path => ({ path, source: readFileSync(path, "utf8") });
const sources = srcFiles.map(read);
const appClient = read(join(root, "src/api/appClient.js"));
const relative = path => path.slice(root.length).replace(/\\/g, '/');

test("FAP-93: credentials, sessions and reset tokens never persist in src", () => {
  for (const { path, source } of sources) {
    assert.doesNotMatch(source, /visionary_users|visionary_sessions|visionary_session_token|visionary_reset/,
      `${relative(path)} keeps no local credential/session/reset store`);
  }
});

test("FAP-93: no src branch picks an auth mode — one connected runtime only", () => {
  for (const { path, source } of sources) {
    assert.doesNotMatch(source, /firebaseAuthEnabled/, `${relative(path)} has no local-auth mode flag`);
    assert.doesNotMatch(source, /auth\.source/, `${relative(path)} must not branch on an auth source`);
  }
});

test("FAP-93: the preview identity seam is appClient-only and test-facing", () => {
  for (const { path, source } of sources) {
    if (relative(path) === 'src/api/appClient.js') continue;
    assert.doesNotMatch(source, /previewSignIn/, `${relative(path)} must not import the preview identity seam`);
  }
  assert.match(appClient.source, /if \(import.meta.env && !import.meta.env.DEV\) throw/);
  assert.match(appClient.source, /auth: import.meta.env\?\.PROD \? firebaseAuth/);
});

test("FAP-93: entities live in one shared namespace with no per-uid fork", () => {
  for (const { path, source } of sources) {
    assert.doesNotMatch(source, /visionary_firebase_preview/, `${relative(path)} keeps no per-uid entity namespace`);
  }
  assert.match(appClient.source, /const entityKey = \(name\) => `visionary_entity_\$\{name\}`;/,
    "one entity namespace shared by appClient and every workspace service");
});
