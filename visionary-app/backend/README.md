# Application backend

## Domain preparation verification (KAN-36)

`npm run data:check` at the product root validates/generates the locked Prisma client,
checks canonical domain DDL, compiles the actual workspace repository and runs its
PostgreSQL tests. Install `backend/upstream/backend` dependencies from its lock first
(`npm ci --ignore-scripts --no-audit --no-fund` in that directory). This check is a
required, separate CI step; ordinary frontend `npm run check` retains its existing scope.

Set `DATA_TEST_DATABASE_URL` to a **disposable loopback** PostgreSQL database whose
name starts `visionary_data_test_`. Tests create fresh uniquely named schemas and
drop only those schemas after checking their absolute logical boundary. They refuse
hosted URLs and other database names. Do not use product credentials or real records.
CI provisions an isolated PostgreSQL 16 service with explicitly synthetic credentials.
For Windows, an isolated PostgreSQL binary distribution can be obtained through the
[official PostgreSQL download page](https://www.postgresql.org/download/windows/);
no Windows service or cloud resource is needed for these tests.

`node scripts/domain-ddl.mjs --write` regenerates only the proposed DATA-01 migration
from its marked section in `prisma/schema.prisma`. The generator also records the
explicit PostgreSQL-only personal-workspace and account-wide-consent partial indexes
and positive command revision constraint. `data:check` refuses drift. Domain migration
SQL is not applied by product startup or dependency installation. Legacy account/plan
tables are excluded from this generated domain migration; Firestore keeps current
account/profile/billing authority. The disconnected workspace controller/module is
not registered in either the connected product or legacy app.

This is workspace-domain **development preparation**, not full DATA-01 acceptance.
Original source/release, session/evidence, classroom/project and lifelong schema scope,
source/admission/policy decisions and connected/hosted/erasure acceptance remain open.
Invitation and consent helpers are not a complete product permission system. General
conditional domain mutations and their revision protocol remain DATA-06 work; the
unsafe unused generic receipt mutator was removed because it could alter receipts
without a domain transaction. The create command commits an immutable result and
rechecks ownership/erasure on replay. No new product route is activated by this work.

D-091 [calendar and component handoff](../docs/architecture/DELIVERY_CALENDAR.md) schedule contracts before backend data/authority, then jobs/files, source, learning/Build and linked-role integrations. Work stays under the existing pinned/product-owned boundaries with explicit patch provenance; no wholesale source deletion or automatic migration occurs. All dates are forecasts pending actual acceptance.

D-090 [lifelong delivery contract](../integration/LIFELONG_EDUCATION_CONTRACT.md) defines the proposed owned profile/stage/mapping/receipt flow, reviewed admission/relationship boundaries and teacher/parent delivery acceptance. All 145 source tasks remain mapped to the current architecture; this contract/registry pass registers no controller, migration or new runtime benefit.

D-088: [current education launch plan](../docs/architecture/EDUCATION_LAUNCH_PLAN.md) adds voice-turn/cancellation authority, rights-aware offline reconciliation and trusted activity revisions to the existing server-owned contracts. Its 142-task manifest and verified Jira dependencies are implementation requirements, not registered controllers or completed database work. Freeze the shared contracts before concurrent backend/ML feature implementation.

D-087 [VATS contract](../integration/VATS_CONTRACT.md) keeps identity, permissions, assessment receipts and state commits here. The [pedagogy-proposal boundary](upstream/backend/src/learning/pedagogy-proposal.ts) rejects stale/cross-scope ML suggestions and cannot create mastery or skip current checks. It is a tested pure module, not a registered endpoint. Follow the [seven-layer delivery plan](../docs/architecture/VATS_IMPLEMENTATION.md) before connecting ML workers or changing store ownership.

D-086 adds a product-owned [learning policy kernel](upstream/backend/src/learning/teaching-policy.ts) with [offline tests](tests/teaching-policy.test.cjs). It is not wired to the active auth app or a datastore: authorized receipt transactions, calibrated criteria, controllers, UI and two-device acceptance remain open. See the [founder reconciliation](../docs/architecture/FOUNDER_SPEC_RECONCILIATION.md).

Next implementation chunks and launch gates: [backend launch checklist](../docs/architecture/BACKEND_LAUNCH_CHECKLIST.md), supported by the [current-state evidence](../docs/architecture/BACKEND_LAUNCH_EVIDENCE.md). Existing local auth/account/test billing stays the foundation while domain services are added.

D-082 adds [owner-bound account feedback](../integration/FEEDBACK_CONTRACT.md) to this same runtime, with transactional submission/retry/admission and owner pagination. The dashboard offers an optional translated feedback control. See the [backend/ML execution handoff](../docs/architecture/IMPLEMENTATION_HANDOFF.md) and [Jira sync status](../docs/architecture/tracking/JIRA_SYNC.md); full support/operator/hosted acceptance remains open.

Organization backend imported from `visionaryorg/visionary-dev`, commit `81e861be4a87b8af02c9f986d6874e82be20b1b7`. Code and legacy Prisma schema live in `upstream/backend/`; imported deployment references live in `upstream/deploy/`. They are not current product deployment instructions.

From the product root, use `npm run backend:install` and `npm run backend:build` with supported installed Node22/24 LTS (24 recommended). Source imports and dependency installation do not start a server, apply migrations, send email or connect a model.

Read [the integration handoff](../integration/README.md) before configuring databases or replacing frontend preview services. Authentication and all product authorization belong here. The current imported schema needs the five-role workspace, membership and consent model reconciled with the existing product contract.

D-060 adds Firebase Admin14.5.0. Dependencies and imported runtime files have explicit [patch provenance](../integration/upstream-patches.json). The original upstream commit/hashes remain unchanged in the import baseline.

D-063 connects the Firebase auth/profile slice through a **standalone** NestJS app. D-075 makes root `npm run backend:dev` and the existing `backend:auth:dev` alias watch `src/main-auth.ts` using ts-node on127.0.0.1:3001 with Firebase token/session verification, Firestore accounts, onboarding, device revocation and rate counters. After `backend:build`, root `backend:start` selects `dist/src/main-auth.js`. Configuration is in ignored `upstream/backend/.env`; use [the example](.env.firebase.example) for another machine. Read [the auth contract](../integration/FIREBASE_AUTH_CONTRACT.md) and [setup handoff](../integration/FIREBASE_SETUP.md). Imported package startup commands, `src/main.ts`, old migrations/seeds and Docker defaults remain legacy references and must not be used to launch the product. Business-controller cutover and deployment remain later work.

D-069 adds Razorpay test billing to this same standalone app: shared request authority, provider subscription checkout, durable Firestore account/command/event records, reconciliation, cancellation, owner-scoped test invoices and accepted Family billing benefits. Use [the payment contract](../integration/PAYMENTS_CONTRACT.md) and [test configuration example](.env.razorpay.example). Runtime rejects live keys. No original imported baseline or dependency lock is changed; product additions retain separate ownership. Public webhook ingress, live methods/tax/commercial policies and broader business services remain release work.

D-075: [backend/ML audit](../docs/architecture/discussions/backend-ml-audit.md) classifies retained/replaced components. [System design](../docs/architecture/discussions/system-design.md) retains UID-owned Firestore account/billing and introduces a reviewed relational product schema, private AI and durable workers. `npm run product:test-runtime` verifies root entrypoint selection and the product import graph. No old source/data is deleted or cloud service deployed by the audit.
