import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function tieredCharge(units, tiers) {
  if (!Number.isFinite(units) || units < 0) throw new Error('Units must be finite and non-negative.');
  let previous = 0, result = 0;
  for (const tier of tiers) {
    const upper = tier.upTo ?? Infinity;
    if (!Number.isFinite(tier.rate) || tier.rate < 0 || upper <= previous) throw new Error('Invalid rate tier.');
    result += Math.max(0, Math.min(units, upper) - previous) * tier.rate;
    if (units <= upper) return result;
    previous = upper;
  }
  throw new Error('Rate tiers do not cover the workload.');
}

function nonnegativeNumbers(value, label) {
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'number' && (!Number.isFinite(item) || item < 0)) throw new Error(`${label}.${key} must be finite and non-negative.`);
    if (item && typeof item === 'object') nonnegativeNumbers(item, `${label}.${key}`);
  }
}

export function runCharge({ requests, requestSeconds, effectiveConcurrency, minInstances, idleHoursPerDay, vcpu, gib }, rates, config, overhead = 1) {
  nonnegativeNumbers({ requests, requestSeconds, minInstances, idleHoursPerDay, vcpu, gib, overhead }, 'runtime');
  if (!Number.isFinite(effectiveConcurrency) || effectiveConcurrency <= 0) throw new Error('Concurrency must be positive.');
  const activeSeconds = requestSeconds / effectiveConcurrency * overhead;
  // Two explicit estimates: night/idle overlap and the minimum-instance month floor.
  // They are not added to each other; taking max avoids charging that idle floor twice.
  const idleSeconds = Math.max(minInstances * idleHoursPerDay * config.daysPerMonth * 3600,
    minInstances * config.hoursPerMonth * 3600 - activeSeconds, 0);
  return { activeSeconds, idleSeconds,
    cost: activeSeconds * (vcpu * rates.cpuSecond + gib * rates.gibSecond)
      + idleSeconds * (vcpu * rates.idleCpuSecond + gib * rates.idleGibSecond)
      + requests / 1e6 * rates.millionRequests };
}

