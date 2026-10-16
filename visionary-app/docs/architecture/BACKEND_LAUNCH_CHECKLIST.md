# Backend implementation and launch checklist

16 October 2026 · D-081 · execution tracker for the [final architecture baseline](FINAL_ARCHITECTURE_RECOMMENDATION.md) and the 100,000-MAU growth target.

The next milestone is one durable, authorized learning-to-project journey across two devices. Full product completion then extends the same foundation to every released category and all five role experiences. Preserve the existing frontend journeys while replacing preview persistence through reviewed adapters.

## How to use this tracker

- `[x]` means the specifically named local implementation or design deliverable exists. It does not mean production acceptance.
- `[ ]` means work or release evidence remains. A partial implementation stays unchecked until its stated exit condition passes.
- Keep each ID stable. Close a task with the change reference, exact test/environment/result, and rollback/recovery evidence where applicable. Source files or mocked tests alone cannot close a hosted/provider/load gate.
- Owner labels are required responsibilities, not assertions that a team is already staffed. Assign people before execution. No delivery date or completion percentage is inferred from the number of checkboxes.
- Production must use server-owned data. Fictional fixtures and local preview memberships remain isolated development tools. An exposed feature must satisfy its backend gate; an unreleased capability needs an honest unavailable state.

Scope and evidence references are in the [current-state ledger](BACKEND_LAUNCH_EVIDENCE.md). The eight existing diagrams are sufficient to begin; change the architecture when implementation evidence warrants it.

## What is already done — scoped local foundation

- [x] **DONE-01** — Repository ownership, independent component environments, pinned imports and patch provenance are established. The product command selects the connected backend entrypoint.
- [x] **DONE-02** — Firebase identity exchange and verified device-bound server sessions exist, with Origin/CSRF/expected-account protections and device revocation behavior.
- [x] **DONE-03** — Validated onboarding/profile/introduction state is saved against the authenticated UID. Onboarding role selection remains a preference, not verified membership.
- [x] **DONE-04** — The UID-owned Firestore account tree and paginated owner-only account/device/invoice APIs exist. Future learning/project records are not yet in this connected domain backend.
- [x] **DONE-05** — Free defaults and authenticated monthly/annual Razorpay test subscription commands, verification, cancellation and durable reconciliation exist.
- [x] **DONE-06** — Owner-bound test invoices retain charge-time customer/service/payment information and support the simplified frontend/print journey. Live legal/tax invoicing remains open.
- [x] **DONE-07** — Accepted Family billing-benefit workflows exist and preserve payer/beneficiary boundaries. They do not grant guardian access to learning records.
- [x] **DONE-08** — Local auth/account/billing tests and browser/emulator harnesses exist. Fixture/provider/emulator evidence has explicit limits; hosted end-to-end acceptance remains open.
- [x] **DONE-09** — Frontend learning, teaching, project, classroom, guardian and professional workflows provide product rules and regression examples. Their local previews are not production backend implementations.
- [x] **DONE-10** — Backend/ML source classification and the API-first model strategy are documented. Useful imported ML components are available for controlled adaptation; the old gateway remains disconnected.
- [x] **DONE-11** — Local infrastructure definitions, prepared Firestore rules, hosting handoffs, workload/cost planning and architecture diagrams exist. Product GCP deployment and measured growth capacity remain open.

## Milestones and dependencies

