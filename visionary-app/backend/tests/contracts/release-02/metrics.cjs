// RELEASE-02 (KAN-125) measurement.
//
// Records what the release matrix asks for — achieved percentiles, error rate,
// queue age, and (here) the saturation/degradation law — without inventing
// numbers. Percentiles use the nearest-rank method over the observed sample;
// the report always carries the sample size so a thin profile is visible.

function percentile(sortedMillis, fraction) {
  if (!sortedMillis.length) return null;
  const rank = Math.min(sortedMillis.length - 1, Math.max(0, Math.ceil(fraction * sortedMillis.length) - 1));
  return sortedMillis[rank];
}

/** Latency distribution for one profile's completed requests. */
function distribution(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    count: sorted.length,
    min: sorted.length ? sorted[0] : null,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    max: sorted.length ? sorted[sorted.length - 1] : null,
    mean: sorted.length ? Math.round((sum / sorted.length) * 100) / 100 : null,
  };
}

// The product returns typed overload/throttle codes rather than unbounded
// waits (see the blueprint: "typed 429/503 with clear retry timing"). A load
// test must treat those as CONTROLLED degradation, not silent success.
const OVERLOAD_STATUSES = new Set([429, 503]);
const CLIENT_STATUSES = new Set([400, 401, 403, 404, 409, 413, 422]);
const SERVER_STATUSES = new Set([500, 502, 504]);

function classify(status, error) {
  if (error) return 'transport';
  if (status >= 200 && status < 300) return 'success';
  if (OVERLOAD_STATUSES.has(status)) return 'overload';
  if (CLIENT_STATUSES.has(status)) return 'client';
  if (SERVER_STATUSES.has(status)) return 'server';
  return 'other';
}

/**
 * Summarise one profile run. `results` is an array of
 * { status, latencyMs, error?, kind }.
 *
 * The verdict separates the three things a reader must not confuse:
 *  - `ok`             every request succeeded;
 *  - `degraded`       some requests were refused with a TYPED overload code
 *                     (a controlled, correct behaviour under saturation);
 *  - `failed`         unexpected 5xx or transport errors appeared.
 * A degraded run is not a pass on its own — the assertion layer decides, per
 * the launch objective, whether the observed error rate is acceptable.
 */
function summarise(profile, results, { acceptedLatencyMs = 500 } = {}) {
  const latencies = results.filter(r => classify(r.status, r.error) === 'success').map(r => r.latencyMs);
  const buckets = { success: 0, overload: 0, client: 0, server: 0, transport: 0, other: 0 };
  const overloadCodes = new Map();
  for (const result of results) {
    const bucket = classify(result.status, result.error);
    buckets[bucket] += 1;
    if (bucket === 'overload') {
      const key = String(result.status);
      overloadCodes.set(key, (overloadCodes.get(key) || 0) + 1);
    }
  }
  const total = results.length;
  const successRate = total ? buckets.success / total : 0;
  const unexpectedFailures = buckets.server + buckets.transport + buckets.other;
  const verdict = unexpectedFailures > 0 ? 'failed' : buckets.overload > 0 ? 'degraded' : 'ok';
  return {
    profile: profile.id,
    label: profile.label,
    kind: profile.kind,
    arrivalPerSecond: profile.arrivalPerSecond,
    durationSeconds: profile.durationSeconds,
    issued: total,
    achievedPerSecond: profile.durationSeconds ? Math.round((total / profile.durationSeconds) * 100) / 100 : null,
    buckets,
    overloadCodes: [...overloadCodes.entries()].map(([status, count]) => ({ status: Number(status), count })),
    successRate: Math.round(successRate * 10000) / 100,
    latency: distribution(latencies),
    latencyWithinTarget: latencies.length ? Math.round((latencies.filter(v => v <= acceptedLatencyMs).length / latencies.length) * 10000) / 100 : null,
    verdict,
    baselineReference: profile.baseline ?? null,
  };
}

/** Downstream (Firestore emulator) queue age: arrival → authoritative write. */
function queueAge(samples) { return distribution(samples); }

module.exports = { percentile, distribution, summarise, queueAge, classify, OVERLOAD_STATUSES };
