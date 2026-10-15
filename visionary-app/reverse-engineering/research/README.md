# Feature research queue

No Google or Apple feature investigation has been executed by this source import. Select a concrete product, feature and publicly accessible reference for each study.

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

[Google One, Workspace and Apple payment study, 15 October 2026](PAYMENTS_STUDY_2026_10_15.md) records public-document findings, actual REA browser evidence and its failures/limits, current pricing/auth integration gaps and proposed acceptance criteria. Run `node reverse-engineering/research/payment-study.mjs` from the product root to retain a fresh anonymous evidence set. The [connected billing proposal](../../integration/PAYMENTS_DESIGN.md) prepares the next implementation discussion; no provider or live payment policy is selected by this research.
