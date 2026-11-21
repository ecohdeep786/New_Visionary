# KAN-55 — Durable workload admission and job replay

This backend enabler adds admission and replay to the PostgreSQL job store shipped by KAN-54. KAN-56, KAN-139 and the provider and billing release gates own customer-facing integrations. The application must derive job ownership, queue and provider from verified request context and its registered workload handlers.

| Requirement | PostgreSQL behavior |
| --- | --- |
| User, workspace, queue and fleet limits | One transaction checks current authority, counts all active jobs, and inserts the job and first journal event. Defaults are 4 active jobs per user, 12 per workspace, 8 per queue and 80 fleetwide. Operations can set the single admission policy row. |
| Fair scheduling | Workers use `claimNext`. A newly active queue joins behind existing queues. A successful claim moves its queue to the back. The scheduler uses the oldest eligible job in each queue and skips disabled or exhausted provider paths. Explicit targeted claims support the existing fenced recovery path. |
| Provider limits and retry | A configured provider debits one UTC-day attempt only on a successful claim transaction. Unknown providers are refused. Retries consume another attempt and reuse the job's persisted retry ceiling. Unspecified job deadlines default to 24 hours. |
| Progress and reconnect | `PostgresJobStore.observe` enforces current owner and workspace scope. The response contains state, attempt, cursor and timestamps. Clients resume after the last applied cursor. A gap or a cursor beyond the current revision returns the current status and a fresh checkpoint. |
| Rollback | Status, journal, provider debit and scheduling changes roll back together. Workers continue to use KAN-54's database-clock fencing. |

Migration 9 creates the policy, usage, queue-turn and journal tables. The migration job's empty-target guard applies. The sweeper role needs SELECT/UPDATE on workload jobs and INSERT on the journal. The admission worker additionally needs SELECT/INSERT on the journal, SELECT on policy and provider limits, SELECT/INSERT/UPDATE on usage and turns, and the scoped authority reads and row-lock privileges exercised by the SQL contract. The worker role cannot change the provider limits or read migration receipts.

Run `npm run data:check` with a disposable PostgreSQL test database to verify concurrent caps, fair turns, two-client replay, authorization changes, provider debits, event rollback and KAN-54 regressions. The pull request records exact-source review, CI and hosted acceptance before integration into `dev`.
