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
them. Nine registered worktrees comprise the primary, this task, unfinished
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
- Reviewer: pending; no identity or exact-SHA approval is invented. Full KAN-34
  remains In Progress while actual provider/delivery/device work remains open.
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
