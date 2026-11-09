// RELEASE-04 (KAN-127) per-completed-task economics model.
//
// Requirement: "Measure useful-answer/artifact quality, latency/error budgets
// and cost per completed task including failed attempts, storage/egress,
// support and operations. Apply enforced spend admission, not alerts alone."
//
// This module turns a task-economics profile (observations over Learn/Build
// tasks plus attributable charges) into the unit-economics a launch-readiness
// record needs, by the same discipline as RELEASE-01's workload model: every
// derived figure carries its provenance (kind 'distribution' = derived from an
// observed histogram, 'assumption' = a fallback the model had to invent), a
// beta-quality capture CLAIM is fail-closed (it must record its window and
// population, mirroring workload-model.mjs), and only distribution-derived
// numbers feed the cost bridge.
//
// The enforced spend-admission decision here mirrors the product gate
// (backend/upstream/backend/src/billing/spend-admission.ts): a deployment's
// enforced cap either admits or refuses with a typed result — never an alert
// alone. Real provider/model costs and calibrated human quality review remain
// hosted gates; this module computes the accounting and the decision, local and
// repetition-free.

// Small histogram summary shared by the model.
export function summarizeHistogram(entries) {
  if (!Array.isArray(entries) || entries.length === 0) throw new Error('A histogram must be non-empty.');
  let total = 0, weighted = 0;
  for (const { value, count } of entries) {
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid histogram bucket value.');
    if (!Number.isSafeInteger(count) || count <= 0) throw new Error('Count must be a positive integer.');
    total += count;
    weighted += value * count;
  }
  const sorted = [...entries].sort((a, b) => a.value - b.value);
  let cumulative = 0, p95 = sorted[sorted.length - 1].value;
  for (const { value, count } of sorted) {
    cumulative += count;
    if (cumulative / total >= 0.95) { p95 = value; break; }
  }
  return { total, mean: weighted / total, p95 };
}

function mean(histogram) { return histogram ? summarizeHistogram(histogram).mean : null; }

function assertProfile(profile) {
  if (!profile || profile.schemaVersion !== 1) throw new Error('A task-economics profile must have schemaVersion 1.');
  const capture = profile.capture || {};
  const measured = capture.source === 'beta';
  if (measured) {
    for (const key of ['windowStart', 'windowEnd', 'activeUsers', 'daysCaptured']) {
      if (capture[key] == null) throw new Error(`A beta profile must record capture.${key}; refusing a measured claim without it.`);
    }
    if (capture.activeUsers <= 0 || capture.daysCaptured <= 0) throw new Error('A beta profile needs positive activeUsers and daysCaptured.');
  }
  return { capture, measured };
}

// Promotion rule launch-operations.md:55: 99.9% permits 43.2 minutes of error
// budget in a 30-day month; the model computes the budget and the failure-share
// steering from observed reliability.
const ERROR_BUDGET_SLO = 0.999;
const MONTH_MINUTES = 30 * 24 * 60;                        // 43,200
const ERROR_BUDGET_MINUTES = MONTH_MINUTES * (1 - ERROR_BUDGET_SLO); // 43.2

// Whole-operation budget law (launch-operations.md:57): transport 20s;
// proposed backend 18s; provider <=14s.
const LATENCY_BUDGETS = { transportSeconds: 20, backendSeconds: 18, providerSeconds: 14 };

function entry(value, via, kind = 'distribution', p95 = null) {
  return { value, via, kind, p95 };
}

/**
 * Per-completed-task economics over one profile.
 *
 * Profile schema (schemaVersion 1):
 *   capture: { source: 'beta'|'synthetic', windowStart, windowEnd, activeUsers, daysCaptured }
 *   tasks:   { completed: int>0, failedAttempts: int>=0 }
 *   cost:    { providerPerAttemptHistogram?: [{value,count}],
 *              storageTotalUnits, egressTotalUnits, supportTotalUnits, operationsTotalUnits }
 *   latency: { transportSecondsHistogram?, backendSecondsHistogram? }
 *   quality: { rubricVersion, sourceVersion, modelVersion, usefulRateHistogram, heldOut?, independentReview? } (optional)
 */
