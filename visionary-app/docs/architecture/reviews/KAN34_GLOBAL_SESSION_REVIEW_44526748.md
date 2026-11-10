# KAN-34 independent session and release review

22 October 2026, 17:15 UTC. Reviewer/verifier: `/root/kan34_release_review`.

**Exact reviewed candidate: `445267487faef036a1b07fa7cb5abd85255f889d`.**
**Reviewer decision: approved for the implementation, current-dev integration,
and the reviewed two-stage release procedure. No remaining blocking source
findings. Hosted feature acceptance is still required.**

## Responsibility, scope and comparison

I explicitly accept responsibility as the independent reviewer. I did not
implement these changes. My only tracked change is this review report. I used
the separate `codex/qa-review-kan-34-signin-matrix` checkout, checked it was clean,
and fast-forwarded it to the pushed candidates before reviewing them.

Jira/source ID: KAN-34. Implementer: `/root`. Acceptance scope: connected auth
implementation and release-safety preparation; not full product launch or an
already completed hosted release. The implementer reports Jira remains Testing.

Worker branch: `codex/codex-kan-34-signin-matrix`. The earlier accepted source
checkpoint was `d87ea72e9cbc4b88a701718231ac7e5a1b786665`; this review additionally
covers the global-session implementation, quota repairs, compiled verification
harness, compatibility rollout and shared-frontend reconciliation after that
checkpoint. The candidate incorporates current remote dev
`37934ceef147834c7da48f3a6e154b3a8cd794fc`. I independently read the remote dev and
worker refs at the end of verification; no dev integration or production merge
is implied by that read.

The main/dev histories require an ordinary merge rather than assuming a fast
forward. I independently ran `git merge-tree --write-tree origin/main 44526748`:
it completed without conflicts and produced
`8c8671816c4b714118eef866e73051a59e375905`, exactly the candidate tree. This is a
dry merge result, not an executed production merge. The integrator must verify
the actual resulting tree and check any later source changes separately.

Owned contracts/files include the Firebase product service/controller and session
policy, account device projection, production HTTP composition, frontend Firebase
adapter/transport and AuthContext, auth/onboarding account navigation, dashboard
sign-out, compiled browser scripts, GCP release helper/tests and the shared auth
contract. Owner frontend changes already on dev were retained; the auth conflict
resolutions are explicitly included in this review. No ML/job or learning-content
acceptance is involved. There is no destructive account migration: absent legacy
epoch fields remain version zero, while malformed security fields fail closed.

Prerequisites and boundaries: Firebase remains the identity authority; the product
backend is the session/profile authority. The production main-to-GCP workflow is
already established. Native provider and mail receipts supplied by the implementer
are separate from fictional browser tests. Their project/domain configuration and
hosted acceptance must be checked live during release. This review does not close
unrelated Jira prerequisites, deferred curriculum work or provider gates.

## Acceptance criteria and assessment

- Remembered device login: server cookies are bound to the device, UID and cookie
  hash; Firebase session revocation is checked on admission. The fixed 14-day
  absolute and seven-day idle limits are enforced without sliding absolute expiry.
  The SDK remains memory-only. Passwords and SDK refresh tokens are not stored as
  a browser login cache or product database password record.
- Account-wide sign-out: the Firestore transaction increments the account epoch,
  records a recent-login cutoff, revokes the issuer and records the audit event.
  Every subsequent device admission checks the epoch. Old identity tokens cannot
  mint a replacement product session. Issuer retries acknowledge the earlier
  operation without revoking a later fresh login. Retired-device retries cannot
  exhaust another device's sign-out quota; stale tokens are denied before charging
  the account sign-in budget.
- Shared account/setup: account identity and first completed onboarding are
  server-owned. Returning devices resume the same account; another device's
  completion is observed without overwriting the unfinished local draft. Profile,
  onboarding and introduction mutations repeat the admitted epoch check inside
  their transaction. Other domains retain admission-before-write semantics;
  this is not a claim that already admitted operations are cancelled globally.
- Observation and recovery: visible clients observe sessions every 30 seconds
  and on focus/visibility changes without refreshing idle activity. A passive
  non-401 outage preserves the current UI; a server 401 clears it. Trusted user
  activity can touch the session. Read/generation guards reject obsolete account
  responses and logout scopes cannot silently downgrade.
- Supported web methods: email/password and Google remain available. Apple is
  removed from the UI and popup allowlist. Microsoft, organization and mobile
  methods remain explicitly unavailable. Shared-dev phone code is retained behind
  `signInMethods.mobile=false` and the additional environment flag; its presence
  is not acceptance of live phone/SMS sign-in. Native Firebase verification links
  remain the founder-selected release flow; no custom email code sender is claimed.
