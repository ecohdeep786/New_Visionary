/**
 * DATA-09 — approved age/admission and guardian-first account/linking workflow.
 *
 * Critical invariants proven here:
 *   1. A client-supplied age or role flag NEVER establishes admission.
 *   2. An adult (verified server birthYear >= 18) is admitted.
 *   3. A supported minor (13..17) is NOT admitted until a verified guardian
 *      account has linked them (guardian-first). Until then every sensitive
 *      operation is denied.
 *   4. An unsupported user (no verified birth registry entry, or below the
 *      supported minimum) is blocked; no role flag converts them.
 *   5. A minor cannot link themselves or fabricate a guardian.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { AdmissionService } = req('./dist/src/admission/admission.service.js');
const { InMemoryAdmissionStore } = req('./dist/src/admission/admission-store.js');

function setup() {
  const s = new InMemoryAdmissionStore();
  const svc = new AdmissionService(s, { now: () => new Date('2026-10-25T10:00:00Z') });
  return { s, svc };
}

test('DATA-09 adult: verified adult is admitted without a guardian', async () => {
  const { s, svc } = setup();
  s.seedBirth('uid-adult', 2000);
  const out = await svc.admit({ uid: 'uid-adult', birthYear: 2000, claimedAge: 99, roleHint: 'member' });
  assert.equal(out.decision, 'adult');
  assert.equal(out.status, 'admitted');
  assert.match(out.reason, /adult/i);
});

test('DATA-09 deny: client-claimed age alone NEVER admits (no verified birth registry entry)', async () => {
  const { svc } = setup();
  const out = await svc.admit({ uid: 'uid-forged', birthYear: null, claimedAge: 30, roleHint: 'member' });
  assert.equal(out.decision, 'unsupported');
  assert.equal(out.status, 'blocked');
  assert.match(out.reason, /client age cannot establish/i);
});

test('DATA-09 deny: a role flag cannot convert an unsupported/minor account (guardian-first)', async () => {
  const { s, svc } = setup();
  s.seedBirth('uid-minor', 2014); // age 12 -> below supported minimum
  const out = await svc.admit({ uid: 'uid-minor', birthYear: 2014, claimedAge: 16, roleHint: 'owner' });
  assert.equal(out.decision, 'minor_blocked');
  assert.equal(out.status, 'blocked');
  assert.match(out.reason, /client role flags cannot change/i);
});

test('DATA-09 supported minor: needs a verified guardian link; sensitive op denied until linked', async () => {
  const { s, svc } = setup();
  s.seedBirth('uid-teen', 2012); // age 14 -> supported minor
  const first = await svc.admit({ uid: 'uid-teen', birthYear: 2012, claimedAge: 14, roleHint: null });
  assert.equal(first.status, 'pending_guardian');
  // Sensitive operations gate denies.
  await assert.rejects(svc.requireAdmitted('uid-teen'), (e) => e.code === 'minor_needs_guardian');

  // Guardian-first: the verified guardian requests + confirms the link.
  const request = await svc.requestLink('guardian-1', 'uid-teen', 2012);
  assert.equal(request.state, 'requested');
  await svc.confirmLink('guardian-1', 'uid-teen');
  const after = await svc.admit({ uid: 'uid-teen', birthYear: 2012, claimedAge: 14, roleHint: null });
  assert.equal(after.status, 'admitted');
  assert.equal(after.decision, 'minor_linked');
  await svc.requireAdmitted('uid-teen'); // now passes
});

test('DATA-09 deny: a minor cannot link themselves or fabricate a guardian', async () => {
  const { s, svc } = setup();
  s.seedBirth('uid-teen', 2012);
  await assert.rejects(svc.requestLink('uid-teen', 'uid-teen', 2012), (e) => e.code === 'wrong_parties');
  // A non-guardian cannot confirm a link requested by another guardian.
  const link = await svc.requestLink('guardian-1', 'uid-teen', 2012);
  assert.equal(link.guardianUid, 'guardian-1');
  await assert.rejects(svc.confirmLink('imposter', 'uid-teen'), (e) => e.code === 'guardian_required');
  await assert.rejects(svc.denyLink('imposter', 'uid-teen'), (e) => e.code === 'guardian_required');
});

test('DATA-09 guardian-first: a supported minor without any guardian link stays blocked for sensitive ops', async () => {
  const { s, svc } = setup();
  s.seedBirth('uid-teen', 2011); // age 15
  await svc.admit({ uid: 'uid-teen', birthYear: 2011, claimedAge: 15, roleHint: 'member' });
  const status = await s.admissionStatus('uid-teen');
  assert.equal(status, 'pending_guardian');
  await assert.rejects(svc.requireAdmitted('uid-teen'), (e) => e.code === 'minor_needs_guardian');
});

test('DATA-09 deny: already-linked minor cannot be linked twice (idempotent/cancelled work checked)', async () => {
  const { s, svc } = setup();
  s.seedBirth('uid-teen', 2012);
  await svc.requestLink('guardian-1', 'uid-teen', 2012);
  await svc.confirmLink('guardian-1', 'uid-teen');
  await assert.rejects(svc.confirmLink('guardian-1', 'uid-teen'), (e) => e.code === 'already_linked');
  await assert.rejects(svc.requestLink('guardian-2', 'uid-teen', 2012), (e) => e.code === 'already_linked');
});

test('DATA-09 invalid subject: bad uid or undefined input is rejected and nothing is admitted', async () => {
  const { s, svc } = setup();
  s.seedBirth('uid-ok', 1990);
  await assert.rejects(svc.admit(null), (e) => e.code === 'invalid_subject');
  await assert.rejects(svc.admit({ uid: 'bad uid!', birthYear: 1990, claimedAge: 36, roleHint: null }), (e) => e.code === 'invalid_subject');
  const status = await s.admissionStatus('uid-ok');
  assert.ok(status === null || status === undefined);
});
