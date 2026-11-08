// RELEASE-02 (KAN-125) workload model.
//
// Encodes the DOCUMENTED launch baseline from
// docs/architecture/discussions/launch-operations.md (D-075) as data, so the
// harness and its evidence never drift from the recorded plan:
//
//   core   150 requests/s sustained, 300/s five-minute burst
//   AI     16.7 new runs/s sustained, 33.4/s short burst
//   payment 10,000 webhooks concentrated in one hour (2.78/s), 100,000
//           duplicate deliveries/hour (27.8 events/s)
//   class  1,000-user synchronized class start
//
// IMPORTANT — what a single loopback host can honestly prove. The full MAU
// baseline assumes a multi-instance autoscaled fleet, a sized SQL pool and a
// real provider quota. None of that exists on one machine, so this module
// keeps two separate ideas apart:
//
//   * `baselineProfiles()` — the DOCUMENTED targets, reported for reference.
//   * `scaledProfiles(scale)` — a per-worker arrival rate the host can actually
//     sustain, plus the connection budget which is the real per-machine
//     ceiling. Reaching the documented target therefore needs N ≈ target/rate
//     workers of this size; the harness records that scaling arithmetic.
//
// Every profile declares where its saturation limit comes from so a reader can
// tell measured numbers from extrapolation.

const documented = {
  source: 'docs/architecture/discussions/launch-operations.md',
  decision: 'D-075',
  corePerSecond: 150,
  coreBurstPerSecond: 300,
  aiRunsPerSecond: 16.7,
  aiBurstPerSecond: 33.4,
  paymentStormEvents: 10000,
  paymentStormWindowSeconds: 3600,
  duplicateEventsPerHour: 100000,
  classEventUsers: 1000,
};

// Realistic mix of a "60 non-AI calls/DAU/day" core request. Reads dominate;
// foreground change polling is explicitly INCLUDED (the blueprint warns the
// 60-call estimate must count polling, not add it afterwards).
const coreMix = [
  { id: 'me', method: 'GET', pathname: '/api/auth/me', weight: 30, csrf: false, kind: 'read' },
  { id: 'catalog', method: 'GET', pathname: '/api/billing/catalog', weight: 12, csrf: false, kind: 'read' },
  { id: 'account', method: 'GET', pathname: '/api/billing/account', weight: 10, csrf: false, kind: 'read' },
  { id: 'consents', method: 'GET', pathname: '/api/account/privacy/consents', weight: 8, csrf: false, kind: 'read' },
  { id: 'policy', method: 'GET', pathname: '/api/account/privacy/policy', weight: 4, csrf: false, kind: 'read' },
  { id: 'feedback-list', method: 'GET', pathname: '/api/account/feedback', weight: 6, csrf: false, kind: 'read' },
  { id: 'feedback-note', method: 'POST', pathname: '/api/account/feedback', weight: 2, csrf: true, kind: 'write' },
];

// AI-run substitute: the durable authored teaching loop over the connected
// runtime (no external model call — a document in the runbook). Each arrival
// opens a bounded session (the "new run") or lists existing sessions (the
// foreground read the loop performs between turns); both are the real
// authority path and need no fabricated provider output.
const aiMix = [
  { id: 'session-start', method: 'POST', pathname: '/api/account/learning/sessions', weight: 70, csrf: true, kind: 'ai-run', command: 'start' },
  { id: 'session-list', method: 'GET', pathname: '/api/account/learning/sessions', weight: 30, csrf: false, kind: 'ai-run' },
];

// Target rate the local host should aim for per worker. A single Node process
// on this EC2 host comfortably does a few hundred small loopback requests/s;
// the honest per-worker target below is deliberately modest so the measured
// success rate stays meaningful. Reach the documented 150/s with worker count.
const LOCAL_WORKER_RATE = Number(process.env.RELEASE02_RATE || 25);

function scaledProfiles(scale = 1) {
  const core = Math.max(1, Math.round(LOCAL_WORKER_RATE * scale));
  return [
    { id: 'core-sustained', label: 'core sustained (per worker)', arrivalPerSecond: core, durationSeconds: 10, kind: 'core', baseline: documented.corePerSecond },
    { id: 'core-burst', label: 'core burst (per worker)', arrivalPerSecond: core * 2, durationSeconds: 5, kind: 'core', baseline: documented.coreBurstPerSecond },
    { id: 'ai-sustained', label: 'learning-run sustained (per worker)', arrivalPerSecond: Math.max(1, Math.round(core / 8)), durationSeconds: 10, kind: 'ai', baseline: documented.aiRunsPerSecond },
    { id: 'payment-storm', label: 'payment webhook storm (per worker)', arrivalPerSecond: 20, durationSeconds: 5, kind: 'webhook', baseline: 27.8 },
    { id: 'class-start', label: 'synchronized class start (per worker)', arrivalPerSecond: core * 2, durationSeconds: 4, kind: 'core', baseline: 300 },
  ];
}

function baselineProfiles() {
  return [
    { id: 'core-sustained', label: 'core sustained', arrivalPerSecond: documented.corePerSecond, durationSeconds: 3600, kind: 'core' },
    { id: 'core-burst', label: 'core burst', arrivalPerSecond: documented.coreBurstPerSecond, durationSeconds: 300, kind: 'core' },
    { id: 'ai-sustained', label: 'learning-run sustained', arrivalPerSecond: documented.aiRunsPerSecond, durationSeconds: 3600, kind: 'ai' },
    { id: 'payment-storm', label: 'payment webhook storm', arrivalPerSecond: documented.duplicateEventsPerHour / 3600, durationSeconds: 3600, kind: 'webhook' },
    { id: 'class-start', label: 'synchronized class start', arrivalPerSecond: documented.classEventUsers, durationSeconds: 1, kind: 'core' },
  ];
}

function pickWeighted(mix, rng) {
  const total = mix.reduce((sum, entry) => sum + entry.weight, 0);
  let point = rng() * total;
  for (const entry of mix) { point -= entry.weight; if (point <= 0) return entry; }
  return mix[mix.length - 1];
}

/** Deterministic pseudo-random source so a profile's mix is reproducible. */
function seededRandom(seed) {
  let state = seed >>> 0 || 0x9e3779b9;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return ((state >>> 0) % 100000) / 100000; };
}

module.exports = { documented, coreMix, aiMix, scaledProfiles, baselineProfiles, pickWeighted, seededRandom, LOCAL_WORKER_RATE };
