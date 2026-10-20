# Firebase SDK setup and console handoff

14 October 2026, D-060–D-063. **Current integration:** see [the Firebase auth/profile contract](FIREBASE_AUTH_CONTRACT.md). The local auth server and Firebase adapter are connected; Mumbai named database `default` and locked client rules are verified. The config API reports `FIREBASE_AUTH`, superseding the earlier owner-reported Identity Platform status. Google/Apple are enabled, and localhost is added without removing existing authorized domains. The founder requests retained data, so no TTL deletion is enabled. Existing setup-stage history follows.

20 October 2026, D-102: **Project switched from `visionary-fd6d2` to `visionary-research`.** The new project is on Blaze and has one Web app, Native Firestore database `default` in `asia-south1` with deny-all deployed rules, and Email/Password, Phone, Google and Apple providers enabled. A bounded read-only Admin check confirms Auth access with an empty Users list and database access; no identity, profile or document is written. D-103 commits the six public Web SDK settings at `infrastructure/gcp/firebase-web-config.json`; the private Admin credential remains outside the repository and the hosted runtime uses the attached service account/ADC instead of a key. The setup history below describes the former project. Deployment source now targets `visionary-research`; the owner-run foundation and identity were applied on 20 October 2026 (Artifact Registry repository, runtime/deployer identities, secret and bounded placeholder Cloud Run service). The first product release still requires a main publish, canonical baseline, edge/DNS/TLS cutover and hosted acceptance in `infrastructure/gcp/README.md`. No product deployment is claimed, and the former project remains a recovery reference.

D-060–D-062 history: The founder reports `visionary-fd6d2` is a production Firebase project on Blaze, with Email/Password, Phone, Google, Apple and Identity Platform enabled. The public Web app config is in ignored `frontend/.env.local`; the supplied external service-account file is referenced only by ignored backend `.env`. A live read-only Admin check independently confirms Firebase Auth access and an empty Users list. Billing/provider/Identity Platform settings remain owner-reported; callbacks/domain settings have not been verified. NestJS is currently local; GCP hosting is planned for later.

## Installed versus connected

- Frontend: exact Firebase Web SDK `13.0.0`, modular `firebase/app` and `firebase/auth` foundation under `frontend/src/api/firebase/`.
- Backend: exact Firebase Admin SDK `14.5.0` in the backend package. That release requires Node 22+, so backend tooling selects supported installed Node 22/24 (24 recommended); the current host is Node 24.19.0.
- `getFirebaseAuthClient()` initializes lazily and uses in-memory persistence. D-063 now wires it into forms through an explicit Firebase adapter; server cookies hold the durable session. There is no automatic production sign-in, user creation, migration or data access in SDK setup.
- Analytics is not initialized. The supplied measurement ID is unnecessary for authentication. Installing the Firebase package does not activate Firestore, Storage, Analytics or model services.
- D-062 registers a lazy Firebase Admin provider in the backend Auth module, with validated project/credential context, production/emulator isolation and redacted failures. Production Admin access is checked read-only through the compiled provider. It is not yet the current JWT strategy or session controller. Cookie/session, workspace, OTP/consent, abuse-limit and data-sync integration still follows the [current design](../docs/architecture/discussions/firebase-auth-system-design.md).

The source provenance change is tracked in [the patch ledger](upstream-patches.json) and [patch guide](upstream-patches/README.md); the original import lock is retained.

## What the owner should provide next

Already received: project ID; public Web app `firebaseConfig`; reported provider list; production/Blaze classification; Identity Platform confirmation; actual external local credential-file path; local-first backend/GCP-later intent. Credential project/type/required fields are validated without printing contents; read-only access independently confirms the Users list is empty. The earlier placeholder is not used. Do not paste another `<script>` into the React HTML: npm owns the modular SDK installation. Firebase's public Web config is client configuration; it is not server Admin authorization. [Web SDK setup](https://firebase.google.com/docs/web/setup).

1. **Authentication → Settings:** current authorized domains remain needed before browser-provider acceptance. Identity Platform is confirmed by the owner; no feature/billing change is performed by this setup. The API-key value alone is not an abuse-control or permission boundary.
2. **Application services:** configure isolated PostgreSQL/Redis and reviewed notification delivery/eligibility/session contracts for live product auth. Firebase credentials do not provide the application database or product authorization.
3. **Local server credentials:** the actual external file is configured and read-only access succeeds. No further private-key contents are needed. Rotate/reconfigure through the approved credential lifecycle when moving to deployed workload identity.
4. **Provider completeness later:** Microsoft app registration and configured organization OIDC/SAML connections will need provider setup. Apple enablement also needs its configured Services ID/callback/signing-key lifecycle verified. These credentials stay in the console/approved server secret store, not chat or frontend source.
5. **Deployment origin later:** when known, provide product HTTPS domain and GCP runtime/service identity so callbacks, cookies, proxy trust, App Check and CSP can be configured accurately. Current local setup does not select a cloud deployment unit.

## Server credential handling

