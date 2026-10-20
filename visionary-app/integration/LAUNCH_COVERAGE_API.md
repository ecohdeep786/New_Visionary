# Learning coverage API — KAN-29

The account runtime exposes `GET /api/account/coverage` and `POST /api/account/coverage/check`. Both verify the actual Firebase session/device and require `X-Visionary-Account` to match that verified UID. POST additionally verifies same-origin CSRF. Request fields cannot supply a UID, role, verified relationship, workspace permission or entitlement. No endpoint publishes coverage.

GET reads the account profile and global release publication in a Firestore transaction, returning the profile version, current catalog revision, all nine categories, all role/delivery dimensions and a short-lived diagnostic receipt. Missing publication returns `coverage-not-published`, distinct from database outage or corrupt/expired publication (503). No user records are created or modified by a coverage read. Current profile/admission and global policy are read on every request; there is no server cache or browser persistence.

POST takes explicit category, interface locale, modality, device, connectivity, source ID/version, source/input/output language and script; speech has its own language only for voice. School additionally requires board/class and State Board state; competitive learning requires its exact exam. It also takes `expectedProfileVersion` and `expectedCatalogRevision` from GET. Changed profile/publication returns 409. An exact tuple is hashed with the server-owned role; there is no wildcard, silent source substitution, language fallback or selector-to-support inference.

## Trusted release records

`visionary_coverage_releases/current` holds a reviewed publication: version 1, revision, published status, publication/expiry timestamps, approvedBy, exact reviewedCommit, evidenceId and a qualified-slice count for each category. `visionary_coverage_releases/{revision}/slices/{sha256}` holds each exact role/source/language/delivery selection, qualification status/expiry and evidence references for source rights, provider capability, language/script, privacy/commercial and delivery/recovery. These global policy records contain no learner identity or private activity. Publishing and source qualification require trusted accountable review and deployment access; browser clients have no write path.

Qualification is deliberately distinct from permission to execute learning. Every response has `runtimeAuthorization: false`. A matching approved source returns `source-qualified-access-check-required`; the owning learning/domain operation must still check its current source publication, UID/workspace/membership/consent, content and criteria revisions, provider/safety, entitlements and cancellation when committing work. KAN-145/KAN-146 do not gain implicit acceptance through this API. Current unconnected guardian/linked-role, native, offline and vocational mapping paths remain explicitly unavailable.

## User experience and recovery

The Learn route reads live coverage in Firebase mode and shows translated English/Hindi/Bengali status, retry and all-category details using the actual interface locale. It keeps existing navigation, sample journeys, drafts and account features intact. Profile/workspace changes discard old results; stale account/selection reads are rejected by the client. The component refreshes on focus, visibility, reconnect and explicit retry. Receipt expiry clears the result locally and requests refresh; it does not poll an idle service. Coverage outage is never shown as a qualified source. Source availability must be rechecked for the selected exact source through POST before downstream domain delivery; the summary is not a grant.

## Verification and deployment

Build the backend before `node --test backend/tests/coverage.test.cjs backend/tests/production-http.test.cjs`. Frontend client regressions are in `frontend/tests/coverage-client.test.mjs`. Synthetic positive qualifications in tests are fixture evidence only; no real curriculum rights or provider capability is inferred. Real policy publication, live browser/store verification and hosted acceptance are recorded separately.

`main-product.ts` cohosts the built frontend and the same account API under one HTTPS origin. Static assets retain immutable caching; HTML is revalidated; account API responses are no-store; unknown API paths remain JSON errors. Secure session/device/CSRF cookies pass directly to the runtime. `infrastructure/gcp/Dockerfile` builds only the product entrypoint for execution, without running migrations or seeds. Existing local `main-auth.ts` behavior is preserved.

The founder's 19 October budget direction is scale-to-zero Cloud Run, one small maximum instance, request-based CPU and no always-on load balancer or database/Redis instance. Use the managed HTTPS run.app URL for first hosted verification; connecting the owned custom domain is a separate reviewed step and must not silently introduce a fixed-cost load balancer. Deployment is not certified by a container recipe or a local test.
