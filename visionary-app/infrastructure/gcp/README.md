# Main-branch production delivery

`visionary.org.in` is the public origin. The production target is the Mumbai Cloud Run service `visionary-product` in GCP project `visionary-research` (project number `174851137514`); the former project remains the serving/recovery reference until the new foundation, baseline, DNS and certificate are accepted. GitHub `main` is the only branch allowed to publish or promote an image. Pull requests to `dev` and `main` run checks without GCP credentials. The workflow pins the image by digest, deploys a no-traffic candidate, probes its exact edge route with a forged forwarding-header sentinel, promotes only while the candidate SHA remains the remote `main` head, and rolls traffic back if canonical smoke checks fail.

The service remains scale-to-zero with maximum one instance, one CPU, 512 MiB, request CPU, no startup boost, concurrency 20 and a 30-second timeout. The global external Application Load Balancer has an estimated base of US$18.25 per 730-hour month, plus metered usage. The former `visionary-fd6d2` service remains available as a recovery reference until the new project is cut over and verified; it is no longer the deployment target. No users or data were migrated between projects.

## Source of truth

- `infrastructure/gcp/firebase-web-config.json` contains the six public Firebase Web SDK settings for `visionary-research`. It is client configuration, not a server secret; the build reads it directly, so production no longer depends on a local `.env.local` or a GitHub `FIREBASE_WEB_CONFIG` variable.
- `firebase.json` and `.firebaserc` target the named Native Firestore database `default`. The deny-all client rules remain at `infrastructure/firebase/firestore.rules`.
- The private Firebase Admin service-account key is **not** in Git and is not needed by the hosted service. The Cloud Run runtime identity uses Application Default Credentials/IAM. The local key path remains only in ignored development configuration.
- `.github/workflows/production.yml` hardcodes only non-secret project, service-account and Workload Identity Federation identifiers. No service-account key, private key, runtime secret or user record is committed.
- `PRODUCTION_PUBLISH_ENABLED` and `PRODUCTION_DEPLOY_ENABLED` remain repository Actions variables because they are release switches, not source configuration. Set publish true and deploy false until the first baseline and edge are verified.

## First-time owner setup

The commands below use a signed-in Cloud Shell in project `visionary-research`, region `asia-south1`, from a clone of this repository. Start with `python infrastructure/gcp/bootstrap.py plan` (run from `visionary-app`; use `python3` outside Windows) and review the output. The last recorded read-only inventory found no new-project Cloud Run service, Artifact Registry repository, runtime identity or deployment identity; re-check after console access, because this source change does not provision them.

1. **Foundation:** run `python infrastructure/gcp/bootstrap.py apply-foundation` from `visionary-app`. It enables the required APIs, creates the private Docker repository, creates the `visionary-product-runtime` service account with Firebase Admin SDK, Firestore data and secret-access roles, creates the `visionary-product-auth-rate-limit` secret version 1 with a generated value that is never printed, and creates a bounded public placeholder Cloud Run service with a `ci-candidate` tag. Existing resources are checked, not silently replaced.
2. **Deployment identity:** run `python infrastructure/gcp/bootstrap.py apply-identity`. It creates the repository/ref/workflow-restricted Workload Identity Federation identity and grants only its WIF user, Run deploy, Artifact Registry write and runtime-service-account act-as. It creates no key and does not grant Firebase user-data access to the deployer. The printed provider must match the hardcoded workflow provider.
3. **Workflow switches:** set `PRODUCTION_PUBLISH_ENABLED=true` and keep `PRODUCTION_DEPLOY_ENABLED=false`. Remove the obsolete `GCP_WORKLOAD_IDENTITY_PROVIDER` and `FIREBASE_WEB_CONFIG` variables if present; the workflow and build no longer read them.
4. **First image:** after this source is merged to `main` through release acceptance, push a reviewed commit to `main` or run `workflow_dispatch` on `main`. The checks run first; the production job builds the image from the committed public Firebase config, runs the container smoke test, authenticates with Workload Identity Federation and publishes an immutable digest. Download the `main-release-*` artifact and read `visionary-app/published-release.json`.
5. **First canonical baseline:** from `visionary-app`, with the current remote `main` SHA and the published digest:
   ```bash
   PRODUCTION_BASELINE_CONFIRM=visionary-research \
   PRODUCTION_BASELINE_COMMIT=<40-character-main-sha> \
   PRODUCTION_BASELINE_IMAGE=<published-image@sha256:digest> \
   node infrastructure/gcp/release.mjs baseline
   ```
   This replaces the placeholder at 100% traffic, verifies the bounded revision, project/auth-domain env and Cloud Run health/provenance, and writes `baseline-release.json`. It refuses an image from another project, a non-current main commit, a service already on canonical ingress, or a **different** canonical release; it may safely resume the same commit/image baseline after a failed health probe.