| Chunk | Owner responsibility | Dependency / exit milestone |
| --- | --- | --- |
| P00 — Scope and contracts | Product, backend, security/privacy, frontend | First; agree the released surface and acceptance matrix |
| P01 — Data and permission foundation | Backend/data | P00; verified UID/workspace policy and reversible domain schema |
| P02 — Staging and delivery foundation | Platform, backend | P00; can proceed alongside P01 using synthetic data |
| P03 — Durable jobs and private files | Backend, platform | P01/P02; bounded, retry-safe work and protected objects |
| P04 — Source/catalog authority | Content review, backend/ML | P01/P03; one rights-approved published source slice |
| P05 — Durable learning | Backend, frontend | P01/P04; saved evidence and two-device resume; truthful disconnected Ask until P07 |
| P06 — Durable Build | Backend, frontend | P01/P03; guided-project bridge additionally depends on P05 |
| P07 — Private AI | ML, backend, education review | Provider evaluation starts at P00; connection requires P01/P03/P04 and relevant P05/P06 contracts |
| P08 — Linked roles | Backend, frontend, product policy | P01; expand each workflow as its source/learning/project dependencies become available |
| P09 — Hosted billing and commercial release | Billing/backend, platform, commercial owner | P02/P03; preserve current test runtime; live release needs explicit completed gates |
| P10 — Privacy, notifications and support | Backend, security/privacy, operations | Policy starts P00; implementation follows each new data domain, before real-user exposure |
| P11 — Whole-product acceptance | QA, all component owners | Released P00–P10 slices integrated on staging |
| P12 — Capacity and production launch | Platform/on-call, QA, product owner | P11 plus measured workload, recovery, cost and commercial evidence |

Dependencies permit engineering streams to proceed together; they do not authorize skipping an upstream security or data gate. Monitoring, backups and spend admission begin when their dependent service is introduced, not after P12.

## P00 — Define the release and executable contracts

**Owner:** product/backend/frontend/security. **Exit:** a reviewed, testable scope rather than a list of screens.

- [ ] **SCOPE-01** — Inventory every exposed route/control by learner category, five roles, language and operation; classify connected, preview, missing and intentionally unreleased behavior.
- [ ] **SCOPE-02** — Fix the launch coverage matrix: curriculum/source/language availability, age/admission boundaries, linked-role verification and unsupported-content states. All exposed categories need accepted coverage.
- [ ] **SCOPE-03** — Write versioned OpenAPI/runtime schemas, errors, pagination, mutation identity, expected revisions and event cursors; retain existing auth/account/billing route compatibility.
- [ ] **SCOPE-04** — Map each operation to actor/workspace/object/source/consent authority and owning datastore. Include lists, downloads, exports, background jobs and support access.
- [ ] **SCOPE-05** — Assign owners for content rights, retention/deletion, model data handling, billing/commercial terms, incident response and release acceptance; record unresolved decisions as blockers.
- [ ] **SCOPE-06** — Turn existing frontend invariants into backend contract/deny cases; select the first released curriculum/language/source and synthetic fixtures for a vertical slice.
- [ ] **SCOPE-07** — Fix the released sign-in/provider matrix, including organization SSO/phone if offered; configure and test every exposed method instead of relying on an enabled-looking frontend control.
- [ ] **SCOPE-08** — Specify per-route JSON/stream limits. The current 24 KiB parser limit needs reconciliation with bounded project/submission text; keep files outside JSON and never solve it with unlimited bodies/base64.

## P01 — Implement durable identity linkage, data and permission authority

**Owner:** backend/data. **Exit:** every domain command is server-authorized and transactionally scoped.

- [ ] **DATA-01** — Review product SQL DDL and indexes for UID linkage, workspaces/memberships, consent, sources/releases, sessions/evidence, classrooms/projects and operational records; exclude legacy account/plan authority.
- [ ] **DATA-02** — Add versioned migrations, separate migration/runtime identities, bounded resumable backfills, compatibility checks and rollback. Use empty synthetic staging before touching existing records.
- [ ] **DATA-03** — Provision personal workspaces idempotently from the verified UID with pending/recovery state across Firestore/SQL; preserve current account/profile/billing records and IDs.
- [ ] **DATA-04** — Implement invitations, acceptance, verified organization/classroom roles and lifecycle history. A role picker, email match, guessed ID or browser record cannot establish permission.
- [ ] **DATA-05** — Implement consent/share purpose, expiry/revocation and policy versions. Recheck sensitive mutations/delivery; revocation must affect pending jobs, caches and newly requested downloads.
- [ ] **DATA-06** — Add scoped command results, conditional revisions, trusted timestamps, unique constraints, transactional outbox and deletion tombstones; reject same command key with a changed payload.
- [ ] **DATA-07** — Implement owner-scoped repositories/DTOs and paginated UID account/domain overview projections; redact private security fields and avoid one unlimited user-history document.
- [ ] **DATA-08** — Prove wrong UID/workspace/role, concurrent grants/revocation, stale writes and account-switch races; bound total instances × connection pools and recover cleanly after reconnect.
- [ ] **DATA-09** — Implement the approved age/admission and guardian-first account/linking workflow before supporting currently blocked minors; never bypass admission using client age or role flags.

