// RELEASE-04 (KAN-127) per-completed-task economics law suite.
//
// Fast, emulator-free pins on:
//   - the unit-economics attribution law (failed attempts charge provider cost
//     but are never completed tasks; the denominator is completed-only),
//   - the fail-closed beta provenance discipline (a measured claim must record
//     its window/population),
//   - latency/error-budget measurement against the documented envelopes,
//   - quality only from pinned rubric/source/model versions,
//   - the enforced spend-admission decision (no "warn but allow" mode).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveTaskEconomics, spendAdmissionDecision, taskEconomicsToReport, summarizeHistogram } from '../per-task-economics.mjs';

const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/task-economics.synthetic.json', import.meta.url)));

test('histogram summary derives mean/p95 only from buckets and rejects malformed shapes', () => {
  const s = summarizeHistogram([{ value: 1, count: 3 }, { value: 10, count: 1 }]);
  assert.equal(s.mean, 3.25);
  assert.equal(s.p95, 10);
  assert.throws(() => summarizeHistogram([]), /non-empty/i);
  assert.throws(() => summarizeHistogram([{ value: -1, count: 1 }]), /Invalid histogram/i);
  assert.throws(() => summarizeHistogram([{ value: 1, count: 0.5 }]), /positive integer/i);
});

test('unit-economics law: failed attempts charge provider cost but never complete', () => {
  const r = deriveTaskEconomics(fixture);
  // provider cost = mean per attempt (0.004) x ALL attempts (48000 + 4560)
  assert.equal(r.economics.providerTotal.value, 0.004 * (48000 + 4560));
  assert.equal(r.economics.completedTasks.value, 48000);
  assert.equal(r.economics.failedAttempts.value, 4560);
  // attributable total = provider + storage + egress + support + operations
  const expectedTotal = 0.004 * (48000 + 4560) + 320 + 240 + 150 + 90;
  assert.equal(r.economics.attributableTotal.value, expectedTotal);
  assert.equal(r.economics.costPerCompletedTask.value, expectedTotal / 48000);
  assert.equal(r.counts.completed, 48000);
  assert.equal(r.counts.failed, 4560);
  assert.equal(r.counts.attempts, 52560);
});

test('failure share equals failed / attempts and is reported for the error budget', () => {
  const r = deriveTaskEconomics(fixture);
  assert.ok(Math.abs(r.errorBudget.failureSharePerTask.value - 4560 / 52560) < 1e-12);
  assert.ok(Math.abs(r.errorBudget.allowedMinutesPerMonth - 43.2) < 1e-9, `43.2 minutes exactly, got ${r.errorBudget.allowedMinutesPerMonth}`);
  assert.equal(r.errorBudget.objective, 0.999);
});

test('latency budgets: p95 measured against the documented transport/backend envelopes', () => {
  const r = deriveTaskEconomics(fixture);
  // p95 = smallest histogram bucket whose cumulative share reaches 0.95: with
  // [2 x40000, 8 x7800, 19 x200] over 48000, cumulative hits 0.95 at the 8s
  // bucket (0.9958 after it), so p95 is 8 — under both envelopes.
  assert.equal(r.latencyBudget.observedTransportP95.value, 8);
  assert.equal(r.latencyBudget.withinTransportBudget, true);
  assert.equal(r.latencyBudget.observedBackendP95.value, 7);
  assert.equal(r.latencyBudget.withinBackendBudget, true);
  assert.equal(r.latencyBudget.transportSeconds, 20);
  assert.equal(r.latencyBudget.backendSeconds, 18);
  // a transport p95 past the budget must be marked outside the envelope
  const over = deriveTaskEconomics({ ...fixture, latency: { transportSecondsHistogram: [{ value: 25, count: 100 }], backendSecondsHistogram: [{ value: 19, count: 100 }] } });
  assert.equal(over.latencyBudget.withinTransportBudget, false);
  assert.equal(over.latencyBudget.withinBackendBudget, false);
});

test('quality is only measured with pinned rubric/source/model versions', () => {
  const r = deriveTaskEconomics(fixture);
  assert.ok(r.quality);
  assert.ok(Math.abs(r.quality.usefulRate.value - 45600 / 48000) < 1e-12);
  assert.equal(r.quality.reviewedIndependently, true);
  assert.equal(r.quality.heldOut, true);
  // missing pins -> refuse, never silently adopt
  assert.throws(() => deriveTaskEconomics({ ...fixture, quality: { ...fixture.quality, modelVersion: undefined } }), /pinned rubric\/source\/model/i);
  assert.throws(() => deriveTaskEconomics({ ...fixture, quality: { ...fixture.quality, usefulRateHistogram: [] } }), /useful-rate histogram/i);
});

test('beta provenance is fail-closed: a measured claim must record window and population', () => {
  // The synthetic fixture already carries capture metadata; a beta claim that
  // DROPS a required field must be refused.
  const beta = { ...fixture, capture: { ...fixture.capture, source: 'beta' } };
  delete beta.capture.windowStart;
  assert.throws(() => deriveTaskEconomics(beta), /capture.windowStart/i);
  const complete = { ...fixture, capture: { ...fixture.capture, source: 'beta' } };
  assert.equal(deriveTaskEconomics(complete).capture.measured, true);
  assert.throws(() => deriveTaskEconomics({ ...complete, capture: { ...complete.capture, daysCaptured: 0 } }), /positive activeUsers and daysCaptured/i);
});

test('spend admission is enforced, not alert-only: over-cap commits are refused, misconfigured cap refuses, off admits', () => {
  assert.equal(spendAdmissionDecision({ enabled: true, committed: 90, cap: 100, next: 15 }).admitted, false);
  assert.equal(spendAdmissionDecision({ enabled: true, committed: 90, cap: 100, next: 5 }).admitted, true);
  // a missing/invalid cap while enabled is a refusal, never "no limit"
  assert.equal(spendAdmissionDecision({ enabled: true, committed: 0, cap: null, next: 1 }).reason, 'misconfigured-cap');
  assert.equal(spendAdmissionDecision({ enabled: true, committed: 0, cap: 0, next: 1 }).reason, 'misconfigured-cap');
  // invalid-next refuses
  assert.equal(spendAdmissionDecision({ enabled: true, committed: 0, cap: 100, next: -1 }).reason, 'invalid-next');
  // not enabled admits (byte-identical default behavior)
  assert.equal(spendAdmissionDecision({ enabled: false, committed: 0, cap: null, next: 5 }).admitted, true);
});

test('taskEconomicsToReport keeps provenance and only carries measured cost shapes into overrides', () => {
  const r = deriveTaskEconomics(fixture);
  const report = taskEconomicsToReport(r);
  assert.ok(report.provenance.providerTotal.kind, 'distribution');
  assert.ok(report.provenance.costPerCompletedTask.kind, 'assumption');
  assert.equal(report.capture.source, 'synthetic');
  assert.equal(report.capture.measured, false);
  assert.equal(report.errorBudget.failureShare, 4560 / 52560);
});