- Account switching and rendering: switching is available across onboarding
  identity/flow/review with concurrency, draft, UID and failure handling retained.
  Mobile login/registration navigation remains visible. I inspected the new 390px
  login and registration captures: the forms render, opposite-route links are
  visible, Apple is absent and unavailable methods are explained without clipping.

Frontend -> API -> backend -> data -> observation -> device behavior applies and
is covered by the compiled harness, service/HTTP tests and source inspection.
ML/jobs are N/A. Browser-local drafts remain device-local and do not become a
server authority or a claim of synchronizing all learning activity.

## Release-safety assessment

An image that ignores epochs can revive revoked peer sessions if restored after
global sign-out. The final release helper addresses this with two stages:

1. Against the verified legacy rollback image, the first deployment keeps new
   global sign-out disabled server-side. The frontend uses the server capability
   to offer local sign-out. Admission still enforces epochs and cutoffs.
2. A subsequent trusted main run enables global sign-out only when the actual
   serving fallback has compiled policy v1. The helper checks pinned revision
   configuration plus the canonical health response, then checks candidate and
   promoted responses. Policy version is a code constant rather than a trusted
   environment echo. A fallback with the action disabled still denies revoked
   sessions. Receipts retain both candidate and previous policies.

The workflow retains immutable image verification, exact main/source checks,
no-traffic candidate/proxy probes, serialized deployment and operator traffic
guards. The real CLI passes the derived policy through the tested deployment
argument builder; initial baseline recovery retains its no-argument callback.
Recovery documentation prohibits legacy images and deletion of epoch/cutoff
fields after activation. These controls approve the source procedure; they are
not evidence that either rollout stage or a hosted rollback has already run.

## Findings resolved before approval

- Candidate `d3b3ba32` had a real production CLI callback defect: undeclared
  `globalSignOut`, and destructuring in the initial-baseline callback that receives
  no argument. The state-machine unit fixtures did not execute that wiring.
  `8117449f` corrected the callbacks and added a test exercising the production
  deployment argument builder for both rollout stages.
- Candidate `8117449f` failed the actual compiled peer sign-out test: after the
  server correctly returned passive 401, the app rendered its error boundary.
  I independently inspected that failed capture and found missing `Building2`
  and `Phone` JSX imports after the shared-dev merge. A forced JSX undefined-name
  lint independently reproduced exactly those two errors. `44526748` restores
  both imports and enables `react/jsx-no-undef` generally. The rebuilt methods
  and two-device cases now pass. The earlier failure is not counted as a pass
  or attributed solely to a slow host.

## Verification and evidence

All commands below ran on 22 October 2026. Independent commands used the reviewer
checkout; supplied browser/build receipts used the implementer checkout and are
clearly distinguished.

