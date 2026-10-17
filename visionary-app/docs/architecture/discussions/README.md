# Engineering discussion index

The founder selected a 100,000-MAU growth launch for the system design on 15 October 2026. D-075 supplies the architecture, source audit, model strategy and operational gates below; implementation status is explicit in each. Existing product/upstream documentation and personal editor plans retain their locations.

| Discussion | Questions | Deliverable |
| --- | --- | --- |
| [End-to-end engineering blueprint](../blueprint/README.md) | Reference-product research, complete tree, HLD/LLD/OOP, frontend/backend communication and cloud/cost | D-076 detailed design, dated public evidence and tested scenario calculator; target services remain implementation work |
| [Firebase authentication design](firebase-auth-system-design.md) | Selected Firebase identity, existing project, consent, providers, abuse limits and device/account sync | Historical design; connected local runtime and remaining gates in [current auth contract](../../../integration/FIREBASE_AUTH_CONTRACT.md) |
| [Initial authentication discussion](auth-system-design.md) | Observed source gaps and initial owned-identity alternative | Historical design/acceptance context; Firebase supersedes the identity recommendation |
| [System design](system-design.md) | Domain/API/data ownership, role/consent boundaries, edge, sync, payments and recovery | D-075 launch architecture and implementation sequence; target features are distinguished from current runtime |
| [One user account data design](user-account-data-design.md) | Same-UID identity/onboarding/billing, account hierarchy and domain ownership | Historical proposal; [D-072 storage contract](../../../integration/USER_ACCOUNT_STORAGE.md) records implementation/migration |
| [Scale and operations](launch-operations.md) |100,000 MAU, workload, latency/availability, capacity, cost and degradation | Explicit assumptions, sizing candidates and measured acceptance targets |
| [Backend/ML alignment audit](backend-ml-audit.md) | Component fit, legacy identity/plan/source contracts and safe retirement | Keep/adapt/replace map; root runtime isolation implemented, physical baseline deletion deferred |
| [Cloud/DevOps](launch-operations.md#delivery-and-infrastructure) | Environments, identity/secrets, CI/CD, observability and rollback | GCP deployment/recovery plan; provisioning remains implementation work |
| [ML strategy](ml-strategy.md) | API versus own model, source/model/prompt versions, grounding, evaluations and releases | API-first decision; specific provider models require evaluation; no training/deployment |
| [Testing](launch-operations.md#release-test-matrix) | Policy, contract, journey, model quality, accessibility and performance | Risk-based launch gates; local checks do not constitute hosted acceptance |

Use descriptive filenames such as `system-design.md`, `scale.md`, `tech-stack.md`, `cloud-devops.md`, `mlops.md` and `testing.md` for new material. Link existing documents rather than duplicating specifications. Accepted decisions and evidence continue in DECISIONS/STATUS/QA; this folder is discussion material, not a new status system.