The Firebase Admin SDK is privileged server software. Prefer Application Default Credentials/workload identity from an attached least-privilege service account when deploying on GCP. Do not grant project Owner/Editor simply to make auth work. Exact IAM needs depend on the accepted token-verification/session/user-lifecycle operations. [Admin setup](https://firebase.google.com/docs/admin/setup).

If a local server must perform reviewed real Firebase operations and a service-account file is required:

1. Firebase Console → Project settings → Service accounts → Firebase Admin SDK. Use the approved account/key path; do not generate keys merely for an offline installation test.
2. Keep the JSON on your computer in a private directory outside the repository, for example `C:\Users\Administrator\.config\visionary\firebase\visionary-research-admin.json`. Restrict its file access. Do not put it in `frontend/`, `public/`, source control, screenshots or chat. The added ignore patterns are a fallback, not permission to embed credentials.
3. Tell the agent only the absolute local file path. Set `GOOGLE_APPLICATION_CREDENTIALS` to that path in the backend's local environment when the server integration is ready. The credential content should never be printed in diagnostic output.

No local key is needed for Auth Emulator tests. Production must reject emulator configuration; emulator identity is a separate demo project, not an implicit fallback to `visionary-research`. Do not assume a plain user `gcloud auth application-default login` is sufficient for Firebase Auth: the documented user-credential setup has additional OAuth-client requirements; use an approved service identity/impersonation or the documented setup.

## Account reuse and duplicate handling

The Users list represents account identities; it is not a list of currently active sessions. Successful first enrollment/federated creation produces an identity entry. Later login reuses its UID. Logout revokes the current device session and retains the account and permitted records.

Use the verified project/tenant/UID mapping as the canonical identity. Existing UID/email/phone conflicts during creation must not overwrite a password, recreate a product person or delete the existing account. Give consistent registration responses and an appropriate sign-in/recovery path; never expose a public account-existence lookup. Concurrent retries share one registration intent and reconcile the same identity.

Multiple methods may link to one Firebase UID through the reviewed ownership-proof flow. A credential belonging to another UID requires explicit proof of both accounts and conflict/data/consent review before any merge. Repeated login, matching IP and shared family/school devices do not justify automatic account deletion or merging. An already authenticated person follows the authoritative onboarding/consent/Home state from `/me`. References: [Firebase create-user conflicts](https://firebase.google.com/docs/auth/admin/manage-users), [provider linking](https://firebase.google.com/docs/auth/web/account-linking).

## Local configuration and next checks

Frontend template: `frontend/.env.firebase.example`. The production public config is committed at `infrastructure/gcp/firebase-web-config.json`; an ignored `.env.local` copy remains only for local Firebase mode. Vite loads environment changes at startup, so an existing dev process may need a restart when the auth adapter actually consumes them.

Backend template: `backend/.env.firebase.example`; merge its reviewed settings with the backend's ignored configuration later. Application `DATABASE_URL`, Prisma `DIRECT_URL`, Redis, notification delivery and server origin are separate from Firebase config. Admin installation does not create an application database.

`npm run check` covers layout, import/patch evidence, script-integrity tests and frontend lint/types/tests/build. `npm run backend:generate`/`backend:build` use the supported runtime; SDK import/native checks are offline. Neither successful installation nor compilation proves real provider login or server-session integration. Live authentication also needs guarded enrollment, CSRF/cookie policy, current account/workspace/consent authority and tested revocation.

## Verified installation evidence

On 14 October 2026, exact SDK package/lock versions are confirmed; zero previously locked package paths change version in either component. Synthetic-config Web SDK initialization and Admin Auth API loading pass without production credentials/cloud requests. Existing native bcrypt, Prisma5.22 generation and NestJS build pass using host Node24.19.0. Root `npm run check` passes layout/import accounting, five provenance regressions, frontend lint/both type configurations, all488 frontend regressions and production build. All3842 original import entries validate against the untouched baseline plus one recorded patch covering five backend files.

Logs: `artifacts/tmp/firebase-setup-{prisma,backend-build,check}.log`; dependency comparison reports are in the same ignored evidence directory. This verifies installation/source compatibility, not production login, rate-limit enforcement, provider credentials, guardian assurance, device sync or an image deployment. No vulnerability-remediation certification is inferred from these checks.

## Verified Admin connection, D-062

`npm run backend:build` compiles the lazy provider. Then `node --test backend/tests/firebase-admin.test.cjs` passes six isolation/configuration tests, and `npm run backend:firebase-check` makes one bounded, read-only `listUsers(1)` request through that provider. The latter succeeds for `visionary-fd6d2` and returns an empty list; no identity is created/deleted/revoked and no profile/key/token data is printed.

The imported build emits `dist/src/`, so the check/test require the compiled provider there. The existing unused `start`/deployment `dist/main` assumptions require reconciliation before server deployment; this Admin check does not certify an HTTP server bootstrap. The current application JWT routes, missing DB/Redis setup and eagerly constructed optional providers remain integration tasks.

The backend's ignored `.env` contains only Firebase project/kind and an external credential-file reference; key JSON is not copied into the product. The service validates matching project/type, absolute path and required key fields before using it; production/staging rejects emulator configuration, emulator mode rejects live keys and a missing process-level emulator host, and incompatible reused SDK contexts fail closed. Changing credentials/settings requires a backend restart. Logs: `artifacts/tmp/firebase-admin-{backend-build,tests,connection}.log`. Import verification now records two intentional patches affecting six original imported files; the provider/module/tests are new first-party source.


## D-064 frontend workflow evidence

Auth screens now show allowlisted recovery messages and tested signup/verification/forgot/reset/duplicate/cache behavior. The live default email handlers and templates are unchanged; /auth/action is ready for a later reviewed hosted-domain cutover. Nineteen backend tests,503 frontend tests, ten demo-emulator workflow cases, four routing fixtures and a source-preserving HMR regression pass. The actual dashboard reloads with its saved account. A read-only event projection confirms stored IP/browser metadata and local-loopback provenance; private values are not printed. Test identity operations stay in demo-visionary-auth with a memory profile repository. See the D-064 section of [the auth contract](FIREBASE_AUTH_CONTRACT.md) and append-only QA for limitations and exact evidence.
