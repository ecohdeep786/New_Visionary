# KAN-34 independent phone authentication review

23 October 2026, 05:58 UTC. Reviewer/verifier: `/root/kan34_release_review`.

**Exact reviewed implementation: `3bf8aa9862892567d2dbed44d6d838a2d33bf98b`.**
**Decision: approved for source integration and the reviewed controlled rollout.
Native hosted SMS acceptance remains pending.**

## Responsibility and scope

I explicitly accept responsibility as the separate reviewer and did not implement
the changes. Jira/source ID is KAN-34 / SCOPE-07; implementer is `/root`. This is
the phone extension described in
[the handoff](../delivery/KAN34_PHONE_AUTH_REVIEW.md), not an extension of the
earlier email/Google hosted approval by implication.

Worker branch is `codex/codex-kan-34-signin-matrix`, accepted dev base/current dev
is `54fe8e9d6b29af9a84c5cec8a9e130a771e7fb23`, and current main is
`1ae078dc469846246bb5571717e39a6afe7a402e`. I fetched and independently checked
these refs. Existing main is the previously accepted email/Google/epoch-aware
production release; it does not implement the new phone sign-in contract.

I used the clean `codex/qa-review-kan-34-signin-matrix` checkout and preserved its
prior review commits while merging each pushed candidate for inspection. Before
adding this report, its complete tree matched the exact final candidate tree
`401c13d6970182061f34575ce7b11a6fd231eb73`. Review merge commits are not a different
implementation approval. Only this new report is a reviewer-authored tracked
change. No runtime source or shared worker file was edited by the reviewer.

Comparison covers the phone extension from accepted dev, including rejected
candidate `24663e21`, repairs at `4a3a5406` and `645142df`, and the final submitted
session boundary at `3bf8aa98`. Owned surfaces include shared phone/login/register
UI, SDK/identity lifecycle, server methods/admission/profile, account identifiers,
CSP, release checks, tests and source inventories. Landing source is unchanged
from current dev, independently verified. No ML/job, password export, account
linking, new mail sender or destructive migration is introduced.

## Criteria and source assessment

- Identity admission verifies the native token and recent authentication before
  accepting the phone provider. Phone admission requires the server availability
  flag, matching signed phone number/identity claims, and the existing UID,
  account/session epoch, cutoff, expiry and cookie/device bindings. Disabled or
  malformed phone identities cannot create account records.
- New phone identities create one UID-owned profile and enter onboarding;
  returning identities resume the saved setup/introduction. Account display and
  switching use phone identifiers when there is no verified email. A phone number
  does not automatically merge an email/Google account; the form explains this.
- Phone verification does not establish ownership of a linked email. Canonical
  email is populated only from a currently verified Firebase email claim and is
  cleared otherwise. Public profile projection requires the verified-email marker
  and sets identity/email after the profile spread. Email-addressed Family grants
  therefore retain their ownership guard, including through the older rollback
  image that consumes canonical email.
- The shared phone form validates Indian numbers, uses Firebase reCAPTCHA/SMS,
  bounds code input, prevents duplicate submissions and supports wrong-code
  recovery, resend cooldown and number correction. It retains no durable SMS code,
  password or SDK token as a product login cache. Passwords remain managed by
  Firebase Authentication; product session/profile authority remains server-owned.
- Cancellable identity work owns its operation slot. A disposed CAPTCHA need not
  settle its native SDK promise for cancellation to release the UI. Late work
  cannot unlock or sign out a newer operation. Pending email verification/resend
  retain the intended SDK user object and captured UID rather than consulting
  global Firebase `currentUser`, which a late SDK operation can mutate.
- Once a cookie-changing session exchange is queued, phone-form cleanup cannot
  report cancellation or admit another identity over it. The operation settles
  its actual server result. This explicit commit boundary avoids a rejected local
  flow followed by an unexpectedly authenticated cookie on the next read.
- The methods endpoint carries availability only, not private account data. The
  real-project phone UI requires a supported HTTPS origin and server availability;
  loopback workflows use explicit demo emulator configuration. Unsupported
  providers are removed from the offered web UI. CSP adds scoped reCAPTCHA
  script/frame/connect paths without adding wildcard or inline script permission.

Frontend -> SDK/provider -> API -> backend -> UID store -> session observation ->
device recovery applies. Native SDK/emulator browser evidence and memory-store
tests cover those local boundaries. ML/jobs are N/A. No native SMS delivery,
production phone account or hosted CAPTCHA outcome is inferred from these tests.

## Blocking findings resolved before approval

1. `24663e21` kept the sign-in lock until an abandoned reCAPTCHA SDK promise
   settled. I inspected the installed SDK and independently reproduced that
   cancellation still blocked subsequent email sign-in. Final owned-operation
   cancellation settles the caller and releases its own slot without requiring
   the abandoned SDK promise to resolve.
2. Phone admission at `24663e21` could project an unverified linked email as
   trusted canonical email. I independently reproduced the compiled phone
   admission -> public profile -> email-addressed Family invitation authorization
   chain. The final canonical/projection guards and compiled deny/positive/revoked
   verification regression close that authority regression.
