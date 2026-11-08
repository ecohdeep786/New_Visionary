# RELEASE-01 (KAN-124) — measured workload distributions

**Task:** RELEASE-01 (KAN-124), P12 checklist line
([BACKEND_LAUNCH_CHECKLIST.md](../BACKEND_LAUNCH_CHECKLIST.md)):

> Replace workload guesses with beta request/token/duration/byte distributions;
> include polling, synchronized class starts, retries and additional Build demand
> without double-counting turns.

**Refinement (recorded in the same board entry):** measure voice audio/ASR/TTS/turn
durations and explicit declarative Build/offline reconnect demand in addition to the
earlier text baseline; avoid double-counting chunks as independent user questions.

**Owner:** Senior Principal Backend & ML Engineer. **Branch:**
`zcode/kan-124-release01-workload` off `dev` (`2e0b1fbb`). **Status:** implemented,
locally proven, reviewer pending per D-095. Not merged into `dev`.

## The gap this closes

The D-075 cost model (`scripts/cost-model.mjs`) consumes **point guesses** for its
workload inputs: `coreCallsPerDauDay` (60), `aiTurnsPerDauDay` (4),
`inputTokensPerTurn` (3000), `outputTokensPerTurn` (700),
`providerAttemptMultiplier` (1.1), `apiMeanCoreSeconds` (0.25), `aiMeanSeconds` (12),
and KiB sizes — all in `infrastructure/cost/launch-scenarios.json`, explicitly flagged
as "explicit assumptions". Nothing about the workload is *measured*, and nothing models:

- **polling** (device sync/visibility polls) — today it is silently rolled into the
  same request figure as real turns;
- **synchronized class starts** — today turns are spread uniformly, which hides the
  simultaneous-start burst;
- **retries** — today a bare attempt multiplier, with no law preventing a retry from
  being miscounted as a new turn;
- **chunked turns** — a long lesson answer split into N chunks can be counted N times;
- **declarative Build runs and offline reconnects** — additional demand not present in
  the text-turn baseline;
- **voice/ASR/TTS** — audio duration is not represented at all.

## What was built

### `scripts/workload-model.mjs`
Pure functions over a **measured workload profile** and the **bridge** back to the
existing cost engine:

- `summarizeHistogram([{value,count}])` — total / mean / p95 derived only from
  buckets; rejects malformed, negative or non-integer shapes.
- `deriveWorkload(profile, denominators)` — applies every counting law and emits a
  flat workload projection. Each value carries a `kind` (`distribution` = derived
  from a profile histogram; `assumption` = a fallback the model had to invent) and
  a `via` explanation of the law that produced it.
- `workloadToCostOverrides({workload, capture})` — emits an `overrides` object for
  exactly the keys the D-075 `estimate()` accepts, **only from distribution-kind
  values**; everything else stays the baseline assumption and is listed in the
  provenance table. The `capture.measured` flag travels so a report labels the
  result a real beta measurement or a synthetic demo.

### The counting laws (each pinned by the test suite)

1. **Chunking** — `aiTurnsPerDauDay` counts distinct questions, never chunks;
   `aiAdmissionsPerDauDay` counts every chunk as one runtime/token admission event;
   per-turn tokens aggregate chunk means once (no double count). 61,200 chunks / 48,000
   questions → **0.08 turns/DAU/day**, admissions **0.102**.
2. **Polling** — polls add to `coreCallsPerDauDay` and request-seconds but never to
   turns or admissions.
3. **Retries** — the measured attempts-per-primary histogram drives
   `providerAttemptMultiplier` (1.095 in the demo); retries are the difference
   (`attempts − turns`), never new logical turns.
4. **Synchronized class starts** — the measured peak/mean ratio (92/7.4 ≈ 12.4) is
   reported as a capacity guardrail: spreading the same turns uniformly would
   understate peak demand. It is a *report*, not a cost input.
5. **Build + offline reconnect** — one logical Build run across N chunks counts once
   (`buildRunsPerMau`), with the N chunks as the admission surface; Build and
   reconnect are worker demand, never foreground questions.
