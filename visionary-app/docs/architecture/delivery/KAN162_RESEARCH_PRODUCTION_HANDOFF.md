# KAN-162 — visionary-research production handoff

Jira/source: KAN-162 / MAIN-PRODUCTION-01. Acceptance scope: release gate. Implementer Codex; independent reviewer `/root/kan162_review`. Branch `codex/firebase-visionary-research`, base `1d2e02aa`, exact approved source `ad495a66` plus reviewed owner helper `4de8a33c`. Independent review reports are in `docs/architecture/reviews/`. Owned scope: workflow, GCP bootstrap/release/public Firebase config, product packaging, focused tests and evidence. No data/schema migration.

## Evidence

- Source checks: root check passes (532 frontend tests,18 script tests, lint/types/build), production suite65, infrastructure Node21/Python11. Audit zero high/critical, four moderate. Actual Windows gcloud invocation passes.
- PR9 checked dev integration `3a2626d6`; PR10 checked main `f3cf316e`. Actual [main workflow39402842556](https://github.com/ecohdeep786/New_Visionary/actions/runs/39402842556) passes Linux build/container smoke/keyless publish. Immutable digest `sha256:d7c679901eaa656dd8759291ff0b1d7f736b7006b4feccd154bc29bf9d28cfe2`.
- Live project174851137514/visionary-research, Mumbai native database `default`, deny-all rules, production authorized domain, scoped IAM/WIF/secret-reference and service/revision cost bounds read back. Baseline `visionary-product-baseline-f3cf316edb74-mvgi7evq` serves100%; service-specific public mode, app authorization preserved.
- Independent run.app health/login200, anonymous me/account401, unknownAPI404, correct main source/cache/security headers, secure CSRF cookie and Origin denials. The exact report is `KAN162_BASELINE_HOSTED_VERIFICATION_F3CF316E.md`.
- Root real synthetic Firebase→product→Firestore test passes UID hierarchy/Free billing, two independent sessions, wrong-UID/CSRF/Origin denials, persisted adult onboarding recovery, current-tree audit and logout isolation. Identity disabled/tokens revoked; records retained. Earlier new-project users/accounts were empty; no former-project migration.
- Edge exists at34.8.58.39, exact candidate path and forwarded-header replacement. Public/authoritative DNS now match. TLS PROVISIONING. No canonical browser/provider claim.

## Remaining gates

Canonical TLS/HTTPS; ingress restriction; automatic deploy enablement; real main-push candidate/proxy/promotion/rollback; browser sign-in and provider acceptance where required. KAN29 retains full real-source coverage requirement (zero accepted real slices), KAN145/146 remain Testing. ML/jobs are unchanged; no educational outcome or broad product readiness follows from hosting.

Reviewer decision: exact implementation approved for checked integration/main publication; baseline independent verification passed. Hosted canonical release decision remains pending. KAN162 native Testing (transition41); Jira receipts10047–10050. Helper follow-up PR11 remains under CI/integration; no Done or cleanup yet.

## Final scoped release verification — 20 October 2026

Actual main push7aee2324024cb0b9202609c72fcab21b6de7ed6b workflow39405370084 completed SUCCESS, including each build/container/auth/publish/deploy step. Revision visionary-product-g7aee2324024c-39405370084-1 at100%, image95f26b3ca800d148577456b2b21951bb2f93f76d1534628a37304ccd1363a7aa. Managed TLS ACTIVE, canonical apex DNS34.8.58.39, ALB-only ingress, direct run.app404 and canonical public/security/CSRF/Origin/source/proxy checks pass independently. Both repository switches true. Actual operator rollback to baselinef3cf316e passes canonical checks; latest7a restoration passes. Reviewer independently verifies final restored state and attributes the brief rollback transition to root's actual receipt (no invented independent observation).

Real canonical Firebase custom-token→two secure sessions→UID directory/Free billing→onboarding/store/recovery→wrong-account/Origin/CSRF denial→logout isolation checks pass. Both created synthetic identities are disabled/tokens revoked, records retained. Correctly does not qualify email/Google/Apple, an authenticated browser journey, real curriculum or broad launch. Public login browser renders with no console warnings/errors.

Reviewer/root/kan162_review accepts scoped production-target/main-pipeline delivery. Final report KAN162_PRODUCTION_ACCEPTANCE_7AEE2324.md records exact implementation/main parity and evidence. Closeout metadata awaits checked dev publication and native Jira transition; helper PR11 integrated devab201364 and PR12 integrated main7aee2324. KAN29 has zero accepted real slices;145/146 fresh test defects remain separate.
