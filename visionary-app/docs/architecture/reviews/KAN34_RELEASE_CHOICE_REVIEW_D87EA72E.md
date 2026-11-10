# KAN-34 independent release-choice source review

21 October 2026, 14:26 UTC. Reviewer/verifier: `/root/kan34_review`.

**Exact reviewed source: `d87ea72e9cbc4b88a701718231ac7e5a1b786665`.**
**Decision: approved for this exact source scope. No blocking source findings.**

## Responsibility and comparison

I explicitly accept responsibility as the separate source reviewer. I did not
implement these changes. This review replaces the earlier source approval for
the changed candidate; it does not approve full KAN-34, hosted acceptance, mail
configuration, a merge or a production release.

The comparison is `abf3291316f022acece27ddf7e5db324776603d4..d87ea72e`, including
the retained onboarding repair previously reviewed at `c896dafa`. The intermediate
source was `f094876a42a7cf47dfad907777730b2d584e4df4`. Final source adds the mobile
account-navigation footer, its compiled regression and documentation/inventory
updates. Backend, Firebase adapter, AuthContext, Onboarding and infrastructure
blobs are identical between those last two candidates, independently checked
with `git diff --exit-code`.

Reviewer branch `codex/qa-review-kan-34-signin-matrix` was fast-forwarded to each
pushed candidate, pushed and actual remote-ref verified before its review. Work
used only the matching reviewer checkout under
`C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-34-signin-matrix`.
Only this report is a tracked reviewer change. The implementation source stayed
at the final exact SHA during final verification.
Current remote dev was read with `git ls-remote --heads origin dev` after checks:
`84a432ece03535ec7e62c1591b420650bd12e52a`. No integration is implied by that read.

## Source assessment

Apple is absent from web sign-in and registration. The popup allowlist rejects
Apple and unknown names before invoking the identity SDK; the adapter constructs
only GoogleAuthProvider. Disabled mobile, Microsoft and organization methods
remain visibly explained. This is web-client support removal, not a claim that
the Firebase project's Apple provider or other clients were disabled.

Server sessions now have a fixed 14-day absolute lifetime and seven-day idle
limit. Activity updates lastSeen without extending absolute expiry, including
existing sessions with shorter expiry. Server authority, cookie/device/UID/hash
binding, revocation verification and recent-auth requirements remain intact.
Malformed/nonfinite expiry and activity records, expiry, excessive future activity
and idle expiry are denied before activity writes. The SDK remains memory-only;
no password or SDK refresh token is cached to implement remembered sign-in.

HTTPS controller probes confirm both host-prefixed cookies use Secure, HttpOnly,
SameSite Strict, path `/`, no Domain and 14-day maxAge. Loopback HTTP is a separate
development behavior; the browser fixtures are not a hosted HTTPS cookie test.

Native Firebase verification and reset links remain the chosen implementation.
There is no custom OTP or custom sender implementation. The nonsecret desired
email-template JSON explicitly says `prepared-not-applied`; no runtime consumer
or configuration-mutating helper is introduced. The contract documentation does
change to describe the new policy and remaining restrictions. Runtime API routes,
DTO/schema and storage paths are unchanged; session duration/validation changes
are intentional behavior changes. Generated route/endpoint/storage inventories
were compared independently and retain their identities. No ML/job changes apply.

The final mobile-only footer exposes Create account and Sign in outside the
desktop-only panel. Compiled tests navigate both directions and preserve the
validated return intent. I inspected the independently generated 390px login and
registration screenshots: footer links are visible, Apple is absent, copy and
controls fit without horizontal overflow. The earlier nonblocking 503 logout
wording observation is fixed: the compiled failure says it could not sign the
user out and that the draft is kept. Its recovery screenshot was also inspected.

## Independent verification

