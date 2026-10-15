# System-design study: Classroom, Khan Academy and YouTube

15 October 2026 · D-076 · public evidence, anonymous toolkit attempts and Visionary adaptation. The user requested this research before extending the product system design.

## What ran, and what it establishes

Run the local toolkit workflow:

```powershell
npm run rea -- --help
node reverse-engineering/research/system-design-study.mjs
# Focused attempts, after inspecting cleanup evidence:
node reverse-engineering/research/system-design-study.mjs khan-academy
node reverse-engineering/research/system-design-study.mjs youtube
```

The runner invokes the pinned REA6.4.0 `capture-browser-scenario`, locates installed Chromium through existing frontend Puppeteer and uses an empty temporary profile. Targets are official Classroom coursework documentation, Khan's technical architecture article and Google's YouTube recommendations publication. No third-party sign-in, account operation, purchase, consent click, private API, source credential or authenticated user traffic is used. No provider installation, global registration or upstream modification occurs.

| Attempt | Actual result | Evidence |
| --- | --- | --- |
| Initial Classroom runner diagnostic | Invalid executable-path type before capture; asynchronous path lookup was corrected with `await` | `2026-10-15T17-12-52-006Z/classroom.evidence.json` |
| Classroom public document | Exit1, `cleanup_incomplete`; partial observation retained | `2026-10-15T17-13-22-349Z/classroom.evidence.json` |
| Khan Academy engineering article | Exit1, `cleanup_incomplete`; partial observation retained | `2026-10-15T17-14-53-836Z/khan-academy.evidence.json` |
| YouTube research publication | Exit1, `cleanup_incomplete`; partial observation retained | `2026-10-15T17-15-17-771Z/youtube.evidence.json` |

All evidence paths above are under `artifacts/research/system-design/`. [Digest/status index](SYSTEM_DESIGN_EVIDENCE_2026_10_15.json) retains exact hashes. The corrected runner stops on unconfirmed cleanup. Read-only process inspection after each failed capture found no Chrome command line containing REA before the next selected target was attempted. That does not certify deletion of every reported temporary profile. No unrelated/user browser is killed. The provider failure remains unresolved; no run is counted as complete.

Partial records include captured steps, but a completed step is not a complete investigation or proof of a company's servers. Independent reading of the official sources below supports the findings. This is **public-contract research and historical architecture analysis**, not recovered private source code or an authenticated workflow test. CPU time, peak process-family memory and agent-token cost were not measured; run manifests retain wall duration. There is no performance improvement claim.

## Evidence ledger and adaptation

### Google Classroom: contracts and permissions

