# KAN-162 production delivery — independent scoped acceptance

Jira/source: KAN-162. Acceptance scope: correct GCP production target, canonical domain/edge, main-only automatic production delivery and operational recovery.
Implementer/operator: Codex root agent. Independent reviewer/verifier: `kan162_review` QA subagent, accepting responsibility for this decision.
Exact deployed main: `7aee2324024cb0b9202609c72fcab21b6de7ed6b`.
Reviewed implementation: `4de8a33cb223a746c9738dc24554dd8ab812556e`, following exact reviews of `ad495a66` and `bf3a9489`. Subsequent main differences are documentation/evidence only; explicit runtime/workflow/configuration source comparison exits 0.
Final independent hosted verification: 2026-10-20 10:12:09 UTC.

## Decision

**Approved and verified for KAN-162's scoped production-target/main-delivery infrastructure outcome at deployed main `7aee2324024cb0b9202609c72fcab21b6de7ed6b`.** The correct `visionary-research` project now serves the canonical product domain, and an actual main push completed the automatic build, smoke, keyless publish, candidate verification and promotion path. Operational rollback/restoration has an actual operator receipt, and this reviewer independently verified the restored final state.

This decision does not qualify the entire product as launch complete. Email/provider/browser sign-in, KAN-29 source/content coverage, KAN-145/KAN-146 testing, live billing, privacy/commercial acceptance, capacity/load and other feature gates retain their own acceptance. KAN-161/KAN-28 source acceptance is not enlarged into unrelated hosted feature acceptance. Four moderate upstream dependency advisories remain visible; high/critical audit threshold passes.

## Actual main workflow and immutable release

Independently queried GitHub's public Actions API for [run 39405370084](https://github.com/ecohdeep786/New_Visionary/actions/runs/39405370084). It reports event `push`, branch `main`, exact head `7aee2324`, completed **success**. Both checks and production jobs succeeded. Individual successful steps include locked installs/audit, full root checks, production-runtime checks, Node/Python infrastructure tests, Linux image build, container smoke, keyless cloud authentication, immutable publication, deploy and artifact upload. This supplies executed container evidence that was unavailable in the local Windows Docker environment.

Independently read the actual downloaded `auto-published-release.json` and `auto-deployed-release.json` in the implementer's ignored `artifacts/gcp/kan162-research/` folder. Their values match live Cloud Run read-back:

```text
Project: visionary-research (174851137514)
Region/service: asia-south1 / visionary-product
Main: 7aee2324024cb0b9202609c72fcab21b6de7ed6b
Image: asia-south1-docker.pkg.dev/visionary-research/visionary-product/product@sha256:95f26b3ca800d148577456b2b21951bb2f93f76d1534628a37304ccd1363a7aa
Revision: visionary-product-g7aee2324024c-39405370084-1
Previous revision: visionary-product-baseline-f3cf316edb74-mvgi7evq
Previous main: f3cf316edb746ef85a8bfb04f71f29165c54944e
```

The source review confirms cloud credentials and publish/deploy are restricted to the exact main workflow/ref/event with separate activation flags; dev/PR checks do not deploy. Actual main deploy success establishes that the deploy gate was enabled for this run, independently of the operator's variable-setting receipt. Future main changes remain subject to those checks and current-main/revision/traffic guards; this is not a guarantee that an arbitrary failing change will deploy.

## Independent canonical edge and runtime checks

