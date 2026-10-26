# Local development and GCP release boundary

Founder direction, 26 October 2026: implement and verify features locally,
publish reviewed changes to dev, and provision release infrastructure for GCP
when preparing promotion to main. Avoid dedicated paid development services
where local execution can establish the required behavior.

| Component | Feature development and dev verification | GCP release verification |
| --- | --- | --- |
| Frontend and backend | Run the actual application locally; browser checks use the in-app browser. | Verify deployed routes, auth, service configuration and traffic handling. |
| SQL database | Local PostgreSQL with compatible major version, the same migrations, constraints, transactions and separate migration/runtime roles. Use synthetic records. | Verify Cloud SQL connectivity, identities, grants, migration execution, backups and recovery policy against the intended release target. |
| Workers and ML | Run applicable real workers, model adapters and bounded jobs locally. Provider stubs support failure tests but do not prove hosted capability. | Verify required provider access, runtime limits, cancellation, network and service identities. |
| Cache and object storage | Use compatible local services where the feature needs them; retain production interfaces and explicit adapter differences. | Verify provider semantics, permissions, retention and signed access where applicable. |
| Firebase and external providers | Preserve the existing real Firebase sign-in path. Use emulators or test modes for suitable isolated tests; protect live records. | Interactive provider, callback, email/SMS, payment and quota acceptance requires the actual applicable provider environment. |
| Infrastructure | Version deployment definitions, migrations, configuration contracts and runbooks with source. Credentials remain outside Git. | Provision reviewed configuration, inject secrets, validate health and rollback before product traffic changes. |

The same business logic, schemas, migrations and artifacts should travel toward
production; endpoint, identity, secret and capacity settings vary by environment.
Local compatibility is evidence for application behavior, not proof of GCP IAM,
networking, managed-service behavior, capacity or production recovery.

Delivery remains task branch -> independent exact-SHA review and relevant checks
-> published dev integration. Main promotion requires applicable cloud/provider
verification and release acceptance. A merge does not itself prove infrastructure
has been provisioned or deployment has succeeded. Local enabler acceptance may
complete only its explicitly reviewed scope; linked hosted gates stay open.

For KAN-37, defer the proposed development Cloud SQL instance, associated cloud
bootstrap/control resources and cloud execution. Preserve unfinished work for
review; do not publish or execute it as approved infrastructure. Existing live
production dependencies remain available. Resume a minimal cloud verification
window only when required to establish a release-specific claim.
