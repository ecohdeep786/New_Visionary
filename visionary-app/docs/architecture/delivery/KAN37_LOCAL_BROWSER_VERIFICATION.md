# KAN-37 local product verification

25 October 2026. The real root development commands ran frontend and Firebase-connected Nest backend from the existing KAN-37 checkout on localhost:5173 and port3001. Existing ignored Firebase configuration was used; no password, fake account or authentication bypass was introduced. Domain migrations/backfills remain disconnected from product startup and were tested separately against disposable PostgreSQL.

The user's actual signed-in in-app browser, Professional role, passed read-only Home, Learn, Ask, Practice, Build and Privacy navigation. Expected headings were Welcome back, Visionary.; Your learning outline; Visionary Guide; Your next practice; Build something of your own; and Privacy & consent. Home retained the existing session after full reload. At390x844 the Home content and bottom navigation were readable without visible horizontal clipping. The viewport override was reset and browser error logs returned no entries. No project, invitation, payment, privacy setting or learning record was created or changed.

The six-route/reload/mobile pass was captured at source `e09c736a156f6893c5166564a3bec88a6c60d8c3`. The final data-only correction `6639a4dd9c211a669573bb960a1f27e8761b928c` leaves the frontend and connected auth source identical; another full Home reload passed on that final source. The separate reviewer inspected the local JSON receipt recording that final SHA/reload and the mobile screenshot. Screenshots and route receipts remain outside Git at `C:/Users/Administrator/Visionary-local/kan37-rework/browser/`; no account/session contents are published.

This establishes existing-product regression evidence before dev integration. Existing local learning previews remain previews. It does not demonstrate a connected migration/backfill UI, platform identity provisioning, hosted acceptance or production readiness. Full DATA-02 and linked acceptance gates remain open. Independent exact-SHA source approval, final-head CI and accepted dev integration must still be recorded; this document does not assert future results or authorize full Done/worktree cleanup.

## Production-job continuation regression, 26 October 2026

The integrator repeated real signed-in in-app browser navigation at reviewed source
`52279b91e852f6135abd2763b6872d0c0c6f55d0`: Home, Learn, Ask, Practice, Build and
Privacy all rendered their expected headings. Full Home reload retained the
Professional workspace and authenticated dashboard. No account/profile, learning,
project, billing or privacy records were changed. The prior mobile result above
was not repeated in this continuation; frontend/auth sources are unchanged.

The task checkout initially lacked its ignored backend configuration, producing
an account-loading failure. The existing primary-checkout configuration was
restored locally, the real backend restarted, and read-only Firebase Auth and
Firestore checks both passed. No password, credential contents or user records
were displayed or committed. The initial failure is not counted as a pass.

Local screenshot evidence, outside Git:
`C:/Users/Administrator/Visionary-local/kan37-rework/browser/KAN37_PRODUCTION_JOB_HOME_2026-10-26.png`.
The separate migration image's successful PostgreSQL socket test and exact-source
approval are recorded in `KAN37_PRODUCTION_JOB_INDEPENDENT_REVIEW.md`. This browser
regression covers the existing product; it does not activate SQL repositories,
execute a hosted migration/backfill or establish ML/production acceptance.