## P02 — Establish product-owned staging and delivery

**Owner:** platform/backend. **Exit:** repeatable, isolated staging with no fictional-to-production leakage.

- [ ] **PLAT-01** — Create reviewed product IaC/environment configuration for GCP identities/network, data, storage, compute, edge, queues and protection; do not apply imported legacy Terraform/Compose as product deployment.
- [ ] **PLAT-02** — Build a minimal product image using the current entrypoint. Exclude desktop credentials, research, obsolete deploy scripts and fixture routes; validate startup configuration, probes, shutdown and timeouts.
- [ ] **PLAT-03** — Configure ADC/workload identity, least-privilege service accounts and Secret Manager rotation; isolate environments and validate the existing named Firestore database rather than guessing it.
- [ ] **PLAT-04** — Configure canonical HTTPS origin, TLS, edge/WAF/rate controls and API/static routing. Prove no API-to-SPA fallback, private-response CDN caching or direct-origin bypass.
- [ ] **PLAT-05** — Prove hosted session cookies, proxy/origin/CSRF behavior, authorized auth domains and chosen real sign-in/verification/reset delivery. Emulator evidence is insufficient for provider acceptance.
- [ ] **PLAT-06** — Add product CI: component tests/builds, provenance/secrets/dependency checks, API/schema compatibility, immutable image release, staging smoke, canary and rollback.
- [ ] **PLAT-07** — Add redacted traces/metrics, latency/error/queue/cost dashboards, synthetic health checks and alerts. Keep prompt bodies, payment secrets and raw private learning text out of routine logs.
- [ ] **PLAT-08** — Enable and verify backups/PITR/object protection, restore identities and environment runbooks before persistent real-user data is admitted. Deploy first with synthetic data.

## P03 — Implement durable jobs and protected files

**Owner:** backend/platform. **Exit:** restarts, retries and malformed files cannot lose work or bypass policy.

- [ ] **JOB-01** — Implement owning-store outbox dispatch, private authenticated task delivery, per-workload queues, bounded retry/backoff and recovery after commit/dispatch/ack crashes.
- [ ] **JOB-02** — Add leases, attempt fencing, idempotent completion, deadlines, cancellation, quarantine of failed cleanup and a sweeper for orphaned/stuck work.
- [ ] **JOB-03** — Enforce per-user/workspace and fleet admission limits, queue fairness, provider budgets and retry ceilings; expose durable status/events with replay/refetch semantics.
- [ ] **FILE-01** — Implement authorized upload intent → private quarantine → complete/digest/type/size verification → scan → ready lifecycle; handle resumable failures and bounded parser/archive output.
- [ ] **FILE-02** — Store immutable object generations/manifests and verify references before database commit; collect unattached objects safely without deleting retained revisions/submissions.
- [ ] **FILE-03** — Implement private downloads, exports and revocation behavior. Use an authenticated gateway where immediate revocation is required; document signed-link residual validity.
- [ ] **FILE-04** — Prove unauthorized reads, URL/path traversal, unsupported formats, scan failures, object loss, duplicate completion and deletion races; isolate converters/parsers from account/payment credentials.

## P04 — Publish authoritative curriculum and sources

**Owner:** content/education review, backend/ML. **Exit:** learners receive only authorized, supported, published versions.

