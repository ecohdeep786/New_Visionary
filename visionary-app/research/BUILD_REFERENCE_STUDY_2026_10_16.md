# Build reference study: Claude, ChatGPT and Gemini

16 October 2026 · D-078 · public evidence, followed by a Visionary design proposal.

## Scope and actual REA runs

The founder requested diagrams of the existing product design, then REA research of Claude, ChatGPT and Gemini before designing Build separately from Learn/Teach. The [overall](../docs/architecture/diagrams/SYSTEM_OVERVIEW.md) and [Learn/Teach](../docs/architecture/diagrams/LEARN_TEACH.md) diagrams were created and rendered before this investigation. Run `node research/build-reference-study.mjs` from the product root; optional targets are `claude`, `chatgpt`, `gemini`. Product research stays here; the pinned toolkit remains in `reverse-engineering/upstream/`.

Selected targets were anonymous official artifact/file/Canvas documentation. No account login, private endpoint, user traffic, provider execution, deployment or paid operation was exercised. These pages document user-facing contracts; they do not disclose the companies' full production system designs. The study is deliberately focused on creation workflows relevant to Build rather than pretending to recover general chat serving infrastructure.

| Run (UTC) | Target | Actual result |
| --- | --- | --- |
| 05:14:08 | Claude | Input diagnostic: missing awaited browser executable; rejected before browser launch. Runner corrected; diagnostic retained. |
| 05:14:26 | Claude | URL, DOM and accessibility captured; both steps complete; envelope fails `cleanup_incomplete` after the provider's 1,000 ms cleanup deadline. Not a complete capture. |
| 05:15:11 | ChatGPT | URL, DOM and accessibility captured; both steps complete; same cleanup failure. Final URL includes the public `surface=app` parameter. Not a complete capture. |
| 05:15:36 | Gemini | Exit 0, complete steps and envelope, URL/DOM/accessibility captured, `terminated-owned-process`. Complete public-document capture. |

Read-only Windows process checks after the failed runs and after Gemini found no Chrome/Chromium process. No user browser was killed. REA's temporary-profile deletion remains unconfirmed for the two cleanup failures. The 1,000 ms cleanup boundary is present in pinned `PlaywrightScenarioBrowser.ts`; it was inspected, not patched. No identical failed capture was repeatedly retried. Independent official-document reading corroborates the findings below. [Evidence index](BUILD_REFERENCE_EVIDENCE_2026_10_16.json) retains exact file digests, states and errors; `node research/verify-build-reference-evidence.mjs` checks them against local raw captures. Wall durations are recorded; CPU, peak memory and agent-token cost were not measured.

## Published capabilities, interpretation and decisions

### Claude

**Published:** Artifacts persist beside conversation and in a library, support conversational/direct editing and selected edits, with type-dependent export and personal/shared storage or connector permissions. The current guide distinguishes artifacts made before 16 September 2026 as legacy. Earlier runtime restrictions cannot be assumed current. [Artifacts guide](https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them)

**Published:** Artifacts begin private; access and external-sharing controls vary by type and organization, including distinct view/comment/edit behavior. [Sharing guide](https://support.claude.com/en/articles/9547008-share-artifacts)

**Published:** File creation uses an isolated execution environment with configurable network access and limits. Network controls and connector permissions are separate concerns. [File creation and execution](https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude)

**Visionary inference:** durable artifact state must be separate from chat, access scope explicit, and editing distinct from sharing or execution. Adopt private versioned projects and independently scoped capabilities. Do not copy organization or connector defaults without education-specific authorization. Unknown: private queues, databases, orchestration, isolation implementation, model routing, load balancers and disaster recovery.

### ChatGPT

**Published:** Generated files can be previewed alongside chat in the desktop app; supported HTML can expose source/rendered views and annotations can request focused revision. Standalone LaTeX preserves edited source and the last successful PDF after compilation errors. Available surfaces differ. [Work with files](https://learn.chatgpt.com/docs/artifacts-viewer)

**Published:** Pages support selected-text changes and comments, block rearrangement, and generated drafts that the user reviews, accepts, changes or undoes. [Work with pages](https://learn.chatgpt.com/docs/space/pages)

**Published API contract, not evidence of ChatGPT's internal implementation:** OpenAI Code Interpreter exposes sandbox containers, file upload/download, explicit or automatic creation and expiry. Its documentation recommends keeping durable data in the caller's own systems. [Code Interpreter](https://developers.openai.com/api/docs/guides/tools-code-interpreter)

**Visionary inference:** preserve the editor if generation/export fails; tie feedback to a specific selection/revision; treat execution storage as temporary and persist validated output independently. Choose providers behind adapters after evaluation. API container behavior does not prove which runtime powers a particular ChatGPT UI. Unknown: private artifact schemas, scheduling, replication, frontend synchronization and service topology.

### Gemini

**Published:** Canvas supports prompt/direct code edits, autosave, preview/console, recent changes and selected edits; documents have version navigation. A shared item can be copied into a separate editable version. Some creation/sharing capabilities have age restrictions. [Canvas guide](https://support.google.com/gemini/answer/16047321?hl=en)

**Published:** Apps needing persistence receive Firestore storage; personal and shared app data differ. A public multi-user app's linked data can be visible/editable to anyone holding its public link. Google cautions about untrusted apps and sensitive inputs. [Canvas safety](https://support.google.com/gemini/answer/16419134?hl=en)

**Visionary inference:** adopt visible save states, version navigation, bounded diagnostic logs and explicit independent forks. Reject public-link access as the authority for learner records. Generated-app data must have authenticated project/actor scope and reviewed schemas. The Firestore disclosure concerns a documented app-storage feature; it does not establish Gemini's entire backend or Visionary's required database choice. Unknown: underlying revision database, tenancy, scheduling, serving and recovery.

## Execution options checked against current GCP documentation

**Published:** GKE Sandbox offers stronger workload isolation using sandbox runtimes such as gVisor. Reachable services, metadata and resource/network policies still require attention. [GKE Sandbox](https://docs.cloud.google.com/kubernetes-engine/docs/concepts/sandbox-pods)

**Published:** Cloud Run Sandboxes are Preview, opt-in and ephemeral. They block egress and do not inherit environment variables by default, but sandbox processes can read the host container root filesystem by default. This makes clean execution images and separation from sensitive application images essential. [Cloud Run code execution](https://docs.cloud.google.com/run/docs/code-execution)

**Proposal:** start Build with documents and reviewed declarative activities. Add code only after a dedicated execution plane is qualified. GKE Sandbox/gVisor is the conservative planned production path; evaluate Cloud Run Sandboxes as a bounded pilot after Preview, region, isolation, quotas, cancellation and cost review. Neither option is provisioned by this study. Cloud Run remains suitable for trusted API/coordinator work; ordinary container isolation alone is not permission to execute untrusted programs in the privileged product process.

## Resulting Visionary design

The [Build design](../docs/architecture/build/README.md) separates project state, AI proposals, execution, preview and explicit distribution. It preserves current guided-learning eligibility, private drafts, immutable classroom copies, parent summaries, employer/personal separation and unverified self-reported application evidence. See [Build diagram](../docs/architecture/diagrams/BUILD_SYSTEM.md), [lifecycle](../docs/architecture/diagrams/BUILD_LIFECYCLE.md) and [Learn/Build boundary](../docs/architecture/diagrams/LEARN_BUILD_BOUNDARY.md). All new server components remain targets; public reference evidence is not proof they are implemented or capacity-tested.
