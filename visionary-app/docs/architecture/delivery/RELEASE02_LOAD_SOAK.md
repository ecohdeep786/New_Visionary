# RELEASE-02 (KAN-125) — Realistic Load and Soak Runbook

**Task:** Run realistic data/index load and soak tests against the selected
baseline: 150 core requests/s and 16.7 AI runs/s sustained, 300/33.4 burst, plus
explicitly selected Build traffic and school-start scenario.
**Status:** the connected runtime path, measurement and the saturation
degradation law are proven on the local estate; HOSTED capacity, the recorded
24 h soak and real provider quotas remain the owner's external gates.
**Registered command:** `npm run release:load:soak`.

## What the harness is (and is not)

It composes the **real** product runtime — the production HTTP composition over
the real controllers/services (auth, account, billing, learning loop, knowledge
projection, feedback, consent, privacy policy) — with the real identity plane
(Firebase Auth + Firestore emulators) behind a real TLS terminator on the
canonical `https://visionary.org.in` origin. Every arrival is a genuinely
authenticated `__Host-` session with a server-owned uid, so the measured surface
is the real authority path.

It is **not** a capacity proof. One loopback host is one box, not the blueprint's
autoscaled fleet (2/30 API + 2/60 AI instances) and not a sized SQL pool. The
harness therefore keeps two ideas strictly apart:

| Concept | Where it lives |
| --- | --- |
| Documented target (150/16.7, 300/33.4, 1,000-class, 100k duplicates/h) | `profiles.cjs` `documented` / `baselineProfiles()` — loaded from `launch-operations.md`, never restated by hand |
| What this host sustains (a per-worker rate) | `scaledProfiles()` — the measured envelope below |
| Scaling arithmetic to reach the target | `report.scaling` — workers ≈ target / worker-rate |

The AI-run substitute is the **durable authored teaching loop** (`POST
/account/learning/sessions` + list) driven over the connected runtime. There is
no external model call on this host, so the harness validates the runtime path —
scheduling, admission, durable writes, authority — **not** provider quota or
model latency. That stays a hosted gate.

## Measured evidence (2026-11-08, local estate)

Report: `artifacts/qa/release02-load-soak/<stamp>/load-report.json`.

| Profile | Issued | Success | p50 | p95 | Overload | 5xx | Transport |
| --- | --- | --- | --- | --- | --- | --- | --- |
| core sustained (25/s worker) | 250 | 100% | 28 ms | 73 ms | 0 | 0 | 0 |
| learning-run sustained | 30 | 100% | 66 ms | 100 ms | 0 | 0 | 0 |
| payment webhook storm (20/s, 50% identical duplicates) | 60 | 100% | 20 ms | 36 ms | 0 | 0 | 0 |
| class-start burst | 200 | 100% | 19 ms | 49 ms | 0 | 0 | 0 |
| **saturation burst (200/s = 8× worker rate)** | 800 | 91.75% | 30 ms | 8,291 ms | **66 × 503** | **0** | **0** |
| bounded soak (20 s @ 20/s) | 400 | 100% | 50 ms | 81 ms | 0 | 0 | 0 |

**The key result is the saturation row.** Pushed far past the worker rate, the
runtime refused 66 requests — **every refusal a typed `503`, with zero 5xx and
zero dropped connections**. That is the documented degradation law ("typed
429/503 with clear retry timing rather than unbounded in-memory waiting")
demonstrated under a real burst, and it is now a permanent regression test.

Latency objective check: the 500 ms core p95 target
(`launch-operations.md`) holds at the worker rate; the 2 s webhook durable-ack
p95 target holds for the paced storm.

## Honest limitations recorded

1. **No hosted capacity claim.** The scaling arithmetic (≈6 workers to reach
   150 core/s at 25/s each) shows horizontal reachability, nothing more.
2. **`nest build` vs the deployed compile.** The repo-local `npm run
   backend:build` uses `nest build`, which does **not** emit
   `src/privacycore/privacy-preservation-policy.v1.json`. The deployed API image
   compiles with `tsc -p tsconfig.product.json`, which lists that JSON in
   `files` and therefore emits it. The harness copies the asset to the compiled
   location so the policy route reflects production rather than a local
   build-mode gap. This is a harness accommodation, not a product defect — the
   deployed path is correct.
3. **A larger accept backlog.** The local TLS terminator is one Node process; a
   burst can exhaust its default accept queue and present `ECONNREFUSED` — a
   property of the test terminator, not the product. The harness raises the
   backlog so transport errors reflect the product, not the fixture.

## External gates (owner)

1. **Hosted baseline run** — the recorded profiles against the hosted fleet:
   150+16.7 sustained for 60 min, 300/33.4 burst for 5 min, 24 h soak, isolated
   payment storm. Record percentiles, error rate, queue age, DB/pool and model
   quota/cost at each stage (release matrix).
2. **SQL-backed surface** — overview/submissions over a sized pool. This harness
   composes the connected non-SQL core + learning loop only; the SQL pool budget
   is the RELEASE-03/hosted gate.
3. **Real provider quotas** — model/speech latency and quota under load.
4. **Beta workload distributions** — replace the documented planning
   assumptions with measured beta request/token/duration/byte distributions
   (RELEASE-01).
