# Learn/Teach and Build: shared identity, separate authority

Target integration preserving current education/privacy rules. [Boundary details](../build/SYSTEM_DESIGN.md#learnteach-integration).

```mermaid
flowchart TB
    FOUNDATION["Shared verified UID + workspace policy<br/>Account / devices / entitlements / consent"]
    LEARN["Learn / Teach<br/>Published lesson, source, objective and rubric"]
    EVIDENCE["Verified check + practice evidence<br/>Server checks eligibility and source rights"]
    BRIEF["Immutable guided project brief<br/>Objective / source / rubric / evidence versions"]
    BLANK["Blank personal project<br/>Available without guided-learning gates"]
    BUILD["Build private workspace<br/>Draft / guidance / revisions / self-review"]
    SUBMIT["Explicit selected submission copy<br/>Fixed revision and assignment provenance"]
    TEACHER["Authorized classroom review<br/>Feedback / requested revision / teacher grade"]
    SUMMARY["Explicit consent-bound summary<br/>Approved fixed text; excludes private body/history"]
    PARENT["Verified guardian view<br/>Permitted summary only"]
    FOUNDATION --> LEARN
    FOUNDATION --> BUILD
    LEARN --> EVIDENCE
    EVIDENCE --> BRIEF
    BRIEF --> BUILD
    BLANK --> BUILD
    BUILD -->|"user submits saved revision"| SUBMIT
    SUBMIT --> TEACHER
    BUILD -->|"user approves permitted summary"| SUMMARY
    SUMMARY --> PARENT
```

Project completion and AI checks remain application/self-review evidence until assessment; they do not award mastery. Classroom review does not grant access to the private project conversation or later edits. Family payment does not grant guardian visibility. Professional personal projects and employer workspaces keep the same explicit-sharing boundary.
