# Connected account onboarding

D-065/D-066, 14 October 2026. Scope: five existing roles, concise product setup, saved completion and the illustrated welcome dialog. Uses Firebase project `visionary-research` (switched from `visionary-fd6d2` on 20 October 2026, D-102), named Native Firestore database `default` in Mumbai. Read the [auth contract](FIREBASE_AUTH_CONTRACT.md) for session/deployment boundaries and the [question/screen design](../docs/architecture/discussions/product-onboarding-journey.md) for minimum role details.

## Account ownership

Firebase Authentication owns the identity. The backend verifies the bound device session and uses that UID as `visionary_accounts/{uid}`. Onboarding does not create another user, merge by email/IP, establish organization membership or prove a guardian relationship. The web client cannot write Firestore directly. Server SDK access requires IAM and server-side authorization; see [Firebase security guidance](https://firebase.google.com/docs/firestore/security/overview).

| Command | Authority and result |
| --- | --- |
| GET `/api/auth/me` | Loads the allowlisted profile and server onboarding state for the authenticated UID |
| POST `/api/auth/onboarding` | Exact Origin/CSRF, bound session, matching expected UID and profile rate budget; bounded typed preferences, adult admission and required role details; first successful completion wins |
| POST `/api/auth/onboarding/introduction` | Same authority; accepts `{}` only, requires completed setup and idempotently records acknowledgement on the same document |

Completion uses a [Firestore transaction](https://firebase.google.com/docs/firestore/manage-data/transactions). Preferences, name, profile version and onboarding completion are saved together. Schema version2 creates `onboarding.introduction.status=pending`. Acknowledgement records a server timestamp and increments the profile version while preserving setup, identity and account history. Existing completed accounts without introduction metadata are treated as acknowledged; no migration resets their setup. They can reopen the cards with **Show getting started**. No TTL or record deletion is introduced.

Role/preferences remain user statements. Name is1–80 characters; selected lists contain bounded strings; maps contain shallow preferences. Unsupported/claimed authority fields are rejected. Stale role/stage answers are removed before storage. Organization setup collects a name and learning context rather than discarded contact/address details or an unverified public profile. Parent setup does not collect a child's name. Under18 activation remains blocked until verified guardian services exist; age range is self-declared.

## Frontend journey

1. Choose a role in a responsive, aligned setup shell.
2. Enter relevant preferences; optional screens can be skipped. Changing a role/branch keeps basic personal preferences and clears obsolete branch answers.
3. Review, edit details or change role, declare age and save once. Progress includes review and saving rather than declaring completion early.
4. Load the saved dashboard and show the three-screen welcome dialog: product introduction, a role-specific starting action, then preferences/privacy. Acknowledgement persists with the account. Reopening does not reset acknowledgement. Close/Escape only closes the current view; Finish/Skip saves acknowledgement.

Drafts are device-local, account-scoped and remounted on account changes. Invalid legacy/corrupt drafts are rejected. Browser storage failure does not convert a successful server save into failure. Database failures show safe retry guidance and do not manufacture a completed/new account. Controls are disabled while saving and duplicate saves are guarded. D-067 adopts the canonical profile returned by a successful authenticated mutation directly, invalidating older reads; it does not issue a redundant confirmation GET that could turn a saved setup into an apparent failure. Account changes invalidate pending UI commands. Learning activity, business membership and model responses remain separate integration work; the introduction/privacy UI states this accurately.

## Verification

Frontend/service tests cover draft shapes, branch changes and bound introduction commands. Backend tests cover transactional first completion, typed/required role details, retained setup, idempotent introduction acknowledgement and HTTP Origin/CSRF/account checks.

`node frontend/scripts/product-onboarding-review.mjs` uses fictional HTTP fixtures for five roles/four learner contexts, four/five-screen entry, draft reload, save retry, welcome-dialog retry/reopen/skip,390px mobile setup/tour, mandatory State Board state, comma-separated subjects, keyboard focus/restore and early guardian blocking. `onboarding-review.mjs` delegates to this current review; D-065's older eight-scenario evidence remains historical. Current screenshots: `artifacts/tmp/product-onboarding-browser/`.

`node frontend/scripts/auth-emulator-review.mjs` uses real Web/Admin Auth Emulator operations and cookie checks with an isolated memory product repository, including saved setup/introduction. It cannot use the production database or credential. It is not a Firestore integration emulator or live delivery/provider test. A separate bounded read-only live check verifies existing account-to-Auth UID linkage and completed profile consistency without printing personal data or changing accounts. Exact evidence is in [QA](../docs/visionary/QA.md).

Guardian assurance, verified family/organization access, deployed ingress, live provider/delivery acceptance and learning/business/model persistence remain release work.
