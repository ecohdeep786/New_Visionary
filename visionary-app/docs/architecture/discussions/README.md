# Engineering discussion index

The founder will discuss system design, scale, stack, cloud/DevOps, MLOps and testing before committing the wider architecture. Index supplied and reviewed discussion files here. Existing product/upstream documentation and personal editor plans retain their current locations.

| Discussion | Questions | Deliverable |
| --- | --- | --- |
| System design | Domain/API/data ownership, role/consent boundaries and recovery | Reviewed architecture and contract/data flows |
| Scale | Workload, growth, latency/availability, capacity, cost and degradation | Measurable workload/capacity/SLO plan |
| Tech stack | Component fit, runtime/dependency lifecycle and justified additions | Decision records and migration checks |
| Cloud/DevOps | Environments, network/identity, secrets, CI/CD, observability and rollback | Deployment/environment/runbook plan |
| MLOps | Content/model versions, retrieval/grounding, evaluations, experiments and drift | Evaluation/release/monitoring workflow |
| Testing | Unit, service, contract, integration, end-to-end, model quality, access, accessibility and performance | Risk-based matrix and executable gates |

Use descriptive filenames such as `system-design.md`, `scale.md`, `tech-stack.md`, `cloud-devops.md`, `mlops.md` and `testing.md` for new material. Link existing documents rather than duplicating specifications. Accepted decisions and evidence continue in DECISIONS/STATUS/QA; this folder is discussion material, not a new status system.