- **GC1 — current documented roles.** Roles are contextual to a course; a person may teach in one context and learn in another. Adopt separate UID, membership and action policy, with explicit guardian grants. Do not authorize from onboarding category. [User roles](https://developers.google.com/workspace/classroom/guides/key-concepts/user-types)
- **GC2 — current documented coursework.** Assignment metadata and student responses are separate resources. Submission access does not automatically grant attachment access. Adopt fixed published assignment/source versions, owned submission revisions and separate object-download authorization. Google's developer-project modification rule is its integration policy, not a Visionary tenancy model. [Manage CourseWork](https://developers.google.com/workspace/classroom/guides/manage-coursework)
- **GC3 — current documented workflow.** Submission records distinguish draft/assigned grades, state/history and actor timestamps; APIs expose explicit submission transitions. Adopt state machines and immutable feedback/revision history. AI suggestions must not become a released teacher grade. [StudentSubmission resource](https://developers.google.com/workspace/classroom/reference/rest/v1/courses.courseWork.studentSubmissions)
- **GC4 — current documented lifecycle/events.** Course lifecycle and asynchronous resource readiness are explicit. Change notifications lead clients to authorized resource fetches, have registration lifetime rules and are not instantaneous consistency guarantees. Adopt invalidation/refetch/reconciliation, with independent revocation checks. Do not copy Google's notification lifetime or edition restrictions. [Course resource](https://developers.google.com/workspace/classroom/reference/rest/v1/courses), [push notifications](https://developers.google.com/workspace/classroom/best-practices/push-notifications)

Unknown: Classroom's private database, internal service/deployment topology, cache keys, ledger, regional failover and exact consistency implementation. Public API resources cannot prove whether a monolith, microservices or a particular database implements them.

### Khan Academy: historical architecture and current learning semantics

- **KA1 —2019 historical architecture disclosure.** Goliath replaced an aging Python2 backend with Go services and a GraphQL gateway while preserving successful managed infrastructure/data choices. Adopt incremental replacement and preserve working Firebase/payment authority. Language/framework changes need Visionary measurements. [Go + Services](https://blog.khanacademy.org/go-services-one-goliath-project/)
- **KA2 —2020 migration disclosure.** Khan described shadowed read comparisons, canary stages and incremental GraphQL migration. Adopt read-only compatibility comparisons and reversible cutovers; never duplicate payment/submission mutations to compare results. REST/OpenAPI can use the same migration discipline. [Incremental rewrites](https://blog.khanacademy.org/incremental-rewrites-with-graphql/)
- **KA3 —2021 design disclosure.** Services owned their data; ADRs, typed contracts and practical fan-out/performance constraints shaped the rewrite. Adopt module-owned data inside the modular product API, extracting services when measured isolation/scaling requires it. Do not copy its service count or force GraphQL federation into the launch. [Technical choices](https://blog.khanacademy.org/technical-choices-behind-a-successful-rewrite-project/)
- **KA4 —2020 scaling account.** Managed compute/data, content caching/CDN and operational response supported a major traffic increase; costs also grew. Adopt CDN for approved assets and keep video bytes outside API servers. This article is not a2026 inventory. [Traffic scaling](https://blog.khanacademy.org/how-khan-academy-successfully-handled-2-5x-traffic-in-a-week/)
- **KA5 — current documented mastery.** The help article updated25 August2026 measures course/unit mastery using skills at Proficient or Mastered, with stated regional exceptions. It differs from older weighted-point descriptions. Adopt immutable attempt evidence and versioned mastery/denominator policies, not an outdated formula or video-completion score. [Course and Unit Mastery](https://support.khanacademy.org/hc/en-us/articles/115002552631-What-are-Course-and-Unit-Mastery)
- **KA6 — older-dated help behavior.** Mastery Challenges document a bounded personalized review workflow and subject/eligibility limits. Adopt evidence/due-time-driven review scheduling only after evaluation for Visionary's released subjects. [Mastery Challenges](https://support.khanacademy.org/hc/en-us/articles/360037494231-What-are-Mastery-Challenges)

Original architecture articles date to2019–2021; a later website update date does not make their topology current. Unknown: Khan's complete2026 service inventory, inference/data stack, actual unit costs and cross-device consistency guarantees.

### YouTube: separated workloads and measured specialization

- **YT1 —2016 research architecture.** The published recommendation design separates candidate generation from ranking. Adapt eligible learning candidates followed by pedagogic ranking; begin with explainable rules and versioned evaluation. Do not copy a historical model architecture or equate watch time with mastery. [Research publication](https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/)
- **YT2 —2021 product/engineering explanation.** YouTube described multiple satisfaction signals and user history controls, rather than one universal engagement formula. Adopt controllable personalization and useful-learning outcomes. Do not optimize a student's time spent as the sole education objective. [Recommendations explanation](https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/)
- **YT3 —2021 infrastructure disclosure.** Video ingest/transcoding and multiple device formats drove specialized processing; the team described custom VCU hardware. Adopt asynchronous media processing, renditions and separate delivery budgets. Visionary does not need custom chips or YouTube-scale infrastructure at100,000 MAU. [Video infrastructure](https://blog.youtube/inside-youtube/new-era-video-infrastructure/)
- **YT4 — historical database scaling.** Vitess's official history describes YouTube's progression from read replicas toward sharding/proxy-managed routing as limits were reached. Adopt observable growth triggers and bounded database connections. Do not shard Visionary on day one or assume YouTube's current private data topology. [Vitess history](https://vitess.io/docs/overview/history/)
- **YT5 — current integration interface.** Public external video use should follow the official player API and minimum-functionality requirements, including identity/referrer and presentation behavior. Research does not authorize downloading/rehosting someone else's videos. An external embed has privacy, availability and product-policy dependencies. [Player API](https://developers.google.com/youtube/iframe_api_reference), [minimum functionality](https://developers.google.com/youtube/terms/required-minimum-functionality)

Unknown: full current YouTube backend, recommendation models, private schemas, quotas/contracts/costs and global failover design. Browser HTML cannot establish any of these. No authenticated YouTube behavior was exercised.

## Design decisions for Visionary

| Pattern | Decision / requirement | Acceptance |
| --- | --- | --- |
| Contextual classroom roles | Adopt verified membership/object/source policy | Same UID different roles; wrong/revoked scope denied |
| Assignment/submission/media separation | Adopt fixed versions and independent attachment grants | Teacher return/new revision preserves old snapshot; denied object download |
| Evidence-based learning | Adopt versioned evidence/progress/review policies | Recompute the same result from fixed evidence/policy; no AI-confidence mastery |
| Domain ownership and incremental migration | Adopt modules/typed adapters/canaries | No duplicate side effects; scoped read comparisons and rollback |
| Candidate/rank split | Adapt to pedagogic eligibility and reasons | No withdrawn/private/unsupported source in candidates; measured outcomes |
| Async media/CDN | Adopt only for rights-approved content | Upload/scan failure recovery; no public private data; measured egress |
| Large microservices/custom chips/sharding | Reject as initial defaults | Add only after a measurable isolation/capacity/cost case |

The resulting [Visionary blueprint](../../..//docs/architecture/blueprint/README.md) covers frontend/backend contracts, HLD, LLD, OOP, data/workers, one-cloud choice and cost. Actual product acceptance remains separate from this study. Hosted/private-company internals remain unresolved rather than guessed.