3. `4a3a5406` still allowed a late cancelled phone SDK confirmation to replace
   global `currentUser` while a newer email registration awaited verification. I
   reproduced exchange of the cancelled phone identity from the email verification
   action. Explicit user/UID binding now covers both registration and unverified
   email login, resend and verification. Global SDK current-user consumers were
   removed from these authority paths.
4. Cancellation could still abandon an already submitted `/session` response,
   whose Set-Cookie could authenticate the next read. I reproduced that held
   response/cookie case. The final identity/session phase boundary retains
   ownership after the exchange is queued; its regression checks actual result
   settlement and excludes overlapping identity commands.

None of those rejected candidates is approved by this report.

## Verification and evidence

| Check | Actual result and attribution |
| --- | --- |
| Backend build in the reviewer checkout | Independent exit 0 at `4a3a5406`; backend source is byte-identical at final `3bf8aa98`, independently compared |
| `node --test --test-concurrency=2 backend/tests/firebase-product.test.cjs backend/tests/production-http.test.cjs` | Independent exit 0, 36/36 cases on that compiled backend: phone claims/availability, canonical email and Family deny/read/accept/verified-positive, session/epoch/cutoff, UID/cookie/CSRF and CSP boundaries |
| Six focused frontend auth/config/transport/onboarding test files plus `infrastructure/gcp/tests/*.test.mjs` | Independent exact final tree: exit 0, 73/73 cases, including all 27 GCP JavaScript cases and the adversarial cancellation/identity/held-cookie regressions |
| Final ref/tree comparison, backend blob comparison, landing comparison and `git diff --check` | Independent pass; reviewer working tree matched final source exactly before the report |
| Final local `npm run check` | Implementer receipt: exit 0, 624 frontend tests, 18 script tests, lint, both TypeScript projects, layout/import/audit and production build in 25.86 seconds; final build log inspected |
| Full backend suite | Implementer receipt: 107/107 exit 0 on the unchanged final backend; not substituted for a claim that the reviewer reran all 107 after the repairs |
| Final source CI | Successful [39908224000](https://github.com/ecohdeep786/New_Visionary/actions/runs/39908224000) supplied by the implementer; production correctly skipped for the task branch |
| Final phone browser workflow | Implementer frozen-source exit 0; eight actual SDK/demo Auth Emulator/Nest/memory-store scenarios, independently inspected result/log and mobile code capture |
| Final email/reset browser workflow | Implementer frozen-source exit 0; all eleven SDK/emulator registration, verification, onboarding, introduction, reset/used-link/old-password/new-password, duplicate and recovery scenarios; result/log independently inspected |

Current browser evidence is under
`artifacts/tmp/{phone-auth-browser,auth-emulator-browser}` and
`artifacts/qa/kan34/{frozen-phone-browser.log,frozen-email-browser.log,frozen-phone-check.log}`
in the worker checkout. The phone workflow covers mobile and an independent
desktop peer, same saved UID/setup, reload, both sessions denied after global
sign-out and a fresh returning login. It uses a demo provider and memory Firestore,
not real SMS or live account writes. I did not inspect or record the founder's
dedicated real number or any credential/private fixture.

The old standalone `sign-in-methods-review.mjs` asserts the previous disabled
provider-button matrix. It is historical/superseded for this extension and is
not current phone acceptance evidence; it must be refreshed before reuse against
the new UI. It is not wired into the current npm/CI checks. This nonblocking
verifier-maintenance limitation is retained rather than counted as a passing
new-phone test.

## Rollout decision and open acceptance

**Reviewer decision: approved** for exact implementation
`3bf8aa9862892567d2dbed44d6d838a2d33bf98b`, checked dev integration and the reviewed
controlled main rollout. The four reproduced findings are resolved; no remaining
blocking source finding was identified. Verification is passed for the recorded
local/source scope, with independent versus implementer evidence separated above.

The main-only workflow explicitly enables phone admission, validates actual
canonical methods availability after promotion and retains the epoch-aware
rollback boundary. The older accepted main image has no phone methods endpoint;
fallback checks correctly use its older contract. Restoring it temporarily stops
fresh phone sign-in and hides phone on new page loads without deleting accounts
or reviving globally revoked sessions. Never restore a pre-epoch image. Actual
dev/main merge identities, integrated checks, deployment artifacts and canonical
outcomes remain integrator release receipts to be recorded, not completed actions
asserted here.

**Hosted SMS acceptance remains pending.** It still requires the authorized real
number on the canonical HTTPS product, human CAPTCHA if challenged, SMS receipt
and correct-code confirmation, same-UID setup/return/session behavior, and guarded
test cleanup. Provider enabled/region inventory and passing emulator codes do not
meet that gate. KAN-34 must not be marked Done for the expanded scope or its
worktrees retired before that acceptance and actual recorded integration/Done.

Custom mail-domain verification and unapplied template changes retain their
separate open configuration boundaries. KAN-29 remains deferred. Account linking,
MFA/load/security-equivalence and unrelated feature/privacy/billing gates are not
approved by this source review. No next dependent task is started or accepted.