6. **Edge and DNS:** run `python infrastructure/gcp/bootstrap.py apply-edge`. Copy the printed IPv4 address into a GoDaddy `A` record for the apex (`@`, `visionary.org.in`); preserve MX, TXT, CAA and subdomain records. Wait until the Google-managed certificate reports `ACTIVE` and the apex resolves to the address. The script never logs in to GoDaddy or writes DNS.
7. **Ingress cutover:** restrict the service to the load balancer:
   ```bash
   gcloud run services update visionary-product --project=visionary-research --region=asia-south1 --ingress=internal-and-cloud-load-balancing
   ```
   Then set `PRODUCTION_DEPLOY_ENABLED=true`. The next main push or manual run creates a no-traffic candidate, probes `/__deploy-check` through the edge, promotes it, and runs canonical product checks. A stale run refuses to deploy if a newer commit reached `main`.

## Firebase console and rules

- Add `visionary.org.in` to Firebase Authentication → Settings → Authorized domains for `visionary-research`; keep `localhost` for development. This is a console setting and cannot be inferred from source. If the Web API key has HTTP-referrer restrictions, also allow `https://visionary.org.in/*`; otherwise the browser SDK will reject sign-in. Verify Google/Apple OAuth redirect URIs for the new project while changing providers.
- Deploy the committed deny-all Firestore rules after review with the Firebase CLI from `visionary-app`:
  ```bash
  npx --yes firebase-tools deploy --only firestore --project visionary-research
  ```
  The Firebase CLI config targets the named database `default`. The Admin SDK uses IAM and bypasses client rules.
- Keep the private Admin key outside the repository. It is only for local development; GCP runtime uses the attached service account and ADC.

## Recovery and evidence

The deployment artifact records the source commit, image digest, candidate/previous revision and the previous main commit. A failed new candidate leaves production traffic on the previous revision. A post-promotion failure moves traffic back to the previous verified main revision and re-runs canonical checks. There is no one-time legacy baseline in the new project; the first canonical baseline is created explicitly in step 5. The former project remains untouched for recovery until the new origin is accepted.

Check the GitHub Actions artifact `main-release-<sha>-<run>-<attempt>`, `baseline-release.json` and test logs before diagnosing a release. Confirm `X-Visionary-Revision` on canonical health/API/static responses and verify anonymous account APIs remain unauthorized. The health-only canary response reports only whether its deliberate forwarded-IP sentinel was removed; it never returns an address. Do not treat a passing health check as acceptance of open real-source coverage, provider, privacy, billing-live, load or full-product launch gates.

Resource lifecycle and cost reference: [Google Cloud global forwarding-rule pricing](https://cloud.google.com/vpc/network-pricing), [custom request headers](https://docs.cloud.google.com/load-balancing/docs/https/custom-headers-global), [forwarding-header behavior](https://docs.cloud.google.com/load-balancing/docs/https). DNS provider: GoDaddy. Production project and domain changes require a recorded change receipt.