- [ ] **CONTENT-01** — Implement stable curriculum/book/chapter/topic/concept IDs and source provider/version, rights, owner/visibility, grade/category and authored-language metadata.
- [ ] **CONTENT-02** — Implement bounded scan/parse/chunk/embed/evaluate jobs with provenance and page/section offsets; preserve embedding model/dimension and transformation versions.
- [ ] **CONTENT-03** — Add draft/review/release/withdrawal/restore lifecycle and atomic publication/index pointer changes; incomplete ingestion cannot appear published.
- [ ] **CONTENT-04** — Connect catalog/concept adapters to reviewed server DTOs; preserve locale/source-language distinctions, authoring representations and clear unsupported/unavailable states.
- [ ] **CONTENT-05** — Enforce source/workspace/publication filtering before keyword/vector retrieval and cache lookup; withdrawal stops new access and pending output.
- [ ] **CONTENT-06** — Evaluate coverage and retrieval on every released category/language, including Hindi/Bengali segmentation where released. Frontend category labels do not establish content support.
- [ ] **CONTENT-07** — Preserve official approved embeds where suitable; add owned media processing/delivery only when released content requires it and rights, privacy and cost gates pass.

## P05 — Connect durable Learn, Practice, Progress and Guide state

**Owner:** backend/frontend. **Exit:** a committed learner journey resumes correctly on another device.

- [ ] **LEARN-01** — Implement owned learning sessions, selected source/revision, checkpoints and resume cursors behind current frontend facades; preserve unsaved local recovery visibly.
- [ ] **LEARN-02** — Persist checks, answers, attempts, rubric/evidence references and revision history; validate eligibility server-side and deduplicate repeat submissions.
- [ ] **LEARN-03** — Implement versioned mastery/progress/review projections from immutable evidence; distinguish consumption, attempts, self-review and assessed outcomes.
- [ ] **LEARN-04** — Persist permitted goals/daily plans/review scheduling and eligible discovery results with understandable reasons; a rebuilding projection must not overwrite evidence.
- [ ] **LEARN-05** — Add owned Ask/Guide/conversation state and typed model-response adapters. Keep disconnected/blocked/partial states truthful until P07 is accepted.
- [ ] **LEARN-06** — Add authorized change cursors/refetch, stale-response rejection, independent workspace selection per device, offline/conflict recovery and sign-out/account-switch handling.
- [ ] **LEARN-07** — Verify concept → check/practice → private project → save → second-device resume, including source withdrawal, concurrent edits, failed saves and session expiry.
- [ ] **LEARN-08** — Evaluate checks/practice using server-owned versioned criteria and protected answer keys. Client pass/score/completion flags cannot create verified evidence or unlock a guided project.

## P06 — Connect durable Build

**Owner:** backend/frontend. **Exit:** current document Build is server-backed without weakening existing privacy/recovery rules.

- [ ] **BUILD-01** — Implement private projects, immutable revisions/manifests, conditional draft saves, history and restore-as-new-revision with actor/workspace ownership.
- [ ] **BUILD-02** — Preserve per-tab original-base draft recovery and compare/resolve conflicts. Import local originals only through reviewed ownership mapping, idempotent transfer and count/digest verification.
- [ ] **BUILD-03** — Implement verified guided briefs pinned to objective/source/rubric/check/practice evidence; keep blank projects available without guided-learning gates.
- [ ] **BUILD-04** — Add durable run/status/event and proposal accept/reject contracts. AI proposals are bound to a base revision; new edits or revoked permission block acceptance.
- [ ] **BUILD-05** — Connect explicit saved-revision Markdown/document export and supported assets through P03; generation/preview cannot silently save, share, submit or deploy.
- [ ] **BUILD-06** — Implement exact-revision accepted-recipient sharing, consent-bound parent summaries and classroom-copy bridge; private drafts/conversations/history stay private.
- [ ] **BUILD-07** — Preserve completion criteria and professional self-review versioning; application evidence remains unverified until assessment and never awards mastery automatically.
- [ ] **BUILD-08** — Prove duplicate accept, stale proposal, cancellation/restart, account switch, restore/export failure and revoked share behavior through real API adapters on two devices.

