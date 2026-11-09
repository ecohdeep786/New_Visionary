// RELEASE-04 (KAN-127) enforced spend-admission law suite.
//
// Fast, emulator-free pins on the product's spend-admission gate
// (BillingSpendAdmission), which enforces a configured spend cap with a typed
// 503 — never an alert. It runs against the compiled product module, so it
// exercises exactly what ships. The per-completed-task economics the gate
// admits against is measured by scripts/per-task-economics.mjs; the real
// provider/model cost figures remain a hosted gate.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(here, '../../../..');
const backendRequire = createRequire(path.join(productRoot, 'backend/upstream/backend/package.json'));
const { BillingSpendAdmission } = backendRequire('./dist/src/billing/spend-admission.js');
const { ConfigService } = backendRequire('@nestjs/config');

const gate = (overrides = {}) => new BillingSpendAdmission(new ConfigService({
  BILLING_SPEND_ADMISSION: 'enabled', BILLING_SPEND_ADMISSION_CAP: '100', ...overrides,
}));
const isTyped503 = error => error?.getStatus?.() === 503;

/** Run `fn`, returning the thrown error; throw if the call was admitted. */
function refusal(fn) {
  try { fn(); } catch (error) { return error; }
  throw new Error('expected the call to be refused, but it was admitted');
}

test('the gate is off (byte-identical behavior) unless enforcement is explicitly enabled', () => {
  const off = new BillingSpendAdmission(new ConfigService({ BILLING_SPEND_ADMISSION_CAP: '100' }));
  assert.equal(off.snapshot().state, 'off');
  assert.equal(off.admit(1000), true, 'no enforcement configured means current behavior: admit');
  assert.equal(off.snapshot().admitted, 0, 'an off gate records no admissions');
  off.settle(1000);
  assert.equal(off.snapshot().committed, 0);
});

test('within the enforced cap: admissions are reserved and counted', () => {
  const g = gate();
  assert.equal(g.snapshot().state, 'enforcing');
  assert.equal(g.snapshot().cap, 100);
  assert.equal(g.admit(40), true);
  assert.equal(g.admit(40), true);
  assert.equal(g.snapshot().committed, 80);
  assert.equal(g.snapshot().admitted, 2);
});

test('an admission that would exceed the cap is refused with a typed 503, never an alert', () => {
  const g = gate();
  g.admit(80);
  const error = refusal(() => g.admit(30));
  assert.ok(isTyped503(error), `over-cap admission must be a typed 503, got ${error?.constructor?.name}`);
  assert.equal(g.snapshot().refused, 1);
  assert.equal(g.snapshot().committed, 80, 'refusal must not consume reserved spend');
});

test('an enforced gate with a misconfigured cap is fail-closed: refuse, never "no limit"', () => {
  for (const cap of [undefined, '', '0', '-5', 'abc']) {
    const g = new BillingSpendAdmission(new ConfigService({ BILLING_SPEND_ADMISSION: 'enabled', BILLING_SPEND_ADMISSION_CAP: cap }));
    const error = refusal(() => g.admit(1));
    assert.ok(isTyped503(error), `cap=${JSON.stringify(cap)} must refuse with a typed 503`);
    assert.equal(g.snapshot().refused, 1);
  }
});

test('a non-finite or negative admitted amount is refused without consuming reserve', () => {
  const g = gate();
  refusal(() => g.admit(-1));
  refusal(() => g.admit(Infinity));
  refusal(() => g.settle(-1));
  assert.equal(g.snapshot().refused, 2);
  assert.equal(g.snapshot().committed, 0);
});

test('settle releases reserved spend after an operation that did not complete', () => {
  const g = gate();
  g.admit(40);
  g.settle(40);
  assert.equal(g.snapshot().committed, 0);
  g.admit(90);
  assert.equal(g.snapshot().committed, 90);
  g.settle(90);
  assert.equal(g.snapshot().committed, 0);
  // a settle that would over-release clamps at zero
  g.settle(50);
  assert.equal(g.snapshot().committed, 0);
});
