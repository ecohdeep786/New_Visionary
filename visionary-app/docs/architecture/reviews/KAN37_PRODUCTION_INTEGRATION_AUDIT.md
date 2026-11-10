# KAN-37 production integration gap audit

25 October 2026. Founder direction: backend, database, ML and system changes must
form an operable GCP production path. Local or synthetic success is verification
evidence, not final production delivery. No main promotion, cloud mutation or
existing-record migration was performed by this audit.

## Verified current evidence

- Published dev includes scoped KAN-36 preparation at `27ba46b73e08071049c36f7999ddf0367e50738d`
  and KAN-37 preparation at `65045d72976b629336a150fa18aa32d73537a3bd`.
- Integrated KAN-37 [CI40204197741](https://github.com/ecohdeep786/New_Visionary/actions/runs/40204197741)
  passed. Source approval, real PostgreSQL checks and actual signed-in local browser
  evidence are retained in the replacement review and browser reports.
- A live read-only GET to `https://visionary.org.in/api/health` returned200,
  `status=ok`, auth policy version1/globalSignOut=true, and response revision
  `592d47527d2fd8d414041aace2393b7c0d7b7898`. That equals current remote main,
  and differs from dev. This proves public health/source provenance only.
- GCP CLI Cloud Run/SQL inventory failed token refresh with reauthentication
  required. Founder said they will reauthenticate. Current resource existence,
  SQL identity/network configuration and ML deployment are therefore unverified;
  neither their presence nor their absence is inferred from repository files.

## Source-confirmed gaps

| Boundary | Observed code | Required production evidence |
| --- | --- | --- |
| Container/backend | `infrastructure/gcp/Dockerfile` installs the minimal production-runtime lock and compiles only `tsconfig.product.json`'s selected product graph. That lock contains no Prisma/domain SQL dependency. | Reviewed production dependency/client build, container smoke and real SQL connection from the deployed backend. |
| Runtime authority | `main-product.ts` starts `FirebaseProductModule`; its current providers/controllers include existing auth/account/billing/feedback/learning code, without the new workspace/data modules. | Reviewed product API/service integration with verified UID, membership/consent/source/revision authority; preserve current Firebase account/profile/billing ownership. |
| Migration executor | Current `src/data` adapter explicitly refuses hosted/non-synthetic database URLs. | A separately configured production-capable execution path with actual GCP migration identity, bounded execution and audited compatibility/admission; never remove synthetic test guards to make tests touch production. |
| Runtime/migration credentials | Synthetic tests exercise real distinct PostgreSQL roles, including delegated/default/PUBLIC control-grant denial. Release environment currently supplies Firebase/auth/billing settings, without SQL connection/role/network wiring. | Actual Cloud SQL connectivity and least-privilege runtime identity; separate migration job identity/configuration and secrets/IAM, with no migration credentials in the product service. |
| Data lifecycle | Canonical workspace preparation and atomic synthetic migration/backfill machinery pass review. Full DATA-01 models and retained-record operations remain open. | Accepted domain DDL/RLS and actor scope; expand/backfill/verify/switch/contract strategy, backup/restore and compatible rollback against approved staging before production records. |
| ML/system | Current product graph excludes the imported legacy ML startup. This audit does not establish a deployed private ML service or permitted context/output flow. | Verified private service identity, rights-scoped data/read models, deadlines/cancellation, output validation, queues/observation, redacted monitoring and resource/cost bounds for each affected ML journey. |
| Release | Current workflow restricts publication/deployment to trusted main, with no-traffic candidate probes and rollback. Dev PR production jobs are skipped. | Exact reviewed backend/database/service release, staging and deployed acceptance, compatible rollback and actual canonical journey verification before marking production complete. |

## Delivery consequence

KAN-37 has returned to native **Rework** for its remaining production integration,
while the reviewed preparation remains accepted on dev. Full DATA-01/02, affected
source/privacy/policy gates and dependent feature acceptance remain open. Existing
worker/reviewer checkouts and pushed history are retained. A synthetic adapter,
build file, enabled provider or healthy static shell cannot close those gates.

Next production implementation must use the live resource inventory and existing
architecture, then deliver the relevant backend-to-store/service path through
reviewed configuration, registered tests, local browser checks, main release and
hosted recovery evidence. Provisioning new billed resources or changing live
credentials/data requires a concrete reviewed resource/change plan; this audit
does not authorize an arbitrary replacement of the current live system.