## P07 — Qualify and connect private AI/ML

**Owner:** ML/backend/education/privacy review. **Exit:** evaluated, authorized assistance with bounded costs and no cross-user leakage.

- [ ] **AI-01** — Benchmark candidate APIs on permitted sources, teaching quality, English/Hindi/Bengali or actual released languages, citation correctness, safety, latency, quotas and total per-use cost; pin the selected route/version.
- [ ] **AI-02** — Review selected provider purpose/region/retention/tools and contract settings; minimize sent data and approve any fallback separately before routing learner data to it.
- [ ] **AI-03** — Replace imported HMAC/browser-claim trust with private service identity and audience/expiry/run-bound authorized context. ML cannot grant membership, consent, plans, publication or grades.
- [ ] **AI-04** — Enforce conversation UID/workspace ownership on every get/append/delete/context request. A supplied session ID or UUID is insufficient authorization.
- [ ] **AI-05** — Disable unsafe global exact/semantic/template caches. Add only scoped, source/policy/version-aware, reauthorized caching after isolation and revocation tests pass.
- [ ] **AI-06** — Implement permission-filtered retrieval, pinned context/prompt/tool versions and schema/citation/locale/allowed-action validation; treat uploaded/source text as untrusted input.
- [ ] **AI-07** — Implement atomic usage reservation, bounded context/tokens/tool loops/attempts, measured usage ledger, terminal settlement and ambiguous-timeout reconciliation without duplicate user debit.
- [ ] **AI-08** — Reconcile the existing whole-request teaching deadline and cancellation with provider work; long Build jobs use their own durable protocol. Preserve partial/final distinction and disconnect cleanup.
- [ ] **AI-09** — Remove raw private-text logging; test classroom/NAT fairness, provider429/outage, policy revocation mid-run, prompt injection, scoped memory and source withdrawal before production connection.
- [ ] **AI-10** — Implement any released voice/image/structured-activity operations with explicit schemas, permitted context, device/locale recovery and separate cost limits; unreleased modalities stay unavailable.

## P08 — Finish every released role backend

**Owner:** backend/frontend/product policy. **Exit:** role and relationship permissions are proved through actual server journeys.

- [ ] **ROLE-01** — Implement verified teacher/class ownership, enrollment/join/invitation lifecycle and workspace actions; independently check each class, attachment and learner operation.
- [ ] **ROLE-02** — Implement fixed assignment/objective/source/rubric publication, scheduling/timezones, close/archive/restore and supported response types.
- [ ] **ROLE-03** — Implement immutable submission copies, duplicate-safe submit, teacher draft/release/return/request-revision and retained attempt/feedback history; no silent resubmission replacement.
- [ ] **ROLE-04** — Implement verified guardian relationships, granular purpose/expiry and explicit fixed summaries/goals/classwork digests. Revocation/reconsent never revives old shares.
- [ ] **ROLE-05** — Implement separate professional personal/company records, sponsored membership and explicit portfolio/project shares; employer access does not include private personal learning.
- [ ] **ROLE-06** — Implement organization membership/invitations/roles, approved curriculum delivery/publication, settings permissions and scoped audited administrative actions.
- [ ] **ROLE-07** — Implement authorized teacher/guardian/organization reports with provenance, permitted periods and approved aggregation/suppression rules; exclude private learner chat and drafts by default.
- [ ] **ROLE-08** — Connect every released role screen to backend adapters and test pending/expired/revoked membership while reads/writes/jobs are in flight, across all released categories/languages.
- [ ] **ROLE-09** — Reconcile organization-sponsored entitlement requirements with real approved commercial contracts; a seat-request preview cannot invent institutional billing or administrative authority.

## P09 — Complete hosted billing and paid-release acceptance

**Owner:** billing/backend/platform/commercial owner. **Exit:** production-money capability is explicitly separated from current test mode and accepted before paid launch.