| Boundary | Independent result |
| --- | --- |
| DNS | `visionary.org.in` resolves to new edge `34.8.58.39` |
| Managed certificate | `visionary-product-cert` and its apex domain report ACTIVE |
| Client TLS | Authorized TLS 1.3, Google Trust Services issuer, SAN `DNS:visionary.org.in`, expiry 2027-01-18 09:46:21 GMT; no certificate verification bypass |
| HTTP redirect | 301 to HTTPS, preserving `/login?qa=canonical`; Location explicitly includes default port `:443`, whose normalized origin is canonical |
| Direct service URL | `/api/health` returns 404 after ingress cutover |
| Cloud Run ingress/cost | `internal-and-cloud-load-balancing`, service maximum 1; invoker IAM check disabled only on this public service |
| Serving state | 100% explicitly pinned to the expected `g7aee2324` revision; no LATEST traffic ambiguity |
| Immutable runtime | `verifyRevision` accepts exact expected commit/image, runtime identity, Firebase project/auth domain/default database/canonical origin/two proxy hops, secret reference version 1 and all resource/cost settings |
| Health/login | Actual canonical `/api/health` 200 JSON and `/login` 200 HTML, exact source headers |
| Anonymous authority | Actual canonical `/api/auth/me` and `/api/account/overview` 401 JSON; unknown API 404 JSON; exact source and no-store |
| CSRF/Origin | Secure/HttpOnly/SameSite=Strict host CSRF cookie; anonymous canonical-Origin POST with valid CSRF denied 401; forged Origin denied 403 |
| Candidate/proxy | Actual `/__deploy-check` passes exact source/no-store/JSON and reports removal of the deliberately forged forwarded-IP sentinel |

Executed `publicChecks` and the candidate `probe` first against the canonical baseline source, again after automatic promotion and again on the final restored `7aee2324` state. Final exact service/revision reads plus canonical/security/proxy checks exit 0 at 10:12:09 UTC. The initial redirect test expected a string without explicit `:443`; inspection showed a semantically correct default-port redirect, and the corrected normalized-origin/path/query assertion passed. No product defect or implementation change was inferred from that overly strict initial assertion.

The earlier [independent read-only cloud snapshot](KAN162_EXACT_SHA_REVIEW_4DE8A33C.md) verified active project identity, named native Firestore/default deny-all deployed rules, canonical Firebase authorized domain, exact WIF condition/mappings, narrowly scoped deployer resource IAM, enabled secret reference and bounded runtime. No secret value or protected account record was accessed by this verifier.

## Actual recovery and account-test attribution

Reviewed the operator's actual `rollback-restoration.json`: exact main/revision guard, move to the prior baseline at 100%, successful canonical source/security checks, restoration to current main, and successful canonical/candidate checks. It records `rollbackVerified:true`, `restorationVerified:true`, `canonicalSecurityChecks:true`, final public source `7aee2324`, and no user-data change from traffic operations.

This reviewer independently observed and tested the final restored revision/source at 10:10:50 UTC and 10:12:09 UTC. The brief baseline traffic interval was not independently sampled; its transition and baseline checks are attributed to the operator receipt. This was an actual guarded operational traffic rollback/restoration test, not an induced failed-release test of the automated failure handler. That handler retains separately executed source regression coverage.

Reviewed `canonical-account-result.json`, attributed to the root operator: a real Firebase custom token, two independent secure device sessions, UID-root/directory/Free-billing persistence, wrong-account and Origin/CSRF denial, adult onboarding recovered by the other session, zero current-tree differences and independent logout behavior passed on canonical `7aee2324`. It records synthetic identity disabled, no existing account changed and no records deleted. It explicitly does **not** qualify provider login or an authenticated browser journey. The operator separately observed the rendered canonical login UI; this verifier performed HTTP/TLS/API checks, not a browser sign-in. Those distinctions are retained.

## Delivery receipt boundary

Reviewer decision: **approved for scoped KAN-162 delivery**, exact deployed main above.
Verification result: **passed** for the specified canonical infrastructure/automatic-main/recovery outcome, with the attributed versus independently observed evidence stated explicitly.
Published integration: main `7aee2324` verified by remote/source comparison and actual successful push workflow; predecessor helper/source integration and independent reviews remain linked above.
Jira transition: not performed or invented by this reviewer. The integrator records the actual native status/comment receipt after accepting this scoped outcome. Cleanup and next-task selection still follow the repository's evidence, remote-backup and prerequisite rules.

No cloud mutation, traffic change, protected-record operation, implementation edit or unrelated Jira task work was performed by this reviewer. This evidence does not migrate old-project data, close linked provider/content/privacy gates or certify the whole product for launch.
