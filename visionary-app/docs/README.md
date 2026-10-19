# Visionary documentation

Start here. Documents describe different kinds of evidence; a design or scheduled date does not establish a working feature.

## Reading order

1. **What we are building:** [product contract and acceptance](visionary/README.md), then [product domains](architecture/PRODUCT_DOMAINS.md).
2. **What works now:** [current product status](visionary/CURRENT_PRODUCT_STATUS.md), latest entries in [STATUS](visionary/STATUS.md), [DECISIONS](visionary/DECISIONS.md) and [QA](visionary/QA.md).
3. **How it connects:** [architecture index](architecture/README.md), [platform diagrams](architecture/diagrams/README.md), [Build architecture](architecture/build/README.md) and [VATS implementation](architecture/VATS_IMPLEMENTATION.md).
4. **What to work on:** [task tracking](architecture/tracking/README.md), live [Jira project](https://visionary-team.atlassian.net/jira/software/projects/KAN/list) and [implementation handoff](architecture/IMPLEMENTATION_HANDOFF.md). Check prerequisites before selecting work.
5. **How to finish:** [branch and review workflow](architecture/BRANCH_WORKFLOW.md), then the [review handoff template](architecture/delivery/TASK_REVIEW_TEMPLATE.md). Implementation → Testing/review → verified integration → Done. Dependent work waits for acceptance.

## Folder map

```text
docs/
├── README.md                    Start here
├── written-style.md             Shared writing guidance
├── motion-style.md              Shared motion guidance
├── architecture/
│   ├── README.md                System and delivery navigation
│   ├── PRODUCT_DOMAINS.md        Shared frontend/backend/ML vocabulary
│   ├── blueprint/               Tree, HLD, LLD, object design and cloud costs
│   ├── build/                   Build projects, runs and execution boundaries
│   ├── diagrams/                Visual architecture and request paths
│   ├── discussions/             Engineering rationale and reference studies
│   ├── reviews/                 Architecture, backend/ML and vision reviews
│   ├── delivery/                Task review template and current handoff
│   └── tracking/                Execution receipts, Jira maps and dated forecasts
└── visionary/
    ├── README.md                Product requirements and evidence navigation
    ├── MASTER_SPEC.md           Entry to the operative product contract
    ├── VISIONARY_MASTER_v2.2.md  Operative contract; read with later decisions
    ├── CURRENT_PRODUCT_STATUS.md
    ├── STATUS.md / DECISIONS.md / QA.md   Only three living logs
    ├── design/                  Internal design specifications and handoffs
    ├── agents/ / roles/         Agent protocol and role charters
    ├── baseline/                Dated browser and design evidence
    ├── books/                   Supplied reference material; rights still apply
    └── archive/legacy-pack/     Preserved superseded contract material
```

`Frontend(Head Of Product Agent)/` belongs to the separate public/landing team. Do not open or modify it for internal-product work. It is excluded from this organization.

## Keeping documents understandable

- Keep operative contracts, current status and the three append-only logs at stable paths. Read later decisions before applying older assumptions.
- Keep new design handoffs in `visionary/design/` and architecture reviews in `architecture/reviews/`. Existing short “Document moved” files are compatibility pointers, not duplicate specifications. [The move ledger](architecture/tracking/document-moves-2026-10-17.json) records original hashes and destinations.
- Generated delivery plans, audit reports and JSON manifests stay at their existing paths so their commands and dated Jira references keep working. Their [index](architecture/tracking/README.md) explains current versus historical evidence. Regenerate them through their source scripts.
- Put research in [research](../research/README.md), interface contracts in [integration](../integration/README.md), and runtime/setup instructions beside [frontend](../frontend/README.md), [backend](../backend/README.md), [ML](../ml/README.md) or [infrastructure](../infrastructure/README.md). Local captures and test output belong in ignored `artifacts/`.
- Record new decisions and verification in the existing three logs. Do not create another competing status log. Never put credentials or identifiable learner data in documentation or Jira.