- [ ] **BILL-01** — Deploy and accept the existing test runtime on canonical HTTPS ingress; verify real auth return, cookies and real test-merchant checkout with durable storage and a second device.
- [ ] **BILL-02** — Register actual test webhooks after an ingress exists, preserve raw signed bytes/limits, and prove duplicate/reordered/late/refund/dispute notifications and reconciliation after restart.
- [ ] **BILL-03** — Replace the bounded test-volume scanner with growth-appropriate per-account Tasks/outbox, private job identity, backlog monitoring, leases and merchant-rate-aware retry caps.
- [ ] **BILL-04** — Connect authoritative entitlement and actual AI/feature usage admission. Plan display, checkout intent and paid actions must agree across devices; unknown provider state stays pending.
- [ ] **BILL-05** — Define and implement the released renewal/failure/grace/cancel/refund/dispute/plan-change/payment-method behavior and recovery. Unreleased changes must not be advertised as working.
- [ ] **BILL-06** — Obtain reviewed seller/tax/invoice/refund/commercial policy and recurring-method acceptance for the actual merchant. Preserve immutable original invoices and accurate refunds; do not invent legal fields.
- [ ] **BILL-07** — Implement explicit separately configured live mode/records/secrets/plan provisioning and acceptance. Retain UID but never convert test transactions into live history; startup/scaling cannot provision plans or charges.
- [ ] **BILL-08** — Prove auth-required purchase, expired-session recovery, idempotent retry, Free defaults, one Family payer, beneficiary revocation and payer-only invoice access. Family benefits never grant learning/guardian access.

A hosted test beta may close BILL-01–04 without enabling real money. A paid launch additionally requires the relevant BILL-05–08 commercial/live evidence; changing a secret is not a release gate.

## P10 — Privacy, notifications, support and operational data

**Owner:** backend/security/privacy/operations. **Exit:** real-user data has enforceable access, lifecycle and support procedures.

- [ ] **PRIV-01** — Approve purpose/minimization/retention by data class, including auth/device metadata, learning text, source files, billing/audit and model artifacts; define supported age/admission/guardian flows.
- [ ] **PRIV-02** — Implement authenticated bounded export/deletion jobs across Firestore, SQL, objects, provider artifacts and caches; stop new work/downloads first and verify completion/reconciliation.
- [ ] **PRIV-03** — Test restore against deletion/consent tombstones and current policy, so backup recovery cannot revive prohibited access or erased derived records.
- [ ] **PRIV-04** — Implement durable in-app notification/read/preference state and approved email delivery, with idempotency, quiet/retry handling and no private data in public links/logs. Verify real selected delivery channels.
- [ ] **PRIV-05** — Implement support cases/reporting, scoped operator access, reason/audit and incident/abuse response. No unrestricted user dump or default operator impersonation.
- [ ] **PRIV-06** — Protect exports, object links, search results, error messages and telemetry through negative authorization tests; include log/backup/access-review and secret-rotation procedures.
- [ ] **PRIV-07** — Complete required launch privacy/commercial disclosures and content/model/provider rights review with accountable owners; record approvals separately from engineering tests.

Retain the founder's existing keep-data instruction: do not enable automatic TTL/purges or delete current account/history as an implementation shortcut. Deletion capabilities require explicit request/policy authority; exercise destructive recovery scenarios on isolated synthetic records. Staff access also needs an approved strong-sign-in/step-up and audit policy before exposure.

## P11 — Integrate and accept the whole released product

**Owner:** QA and component owners. **Exit:** real adapters and durable staging data satisfy product behavior, including failure states.

