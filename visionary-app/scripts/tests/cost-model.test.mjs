import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { estimate, runCharge, tieredCharge, renderReport } from '../cost-model.mjs';

const config = JSON.parse(fs.readFileSync(new URL('../../infrastructure/cost/launch-scenarios.json', import.meta.url)));
const rates = JSON.parse(fs.readFileSync(new URL('../../infrastructure/cost/rates-2026-10-15.json', import.meta.url)));
const scenario = overrides => ({ id: 'test', label: 'test', overrides });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('Mumbai Enterprise HA compute and storage are not multiplied by redundancy twice', () => {
  const result = estimate(config, rates, scenario({ sqlAllocatedGib: 100, sqlBackupUsedGib: 0 }));
  near(result.sqlCompute, 485.596);
  near(result.breakdown.sql, 526.396);
});

test('Identity Platform graduated tiers charge only the incremental MAU at each boundary', () => {
  near(tieredCharge(50000, rates.identity.tiers), 0);
  near(tieredCharge(100000, rates.identity.tiers), 275);
  near(tieredCharge(200000, rates.identity.tiers), 735);
  near(estimate(config, rates, scenario({ identityPlatformEnabled: false })).breakdown.identity, 0);
});

test('CDN traffic crosses tier boundaries without charging all bytes at one rate', () => {
  near(tieredCharge(10240, rates.cdn.outboundGibTiers), 921.6);
  near(tieredCharge(11264, rates.cdn.outboundGibTiers), 983.04);
  near(tieredCharge(0, rates.cdn.outboundGibTiers), 0);
});

test('revenue uses exact annual totals and charges a Family payer once', () => {
  near(estimate(config, rates, scenario({ paidPersonalAccounts: 12, paidFamilyAccounts: 12, annualPayerFraction: 1 })).normalizedRevenueInr, 7980);
  near(estimate(config, rates, scenario({ paidPersonalAccounts: 0, paidFamilyAccounts: 1, annualPayerFraction: 0 })).normalizedRevenueInr, 499);
});

test('billing payers are independent of monthly active users', () => {
  const value = estimate(config, rates, scenario({ mau: 100, paidPersonalAccounts: 200, paidFamilyAccounts: 0, annualPayerFraction: 0 }));
  near(value.normalizedRevenueInr, 59800);
  assert.equal(value.mau, 100);
});

test('concurrency estimates billed instance time and minimum idle is not added twice', () => {
  const input = { requests: 1000, requestSeconds: 12000, effectiveConcurrency: 1, minInstances: 0, idleHoursPerDay: 0, vcpu: 2, gib: 2 };
  const first = runCharge(input, rates.run, config), second = runCharge({ ...input, effectiveConcurrency: 4 }, rates.run, config);
  near(second.activeSeconds, first.activeSeconds / 4);
  const requestsCost = input.requests / 1e6 * rates.run.millionRequests;
  near(first.cost - requestsCost, (second.cost - requestsCost) * 4);
  const idle = runCharge({ ...input, requests: 0, requestSeconds: 0, minInstances: 2, idleHoursPerDay: 12 }, rates.run, config);
  near(idle.idleSeconds, 2 * config.hoursPerMonth * 3600);
});

test('model retry amplification affects tokens and expensive media is separately counted', () => {
  const growth = estimate(config, rates, scenario({}));
  assert.equal(growth.turns, 2400000);
  assert.equal(growth.coreRequests, 36000000);
  assert.equal(growth.attempts, 2640000);
  assert.equal(growth.inputTokens, 7920000000);
  const video = estimate(config, rates, scenario({ ownedVideoMinutesPerMau: 120 }));
  assert.equal(video.cdnGib - growth.cdnGib, 240000);
  assert.ok(video.breakdown.cdn > growth.breakdown.cdn);
});

test('negative, nonfinite, mistyped and misspelled cost assumptions fail closed', () => {
  for (const overrides of [{ mau: -1 }, { mau: NaN }, { premiumRouteFraction: 1.1 }, { apiEffectiveConcurrency: 0 }, { providerAttemptMultiplier: 0.5 }, { identityPlatformEnabled: 'true' }, { typoModelPrice: 1 }]) {
    assert.throws(() => estimate(config, rates, scenario(overrides)));
  }
  assert.throws(() => tieredCharge(Infinity, rates.identity.tiers));
});

test('zero usage stays finite, and the report preserves qualified totals and unit precision', () => {
  const zero = estimate(config, rates, scenario({ mau: 0, paidPersonalAccounts: 0, paidFamilyAccounts: 0, apiMinInstances: 0, aiMinInstances: 0 }));
  assert.equal(zero.costPerMau, null);
  assert.equal(zero.aiCostPerTurn, null);
  assert.ok(Number.isFinite(zero.total));
  const results = config.scenarios.map(s => estimate(config, rates, s));
  const markdown = renderReport(config, rates, results);
  assert.match(markdown, /not a current exchange-rate quote/);
  assert.match(markdown, /Model charge \/ logical turn.*\$0\.\d{5}/);
  for (const result of results) assert.ok(Number.isFinite(result.total) && result.total > 0);
});

test('checked-in scenario report matches the calculator and dated inputs exactly', () => {
  const expected = renderReport(config, rates, config.scenarios.map(s => estimate(config, rates, s)));
  const actual = fs.readFileSync(new URL('../../docs/architecture/blueprint/COST_SCENARIOS.md', import.meta.url), 'utf8');
  assert.equal(actual.replaceAll('\r\n', '\n'), expected);
});
