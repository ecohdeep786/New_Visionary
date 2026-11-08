# KAN-126 (RELEASE-03) — admission ceilings, tenant fairness & dependency-failure degradation

**Date:** 2026-11-08 · **Branch:** `zcode/kan-126-release03-admission-ceilings` ·
**Base:** `dev` @ `2e0b1fbb` · **Worktree:** `nv-worktrees/kan-126-release03`
**Status:** implementation complete, gates green, **reviewer pending** (D-095).
Not merged into `dev`.

## Requirement

> Obtain actual provider quotas; prove instance/pool/concurrency/admission
> ceilings, tenant fairness, queue drain and user-visible throttling under spikes
> and dependency failure.
> — `docs/architecture/tracking/education-launch.json`, RELEASE-03 / KAN-126

Governing law: `docs/architecture/discussions/launch-operations.md` § *Admission
control* — per-UID/device/workspace quotas; a shared coordinator must enforce the
real global cap; **typed 429/503 with clear retry timing** rather than unbounded
in-memory waiting; **billing gets its own queue and provider circuit breaker**.

## Delivered

Two gaps the recorded law named but the product did not yet satisfy, plus the
proof that the whole admission surface behaves as specified.

1. **`Retry-After` on typed backpressure** —
   `backend/upstream/backend/src/platform/production-http.ts`
   (`admissionRetryAfter`, installed in `configureProductionHttp`, the composition
   used by the real entrypoint `main-product.ts`). 429 → `Retry-After: 30`,
   503 → `Retry-After: 15`. Exactly once; never overwrites a handler value; never
   on 2xx.

2. **Billing provider circuit breaker** — new module
   `backend/upstream/backend/src/billing/provider-circuit-breaker.ts`, wired into
   `RazorpayProvider` (`.admit()` before each provider call, `.settle(ok)` on the
   outcome). Opens after 3 consecutive failures, refuses fast with a typed 503,
   half-opens one probe after a deployment-tunable cooling window
   (`BILLING_PROVIDER_BREAKER_COOLING_MS`, default 15s), re-opens on a failed
   probe, closes on success. `BILLING_PROVIDER_BREAKER=disabled` is the explicit
   opt-out.

No duplicate authority is introduced: the breaker bounds outbound provider calls
in-process (honest for the single-connection runtime); the cross-instance budget
for admitted work remains the Firestore-transactional rate limiter.

## Verification

`npm run release:admission` → **18/18 PASS** (two layers, deterministic across
consecutive runs):

- `breaker-law.test.mjs` **9/9** — breaker state machine (emulator-free).
- `admission-ceilings.test.mjs` **9/9** — connected proof over the real production
  HTTP composition + Auth/Firestore emulators + TLS terminator.

Observed laws (from `docs/architecture/delivery/release03/admission-report.json`):

| Law | Observed |
| --- | --- |
| per-UID quota | consent-revoke 10/min: allowed 10, throttled 11, `Retry-After: 30` |
| shared coordinator | 21 concurrent on one uid → 11 throttled together |
| tenant fairness | saturated tenant 201×12 → 429; other uid same surface/minute **served 201** |
| dependency failure | typed **503**, `Retry-After: 15`, `providerCreates` delta 0 |
| queue drain | scheduled job drains failed work: `processed 3, failed 0` |
| circuit breaker | opens at 3; further call refused with `providerReadsDelta: 0` |
| breaker recovery | successful half-open probe closes breaker, drains (`processed 4`) |
| no false backpressure | 2xx carries no `Retry-After` |

## Defects found and fixed during verification (harness-side, disclosed)

The first runs of this suite surfaced four real defects in the **pre-existing**
harness/design, not the product — each fixed and re-verified:

1. **`/fixture/state` required GET while the test's `control()` helper sends
   POST** → the dependency-failure invariant compared `undefined === undefined`
   (vacuously true). Fixed; the invariant is now real.
2. **Tenant-fairness used `accounts[1]`**, already saturated by the preceding
   shared-coordinator test → rewritten onto a fully composed surface (billing)
   with two untouched accounts; a 503 from the uncomposed SQL consent store had
   been passing the old `!== 429` assertion for the wrong reason.
3. **Month/boundary-flaky quota bursts** — the limiter counter is keyed per
   minute, so a burst straddling a boundary could slip under the cap. All three
   quota tests now send `2*limit+1` attempts (pigeonhole ⇒ a 429 is unavoidable).
4. **Fixture threw a bare `Error`** where production throws the typed
   `PaymentProviderError`; it now throws the shipped error with the shipped
   ambiguity semantics (a bare `Error` would have surfaced an untyped 500).

The breaker unit tests also caught a genuine product robustness edge:
`Number('') === 0` meant an accidentally-empty `BILLING_PROVIDER_BREAKER_COOLING_MS`
silently set a **zero** cooling window. The code now treats empty/whitespace as
absent and falls back to the default.

## Gates (fresh at this SHA)

| Gate | Result |
| --- | --- |
| `release:admission` | 18/18 PASS |
| `npm run lint` | 0 |
| `npm run typecheck` | 0 |
| `npm test` | 672/672 |
| `npm run build` | 0 |
| `verify-imports` | PASS (all changes first-party; no patch ledger entry needed) |
| `verify-layout` | PASS |
| `npm run check` | PASS (authority inventory regenerated per protocol — see below) |

## Scope inventory refresh (protocol)

The KAN-31 authority inventory is regenerated after source changes. Here the drift
was **exactly two lines**: the `sha256Lf` of the two edited authority files —
`billing/razorpay.provider.ts` and `platform/production-http.ts`. No registered /
infrastructure / proposed / future / product-group count changed (55/6/12/16/32),
and the new `provider-circuit-breaker.ts` introduced **no new authority** (it is
not a declared authority file: it bounds outbound provider calls, it does not
grant access). Regenerated with `node scripts/authority-audit.mjs --write` and
re-verified.

## Hosted gates recorded (external; NOT claimed)

1. **Actual provider quotas** — real speech/model-service + Razorpay figures must
   come from the provider consoles. Mechanism proven; numbers not.
2. **Global cap across instances** — fleet-wide Cloud Run cap under production
   load = staging capacity gate (RELEASE-01/02 lineage).
3. **SQL-backed instance/pool ceilings** — overview/submissions projections; this
   stack does not fabricate a SQL authority.
4. **Real provider outage** — the drill drives the fictional fixture provider.
5. **Real test-merchant mode** — `--razorpay-test` not run (no test credentials
   in this environment; live keys prohibited).

## Artifacts

- Delivery note: `docs/architecture/delivery/RELEASE03_ADMISSION_CEILINGS.md`
- Evidence: `docs/architecture/delivery/release03/admission-report.json`
- Suite: `backend/tests/contracts/release-03/{breaker-law,admission-ceilings}.test.mjs`
  (+ `admission-stack.cjs`, `admission-driver.cjs`)
- Command: `npm run release:admission` (`scripts/release03-admission.mjs`)
