# Infrastructure ownership

`local/compose.yml` contains the existing loopback-only PostgreSQL/pgvector and Redis configuration. `local/init-databases.sql` stays beside it so the relative initialization mount is unchanged.

From the product root, with Docker running and a development-only password set:

```powershell
docker compose -f infrastructure/local/compose.yml config --quiet
docker compose -f infrastructure/local/compose.yml up -d
```

Application and retrieval databases remain separate. Provisioning is separate from schema review/migrations/seeding. Relocation does not start containers or change volumes. Imported backend deployment and ML Terraform/Compose source remain pinned references to review.

The [100,000-MAU system design](../docs/architecture/discussions/system-design.md) and [launch operations](../docs/architecture/discussions/launch-operations.md) define the target edge/Cloud Run/data/queue topology, capacity assumptions, identity, delivery, recovery and acceptance. These are architecture artifacts. The reviewed owner-run foundation in [`gcp/bootstrap.py`](gcp/bootstrap.py) now provisions the project repository, runtime/deployer identities, secret and bounded placeholder service; the product image, canonical baseline, edge/DNS/TLS and hosted acceptance remain separate. Put reviewed deployment code here during implementation; avoid speculative empty cloud folders and frontend credentials. Imported Docker/Terraform/migration targets remain reference-only.

The founder's planned GCP hosting has a [payment configuration handoff](PAYMENTS_GCP_HANDOFF.md) for the current authenticated test-billing runtime. It covers the product origin, Cloud Run port/identity, secrets, scheduled reconciliation and future Razorpay webhook registration. It does not provision or deploy resources.
