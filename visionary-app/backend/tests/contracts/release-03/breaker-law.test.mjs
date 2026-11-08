// RELEASE-03 (KAN-126) provider circuit breaker law unit tests.
//
// Fast, emulator-free pins on the billing provider circuit breaker state machine
// (threshold, cooling window, half-open probe, re-open, disable). They run
// against the compiled product module, so they exercise exactly what ships. The
// live end-to-end proof (quotas, tenant fairness, fail-closed dependency failure,
// the Retry-After header law, and queue drain) lives in
// admission-ceilings.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(here, '../../../..');
const backendRequire = createRequire(path.join(productRoot, 'backend/upstream/backend/package.json'));
const { ProviderCircuitBreaker } = backendRequire('./dist/src/billing/provider-circuit-breaker.js');
const { ConfigService } = backendRequire('@nestjs/config');

// A long cooling window keeps an opened breaker refusing (no probe admitted);
// a zero window admits the single half-open probe on the next call.
const LONG_COOLING = '3600000';
const breaker = (coolingMs = '0', overrides = {}) => new ProviderCircuitBreaker(new ConfigService({
  BILLING_PROVIDER_BREAKER_COOLING_MS: coolingMs, ...overrides,
}));

const isTyped503 = error => error?.getStatus?.() === 503;

/** Run `fn`, returning the thrown error; throw if the call was admitted. */
function refusal(fn) {
  try { fn(); } catch (error) { return error; }
  throw new Error('expected the call to be refused, but it was admitted');
}

/** Drive a breaker to the failure threshold and confirm the open state. */
function driveToOpen(circuit) {
  for (let index = 0; index < 3; index += 1) { circuit.admit(); circuit.settle(false); }
  assert.equal(circuit.snapshot().state, 'open', 'precondition: the breaker is open');
  return circuit;
}

test('the breaker stays closed below the failure threshold', () => {
  const circuit = breaker();
  circuit.admit(); circuit.settle(false);
  circuit.admit(); circuit.settle(false);
  assert.equal(circuit.snapshot().state, 'closed');
  assert.equal(circuit.snapshot().consecutiveFailures, 2);
});

test('the breaker opens at the third consecutive failure and refuses fast with a typed 503', () => {
  // Inside the cooling window the breaker must refuse without calling out.
  const circuit = driveToOpen(breaker(LONG_COOLING));
  const snapshot = circuit.snapshot();
  assert.equal(snapshot.consecutiveFailures, 3);
  const error = refusal(() => circuit.admit());
  assert.ok(isTyped503(error), `an open breaker must refuse with a typed 503, got ${error?.constructor?.name}`);
  assert.match(String(error.message), /temporarily unavailable/i);
});

test('a success resets the failure count while closed', () => {
  const circuit = breaker();
  circuit.admit(); circuit.settle(false);
  circuit.admit(); circuit.settle(false);
  circuit.admit(); circuit.settle(true);
  assert.equal(circuit.snapshot().state, 'closed');
  // The next failure must not open: the counter was reset by the success.
  circuit.admit(); circuit.settle(false);
  assert.equal(circuit.snapshot().state, 'closed');
  assert.equal(circuit.snapshot().consecutiveFailures, 1);
});

test('a long cooling window keeps the breaker open (no premature probe)', () => {
  const circuit = driveToOpen(breaker(LONG_COOLING));
  // Every call within the window is refused; the state never leaves `open`.
  for (let index = 0; index < 3; index += 1) {
    assert.ok(isTyped503(refusal(() => circuit.admit())), 'within the cooling window the breaker must still refuse');
    assert.equal(circuit.snapshot().state, 'open');
  }
});

test('after the cooling window a single half-open probe is admitted, and its success closes the breaker', () => {
  const circuit = driveToOpen(breaker('0'));
  circuit.admit(); // window elapsed -> transitions to half_open and admits the probe
  assert.equal(circuit.snapshot().state, 'half_open');
  circuit.settle(true);
  assert.equal(circuit.snapshot().state, 'closed');
  assert.equal(circuit.snapshot().consecutiveFailures, 0);
  assert.equal(circuit.snapshot().openedAt, null);
});

test('a failed half-open probe re-opens the breaker and counts the re-open', () => {
  const circuit = driveToOpen(breaker('0'));
  const reopenedBefore = circuit.snapshot().reopened;
  circuit.admit(); // half-open probe
  circuit.settle(false);
  const snapshot = circuit.snapshot();
  assert.equal(snapshot.state, 'open');
  assert.equal(snapshot.reopened, reopenedBefore + 1);
});

test('only one half-open probe is admitted at a time', () => {
  const circuit = driveToOpen(breaker('0'));
  circuit.admit(); // the single probe, left in flight (no settle yet)
  assert.equal(circuit.snapshot().state, 'half_open');
  const error = refusal(() => circuit.admit());
  assert.ok(isTyped503(error), `a second concurrent probe must be refused with a typed 503, got ${error?.constructor?.name}`);
  assert.match(String(error.message), /recovering/i);
});

test('the breaker can be explicitly disabled for a controlled test composition', () => {
  const circuit = breaker('0', { BILLING_PROVIDER_BREAKER: 'disabled' });
  for (let index = 0; index < 5; index += 1) { circuit.admit(); circuit.settle(false); }
  assert.equal(circuit.snapshot().state, 'closed', 'a disabled breaker never opens');
  circuit.admit(); // must not throw
});

test('an invalid cooling-window value falls back to the documented default instead of disabling protection', () => {
  // A negative or non-numeric value must not be read as "no cooling": the breaker
  // keeps the shipped default, so it still refuses immediately after opening.
  for (const value of ['-1', 'abc', '']) {
    const circuit = driveToOpen(breaker(value));
    const error = refusal(() => circuit.admit());
    assert.ok(isTyped503(error), `cooling value ${JSON.stringify(value)} must not disable the open window`);
  }
});
