# Infrastructure ownership

`local/compose.yml` contains the existing loopback-only PostgreSQL/pgvector and Redis configuration. `local/init-databases.sql` stays beside it so the relative initialization mount is unchanged.

From the product root, with Docker running and a development-only password set:

```powershell
docker compose -f infrastructure/local/compose.yml config --quiet
docker compose -f infrastructure/local/compose.yml up -d
```

Application and retrieval databases remain separate. Provisioning is separate from schema review/migrations/seeding. Relocation does not start containers or change volumes. Imported backend deployment and ML Terraform/Compose source remain pinned references to review.

Cloud environments, CI/CD, orchestration, observability and production operations will be selected in the [engineering discussions](../docs/architecture/discussions/README.md). Put reviewed deployment code here when authorized; avoid speculative empty cloud folders and frontend credentials.