export function deriveTaskEconomics(profile) {
  const { capture, measured } = assertProfile(profile);
  const tasks = profile.tasks || {};
  if (!Number.isSafeInteger(tasks.completed) || tasks.completed <= 0) throw new Error('tasks.completed must be a positive integer.');
  if (!Number.isSafeInteger(tasks.failedAttempts) || tasks.failedAttempts < 0) throw new Error('tasks.failedAttempts must be a non-negative integer.');

  const completed = tasks.completed;
  const failed = tasks.failedAttempts;
  const attempts = completed + failed;
  const failureShare = attempts > 0 ? failed / attempts : 0;

  const cost = profile.cost || {};
  const providerPerAttempt = mean(cost.providerPerAttemptHistogram);
  // Reliability law: a failed attempt charges provider cost but is never a
  // completed task (the unit-cost denominator is completed-only).
  const providerTotal = providerPerAttempt == null ? null : providerPerAttempt * attempts;
  const storageTotal = nonnegativeUnits(cost, 'storageTotalUnits');
  const egressTotal = nonnegativeUnits(cost, 'egressTotalUnits');
  const supportTotal = nonnegativeUnits(cost, 'supportTotalUnits');
  const operationsTotal = nonnegativeUnits(cost, 'operationsTotalUnits');

  const attributableTotal = (providerTotal ?? 0) + storageTotal + egressTotal + supportTotal + operationsTotal;
  const costPerCompletedTask = attributableTotal / completed;

  // Error budget: observed failure share vs the documented monthly objective,
  // reported as steering (hosted outage minutes stay a telemetry gate).
  const errorBudget = {
    allowedMinutesPerMonth: ERROR_BUDGET_MINUTES,
    objective: ERROR_BUDGET_SLO,
    failureSharePerTask: entry(failureShare, 'failedAttempts / (completed + failedAttempts) — reliability law', 'distribution'),
  };

  // Latency budgets: observed p95 vs the documented envelopes.
  const latency = profile.latency || {};
  const transport = latency.transportSecondsHistogram
    ? summarizeHistogram(latency.transportSecondsHistogram)
    : null;
  const backend = latency.backendSecondsHistogram
    ? summarizeHistogram(latency.backendSecondsHistogram)
    : null;
  const latencyBudget = {
    transportSeconds: LATENCY_BUDGETS.transportSeconds,
    backendSeconds: LATENCY_BUDGETS.backendSeconds,
    providerSeconds: LATENCY_BUDGETS.providerSeconds,
    observedTransportP95: entry(transport ? transport.p95 : null, 'observed whole-operation p95', transport ? 'distribution' : 'assumption'),
    observedBackendP95: entry(backend ? backend.p95 : null, 'observed backend p95', backend ? 'distribution' : 'assumption'),
    withinTransportBudget: transport == null ? null : transport.p95 <= LATENCY_BUDGETS.transportSeconds,
    withinBackendBudget: backend == null ? null : backend.p95 <= LATENCY_BUDGETS.backendSeconds,
  };

  // Quality is measured only with pinned rubric/source/model versions (D-084);
  // a quality claim without pins is refused, never silently adopted.
  const quality = profile.quality || null;
  let qualityAssessment = null;
  if (quality) {
    if (!quality.rubricVersion || !quality.sourceVersion || !quality.modelVersion) throw new Error('Quality is only measured with pinned rubric/source/model versions.');
    if (!Array.isArray(quality.usefulRateHistogram) || quality.usefulRateHistogram.length === 0) throw new Error('Quality needs a useful-rate histogram.');
    const usefulRate = summarizeHistogram(quality.usefulRateHistogram).mean;
    if (usefulRate < 0 || usefulRate > 1) throw new Error('Useful rate must be within [0,1].');
    const reviewedIndependently = quality.independentReview === true;
    const heldOut = quality.heldOut === true;
    qualityAssessment = {
      usefulRate: entry(usefulRate,
        `useful-rate from pinned assessment (rubric ${quality.rubricVersion} / source ${quality.sourceVersion} / model ${quality.modelVersion})`,
        reviewedIndependently && heldOut ? 'distribution' : 'assumption'),
      reviewedIndependently, heldOut,
    };
  }

  return {
    economics: {
      completedTasks: entry(completed, 'completed tasks in the window — the denominator', 'distribution'),
      failedAttempts: entry(failed, 'failed attempts — charged for provider cost, never completed', 'distribution'),
      providerTotal: entry(providerTotal, providerPerAttempt == null ? 'no provider histogram — provider cost is an explicit assumption' : 'mean provider charge per attempt x attempts — reliability law (failed attempts charged, never completed)', providerPerAttempt == null ? 'assumption' : 'distribution'),
      storageTotal: entry(storageTotal, 'attributable storage charges in the window', 'assumption'),
      egressTotal: entry(egressTotal, 'attributable egress charges in the window', 'assumption'),
      supportTotal: entry(supportTotal, 'attributable support charges in the window', 'assumption'),
      operationsTotal: entry(operationsTotal, 'attributable operations charges in the window', 'assumption'),
      attributableTotal: entry(attributableTotal, 'sum of provider + storage + egress + support + operations', 'assumption'),
      costPerCompletedTask: entry(costPerCompletedTask, 'attributable total / completed tasks — unit-economics law', 'assumption'),
    },
    errorBudget,
    latencyBudget,
    quality: qualityAssessment,
    counts: { completed, failed, attempts },
    capture: { source: capture.source, measured },
  };
}

