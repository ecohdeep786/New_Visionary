# KAN-34 sign-in implementation and acceptance matrix

21 October 2026. Status: In Progress. This task resumes the existing
`codex/codex-kan-34-signin-matrix` instance from accepted `origin/dev`
`84a432ece03535ec7e62c1591b420650bd12e52a`.

## Current product baseline

A complete live Jira read on 21 October covers 164 issues: 19 Done (18 tasks and
one epic), 136 To Do, two In Progress and seven Idea. KAN-28 source inventory,
KAN-137 metrics, KAN-161 account directory and KAN-162 hosting are scoped Done.
KAN-145/146 are accepted development enablers; full knowledge/teaching acceptance
remains in KAN-163/164. KAN-29 is In Progress with technical review evidence but
no accepted real source/version/rights package. The founder deferred that source
discussion on 21 October; its full acceptance stays open.

Verified remote dev is `84a432ec`; remote main is `7aee2324`. The primary checkout
remains on older dev `e089319a` with unrelated edits. Do not reset or merge over
them. At the initial reconciliation, nine registered worktrees comprised the primary, this task, unfinished
KAN-29 and its reviewer, four completed KAN-145/146 implementation/reviewer
instances, and the separate landing worktree with edits. Previous cleanup
rejections and preserved evidence remain in execution receipts; this checkpoint
does not attempt deletion. All task/review branch refs are retained remotely.

The accepted KAN-162 record verifies main-only production deployment in
`visionary-research`, independently of later development enablers. A fresh public
GET of `https://visionary.org.in/api/health` returns 200 JSON `status: ok` with
`Cache-Control: no-store`. This verifies liveness only.

## Methods and separate evidence gates

| Method | Client behavior in this candidate | Provider evidence | Remaining acceptance |
| --- | --- | --- | --- |
| Email/password | Email entry, password, Firebase verification link and server exchange retained | Jira comment 10067 records 20 October native password creation/login, wrong-password and unverified-session denial, synthetic same-UID profile read-back; synthetic identity disabled/revoked | Real verification/reset delivery and actions, duplicate/conflicting accounts, actual hosted browsers and second-device recovery |
| Google | Existing Firebase popup and verified server exchange retained | 20 October configuration inventory in comment 10067 says enabled with client fields; configuration is not OAuth acceptance | Interactive hosted success/cancellation, wrong existing method, popup/network failure, cookie/session, UID/profile and device recovery |
| Apple | Existing Firebase popup with email scope and verified server exchange retained | 20 October inventory says enabled, without returned client fields; completeness is unproven | Service ID/key/return configuration and interactive hosted success/cancellation, relay email/returning identity, session/profile/device recovery |
| Microsoft | Disabled with visible and accessible explanation; adapter rejects before SDK/session calls | No configured connection in retained inventory | Approved provider/tenant configuration and actual qualification before enabling |
| Mobile | Disabled before collecting a number; dead placeholder forms removed | Firebase phone being enabled does not supply a product SMS/recaptcha/phone identity journey | Explicit supported admission/identity/linking/recovery contract and actual provider/device qualification |
| Organization SSO | Disabled before collecting organization email; no role or membership grant | No accepted tenant/domain routing and membership contract | Reviewed SAML/OIDC provider/tenant routing, separate verified membership and denial/revocation tests |

The shared client method inventory describes implemented paths. It is not a
server permission policy, provider readiness probe or launch approval. Existing
backend identity verification, email verification, CSRF, UID/device sessions and
account ownership are unchanged. No automatic account linking, browser-authorized
roles, new provider configuration, data migration or production deployment occurs.

## Review handoff

- Implementer: Codex. Owned scope: Firebase popup adapter/server-auth facade,
  shared method inventory, Login/Register/SocialAuthButtons, regressions and this
  acceptance record. Backend/ML/schema/storage contracts are unchanged.
- Prerequisites: no incoming native blockers in the existing KAN-34 task handoff;
  accepted dev and the matching pushed task instance were verified before edits.
- Local verification: recorded below after commands finish. Mocked identity and
  rendered fictional account responses must remain labelled as such.
- Reviewer: `/root/kan34_review` independently approved source implementation
  `7aba0d56e176aa3d74f1b4fc459146988924a21b`, with no blocking source finding.
  Full KAN-34 remains In Progress while actual provider/delivery/device work remains open.
- Integration: pending. Only main deploys production; no task branch deployment.
  A later review-approved dev integration needs its own relevant checks.
- Next implementation task: none selected; this worker retains KAN-34 until its
  required acceptance and integration are complete.

## Verification on the source candidate

