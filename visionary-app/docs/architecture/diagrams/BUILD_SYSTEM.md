# Build system architecture

All server components below are **targets**, not deployed services. The current Build screen is a local document editor. The shared UID/account/billing foundation is shown in the [overall diagram](SYSTEM_OVERVIEW.md); this view expands Build. [Full design](../build/README.md).

```mermaid
flowchart TB
    EDITOR["Artifact Studio<br/>Edit / guidance / review"]
    API["Trusted Build API · Cloud Run<br/>UID / workspace / source policy"]
    PROJECT["Project service<br/>Conditional saves and revisions"]
    RUN["Durable run coordinator<br/>Budget / queue / cancel / recovery"]
    DIST["Distribution service<br/>Explicit export / share / submit"]
    AI["Private model adapter<br/>Permitted context / bounded work"]
    EXEC["LATER · execution sandbox<br/>Separate credentials and network"]
    OUTPUT["Validate and quarantine<br/>Immutable proposal for user review"]
    SQL["PostgreSQL<br/>Heads / revisions / jobs / grants"]
    FILES["Private object storage · GCS<br/>Manifests / assets / exports"]
    SURFACE["Authorized delivery<br/>Documents and recipient copies<br/>Later isolated preview origin"]
    EDITOR -->|"commands / refetch"| API
    API --> PROJECT
    API --> RUN
    API --> DIST
    PROJECT --> SQL
    PROJECT --> FILES
    RUN --> AI
    RUN -.->|"after qualification"| EXEC
    AI --> OUTPUT
    EXEC --> OUTPUT
    OUTPUT --> SQL
    OUTPUT --> FILES
    DIST --> SQL
    DIST --> SURFACE
    FILES --> SURFACE
```

The coordinator persists resumable state; the editor observes authorized events or polls and refetches. Generation creates a proposal, never an automatic publication/submission. The separate [lifecycle diagram](BUILD_LIFECYCLE.md) shows explicit acceptance and conflict handling. Execution is deferred until containment tests pass; Learn/Teach and payments never run inside this sandbox.