export function estimate(config, rates, scenario) {
  if (config.schemaVersion !== 1 || rates.schemaVersion !== 1 || rates.currency !== 'USD') throw new Error('Unsupported cost schema/currency.');
  nonnegativeNumbers(config, 'config'); nonnegativeNumbers(rates, 'rates');
  const p = { ...config.base, ...scenario.overrides };
  for (const key of Object.keys(scenario.overrides)) if (!(key in config.base)) throw new Error(`Unknown scenario input: ${key}`);
  for (const [key, original] of Object.entries(config.base)) if (typeof p[key] !== typeof original) throw new Error(`Invalid input type: ${key}`);
  nonnegativeNumbers(p, 'scenario');
  for (const key of ['dailyActiveFraction', 'premiumRouteFraction', 'cdnFillFraction', 'annualPayerFraction', 'gatewayFeeFraction', 'feeTaxFractionAssumption', 'contingencyFraction']) {
    if (!Number.isFinite(p[key]) || p[key] > 1) throw new Error(`${key} must be between0 and1.`);
  }
  for (const key of ['daysPerMonth', 'hoursPerMonth', 'fxInrPerUsdAssumption']) if (!(config[key] > 0)) throw new Error(`${key} must be positive.`);
  for (const key of ['mau', 'paidPersonalAccounts', 'paidFamilyAccounts', 'apiMinInstances', 'aiMinInstances']) if (!Number.isSafeInteger(p[key])) throw new Error(`${key} must be an integer.`);
  if (p.minimumIdleHoursPerDay > 24 || p.providerAttemptMultiplier < 1 || p.runTimeOverheadMultiplier < 1) throw new Error('Invalid idle/overhead assumption.');
  const dau = p.mau * p.dailyActiveFraction;
  const coreRequests = dau * p.coreCallsPerDauDay * config.daysPerMonth;
  const turns = dau * p.aiTurnsPerDauDay * config.daysPerMonth;
  const attempts = turns * p.providerAttemptMultiplier;
  const apiRequests = coreRequests + turns;
  const inputTokens = attempts * p.inputTokensPerTurn, outputTokens = attempts * p.outputTokensPerTurn;
  const a = rates.assumptionsNotVendorQuotes;
  const inputRate = a.fastInputMillionTokens * (1 - p.premiumRouteFraction) + a.premiumInputMillionTokens * p.premiumRouteFraction;
  const outputRate = a.fastOutputMillionTokens * (1 - p.premiumRouteFraction) + a.premiumOutputMillionTokens * p.premiumRouteFraction;
  const ai = inputTokens / 1e6 * inputRate + outputTokens / 1e6 * outputRate;
  const apiRun = runCharge({ requests: apiRequests, requestSeconds: coreRequests * p.apiMeanCoreSeconds + turns * p.aiMeanSeconds,
    effectiveConcurrency: p.apiEffectiveConcurrency, minInstances: p.apiMinInstances, idleHoursPerDay: p.minimumIdleHoursPerDay, vcpu: 2, gib: 1 }, rates.run, config, p.runTimeOverheadMultiplier);
  const aiRun = runCharge({ requests: attempts, requestSeconds: attempts * p.aiMeanSeconds,
    effectiveConcurrency: p.aiEffectiveConcurrency, minInstances: p.aiMinInstances, idleHoursPerDay: p.minimumIdleHoursPerDay, vcpu: 2, gib: 2 }, rates.run, config, p.runTimeOverheadMultiplier);
  const jobs = p.mau * p.workerJobsPerMau;
  const workerRun = runCharge({ requests: jobs, requestSeconds: jobs * p.workerMeanSeconds,
    effectiveConcurrency: 1, minInstances: 0, idleHoursPerDay: 0, vcpu: 1, gib: 1 }, rates.run, config, p.runTimeOverheadMultiplier);
  const sqlCompute = config.hoursPerMonth * (p.sqlVcpu * rates.sql.haCpuHour + p.sqlMemoryGib * rates.sql.haGibHour);
  const sql = sqlCompute + p.sqlAllocatedGib * rates.sql.haSsdGibMonth + p.sqlBackupUsedGib * rates.sql.backupGibMonth;
  const reads = apiRequests * p.firestoreReadsPerApiRequest, writes = apiRequests * p.firestoreWritesPerApiRequest;
  const firestore = reads / 1e5 * rates.firestore.reads100k + writes / 1e5 * rates.firestore.writes100k
    + p.mau * p.firestoreDeletesPerMau / 1e5 * rates.firestore.deletes100k
    + p.firestoreStoredGib * rates.firestore.storedGibMonth + p.firestorePitrGib * rates.firestore.pitrGibMonth + p.firestoreBackupGib * rates.firestore.backupGibMonth;
  const storage = p.objectStoredGib * rates.storage.standardGibMonth + p.objectClassAOperations / 1000 * rates.storage.classA1000 + p.objectClassBOperations / 1000 * rates.storage.classB1000;
  const videoMinutes = p.mau * p.ownedVideoMinutesPerMau;
  const cdnGib = p.mau * p.publicDeliveredGibPerMau + videoMinutes * p.videoGibPerMinute;
  const cdn = tieredCharge(cdnGib, rates.cdn.outboundGibTiers) + cdnGib * p.cdnFillFraction * rates.cdn.fillGib
    + (p.mau * p.cdnLookupsPerMau + videoMinutes * p.videoSegmentsPerMinute) / 10000 * rates.cdn.lookups10000;
  const apiOutGib = (coreRequests * p.apiResponseKib + turns * p.aiResponseKib) / 1048576;
  const apiInGib = apiRequests * p.apiRequestKib / 1048576;
  const edge = config.hoursPerMonth * (rates.edge.globalForwardingRuleGroupHour + rates.edge.armorPolicyHour + p.armorRules * rates.edge.armorRuleHour)
    + apiRequests / 1e6 * rates.edge.armorMillionRequests
    + (apiInGib + apiOutGib) * a.globalAlbProcessedGib + apiOutGib * a.apiInternetEgressGib;
  const identity = p.identityPlatformEnabled ? tieredCharge(p.mau, rates.identity.tiers) : 0;
  const breakdown = { cloudRun: apiRun.cost + aiRun.cost + workerRun.cost, sql, firestore, objectStorage: storage, cdn, edgeAndApiTransfer: edge, identity, otherCloudAllowance: p.otherCloudAllowanceUsd };
  const platform = Object.values(breakdown).reduce((sum, cost) => sum + cost, 0);
  const revenueInr = p.paidPersonalAccounts * (p.personalMonthlyInr * (1 - p.annualPayerFraction) + p.personalAnnualInr / 12 * p.annualPayerFraction)
    + p.paidFamilyAccounts * (p.familyMonthlyInr * (1 - p.annualPayerFraction) + p.familyAnnualInr / 12 * p.annualPayerFraction);
  const revenue = revenueInr / config.fxInrPerUsdAssumption;
  const gateway = revenue * p.gatewayFeeFraction * (1 + p.feeTaxFractionAssumption);
  const contingency = (platform + ai + p.businessToolsContentAllowanceUsd) * p.contingencyFraction;
  const total = platform + ai + gateway + p.businessToolsContentAllowanceUsd + p.peopleOperationsAllowanceUsd + contingency;
  return { id: scenario.id, label: scenario.label, mau: p.mau, dau, coreRequests, turns, attempts, inputTokens, outputTokens, cdnGib,
    breakdown, sqlCompute, platform, ai, gateway, businessToolsContent: p.businessToolsContentAllowanceUsd,
    peopleOperations: p.peopleOperationsAllowanceUsd, contingency, total, totalInrAtAssumedFx: total * config.fxInrPerUsdAssumption,
    normalizedRevenueUsd: revenue, normalizedRevenueInr: revenueInr, planningSurplusUsd: revenue - total,
    costPerMau: p.mau ? total / p.mau : null, aiCostPerTurn: turns ? ai / turns : null,
    runDiagnostics: { api: apiRun, ai: aiRun, workers: workerRun } };
}