6. **Voice** — ASR input tokens derive from capture minutes, TTS output audio bytes
   from spoken seconds, and turn wall-time includes capture + ASR + text + TTS. The
   demo shows 10.01s (text) → 48.9s (voice) wall-time.

### Provenance is fail-closed

A profile claiming `capture.source === 'beta'` **without** `windowStart`,
`windowEnd`, positive `activeUsers` and `daysCaptured` is rejected — a measured claim
must be attributable. Synthetic profiles say so explicitly and are never passed off
as measurements. No real beta capture exists on this host; that is the recorded
hosted gate.

### The profile schema (demonstrated by)
`scripts/tests/fixtures/workload-profile.synthetic.json` — a versioned document with
a `capture` header and per-demand-class histograms: foreground turns (distinct
questions + chunks + token/sec/KiB histograms), device-sync polls, synchronized class
starts, provider retries, Build runs (chunks/sec/tokens + offline reconnects) and
voice (capture minutes, ASR seconds, TTS seconds, audio bytes). Every section carries
a comment stating its law.

## Proof

`scripts/tests/workload-model.test.mjs` — **10/10** (registered as
`npm run workload:test` and added to `scripts/check.mjs`'s script-test list, next to
`cost-model.test.mjs`):

| # | Law proven |
| --- | --- |
| 1 | Histogram summary mean/p95/total; malformed shapes rejected |
| 2 | Chunking: 61,200 chunks → 48,000 turns; admissions separate; per-turn tokens aggregated once |
| 3 | Polling: polls raise API volume, never turns/admissions |
| 4 | Retry: attempts = turns × multiplier; retries are attempts, not new turns; absent histogram → multiplier exactly 1 |
| 5 | Class-start: peak/mean ratio is the guardrail; uniform spread would understate; absent measurement → explicit assumption |
| 6 | Build: one run across N chunks counted once; admissions separate; reconnects once; Build never becomes questions |
| 7 | Voice: ASR tokens/bytes/wall-time from audio duration; voice > text baseline; no voice → no surcharge |
| 8 | Provenance fail-closed: beta claim without metadata rejected; synthetic explicit; complete beta accepted as measured |
| 9 | Bridge: only cost-engine keys emitted; feeds the real D-075 `estimate()` — turns/attempts/core reflect the measured overrides |
| 10 | No double-counting invariant: questions + polls + builds + reconnects = the logical demand total |

The bridge test feeds the measured overrides into the **actual** cost engine
(`estimate()` from `scripts/cost-model.mjs` with the real
`infrastructure/cost/launch-scenarios.json` + `rates-2026-10-15.json`) and asserts the
projected turns (`48,000`), attempts (`48,000 × 1.095`) and core requests
(`(48,000 + 240,000)/…`) match the measured profile, while disagreeing with the naive
chunk count.

## Verification (fresh at this branch head)

| Gate | Result |
| --- | --- |
| `npm run workload:test` | 10/10 pass |
| `npm run cost:test` | 10/10 pass (existing engine untouched) |
| `npm run check` | exit 0 — includes the new suite in script-tests (124/124), qa:continuity/motion/taps, import baseline 3842 files, surface audit, lint, typecheck, `npm test` 672/672, production build |
| Migration impact | none — no backend source module, no frontend source, no manifest-listed file touched; authority inventory and surface audit re-verified clean by `npm run check` |

## Recorded external gate (NOT claimed)

The workflow model is proven with a **synthetic** profile whose shapes are invented to
exercise the laws. Real **beta request/token/duration/byte distributions** must come
from the hosted beta (authorized capture over signed-in traffic, windowed at
`capture.source: 'beta'` with window/users/days). That capture — and any projection
built from it — is a hosted acceptance step, not something this branch can produce or
verify. This change ships the schema, the counting-law engine, the fail-closed
provenance rule and the cost-engine bridge so a measured profile can be dropped in; it
does not invent a beta.
