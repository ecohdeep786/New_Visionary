# KAN-34 independent runtime-repair source review

21 October 2026, 09:00 UTC. Reviewer/verifier: `/root/kan34_review`.

**Decision: approved for exact source `c896dafa82fc813c5706e721e12c7947789638fb`.
No blocking source findings; one nonblocking error-copy observation below.**
This is not full KAN-34 provider, mail or hosted acceptance.

## Responsibility and scope

I explicitly accept independent reviewer responsibility for this replacement
candidate. I did not implement the repair. My previous approval of `7aba0d56`
does not approve new code; the checks in this report were reproduced on the
replacement candidate in the separate reviewer instance.

- Candidate: `c896dafa82fc813c5706e721e12c7947789638fb`.
- Focused repair comparison: `302c8e36..c896dafa`; integration inspected against
  the earlier `7aba0d56` provider-method patch.
- Reviewer branch: `codex/qa-review-kan-34-signin-matrix`, fast-forwarded to the
  replacement candidate, pushed and remote-ref verified before review.
- Reviewer checkout:
  `C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-34-signin-matrix`.
- Implementation source remained at the exact candidate during verification.
  This report adds evidence only; no runtime source was edited by the reviewer.

The runtime delta is confined to `frontend/src/pages/Onboarding.jsx`,
`frontend/src/components/onboarding/OnboardingLayout.jsx`, and
`frontend/src/components/onboarding/steps/IdentitySelection.jsx`. The added
browser harness and source inventory/documentation updates were also inspected.
Earlier Google/Apple provider-method validation is unchanged. No backend, ML,
schema, package/lock, provider configuration or infrastructure source is changed
by this recovery repair.

## Source assessment

The account-switch control is available on identity, flow and review phases and
has explicit `type="button"`, so it does not submit onboarding. The action
reuses existing server-backed logout, waits for its success and preserves the
validated return intent through `authLink('/login')`. It does not save setup or
change membership. The existing UID-keyed ProductSetup remount and UID-specific
draft keys keep different accounts' drafts separate.

A shared ref lock excludes duplicate switch, switch-versus-finish and
finish-versus-switch commands even before a React rerender. Busy state disables
the form fields and navigation. IdentitySelection forwards busy/error/account
actions; pending switch labels say Signing out rather than Saving. Failed
logout leaves the account and its draft available for explicit retry. Existing
server-auth generation/UID/CSRF mechanisms remain in use; the repair does not
invent browser-local session authority.

I independently held mutation responses open and checked pending UI state,
duplicate command exclusion, failure recovery, and a later account-B load. These
tests supplement the supplied six scenarios, whose screenshots are taken after
returning to login. Reviewer screenshots cover the actual pending and failed
onboarding review state before navigation.

## Independent verification

| Check on the exact replacement candidate | Actual result |
| --- | --- |
| Root `npm run check`, Firebase mode using the committed public Web configuration | Exit 0: layout/import integrity, 18 script tests, source audit, lint, both TypeScript checks, 554 frontend tests and production build pass |
| Independent production build within root check | Completes in 4 minutes 55 seconds; slow local run, no build failure |
| `VISIONARY_REVIEW_ORIGIN=http://127.0.0.1:5185 node frontend/scripts/onboarding-account-review.mjs` | Exit 0; six scenarios pass: identity/flow/review at 1280px and 390px, failed logout, duplicate denial, retry, draft/return/CSRF/account binding and no onboarding/profile writes |
| `VISIONARY_REVIEW_ORIGIN=http://127.0.0.1:5185 node frontend/scripts/sign-in-methods-review.mjs` | Exit 0; all four retained compiled sign-in scenarios pass |
| Reviewer-written `node artifacts/qa/kan34-runtime-review/onboarding-extra-probes.mjs` | Exit 0; two compound scenarios pass, detailed below |
| `git diff --check`, exact HEAD and clean-source inspection | Pass; exact candidate retained throughout source checks |
| Visual inspection | Independently generated 390px pending-switch and failed-switch review pages inspected; labels, disabled actions, account email, draft and retry error remain visible, without horizontal overflow |

The switch-first probe holds logout pending, attempts duplicate switch and form
submission, then verifies one logout and zero saves. It checks disabled form,
accurate Signing out labels, a 503 recovery with unchanged draft bytes/account,
and successful retry preserving the subscription return intent. A subsequent
fictional account-B `/me` refresh loads B's own initialized draft, retains A's
draft bytes, and does not display A's private draft name.

The finish-first probe holds onboarding save pending, attempts switch and
duplicate submission, then verifies one save and zero logout calls. Its failed
save preserves the draft and account and re-enables recovery. These are local
fixture tests, not real account writes.

Both compiled harnesses and reviewer probes run only on loopback with fictional
profiles and intercepted Auth API responses. No live identity, credentials,
email, provider configuration or private QA material was accessed. The first
extra-probe runner used a nonexistent package-internal Puppeteer path; the
reviewer corrected that ignored runner to resolve the installed package entry
before running the passing behavioral tests. No candidate source or dependency
was changed to address that harness error.

The reviewer reverified matching frontend lock SHA256
`f2b593302bdaeb5854006e7f2e15476ad32a968827a38a5b8a7f8f4c26e4a3dd` and reused
the existing ignored dependency junction. No fresh install or upgrade is claimed.
The own preview on port 5185 was stopped after verification.

Ignored evidence is under `artifacts/qa/kan34-runtime-review/` (root-check,
onboarding, sign-in and extra-probe logs; reviewer probe source/results; pending
and failed-state screenshots). Supplied-harness outputs are under
`artifacts/qa/kan34/onboarding-account/` and `artifacts/qa/kan34/browser/` in the
reviewer checkout. Preserve required evidence before eventual checkout cleanup.

## Nonblocking observation

On a 503 from logout, `switchAccount` calls the shared `authErrorMessage`, whose
service-failure copy says “Sign-in is temporarily unavailable. Please try again
shortly.” This is inaccurate action wording for a sign-out failure, although the
account/draft retention and explicit retry work correctly. Consider a sign-out
service-failure message in the upcoming copy patch. This observation does not
block the reviewed source repair.

## Acceptance boundary

Verification passes for this exact source repair only. The supplied live Google,
verification-email, reset-email, authorized-domain and Apple configuration
records were not independently executed by this reviewer and are not certified
by these fixtures. The recorded remaining provider/mail/hosted-device gates still
apply. No full-task Done, merge, production deployment, main promotion or checkout
cleanup is approved or performed here.

During this review the founder additionally requested removal of Apple web
sign-in and new wording. Those upcoming changes are outside this exact candidate
and must receive a separate replacement-source review. This decision must not be
reused to approve them. KAN-29 source selection remains separately deferred.