| Check | Observed result on 21 October 2026 |
| --- | --- |
| Focused auth/provider/transport/error regressions | 27 passed, zero failed; includes four new provider-boundary tests |
| Root `npm run check` | Exit 0: layout/import integrity, 18 script tests, source audit, lint, both TypeScript checks, 554 frontend tests and production build |
| Production build | Firebase mode with committed public Web configuration; Vite completes in 35.96 seconds |
| Compiled browser `node frontend/scripts/sign-in-methods-review.mjs` | Exit 0; Login/Register each at 1280px and 390px: three unavailable controls disabled and described, no number input, email/password navigation and return intent retained, zero page errors, no horizontal overflow, zero provider or mutation requests |
| Source audit | Exit 0; 68 routes, 35 selected backend endpoints, 1623 control declarations; regeneration reflects removed placeholder forms and shared method import reachability |
| Diff and execution JSON | `git diff --check` and JSON parse pass |

Rendered evidence is local and fictional: only `/api/auth/me` returns an
intercepted anonymous 401; no Firebase provider is called. Screenshots and
`results.json` are under ignored `artifacts/qa/kan34/browser/`; desktop login and
mobile registration captures were visually inspected. Root check output is in
`artifacts/qa/kan34/root-check.log`. This does not verify OAuth, mail delivery,
real device cookies, existing-account linking or any hosted candidate behavior.

Ordinary and offline dependency installs stalled during extraction and were
interrupted, not counted as successful installs. The frontend lock SHA256 matches
the primary exactly (`f2b593302bdaeb5854006e7f2e15476ad32a968827a38a5b8a7f8f4c26e4a3dd`).
Verification uses the existing primary frontend dependencies through a local
ignored junction, without changing either lock. Partial install files are kept in
ignored `artifacts/qa/kan34/dependency-install-partial/`. No backend/ML source or
runtime dependency changed, so their full suites are outside this source patch.

## Independent review outcome

The founder authorized a separate reviewer on 21 October. The fresh reviewer
instance was created from verified dev `84a432ec`, fast-forwarded to the candidate
and pushed/ref-verified before review. Its separate branch is
`codex/qa-review-kan-34-signin-matrix`; its checkout adds a tenth registered
worktree. Reviewer responsibility and the exact source decision are recorded in
[the independent report](../reviews/KAN34_EXACT_SHA_REVIEW_7ABA0D56.md), published
at `6d86b5238cffb919494d31b2bafabd0d10fbcc46` after a report-only clarification.

The reviewer independently reproduced root check (18 script/554 frontend,
lint/types/layout/import/audit/build), 27 focused tests and all four compiled
desktop/mobile scenarios. Five additional probes passed for unsupported calls
during a pending popup, Google/Apple completion after logout, token-refresh
completion after logout, and unverified-provider token/notification denial.
Independent build: 19.83 seconds. Visual inspection passes. The report labels
the fictional anonymous response and matching dependency reuse explicitly.