| Command or inspection | Source and actual result |
| --- | --- |
| `npm run backend:build`, then `node --test backend/tests/*.test.cjs` | Intermediate f094, identical final backend blobs: exit 0; all 97 tests pass |
| Reviewer `node artifacts/qa/kan34-release-review/session-security-probes.cjs` | Same compiled backend: exit 0; five tests pass covering HTTPS cookie policy, fixed/older expiry, malformed and idle/future denial without writes, repeated revocation checks and recent-auth denial |
| Four focused frontend test files | f094, unchanged core auth at final: exit 0; 26 tests pass |
| Root `npm run check` | f094: layout/import checks, 18 script tests, audit, lint, both type checks and 553 frontend tests pass. The subsequent superseded build was deliberately stopped when final source arrived; the whole command exited -1. This is not a claim that the complete root command passed |
| Final frontend `npm run lint`, `npm run typecheck`, Firebase-mode `npm run build` | Exact d87: all exit 0; production build completes in 2 minutes 21 seconds using committed public Firebase Web configuration |
| `VISIONARY_REVIEW_ORIGIN=http://127.0.0.1:5185 node frontend/scripts/sign-in-methods-review.mjs` | Exact d87: exit 0; four compiled desktop/mobile login/register cases pass, including visible opposite-route navigation, returnTo, Apple absence, disabled methods, email progression, no overflow/errors or provider/mutation calls |
| `VISIONARY_REVIEW_ORIGIN=http://127.0.0.1:5185 node frontend/scripts/onboarding-account-review.mjs` | Exact d87: repeat run exits 0; all six compiled scenarios pass, covering identity/flow/review at 1280px and 390px, failed logout, duplicate denial, retry, draft/return/CSRF/account binding and zero profile/onboarding writes |
| `node artifacts/qa/kan34-release-review/onboarding-extra-probes.mjs` with own loopback origin | Exact d87: exit 0; both compound reviewer probes pass |
| `git diff --check`, final HEAD and remote-ref inspection | Pass; final source and pushed reviewer checkpoint agree |

The switch-first compound probe holds logout open and excludes duplicate logout
and competing save, checks disabled/pending state, verifies 503 copy and unchanged
account/draft, then retries. Loading fictional account B initializes B's own draft
without showing A's private draft or altering A's saved bytes. The finish-first
probe holds save open and excludes competing logout/duplicate save; failed save
retains account/draft and re-enables recovery. No real profile writes occur.

The first supplied six-case recovery-harness run exited 1 on its 30-second
page.goto navigation timeout, before a behavioral assertion. Its log is retained;
the unchanged harness passed all six scenarios on repeat. The host was slow
during this review; no candidate or harness code was changed for the repeat.

Frontend lock SHA256 was independently matched to the reused ignored dependency
junction: `f2b593302bdaeb5854006e7f2e15476ad32a968827a38a5b8a7f8f4c26e4a3dd`.
Backend lock SHA256 likewise matched:
`adf2864153b92e52cf3afbfa8f09a553d5b2e672567ad62deb706ab9166f261b`.
Existing dependencies were reused; no install or upgrade is claimed. Evidence
is ignored under `artifacts/qa/kan34-release-review/`; supplied browser outputs
are under `artifacts/qa/kan34/browser/` and `artifacts/qa/kan34/onboarding-account/`.
The reviewer-owned preview on port 5185 was stopped after verification.

## Acceptance boundary and handoff

These are independent source, compiled loopback and fictional service/store
checks. I did not access real accounts, email, credentials, private evidence,
provider configuration or cloud state. Parent-recorded real Google/new-tab/
reload/logout results are not independent reviewer executions.

The recorded Firebase template-edit restriction, sender-domain verification and
hosted-candidate/device acceptance remain open. The parent subsequently reported
owner-completed native reset and successful local new-password admission on d87;
that is supplied evidence, not my execution or independent hosted acceptance.
Prepared templates must not be presented as applied or delivered. External
records were read for scope consistency, not independently certified.
No migration is introduced. Production rollout and rollback evidence remain
separate release requirements.

Dev integration/checks and Jira receipts belong to the integrator after this
report; none are performed or approved here. Full-task Done, main promotion,
deployment and checkout cleanup are outside this source decision. KAN-29 source
selection remains deferred. No dependent implementation task is authorized by
this report alone.
