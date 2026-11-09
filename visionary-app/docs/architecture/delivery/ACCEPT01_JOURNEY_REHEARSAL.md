# ACCEPT-01 (KAN-117) — connected journey rehearsal

**Task:** ACCEPT-01 (KAN-117), P11 checklist line
([BACKEND_LAUNCH_CHECKLIST.md](../BACKEND_LAUNCH_CHECKLIST.md)):

> Exercise public pricing → auth/verification → onboarding → Free profile →
> test subscription → invoice → learning → project → second-device resume on the
> hosted system.

**Exit (from the board):** real adapters and durable staging data satisfy product
behavior, including failure states. **Owner:** QA and component owners (engineering
half implemented by the backend/ML lane). **Branch:**
`zcode/kan-117-accept01-journey-rehearsal` off `dev` (`2e0b1fbb`). **Status:**
implemented, locally proven, reviewer pending per D-095. Not merged into `dev`.

## The gap this closes

The released journey chain exists only as disconnected atomic suites
(billing tests, firebase-product tests, learning tests, provisioning tests). The
journey itself — one account flowing from the public price page to a paid,
learning, project-holding account on a second device — was never rehearsed end to
end over the **real production HTTP composition**. The hosted walk is the ACCEPT-01
gate; a connected local rehearsal proves the chain behaves as one product before
that gate is attempted.

## What was built (rehearsal harness — test/evidence only, no product change)

`backend/tests/contracts/accept-01/journey-stack.cjs` — **adapted from the
RELEASE-03 admission stack** (same lane/author; the reviewer may dedupe the shared
driver at merge). It composes the real `configureProductionHttp` over the real
product controllers/services with the authorized local identity plane (Firebase
Auth + Firestore emulators), a TLS terminator on the canonical loopback origin with
`__Host-` cookies and Origin/CSRF enforcement, and a **fictional payment
provider** (same request surface as Razorpay, zero network). Unlike RELEASE-03 it
also composes **PersonalWorkspaceService** so the "project" step provisions a
REAL SQL-backed workspace through the product's synthetic local mode against a
disposable staging schema (data-02 fixture lineage, bounded pool/connect params
the product enforces).

`backend/tests/contracts/accept-01/accept01-journey.test.mjs` — the journey, 11
tests over one shared account:

| # | Step | Proves |
| --- | --- | --- |
| 1 | Public pricing | unauthenticated catalog, test mode, plans present |
| 2 | Auth/verification | real emulator token → product session, HttpOnly cookie, uid resolved |
| 3 | Onboarding | bounded role profile completes; profile reports `onboarding_complete` |
| 4 | Free profile | Fresh account is `plan: start`, `entitlement.source: free`, no subscription |
| 5 | Test subscription | checkout → fictional provider payment → verified → synced `active` with `paidThrough` |
| 6 | Invoice | recorded under the account; owner reads it by id, uid matches |
| 7 | Learning | durable loop starts, check presents, server assesses → `check_passed` |
| 8 | Project | REAL PostgreSQL workspace provisioned (`personalWorkspaceId`), same command replays idempotently |
| 9 | Second-device resume | a second device signs in on the SAME uid and sees the active subscription + invoices |
| 10 | Wrong-user failure | a stranger gets 404 on another account's invoice AND learning session |
| 11 | `failure states` | duplicate checkout 409, stale-revision cancel 409, valid cancel → `cancelAtPeriodEnd: true` with paid access retained |

## Proof (11/11)

`npm run accept:journey` runs the connected layer with the emulators + real SQL.
Evidence: `docs/architecture/delivery/accept01/accept01-journey.tap` (11 ok) and
`docs/architecture/delivery/accept01/journey-report.json` (step-by-step values,
including the provisioned SQL `personalWorkspaceId` and `replay: true`).

## What remains a hosted gate (honest boundary)

These are **not** proven here and are recorded as external gates for KAN-117:

1. **The hosted walk itself.** The same chain on the hosted system with real
   hosted adapters, real staging data, real devices/browsers is the ACCEPT-01
   exit — the rehearsal uses emulators and a fictional provider by construction.
2. **Real merchant/provider adapters** (Razorpay test/live merchant wiring,
   real mail, real object storage) belong to the hosted/staging gate.
3. **Cross-family journey depth** (durable change-feeds, offline, timed
   assessment, Build) depends on the unmerged queued stack (KAN-139/140/72/73/82
   et al. in Testing) and the feature-family acceptance gates.
4. **D-095 reviewer approval and integration into `dev`.**

## Verification

| Gate | Result |
| --- | --- |
| `npm run accept:journey` | 11/11 (emulators + real SQL + TLS + fictional provider) |
| `npm run check` | exit 0 (roots, 3842-file import baseline, qa laws, script tests, surface audit, lint, typecheck, unit tests, build) |

## Reproduce

```bash
npm run backend:build
export JAVA_HOME=<temurin-21>        # Firestore emulator
export DATA_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5433/visionary_data_test_accept07
npm run accept:journey               # 11/11
```

The journey never contacts a real provider, never binds beyond loopback, and never
claims hosted acceptance.
