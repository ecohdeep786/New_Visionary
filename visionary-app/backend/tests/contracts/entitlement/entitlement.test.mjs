/**
 * ROLE-09 (KAN-101) — entitlement reconciles ONLY with real approved
 * commercial contracts; a seat-request preview cannot invent institutional
 * billing or administrative authority.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));
const { EntitlementService } = req('./dist/src/entitlement/entitlement-service.js');
const { InMemoryEntitlementStore } = req('./dist/src/entitlement/entitlement-lookups.js');

const COMPANY = { uid: 'company_acme', workspaceId: 'ws_company_acme' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_company_acme' };
const VALID = { companyId: 'company_acme', seats: 10, validFrom: '2026-11-01T00:00:00Z', validTo: '2027-11-01T00:00:00Z', approvedBy: 'approver_commercial' };

async function makeService() {
  const store = new InMemoryEntitlementStore();
  const service = new EntitlementService(store);
  return { store, service };
}

test('no invented billing: a preview with NO approved contract reports honestly and creates NO billing artifact', async () => {
  const { store, service } = await makeService();
  const preview = await service.previewSeatRequest('company_acme', 5);
  assert.equal(preview.entitled, false);
  assert.equal(preview.reason, 'no_approved_contract');
  assert.equal(preview.billingArtifactCreated, false);
  // The store has no invoice/billing write path — only contracts and requests exist.
  assert.equal((await service.reconcile('company_acme')).entitledSeats, 0);
  void store;
});

test('a seat request without a contract stays a REQUEST (pending, no entitlement, sponsor-only)', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.requestSeats(STRANGER, 'company_acme', 5),
    (e) => e.code === 'sponsor_only',
  );
  const request = await service.requestSeats(COMPANY, 'company_acme', 5);
  assert.equal(request.status, 'pending_approval');
  assert.equal(request.contractId, null);
});

test('real contract binding: seats within an approved valid contract are entitled with contract provenance', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.recordContract(STRANGER, VALID),
    (e) => e.code === 'sponsor_only',
  );
  const contractId = await service.recordContract(COMPANY, VALID);
  const request = await service.requestSeats(COMPANY, 'company_acme', 5);
  assert.equal(request.status, 'entitled');
  assert.equal(request.contractId, contractId);
});

test('seat bound and expiry: beyond the contract seats refuses; an expired contract refuses', async () => {
  const { service } = await makeService();
  await service.recordContract(COMPANY, VALID);
  await assert.rejects(
    () => service.requestSeats(COMPANY, 'company_acme', 11),
    (e) => e.code === 'contract_seat_bound_exceeded',
  );
  const { service: expired } = await makeService();
  await expired.recordContract(COMPANY, { ...VALID, validFrom: '2025-11-01T00:00:00Z', validTo: '2026-01-01T00:00:00Z' });
  await assert.rejects(
    () => expired.requestSeats(COMPANY, 'company_acme', 5),
    (e) => e.code === 'contract_expired',
  );
});

test('no administrative authority from a request: the attempt always refuses', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.attachAdministrativeAuthority(),
    (e) => e.code === 'no_administrative_authority_from_request',
  );
});

test('reconciliation report is deterministic and honest about the bound', async () => {
  const { service } = await makeService();
  await service.recordContract(COMPANY, VALID);
  await service.requestSeats(COMPANY, 'company_acme', 8);
  const report = await service.reconcile('company_acme');
  assert.equal(report.contractSeats, 10);
  assert.equal(report.requestedSeats, 8);
  assert.equal(report.entitledSeats, 8);
  assert.equal(report.overBound, 0);
  const again = await service.reconcile('company_acme');
  assert.equal(JSON.stringify(report), JSON.stringify(again));
});
