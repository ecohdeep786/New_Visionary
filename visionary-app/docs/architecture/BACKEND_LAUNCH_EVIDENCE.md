# Backend launch current-state evidence

16 October 2026 · D-081 · companion to the [execution checklist](BACKEND_LAUNCH_CHECKLIST.md). This is a scoped source/evidence inventory, not a production certification or exhaustive security audit.

## Classification at this checkpoint

| Area | Current status | Evidence and interpretation |
| --- | --- | --- |
| Product startup | Connected | [main-auth.ts](../../backend/upstream/backend/src/main-auth.ts), [selected module](../../backend/upstream/backend/src/auth/firebase-product/firebase-product.module.ts), [runtime selection tests](../../scripts/tests/backend-runtime.test.mjs). The module registers product/account/billing controllers; it does not register future domain controllers. |
| Identity and onboarding | Locally connected; hosted acceptance open | [Auth contract](../../integration/FIREBASE_AUTH_CONTRACT.md), [onboarding](../../integration/ONBOARDING_CONTRACT.md), [admin tests](../../backend/tests/firebase-admin.test.cjs), [product tests](../../backend/tests/firebase-product.test.cjs). Emulator identity with memory records differs from hosted Firebase/Firestore/provider acceptance. |
| UID account/device data | Locally connected | [Storage contract](../../integration/USER_ACCOUNT_STORAGE.md), [account controller](../../backend/upstream/backend/src/auth/firebase-product/account.controller.ts), [storage tests](../../backend/tests/account-storage.test.cjs). Bounded owner projections exist; this is not durable learning/project storage. |
| Payment/invoices/Family | Locally connected test implementation; commercial/live gates open | [Payment contract](../../integration/PAYMENTS_CONTRACT.md), [billing controller](../../backend/upstream/backend/src/billing/billing.controller.ts), [billing tests](../../backend/tests/billing.test.cjs). Current runtime rejects live keys. Signature/retry tests are distinct from real hosted delivery. |
| Hosted payment topology | Handoff specified; acceptance open | [GCP handoff](../../infrastructure/PAYMENTS_GCP_HANDOFF.md). The existing low-volume reconcile scanner needs growth task/outbox work; a real ingress/merchant setup is still required. |
| Product domains | Preview/interface; server cutover open | [App entity facade](../../frontend/src/api/appClient.js), [transport interface](../../frontend/src/services/backendTransport.ts), [contract gaps](../../integration/CONTRACT_GAPS.md). Current transport operations cover content/teaching/mentor interfaces, not a connected complete domain API. |
| Build | Local document workflow; durable server target | [ArtifactStudio](../../frontend/src/pages/dashboard/ArtifactStudio.jsx), [workspace services](../../frontend/src/services/workspaceService.ts), [Build design](build/README.md). No project/run controller is registered in the connected backend module. |
| Five-role boundaries | Frontend behavior and tests; backend authority open | [Domain map](PRODUCT_DOMAINS.md), [product status ledger](../visionary/CURRENT_PRODUCT_STATUS.md), [classroom services](../../frontend/src/services/classroomService.js). Older frontend-only status language is historical; D-056 onward authorizes backend work. Existing local behavior remains the compatibility contract. |
| ML/retrieval | Imported reusable source; production connection blocked | [ML guide](../../ml/README.md), [audit](discussions/backend-ml-audit.md), [model strategy](discussions/ml-strategy.md). Identity/session ownership/cache scope/cancellation/logging require replacement or proof before use. Specific production models and coverage remain unselected/unaccepted. |
| Product infrastructure | Local definitions/prepared rules/handoffs; hosted launch evidence open | [Infrastructure guide](../../infrastructure/README.md), [local Compose](../../infrastructure/local/compose.yml), [prepared rules](../../infrastructure/firebase/firestore.rules). Imported deploy/ML Terraform is not product-owned release automation. No root/product GitHub Actions directory was found in this inventory; build a reviewed pipeline rather than assuming upstream CI qualifies. |
| Architecture/cost | Design and planning delivered | [Final baseline](FINAL_ARCHITECTURE_RECOMMENDATION.md), [blueprint](blueprint/README.md), [cost inputs](../../infrastructure/cost/launch-scenarios.json), [operations](discussions/launch-operations.md). Workload numbers are assumptions; no 100k-MAU load, provider-quota or recovery certification follows. |

## Verification for this planning checkpoint

Observed this turn: `backend:build` exits 0; the five files in the command below pass **56 tests, 0 failures** (about 94 seconds). The generated output is rebuilt first. This is fresh offline/service/loopback-HTTP evidence, not a new live provider, database, emulator-browser or production load test.

Rebuild the backend before running its four existing offline test files, because they load generated JavaScript under `dist/src/`. Tests use fictional identities/payments, explicit test configuration, memory repositories and loopback HTTP fixtures. They do not read the desktop payment CSV, initialize production accounts or charge a provider.

```powershell
npm run backend:build
node --test --test-concurrency=2 backend/tests/firebase-admin.test.cjs backend/tests/firebase-product.test.cjs backend/tests/account-storage.test.cjs backend/tests/billing.test.cjs scripts/tests/backend-runtime.test.mjs
```

Record the observed result in the append-only [QA log](../visionary/QA.md). Current source inventory and completed local checks must not close tasks for hosted cookies, real verification delivery, actual Firestore/provider concurrency, merchant webhooks, live invoicing, model quality, deletion/restore or production scale. Existing full-browser/frontend/ML evidence retains its original date and limits unless explicitly rerun.

Two inspected integration constraints are explicit tracker work: `main-auth.ts` currently installs a normal 24 KiB JSON parser (with a separate 256 KiB raw webhook parser), and the current auth/product tests reject unsupported minor admission. New project payloads and guardian-first launch behavior require reviewed contracts and implementation. Existing documentation also records the founder's keep-data direction; no automatic TTL or purge is authorized by this checklist.

## Task closure record

For each checklist ID retain: scope and environment, implementing change, source/contract revision, exact test result, data migration/rollback evidence if relevant, dependency status, accountable reviewer and remaining limitation. A partial implementation remains open. Track defects against the task that owns the violated invariant rather than silently relaxing the product contract.

Preserve unrelated concurrent frontend work. This checkpoint creates planning artifacts, rebuilds generated backend output and runs isolated checks; it does not deploy, activate money, migrate account records, expose the old backend or connect imported ML.
