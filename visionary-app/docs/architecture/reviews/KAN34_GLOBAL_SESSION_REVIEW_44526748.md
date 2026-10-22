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
