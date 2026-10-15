# Application backend

Organization backend imported from `visionaryorg/visionary-dev`, commit `81e861be4a87b8af02c9f986d6874e82be20b1b7`. Code and Prisma schema live in `upstream/backend/`; reviewed deployment source lives in `upstream/deploy/`.

From the product root, use `npm run backend:install` and `npm run backend:build` with supported installed Node22/24 LTS (24 recommended). Source imports and dependency installation do not start a server, apply migrations, send email or connect a model.

Read [the integration handoff](../integration/README.md) before configuring databases or replacing frontend preview services. Authentication and all product authorization belong here. The current imported schema needs the five-role workspace, membership and consent model reconciled with the existing product contract.

D-060 adds Firebase Admin14.5.0. Dependencies and imported runtime files have explicit [patch provenance](../integration/upstream-patches.json). The original upstream commit/hashes remain unchanged in the import baseline.

D-063 connects the Firebase auth/profile slice through a **standalone** NestJS app. After building, `npm run backend:auth:dev` watches `src/main-auth.ts` using ts-node on127.0.0.1:3001 with Firebase token/session verification, Firestore accounts, onboarding, device revocation and rate counters. Configuration is in ignored `upstream/backend/.env`; use [the example](.env.firebase.example) for another machine. Read [the auth contract](../integration/FIREBASE_AUTH_CONTRACT.md) and [setup handoff](../integration/FIREBASE_SETUP.md). `backend:dev` still starts the old complete JWT/Prisma/Redis/model app and is not this auth server. Business-controller cutover and deployment remain later work.

D-069 adds Razorpay test billing to this same standalone app: shared request authority, provider subscription checkout, durable Firestore account/command/event records, reconciliation, cancellation, owner-scoped test invoices and accepted Family billing benefits. Use [the payment contract](../integration/PAYMENTS_CONTRACT.md) and [test configuration example](.env.razorpay.example). Runtime rejects live keys. No original imported baseline or dependency lock is changed; product additions retain separate ownership. Public webhook ingress, live methods/tax/commercial policies and broader business services remain release work.
