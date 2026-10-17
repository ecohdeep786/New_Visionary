# Visionary Build architecture

D-088, 17 October 2026: [current staged Build coverage and implementation handoff](../EDUCATION_LAUNCH_PLAN.md) verifies BUILD-01–08 / KAN-75–82 already exist as open launch work. [BUILD-09 / KAN-154](https://visionary-team.atlassian.net/browse/KAN-154) now explicitly owns Stage 3 trusted declarative activities; [AI-17 / KAN-155](https://visionary-team.atlassian.net/browse/KAN-155) adds voice-guided requests through the same exact-revision approval boundary. LATER-01–03 / KAN-132–134 retain isolated code, HTML and public release gates. None is marked complete by this review. The separate Build design below remains the target architecture.

For the shared deployment/data context, begin with the [grouped platform map](../diagrams/PLATFORM_ARCHITECTURE.md) and [numbered request flow](../diagrams/REQUEST_PATHS.md). The Build-specific diagram below expands project/proposal/execution behavior.

16 October 2026 · D-078 · target design for the 100,000-MAU growth launch.

Build helps a learner or professional create, explain, revise and demonstrate work. Learn/Teach supplies approved objectives, sources and assessment context. Both use the same verified person and workspace policies; they have separate workflows, records and workload budgets.

Start with the [Build diagram](../diagrams/BUILD_SYSTEM.md) ([full-size SVG](../diagrams/rendered/build_system.svg)). Then follow:

| Review question | Design |
| --- | --- |
| Where does Build fit? | [Overall system](../diagrams/SYSTEM_OVERVIEW.md), [Learn/Teach](../diagrams/LEARN_TEACH.md), [boundary diagram](../diagrams/LEARN_BUILD_BOUNDARY.md) |
| How do the frontend, backend, AI and execution communicate? | [System tree, HLD, flows, security and cloud choice](SYSTEM_DESIGN.md) |
| What owns the data and behavior? | [LLD, contracts, state machines and object design](DATA_AND_CONTRACTS.md) |
| How will we implement, size and verify it? | [Delivery, capacity, costs and acceptance](DELIVERY_AND_EVALUATION.md) |
| What did the reference investigation establish? | [Claude / ChatGPT / Gemini study and actual REA results](../../../research/BUILD_REFERENCE_STUDY_2026_10_16.md) |

## Current implementation versus target

The active `/dashboard/build` route loads `frontend/src/pages/dashboard/ArtifactStudio.jsx`. It currently provides a browser-local document/project editor, draft recovery, body history, guided criteria, completion/self-review, Markdown export and explicit fixed-copy sharing. Its local permission checks do not establish production server authorization. The older `Build.jsx` and unused `BuildHero.jsx` are not the active product contract.

The connected backend module registers Firebase account, billing and product controllers; it has no connected project/build controller. Existing `backendTransport.ts` supports content/teaching/mentor operations, with a 20-second whole-request deadline. It is not a build-run stream. Explore/Practice links with `subject/topic` query parameters do not establish a source-linked Build project; ArtifactStudio currently reads only `artifact`.

This design adds target server contracts for durable projects, AI proposals and asynchronous jobs. Optional code execution, assets, previews, publication and generated-app data are later capabilities with explicit gates. Diagrams do not mean these services are deployed. Preserve existing auth, onboarding, Free defaults, Razorpay test billing and private invoices. No migration, pricing change, runtime execution or cloud provisioning occurs in this architecture task.

## Core decisions

1. One Firebase UID across devices; server-verified workspace membership and object permissions on every operation. Names remain attributes, not keys.
2. The saved artifact is authoritative independently of its conversation. AI proposes changes; the user applies them against a fixed base revision.
3. Start with documents and reviewed declarative learning activities. Keep arbitrary code execution behind a separate, qualified execution boundary.
4. Saving, previewing, exporting, sharing, classroom submission and public deployment are distinct operations with distinct authorization.
5. Stay on one primary cloud, GCP. Extend the existing modular API/data architecture; introduce specialized execution infrastructure only when that capability is justified and qualified.

See [D-076 blueprint](../blueprint/README.md) for the shared foundation, existing load assumptions and whole-product cost model. Build's incremental execution and generation costs require their own scenarios before release.
