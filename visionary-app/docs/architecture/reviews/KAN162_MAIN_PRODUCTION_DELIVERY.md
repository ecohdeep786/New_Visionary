# KAN-162 — Main-branch production delivery

## Decision and scope

The founder requested `main` as the only production source, automatic build/deploy for changes on `main`, and `visionary.org.in` as the public product origin. Use the existing Cloud Run service in `visionary-fd6d2/asia-south1`; keep its scale-to-zero, maximum-one-instance, 1 CPU and 512 MiB limits. Use a global external Application Load Balancer in Mumbai's regional backend path because the founder accepted its roughly US$18.25/month forwarding-rule base cost plus usage. GoDaddy remains the DNS registrar; setup prints the apex A record and does not write DNS.

The main workflow runs repository/component checks on PRs without cloud credentials. A main push may publish an immutable digest and deploy to a no-traffic Cloud Run candidate. Deployment requires exact repository, main ref, workflow identity and current remote SHA; probes a dedicated exact candidate path while a forged `X-Forwarded-For` sentinel is supplied; then promotes pinned traffic and runs canonical product/security smoke checks. Failed candidates do not receive traffic. Failed post-promotion smoke moves traffic back only if the candidate is still the live revision.

The existing Cloud Run revision is a KAN-29 release with an all-ingress service, `run.app` canonical origin and one trusted proxy hop. The first main release therefore has a one-time compatibility path that accepts only this bounded legacy revision as its rollback baseline. A failed first candidate restores its traffic and public ingress. After the first successful main release, rollback must target a compatible image whose source commit is in `main`. KAN-29 remains Testing with its source-coverage scope open; KAN-162 does not merge or close it.

## Trust and recovery boundaries

Each ALB backend overwrites forwarded client-IP data with Google load-balancer variables. The canary receives only the exact `/__deploy-check` route; neighboring paths fall through to the active service. Its JSON returns only a boolean indicating whether the canary's fixed IP sentinel survived. It returns no client address. The main product response exposes its release SHA in `X-Visionary-Revision`, security headers apply before body parsing, `/api/*` errors stay JSON, and account APIs remain session-bound. Rate keys remain the authenticated product's existing server-owned request-IP basis.

The repository bootstrap defaults to a read-only plan. Edge resources and keyless GitHub identity are separate explicit modes; neither edits GoDaddy, Firebase, user data or product records. The deployment identity is limited to the existing Cloud Run service, its Artifact Registry repository and its existing runtime identity. The runtime keeps its current Firebase identity and rate-limit secret reference.

The selected production backend graph is the Firebase account/auth module; legacy Prisma/model services, chat SSE routes and upload endpoints are not composed into this container. The pinned Nest 10 runtime currently reports four moderate npm audit advisories (Nest SSE output handling and `file-type` parsing); the selected graph does not register SSE or file-type upload handlers, and CI fails on high or critical production advisories. Recheck the audit and reachable import graph before adding those features or changing the runtime major version.

## Acceptance state

The source implementation and tests are under independent review. Local integration checks include the isolated runtime dependency graph, the existing frontend check, container build/runtime smoke, production workflow checks and release rollback tests. Production launch acceptance remains separate: reviewer approval of the exact implementation SHA, checked integration to `dev`, reviewed merge to `main`, Google resource bootstrap, DNS/TLS readiness, first-main migration and real GitHub main-push deployment verification are required. No hosted behavior or Jira Done claim follows from local tests.

Operational instructions and live boundaries are in [`infrastructure/gcp/README.md`](../../../infrastructure/gcp/README.md). The exact review evidence and remaining release gates are recorded in the task handoff and Jira KAN-162.
