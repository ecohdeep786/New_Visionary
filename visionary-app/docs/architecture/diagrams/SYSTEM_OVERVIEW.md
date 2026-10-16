# Visionary system overview

16 October 2026 · D-078 · review diagram for the 100,000-MAU architecture.

**Connected locally**: Firebase identity, account/onboarding/device sessions and Razorpay test billing. **Target**: hosted GCP infrastructure, relational learning/permissions, AI serving and the Build runtime. A diagram describes the design; it does not deploy these services.

```mermaid
flowchart TB
    CLIENT["Web / future mobile devices<br/>One Firebase UID; independent device sessions"]
    EDGE["TARGET · GCP HTTPS load balancer<br/>Cloud Armor / same product origin"]
    STATIC["TARGET · CDN<br/>Public app assets"]
    API["PRODUCT API · NestJS<br/>Verify session, workspace, consent and action"]
    ID["CONNECTED · Firebase Authentication<br/>Verified identity"]
    ACCOUNT["CONNECTED · Firestore<br/>UID account / onboarding / device sessions"]
    BILL["CONNECTED · Razorpay TEST billing<br/>Verified entitlements / private invoices"]
    LEARN["TARGET · Learn / Teach<br/>Published lessons, practice and classroom workflows"]
    BUILD["TARGET · Build<br/>Private projects and immutable revisions"]
    SQL["TARGET · PostgreSQL<br/>Membership, sources, evidence and project metadata"]
    AI["TARGET · Private AI service<br/>Authorized sources / bounded usage / validated output"]
    MODEL["TARGET · Approved model APIs<br/>Provider selected by quality and privacy evaluation"]
    TASK["TARGET · Durable outbox / Cloud Tasks<br/>Idempotent workers and recovery sweep"]
    FILES["TARGET · Private object storage<br/>Uploads, project files and controlled exports"]
    CLIENT --> EDGE
    EDGE --> STATIC
    EDGE --> API
    ID --> API
    API --> ACCOUNT
    API --> BILL
    API --> LEARN
    API --> BUILD
    LEARN --> SQL
    BUILD --> SQL
    API --> AI
    AI --> MODEL
    AI --> SQL
    API --> TASK
    TASK --> FILES
    TASK --> SQL
    TASK --> BILL
```

The shared foundation serves both tracks. [Learn/Teach](LEARN_TEACH.md) owns curriculum, learning evidence and classroom policy. [Build](BUILD_SYSTEM.md) owns creation, revisions and later reviewed execution/publication, specified after its dedicated reference study. The product API verifies and manages device sessions. Firestore and SQL have separate transactional authorities. No model or browser can grant membership, paid access or publication.

Detailed existing blueprint: [system tree](../blueprint/SYSTEM_TREE.md), [communication](../blueprint/COMMUNICATION.md), [cloud/cost](../blueprint/CLOUD_AND_COST.md).