export function renderReport(config, rates, results) {
  const usd = value => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const count = value => value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const lines = ['# Generated cost scenarios', '', 'Generated from versioned inputs by `npm run cost:report`. Prices checked ' + rates.verifiedOn + '; USD gross planning only. No vendor quote, live billing change or deployment.', '',
    'Models, FX, staff/content/tools, utilization and unresolved network SKUs are explicit assumptions. Compare the same workload/availability before choosing a cloud. See [method and controls](CLOUD_AND_COST.md).', '',
    '| Monthly item | ' + results.map(r => r.label).join(' | ') + ' |', '| --- | ' + results.map(() => '---:').join(' | ') + ' |'];
  const row = (label, fn) => lines.push('| ' + label + ' | ' + results.map(fn).join(' | ') + ' |');
  row('MAU / DAU', r => count(r.mau) + ' / ' + count(r.dau));
  row('AI turns / provider attempts', r => count(r.turns) + ' / ' + count(r.attempts));
  for (const [key, label] of Object.entries({ cloudRun: 'Cloud Run', sql: 'SQL HA compute/storage/backups', firestore: 'Firestore operations/storage/protection', objectStorage: 'Object storage/operations', cdn: 'CDN delivery/fill/lookups', edgeAndApiTransfer: 'Edge/WAF/API transfer', identity: 'Identity Platform if enabled', otherCloudAllowance: 'Other cloud allowance' })) row(label, r => usd(r.breakdown[key]));
  for (const [key, label] of Object.entries({ platform: 'Platform subtotal', ai: 'Model API assumption', gateway: 'Gateway fee + assumed fee tax', businessToolsContent: 'Tools/content allowance', peopleOperations: 'People/operations allowance', contingency: 'Contingency', total: '**Planning total**', normalizedRevenueUsd: 'Normalized revenue assumption', planningSurplusUsd: 'Revenue less planning total' })) row(label, r => usd(r[key]));
  row('Planning total INR at assumed FX', r => count(r.totalInrAtAssumedFx));
  row('Total / MAU', r => r.costPerMau === null ? 'n/a' : usd(r.costPerMau));
  row('Model charge / logical turn', r => r.aiCostPerTurn === null ? 'n/a' : '$' + r.aiCostPerTurn.toFixed(5));
  row('CDN delivered GiB', r => count(r.cdnGib));
  lines.push('', 'FX input: INR' + config.fxInrPerUsdAssumption + '/USD, **illustrative, not a current exchange-rate quote**. Annual charges are normalized using exact annual totals/12. Family revenue counts the payer once. Surplus is a planning remainder before unmodeled taxes, discounts, churn, financing and actual business adjustments; it is not profit.', '',
    'No Cloud Run credits, named-Firestore free quota, promotion, response-cache savings or committed-use discounts are deducted. Cloud Run includes API wait time for AI and an approximate minimum-instance idle floor. CDN tiers apply to Asia-Pacific delivery; this is not a universal per-GB quote.', '', '## Scenario assumptions', '');
  for (const note of config.notes) lines.push('- ' + note);
  lines.push('', '## Reproduce', '', '```powershell', 'npm run cost:estimate', 'npm run cost:report', 'npm run cost:test', '```', '', 'Inputs: [scenarios](../../../infrastructure/cost/launch-scenarios.json), [dated rates](../../../infrastructure/cost/rates-2026-10-15.json). Source URLs and caveats are preserved in the rate card; raw public pricing evidence is retained locally under artifacts/research/system-design/pricing-2026-10-15/.', '');
  return lines.join('\n');
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'infrastructure/cost/launch-scenarios.json'), 'utf8'));
  const rates = JSON.parse(fs.readFileSync(path.join(root, 'infrastructure/cost/rates-2026-10-15.json'), 'utf8'));
  const results = config.scenarios.map(scenario => estimate(config, rates, scenario));
  if (process.argv.includes('--write')) {
    const target = path.join(root, 'docs/architecture/blueprint/COST_SCENARIOS.md');
    fs.writeFileSync(target, renderReport(config, rates, results));
    console.log('Wrote ' + path.relative(root, target));
  } else console.log(JSON.stringify({ currency: rates.currency, fxAssumption: config.fxInrPerUsdAssumption, results }, null, 2));
}
