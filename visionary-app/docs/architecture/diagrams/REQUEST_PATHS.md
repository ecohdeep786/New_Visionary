# Visionary request and data paths

D-079 · target contracts; existing auth/account/test-billing routes retain their current names. Numbered paths explain the platform without mixing API commands, file delivery and asynchronous generation into one request.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / device
    participant Edge as HTTPS edge
    participant API as Product API
    participant DB as Owning data store
    participant Queue as Outbox / Tasks
    participant Worker as Private worker / AI
    participant Files as Private object delivery
    Note over User,API: Every command verifies session, workspace and object/source policy
    User->>Edge: Read lesson / project or save with expected revision
    Edge->>API: Validated API request
    API->>DB: Authorized read or atomic revision + command + outbox
    DB-->>API: Committed result / conflict
    API-->>User: Acknowledged revision, preserve draft on conflict
    Note over User,Files: Large files bypass the API body, private access is separately authorized
    User->>API: Request access to exact saved object/revision
    API->>DB: Check ownership, current consent and ready object state
    API-->>User: Protected download route / scoped upload intent
    User->>Files: Authorized bytes, public CDN only for approved public content
    Note over User,Worker: Expensive Build work survives browser close
    User->>API: Generate proposal (mutation ID + base revision)
    API->>DB: Reserve budget + durable run + outbox atomically
    API-->>User: 202 run ID, observe status/events
    DB-->>Queue: Dispatch committed outbox, retry safely
    Queue-->>Worker: Authenticated task / run ID
    Worker->>DB: Recheck permission, claim lease / attempt fence
    Worker->>Worker: Bounded model / validate / optional qualified sandbox
    Worker->>DB: Store candidate + terminal state + measured usage
    User->>API: Reconnect / poll cursor
    API->>DB: Authorized snapshot / events
    API-->>User: Proposal ready, show diff
    User->>API: Explicit accept against expected head
    API->>DB: Reauthorize + compare-and-swap revision
    API-->>User: Saved revision or conflict, no implicit sharing
```

Each transaction above uses its own authoritative store: account/payment commands use Firestore; future projects/evidence use SQL. A cached event cannot authorize a read. A short-lived signed URL has a residual validity window; use an authenticated gateway for content requiring immediate revocation. Upload intents target quarantine and require completion/scan before attachment. Ordinary save/read does not wait for a queue, model or sandbox. Full endpoint/state behavior remains in [shared communication](../blueprint/COMMUNICATION.md) and [Build contracts](../build/DATA_AND_CONTRACTS.md).