function nonnegativeUnits(cost, key) {
  const value = cost[key] ?? 0;
  if (!Number.isFinite(value) || value < 0) throw new Error(`cost.${key} must be a non-negative number.`);
  return value;
}

/**
 * Enforced spend-admission decision mirroring the product gate. Given a
 * deployment's enforced cap and the committed spend so far, admit a new commit
 * or refuse. Fail-closed: an enabled enforcement with a missing/invalid cap
 * refuses; there is no "warn but allow" mode (alerts are not enforcement).
 */
export function spendAdmissionDecision({ enabled, committed, cap, next }) {
  if (enabled !== true) return { admitted: true, reason: 'off' };
  if (cap == null || !Number.isFinite(cap) || cap <= 0) return { admitted: false, reason: 'misconfigured-cap' };
  if (!Number.isFinite(next) || next < 0) return { admitted: false, reason: 'invalid-next' };
  if (committed + next > cap) return { admitted: false, reason: 'exceeds-cap' };
  return { admitted: true, reason: 'within-cap' };
}

// Bridge: emit the report shape consumed by a delivery record. Only
// distribution-derived unit costs feed the report's measured figures;
// assumptions stay in the provenance table so a synthetic demo is never passed
// off as a measurement.
export function taskEconomicsToReport(result) {
  const { economics, errorBudget, latencyBudget, quality, counts, capture } = result;
  const provenance = {};
  for (const [key, item] of Object.entries(economics)) provenance[key] = { value: item.value, kind: item.kind, via: item.via };
  return {
    provenance,
    costPerCompletedTask: economics.costPerCompletedTask.value,
    providerPerAttemptKind: economics.providerTotal.kind,
    errorBudget: { allowedMinutesPerMonth: errorBudget.allowedMinutesPerMonth, objective: errorBudget.objective, failureShare: errorBudget.failureSharePerTask.value },
    latencyBudget: {
      transportBudgetSeconds: latencyBudget.transportSeconds,
      backendBudgetSeconds: latencyBudget.backendSeconds,
      providerBudgetSeconds: latencyBudget.providerSeconds,
      observedTransportP95: latencyBudget.observedTransportP95.value,
      observedBackendP95: latencyBudget.observedBackendP95.value,
      withinTransportBudget: latencyBudget.withinTransportBudget,
      withinBackendBudget: latencyBudget.withinBackendBudget,
    },
    quality,
    counts,
    capture: { source: capture.source, measured: capture.measured },
  };
}

// ---------------------------------------------------------------------------
// CLI footer (pure functions stay above; imports are hoisted).
// ---------------------------------------------------------------------------
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fixture = path.join(moduleRoot, 'scripts/tests/fixtures', process.argv[2] || 'task-economics.synthetic.json');
  const profile = JSON.parse(fs.readFileSync(fixture, 'utf8'));
  const result = deriveTaskEconomics(profile);
  console.log(JSON.stringify(taskEconomicsToReport(result), null, 2));
}