**Decision: source patch approved; full KAN-34 acceptance remains open.** The
reviewer report and this receipt are evidence only; the reviewed implementation
remained `7aba0d56` at that checkpoint. The later runtime repair below requires
renewed exact-SHA review. Draft
[PR 17](https://github.com/ecohdeep786/New_Visionary/pull/17) remains unmerged;
neither dev/main integration nor deployment is claimed. Real provider, mail and
hosted-device gates still require their recorded acceptance evidence.

## Live runtime continuation and recovery repair

21 October 2026, after the founder requires continued real-product testing and
full task acceptance before dev integration/cleanup. The task app runs its
Firebase production build at `http://localhost:5184` against the real standalone
backend and configured `visionary-research` Auth/Firestore. No response
interception is used for the live scenarios below. Existing production remains
main `7aee2324`; canonical health returns that exact revision, JSON 200/no-store,
and an anonymous auth/me request returns 401/no-store.

| Live scenario | Observed outcome and limit |
| --- | --- |
| Initial Google popup on localhost | Failed with unauthorized-domain warning. Read-only provider/project inspection confirmed localhost absent. |
| Development-domain repair | Field-masked update adds only `localhost`, preserving `visionary-research.firebaseapp.com`, `visionary-research.web.app` and `visionary.org.in`; read-back matches and signIn configuration is unchanged. No provider key or production origin is replaced. |
| Google after repair | Real SDK popup → server session → existing account onboarding succeeds locally. Canonical GCP Google login also reaches the same account's onboarding; reload recovers the session. No profile setup preferences or existing credentials are overwritten. |
| Onboarding account recovery | Live testing found no way to sign out/switch an incomplete account. The repair adds Use a different account on every setup phase, reuses server logout, waits for success, keeps the UID-scoped draft and return intent, and prevents concurrent finish/switch commands. Failure remains retryable. |
| Local logout / independent production session | Repaired local account switch returns to login; independently hosted session still recovers onboarding. No cross-device logout claim beyond these two actual origins is made. |
| Email/password | Isolated task-owned password identity uses a plus alias of the founder-designated inbox. Actual wrong-password UI denial passes. Correct password for the unverified identity reaches verification instead of an authenticated product account. |
| Real verification delivery | Native Firebase verification mail arrives in the designated inbox. After its actual action is opened, Auth confirms emailVerified=true; the live SDK reload and verified token exchange reaches the same test identity's onboarding. No Admin emailVerified override is used. The inspected hosted action page shows already-used/expired, so a first success-page rendering is not claimed. |
| Real reset delivery | Native reset mail arrives and opens a valid new-password form for the isolated account. Credential entry/submission is handed to the founder under browser-control policy; completed reset/new-password sign-in is pending. |
| Apple | Console inspection and authenticated config GET independently show Apple enabled with empty Service ID, Team ID, Key ID and private key. Actual popup returns method unavailable. Apple Developer-owned configuration and successful real sign-in remain required; GCP hosting alone cannot supply those credentials. |

The owner's original Google identity is preserved. The isolated identity and its
random test credential are retained only in ignored local QA material while the
reset handoff is pending. No mailbox contents, addresses, UID, password, action
code, identity token, cookie or provider secret is committed or copied to Jira.
Only requested test messages were opened. Disable/revoke the owned fixture after
the remaining tests; never disable or remove the owner's account.

The domain-change receipt includes the original domain list for rollback. If
local OAuth support must be withdrawn later, apply a field-masked change against
a fresh read, retaining any subsequent owner-approved domains. The retained
receipt is not a command to replace current settings blindly.

Repair verification: root check exits 0 (18 script tests, 554 frontend tests,
lint, both types, layout/import and source audit), Firebase build 83 seconds.
Six new compiled recovery scenarios cover role/flow/review at 1280px and 390px,
each exercising failed logout, duplicate denial, retry success, preserved draft,
account/CSRF binding and return intent without profile writes. The earlier four
compiled sign-in scenarios still pass. Additional script lint passes from the
frontend package. These fixture checks remain separate from the live flows.

The old source approval does not cover this recovery repair. A replacement exact
candidate must receive independent review. Full KAN-34 remains In Progress for
Apple, reset completion and remaining hosted candidate acceptance. Do not merge,
promote main, remove unfinished worktrees or take the next task on partial
provider acceptance.

## Founder release choice and remembered device sign-in

21 October 2026, subsequent founder instructions supersede the Apple requirement
above: remove Apple sign-in from the web release. Login and registration no
longer render the Apple control or recommend it; both the facade and Firebase
adapter reject `apple` before SDK calls, session exchange or profile clearing.
No global Firebase provider is disabled, so this web change does not revoke
existing identities or change other clients. Email and Google remain available.

The founder initially requests numeric email codes, then explicitly chooses
**Keep Firebase verification links for this release** after the built-in sender
limitation is explained. No custom SMTP sender or numeric-code mechanism is
added. The existing `visionary.org.in` sender-domain verification remains in
progress; no DNS record, domain name, callback handler or provider secret is
changed. Domain verification is an external status, not a timer-based guarantee.

Native Firebase verification/reset links remain the email actions. Desired
sender/subject wording for all four templates and a branded password-reset body
are prepared in `infrastructure/gcp/auth-email-templates.json`. Verification,
email-change and MFA bodies remain Firebase-managed under its built-in sender
restrictions. Field-masked API saves fail for all four template types with
`EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`. A real Firebase Console attempt to change
only the verification sender name/subject also fails and explicitly says email
template updates are unavailable for this project and to contact Firebase
support. Read-back retains the old wording; **no live template update is claimed**.
The project supports sending existing templates; an edit failure is not proof
that delivery itself is down. No support message is sent on the founder's behalf.

The remembered-device candidate changes newly issued server session cookies
from eight hours to a maximum of 14 days and inactivity expiry from 30 minutes
to seven days. This remains bounded by Firebase's supported cookie lifetime.
Every request verifies the Firebase cookie with revocation plus the server's
UID/device/cookie-hash record and expiry. A return visit uses that server check;
no password, SDK refresh token or cached profile becomes identity authority.
Existing shorter cookies keep their stored expiry. Activity cannot extend
absolute expiry. Logout revokes the device and clears cookies, and other device
sessions remain independent. Missing/nonfinite expiry and future activity fail
closed. Sign-in copy tells people to sign out on shared devices.

Independent review approved the earlier recovery source at `c896dafa`, report
`KAN34_RUNTIME_REPAIR_REVIEW_C896DAFA.md`, report-only commit `abf32913`.
That approval does not cover this newer Apple/copy/session candidate. A renewed
exact-SHA review and live candidate verification are required before integration.
The reviewer's sign-out failure-copy observation is repaired with action-specific
503 wording. Full task acceptance, new-password sign-in after the reset handoff,
the blocked Firebase template edits/domain verification and hosted candidate
release remain open. No dev/main merge, deployment, Done or cleanup is claimed.
