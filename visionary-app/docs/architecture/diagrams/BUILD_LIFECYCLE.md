# Build generation and save lifecycle

Target flow; ordinary manual saves use the same conditional revision commit without a model run. [Contracts and state machines](../build/DATA_AND_CONTRACTS.md).

```mermaid
flowchart TB
    BASE["User selects saved revision / text range"]
    AUTH["Verify identity, workspace, sources and usage<br/>Reserve bounded budget; create durable run"]
    QUEUE["Outbox to queue<br/>Lease / attempt fence / restart recovery"]
    GENERATE["Bounded AI generation<br/>Optional isolated test stage later"]
    VALIDATE["Validate output / paths / citations / capabilities"]
    PROPOSE["Store candidate; settle generation usage<br/>Saved project is unchanged"]
    REVIEW["User reviews diff<br/>Accept / discard / revise request"]
    MATCH{"Accept command:<br/>permitted and base still current?"}
    COMMIT["Atomic new revision + command result + outbox<br/>Acknowledge Saved; other devices can refetch"]
    CONFLICT["Retain both versions<br/>Compare and explicitly resolve"]
    STOP["Cancel / deadline / failure<br/>Fence late output; terminate and verify cleanup"]
    KEEP["Keep saved work and local edits<br/>Settle actual usage; release unused reservation"]
    BASE --> AUTH
    AUTH --> QUEUE
    QUEUE --> GENERATE
    GENERATE --> VALIDATE
    VALIDATE --> PROPOSE
    PROPOSE --> REVIEW
    REVIEW -->|"accept"| MATCH
    MATCH -->|"yes"| COMMIT
    MATCH -->|"newer revision"| CONFLICT
    REVIEW -->|"discard"| KEEP
    GENERATE -->|"cancel / timeout"| STOP
    VALIDATE -->|"invalid output"| STOP
    STOP --> KEEP
```

Revoked permission blocks acceptance/delivery rather than exposing a comparison the user can no longer read. Cancellation remains Stopping until termination/cleanup is confirmed. Retry uses the same command/run identity; a generation job becoming proposal-ready does not mean the user accepted its changes. Sharing, submission and deployment require separate commands after saving.
