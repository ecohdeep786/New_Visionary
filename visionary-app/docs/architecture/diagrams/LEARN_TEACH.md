# Learn and Teach architecture

Target learning/classroom system from the existing blueprint. Browser previews currently implement many journeys; production domain APIs, source publication and ML connection remain target work.

```mermaid
flowchart TB
    LEARNER["Learner workspace<br/>Learn / Ask / Practice / Progress"]
    TEACHER["Verified teacher workspace<br/>Prepare / Assign / Review / Return"]
    POLICY["Product API policy<br/>UID + membership + consent + source version"]
    CATALOG["Reviewed content catalog<br/>Rights, language, curriculum and publication"]
    TEACH["Teaching / Guide application<br/>Bounded context and usage reservation"]
    RAG["Private retrieval and generation<br/>Permitted chunks / model / citation validation"]
    ATTEMPT["Learning attempts and evidence<br/>Fixed criteria; versioned progress policy"]
    CLASS["Classroom workflow<br/>Enrollment / assignment version / submission snapshot"]
    STORE["PostgreSQL domain authority<br/>Revisions, command results and outbox"]
    SYNC["Authorized changes / refetch<br/>Second-device resume; conflict recovery"]
    REPORT["Scoped reports<br/>Guardian summaries / approved organization aggregates"]
    LEARNER --> POLICY
    TEACHER --> POLICY
    POLICY --> CATALOG
    POLICY --> TEACH
    CATALOG --> TEACH
    TEACH --> RAG
    POLICY --> ATTEMPT
    POLICY --> CLASS
    ATTEMPT --> STORE
    CLASS --> STORE
    CATALOG --> STORE
    STORE --> SYNC
    STORE --> REPORT
    POLICY --> REPORT
```

Explanation and consumption are separate from assessed evidence. AI feedback stays proposed until the relevant policy/teacher accepts it. Guardian access never follows automatically from a Family payment. Shared Build projects enter a classroom through an explicitly selected immutable submission revision, not by exposing the private draft or conversation.