- [ ] **ACCEPT-01** — Exercise public pricing → auth/verification → onboarding → Free profile → test subscription → invoice → learning → project → second-device resume on the hosted system.
- [ ] **ACCEPT-02** — Exercise teacher assignment → learner fixed submission → teacher review/revision, guardian permitted summary, professional/employer share and organization publication/withdrawal through real server authorization.
- [ ] **ACCEPT-03** — Run wrong-user/workspace/role/object, consent expiry, source withdrawal, stale response, concurrent write, changed account and background-output denial cases for every endpoint family.
- [ ] **ACCEPT-04** — Verify degraded states for SQL/object/model/provider outages, interrupted workers, duplicate/reordered delivery, invalid uploads and cancellation; preserve drafts and avoid false success or duplicate side effects.
- [ ] **ACCEPT-05** — Complete released category/source/language coverage, real device/keyboard/screen-reader/mobile and recovery journeys. Native apps are a separate future client, not implied by responsive web tests.
- [ ] **ACCEPT-06** — Verify production builds cannot activate fictional data, fixture routes, emulator bypasses or legacy identity/model startup. Retire old dependencies/routes only after replacement coverage and recorded provenance patches.
- [ ] **ACCEPT-07** — Rehearse reviewed schema/local-data migration with originals retained, counts/digests/ownership checks, canary cutover and rollback; exactly one executor owns each side-effecting command.

## P12 — Prove capacity, recovery, economics and launch operation

**Owner:** platform/on-call/QA/product owner. **Exit:** launch acceptance record with actual configuration and evidence.

- [ ] **RELEASE-01** — Replace workload guesses with beta request/token/duration/byte distributions; include polling, synchronized class starts, retries and additional Build demand without double-counting turns.
- [ ] **RELEASE-02** — Run realistic data/index load and soak tests against the selected baseline: 150 core requests/s and 16.7 AI runs/s sustained, 300/33.4 burst, plus explicitly selected Build traffic and school-start scenario.
- [ ] **RELEASE-03** — Obtain actual provider quotas; prove instance/pool/concurrency/admission ceilings, tenant fairness, queue drain and user-visible throttling under spikes and dependency failure.
- [ ] **RELEASE-04** — Measure useful-answer/artifact quality, latency/error budgets and cost per completed task including failed attempts, storage/egress, support and operations. Apply enforced spend admission, not alerts alone.
- [ ] **RELEASE-05** — Execute SQL/Firestore/object restore, reconnect, region-outage procedure, deletion replay, payment reconciliation and deployment rollback against the stated RPO/RTO objectives.
- [ ] **RELEASE-06** — Complete release-path security/dependency/image reviews, controlled access review, secret rotation and incident/support/on-call runbooks with named responders.
- [ ] **RELEASE-07** — Accept production origin/merchant/model/source/environment configuration and required privacy/commercial evidence; release a controlled cohort with stop/rollback criteria and observed error/cost budgets.
- [ ] **RELEASE-08** — Expand gradually toward the growth target only after measured gates pass. Record final scope, configuration, release evidence, known limitations and accountable launch acceptance.

Load, provider, device and recovery tests must use suitable isolated environments and budgets. Mocked provider runs test infrastructure independently; actual provider/merchant acceptance is separate. Existing [operational targets and release matrix](discussions/launch-operations.md) supply the detailed conditions; they are not already achieved SLAs.

## Later capabilities — separate from the current launch baseline

- [ ] **LATER-01** — Arbitrary code execution: qualified separate runtime/project/network/IAM, supply-chain/resource/egress/metadata controls, cancellation/cleanup tests and incremental budgets.
- [ ] **LATER-02** — Generated HTML/app previews: separate cookieless origin, restrictive sandbox/CSP, bounded authenticated message bridge and real browser abuse/recovery tests.
- [ ] **LATER-03** — Public deployment and generated-app storage/connectors: immutable release approval, scoped capability proxy, revocation, abuse response, schema/tenant boundaries and explicit cost/age policy.
- [ ] **LATER-04** — Own-model serving/fine-tuning: licensed/consented data, measured quality/economic advantage, GPU/MLOps/security/on-call readiness; foundation-model training is outside the initial launch baseline.
- [ ] **LATER-05** — Redis/specialized vector/search infrastructure, replicas/sharding, additional regions or a second cloud: introduce only for a demonstrated access-pattern, capacity, latency or recovery requirement.

If one of these capabilities becomes a published launch feature, move its tasks into the release scope and make its acceptance mandatory. No new cloud resource, production migration, model integration, price/usage-policy change or live-money action is performed by writing this tracker.