| Verification | Actual outcome and attribution |
| --- | --- |
| `node --test infrastructure/gcp/tests/*.test.mjs frontend/tests/firebase-server-auth.test.mjs frontend/tests/auth-transport.test.mjs frontend/tests/auth-errors.test.mjs frontend/tests/onboarding-draft.test.mjs frontend/tests/onboarding-context.test.mjs frontend/tests/firebase-config.test.mjs` | Independent exact `44526748`: exit 0, 65/65 tests, including 26 GCP and 39 focused auth/onboarding tests |
| Focused ESLint on `SocialAuthButtons.jsx` and `Register.jsx` with the final committed configuration | Independent exact `44526748`: exit 0; the previously reproduced JSX undefined-name defects are fixed |
| `git diff --check`, remote worker/dev refs and final source comparison | Independent: pass; reviewed worker ref is exactly `44526748`, current dev is `37934cee` |
| Backend build and `node --test --test-concurrency=2 backend/tests/*.test.cjs` | Implementer receipt, inspected log: exit 0, 104/104 backend tests. Final backend blobs are unchanged from the tested `d3b3ba32` candidate |
| Root `npm run check` | Implementer receipt, inspected final build log: exit 0; 18 script tests, 617 frontend tests, layout/import/audit, lint and both typechecks; Firebase build 45.88 seconds at the pre-import-repair source |
| Final Firebase rebuild and final full lint | Implementer receipt for `44526748`: both exit 0; rebuild 28.17 seconds. The earlier build is not substituted for the repaired frontend build |
| `sign-in-methods-review.mjs` | Implementer compiled receipt, independently inspected results and 390px captures: exit 0, four desktop/mobile login/register cases |
| `onboarding-account-review.mjs` | Implementer compiled receipt, independently inspected results: exit 0, six identity/flow/review cases at 1280px and 390px |
| `device-session-review.mjs` | Implementer compiled receipt, independently inspected log/results: exit 0, four two-device cases; enabled sign-out revokes peer with passive 401 and visible sign-in without reload/focus, disabled compatibility stage retains peer 200 and unchanged epoch |
| Exact candidate CI | Implementer supplied successful [run 39820287068](https://github.com/ecohdeep786/New_Visionary/actions/runs/39820287068); production correctly skipped for the task branch |

The compiled browser artifacts are under
`artifacts/qa/kan34/{browser,onboarding-account,device-sessions}/results.json` and
`artifacts/qa/kan34/device-rollout-browser.log` in the implementation checkout.
These use the real compiled frontend and Nest service/controller with fictional
identity and transactional memory storage. Their `hostedVerified`/provider flags
explicitly remain false. I did not rerun a duplicate heavy build/browser suite
while the shared 8 GB host was executing those cases.

## Decision and remaining delivery gates

Reviewer: `/root/kan34_release_review`; exact reviewed and independently verified
source `445267487faef036a1b07fa7cb5abd85255f889d`; date 22 October 2026.
**Approved**: the source and conflict resolutions are suitable for checked dev
integration, and the two-stage main release procedure resolves the identified
rollback hazard. Verification result: **passed for the recorded local/source
scope**, with independent and implementer evidence separated above.

No blocking source defect remains. This approval does not certify Google/Apple
parity, live phone/organization/Apple providers, custom email-template activation,
domain verification, load/MFA/DDoS guarantees, or every product feature.

Dev integration commit/checks: pending integrator execution and recording.
Hosted verification/migration/rollback: pending actual main-only rollout receipts,
canonical source/policy/auth/proxy checks, relevant real-provider/account/device
acceptance and preservation of a policy-aware rollback. Firebase domain status
and email-template availability remain separate live configuration gates.
Jira transition/comment receipt: pending integrator update; no Done is asserted.
Worktree removal follows accepted/pushed integration and actual Jira Done after
required evidence/configuration preservation. No next dependent implementation
task is accepted or started by this review.

## Hosted acceptance addendum — 22 October 2026, 17:39 UTC

Reviewer: `/root/kan34_release_review`. I independently accept responsibility for
this closeout audit. This dated addendum supersedes the earlier pending hosted
acceptance statement for the released email/Google/session scope only. It does
not change implementation or retrospectively describe fictional tests as hosted.

**Hosted acceptance decision: approved for the released KAN-34 scope. No blocking
finding remains for its recorded completion.** The integrator may record the
accepted result, move KAN-34 to Done, verify that actual transition and pushed
closeout receipt, preserve required local evidence/configuration, then retire the
completed task/reviewer worktrees. Those administrative actions are not asserted
as already complete by this report.

### Delivered source and actual rollout

- Dev PR [17](https://github.com/ecohdeep786/New_Visionary/pull/17) integrated as
  `54fe8e9d6b29af9a84c5cec8a9e130a771e7fb23`; main PR
  [18](https://github.com/ecohdeep786/New_Visionary/pull/18) integrated as
  `1ae078dc469846246bb5571717e39a6afe7a402e`. I independently fetched the refs and
  verified both complete trees are `84a2a08c5c2f500fa63372493250e420350411ef`.
  Only the review, delivery note and execution receipt differ from the exact
  reviewed source `44526748`; no runtime source changed after approval.
- Integration checks [39821768315](https://github.com/ecohdeep786/New_Visionary/actions/runs/39821768315)
  and release-PR checks [39821808453](https://github.com/ecohdeep786/New_Visionary/actions/runs/39821808453)
  were reported successful by the integrator. I inspected the downloaded actual
  publication/deployment artifacts for both production stages below.
- Stage one [39822077619](https://github.com/ecohdeep786/New_Visionary/actions/runs/39822077619)
  deployed `visionary-product-g1ae078dc4698-39822077619-1`, policy v1 with global
  sign-out disabled, retaining legacy `7aee2324` as its rollback. Its image digest
  is `sha256:2f5f8e3d5d8c998115f9eb386d548109345f0ba8385c32bcdef8a4b2013c5610`.
- Stage two [39822825126](https://github.com/ecohdeep786/New_Visionary/actions/runs/39822825126)
  deployed `visionary-product-g1ae078dc4698-39822825126-1`, policy v1 with global
  sign-out enabled. Its verified fallback is the policy-v1, action-disabled stage
  one revision. Its image digest is
  `sha256:e651bff799a7b02efe34eb9643f9cbaaa3d6c59f89c15db17ec681d4bef33595`.
  Both published-image digests match their deployment receipts. Distinct image
  digests for the same main SHA are recorded rather than treated as identical
  builds.

The safe deployment artifacts are
`artifacts/qa/kan34/12445182237-deployed-release.json` and
`artifacts/qa/kan34/12445317414-deployed-release.json`, with their corresponding
published-release JSON, in the implementation checkout. Both receipts report
verified success and explicitly retain candidate/previous policy states. The
policy-aware fallback was deployed and verified; an actual traffic rollback after
this activation was not claimed or exercised as part of this addendum. The prior
failure/rollback tests and prohibition on reverting to legacy code still apply.

### Independent public verification and native evidence audit

At 17:37 UTC I independently ran `publicChecks` from the reviewed release helper
against canonical `https://visionary.org.in`, expected source
`1ae078dc469846246bb5571717e39a6afe7a402e` and policy
`{version:1, globalSignOut:true}`. It exited 0. A separate health fetch returned
HTTP 200, `Cache-Control: no-store`, the expected source header and that exact
policy. This checks canonical login/API boundaries, anonymous denials, secure
host-prefixed CSRF cookie, exact-origin/CSRF behavior and health provenance. It
does not infer the native user journey from an anonymous health response.

I separately audited the implementer's sanitized native receipts and log:

- Real canonical email sign-in restored completed setup, survived reload and
  returned to the same saved account. During the disabled compatibility stage,
  local sign-out retained an independently signed-in peer. Native canonical
  Google OAuth restored the original account's pending onboarding, followed by
  local account switching; no owner credentials or onboarding were changed and
  no global owner sign-out was performed. The Google observation is explicitly
  captured in `live/hosted-google.json`.
- `live/hosted-native-peers.json` and `hosted-native-peers.log` attest two
  independent canonical cookie jars authenticated through native Firebase, not
  an emulator. After the actual production UI global sign-out, both peers were
  rejected with HTTP 401. These are native production backend/session results;
  the 14 compiled browser cases remain separately labeled fictional.
- `live/before-hosted-logout.json` -> `live/after-hosted-logout.json` records
  account session epoch 1 -> 2 while profile version stays 2 and completed
  onboarding/introduction stay complete. The integrator additionally observed
  safe wrong-password UI and a fresh post-revocation login restoring that same
  account. The independently supplied local peer then showed sign-in after
  canonical global sign-out. I accept those explicitly attributed UI observations
  together with the native datastore/session receipts; I did not repeat credential
  entry or inspect private fixture data.
- `live/fixture-cleanup.json` and `live/final-cleanup.json` prove final epoch 3,
  the task-owned fixture disabled, refresh-token revocation requested, profile
  version/setup retained, no deletion and no original-account changes. Logs say
  credentials were not logged. I did not open private fixture JSON or credentials.
- I inspected the anonymous hosted `production-login.jpg` retained under the
  local `Visionary-local/kan34-2026-10-22` evidence folder: the deployed email and
  Google UI renders, Apple is absent and other methods are honestly unavailable.

### Accepted boundary and completion record

I independently read live KAN-34: status is still Testing at this audit and its
requirement includes phone/SSO **if offered**. Released email/password, Google,
Firebase verification links, remembered server sessions, account/setup continuity
and global Visionary session sign-out now have the required source, integration,
hosted and native-provider evidence. The disabled methods are not offered as
working released methods. This supports Done for that explicit scope, without
closing every linked product/provider/privacy/load/AGI gate.

Firebase custom sender-domain verification remains `IN_PROGRESS`, with the
integrator's current request checkpoint `2026-10-22T16:44:51Z`. Custom email-template
writes were rejected by the provider and are not claimed applied. These remain
explicit open provider-configuration follow-ups; existing delivered Firebase
verification/reset links continue to be the accepted release flow. Do not mark
the custom domain/templates complete, promise automatic verification, or erase
their follow-up record when closing KAN-34. Phone, Microsoft and organization
provider acceptance, deferred KAN-29 content, device-local learning limitations,
and other linked release gates retain their prior open/unavailable boundaries.

The integrator must now publish this report and the actual hosted receipts in
the execution/Jira closeout record, retain the explicit remaining configuration
gates, verify Jira Done, and preserve necessary ignored evidence/configuration
before removing completed worktrees. This addendum is report-only; it requires
no additional application deployment.
