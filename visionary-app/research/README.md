# Visionary research

[Education AGI research, 17 October 2026](EDUCATION_AGI_RESEARCH_2026_10_17.md) translates primary-source capability, learning and Indian-speech evidence into the [current implementation plan](../docs/architecture/EDUCATION_LAUNCH_PLAN.md). This is research/planning evidence, not provider qualification or AGI certification.

[YouTube reference-page review, 16 October 2026](YOUTUBE_REFERENCE_REVIEW_2026_10_16.md) records the founder-supplied page review in the visible browser and the resulting architecture-presentation corrections. It is a critical comparison, not evidence of recovered private YouTube infrastructure. [Revised review maps and implementation priorities](../docs/architecture/VISUAL_REVIEW.md).

Keep Visionary study scripts, reports, templates and evidence indexes here. The pinned [REA toolkit](../reverse-engineering/README.md) stays in `reverse-engineering/upstream/`; product [architecture and design](../docs/architecture/README.md) stay under `docs/architecture/`. Raw local captures remain in `artifacts/research/` with their original paths and hashes.

Run commands from the product root:

```powershell
node research/payment-study.mjs
node research/system-design-study.mjs
node research/verify-system-design-evidence.mjs
node research/build-reference-study.mjs
node research/verify-build-reference-evidence.mjs
```

Capture commands launch anonymous browser studies. The verifier only reads retained evidence. Use [the template](FEATURE_STUDY_TEMPLATE.md) for a new study; implementation belongs to its product component.

## Completed system-design research

[Build reference study: Claude, ChatGPT and Gemini](BUILD_REFERENCE_STUDY_2026_10_16.md) records the 16 October anonymous official-document REA runs: Gemini completes; Claude and ChatGPT retain partial captures with cleanup timeouts. The report distinguishes published capabilities, unknown private topology and proposed Visionary decisions. [Exact evidence index](BUILD_REFERENCE_EVIDENCE_2026_10_16.json); [resulting Build architecture and diagrams](../docs/architecture/build/README.md).

[Classroom, Khan Academy and YouTube study](SYSTEM_DESIGN_STUDY_2026_10_15.md) records the 15 October REA attempts with their incomplete-cleanup results, the 16 October reproduction that completed all three captures, official public-contract/historical architecture evidence and Visionary adaptations. Evidence [digests](SYSTEM_DESIGN_EVIDENCE_2026_10_15.json) and [complete-capture digests](SYSTEM_DESIGN_EVIDENCE_2026_10_16.json) are validated by `verify-system-design-evidence.mjs`; reproduce with `node research/system-design-study.mjs` after reviewing cleanup guidance. The [resulting blueprint](../docs/architecture/blueprint/README.md) covers the full system tree, HLD/LLD/OOP, communication and cloud/cost. No private third-party architecture is claimed as recovered.

The table below retains candidate feature questions. Completed studies record the actual investigations and their evidence limits; new studies require a concrete feature and public reference.

| Candidate study | Visionary question | Likely implementation owner |
| --- | --- | --- |
| Google Classroom assignment/review behavior | How should publication, learner attempts, teacher feedback and revision preserve context and history? | Backend and teacher/learner frontend |
| Google guided learning behavior | How should explanation, hints, checks and return-to-lesson work together? | ML orchestration and learning frontend |
| Google guardian summaries | Which summaries are useful without exposing private learner conversations? | Backend consent/reporting and parent frontend |
| Apple ClassKit activity concepts | How should activity identity and meaningful progress be represented? | Backend learning records and frontend |
| Apple Classroom session behavior | How should session scope and monitoring visibility be disclosed? | Backend policy and classroom frontend |
| Apple accessibility and continuity | How should focus, reading position, speech and recoverable activity state behave across contexts? | Frontend and persistence |

These are candidate research questions, not findings or claims that the corresponding mechanisms are already implemented. Attach authoritative references and reproducible observations before proposing changes.

## Completed payment investigation

[Google One, Workspace and Apple payment study, 15 October 2026](PAYMENTS_STUDY_2026_10_15.md) records public-document findings, actual REA browser evidence and its failures/limits, current pricing/auth integration gaps and proposed acceptance criteria. Run `node research/payment-study.mjs` from the product root to retain a fresh anonymous evidence set. The [connected billing proposal](../integration/PAYMENTS_DESIGN.md) prepares the next implementation discussion; no provider or live payment policy is selected by this research.
