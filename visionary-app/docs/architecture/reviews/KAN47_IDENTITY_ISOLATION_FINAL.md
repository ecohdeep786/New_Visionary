# KAN-47 identity isolation review

The audit runs read-only against the reviewed production project. It compares the full bootstrap GitHub federation condition, provider inventory, mappings, issuer and audience. It verifies the numeric pool principal on the deployer service account policy, the reviewed direct resource grants, and absence of user-managed deployer and runtime keys. Unexpected conditional secret grants also fail the audit.

The serving revision check uses the revision receiving all production traffic. It verifies the attached runtime identity, Firebase realm, Secret Manager version reference and reviewed edge ingress. It reports the invoker IAM mode separately. Firestore metadata is read with Cloud SDK impersonation of the reviewed runtime account and an explicit database ID of `default`.

The secret check verifies the pinned enabled version and notification schedule metadata. A successful notification, new secret version, serving revision rollout and rollback require live operational evidence. The audit observes direct policies on the named resources. Inherited IAM and access through additional resources require separate inventory.

Run `node infrastructure/gcp/identity-audit.mjs` from the application directory with an authenticated Cloud SDK configuration that can read the listed IAM and resource metadata and impersonate the reviewed runtime account for the Firestore read. The host currently lacks an authenticated Cloud SDK session. The local command refused all seven live checks, and the synthetic contract tests exercise the positive and failure paths.

The checkout remains active until live validation can be completed. Staging identity isolation and actual rotation evidence remain open.
