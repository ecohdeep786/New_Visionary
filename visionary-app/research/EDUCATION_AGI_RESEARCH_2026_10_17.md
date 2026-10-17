# Education AGI ambition: evidence translated into launch work

17 October 2026 · D-088 · Research synthesis and engineering interpretation. [Implementation and Jira handoff](../docs/architecture/EDUCATION_LAUNCH_PLAN.md). No model, dataset, service or training job was activated by this study.

## Working product ambition

The founder wants an Indian product where eligible users can learn, teach and build step by step, using natural voice/text interaction, persistent permitted context and reliable resume across devices and changing connectivity. This is the product goal. VATS supplies seven capability boundaries; AIRA coordinates bounded workflows. Broad AGI remains an independently evaluated research ambition. Completing a feature backlog cannot by itself certify general intelligence or a market revolution.

Natural human-style communication is interpreted here as understandable two-way interaction with the AI. It does not silently add a live-human marketplace, impersonation, voice cloning or authority to publish/pay/grade from a spoken phrase. Existing five roles, category/source/language/privacy boundaries, auth/onboarding/test billing and current UI are preserved.

## Primary-source findings and their limits

### R01 — Separate system architecture from general capability

DeepMind's [Levels of AGI, ICML2024](https://deepmind.google/research/publications/66938/) frames capability using performance, breadth and autonomy. Our inference: maintain separate software-release and cognitive-capability scorecards. Seven application layers are not seven neural-network layers or evidence of DeepMind-equivalent capability. AI-13 must evaluate unfamiliar tasks and outcomes, while release tasks verify actual services. The framework does not select Visionary's model, training method or deployment topology.

### R02 — Test distinct abilities and transfer independently

DeepMind's [March2026 cognitive framework](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/measuring-agi-cognitive-framework/) proposes a range of cognitive abilities and a protocol using held-out tasks and human comparisons. Our inference: record a capability profile for perception, useful output, attention, learning, memory, reasoning, uncertainty awareness, planning/control, problem solving and social interpretation. Educational performance within selected sources/languages is a domain result. Broader generality needs independent task families, contamination checks, repeated runs and meaningful human reference data; no composite AGI percentage is invented.

### R03 — Build a teaching interaction rather than an answer stream

Google's [LearnLM principles](https://blog.google/products-and-platforms/products/education/google-learnlm-gemini-generative-ai/) emphasize active practice, manageable presentation, adaptation, curiosity and reflection. Our engineering interpretation is a short loop: establish goal → ask/diagnose → explain or hint → let the learner try → assess → adapt → reflect/review. Voice should preserve that loop. A long spoken answer or fluent dialogue is not sufficient evidence of learning. The source describes Google's approach; it is not a benchmark of Visionary or an endorsement of a selected API.

### R04 — Purpose-built tutoring has encouraging but contextual evidence

Kestin et al.'s [2025 Scientific Reports randomized study](https://www.nature.com/articles/s41598-025-97652-6), available through its [indexed primary-paper record](https://pubmed.ncbi.nlm.nih.gov/40537565/), reports learning benefits for a deliberately designed tutor in a university physics setting. The retrieved methods describe two lessons and pre/post assessment. Our inference: evaluate a defined pedagogy and actual learner outcomes rather than assuming a generic chatbot works equally well everywhere. This does not establish delayed retention, Indian-language effectiveness, every audience/subject, replacement of teachers or broad AGI. Publisher/PMC full-page requests encountered access checks; the paper's indexed abstract and methods excerpts informed this scoped summary, not a claimed complete systematic review.

### R05 — Assisted task success can conceal weaker independent learning

Bastani et al.'s [2025 PNAS field experiment](https://pubmed.ncbi.nlm.nih.gov/40560616/) distinguishes unrestricted answer assistance from a tutor designed to protect learning. Its abstract reports that gains during assisted practice can coexist with poorer performance after assistance is removed, while the tutoring safeguards mitigate the negative effect. Our inference: protect check answers, use hints/attempts and test unassisted novel problems plus retention. This is contextual evidence, not proof that all AI use harms learning or that safeguards guarantee benefits. The primary abstract is accessible; publisher/full-text mirror requests were restricted. No study dataset or user conversations were downloaded.

### R06 — Indian speech needs representative qualification

The authors' [IndicVoices repository](https://github.com/AI4Bharat/IndicVoices) documents spontaneous/conversational Indian-language data and diverse collection/annotation. [IndicSUPERB](https://arxiv.org/abs/2208.11761) describes multiple speech tasks across Indian languages. These sources motivate a rights-reviewed, representative benchmark; their dataset/model coverage is not Visionary's released coverage. Our inference: test mixed-language speech, script choices, accents, noise and mathematical meaning as separate failure slices. Word-error rate alone can miss a wrong sign or unit that changes a lesson. No corpus/model is selected, downloaded or licensed by citation; rights, split contamination, commercial use and provider treatment need review before use.

### R07 — Match orchestration complexity to the verified task

Anthropic's [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) distinguishes prescribed workflows and more model-directed systems, and discusses complexity tradeoffs. Our inference: retain deterministic AIRA, typed tools, explicit approvals, bounded retries and observed final-state checks for teaching and Build. Add wider autonomy only when independently measured task benefit justifies the additional failure modes. This source does not establish any provider's private architecture or authorize autonomous learner-data access.

## Required product behavior inferred from the evidence

| User need | Required behavior | Acceptance signal |
| --- | --- | --- |
| “Explain this in my language” | Clarify ambiguous input; keep interface/input/source/output language separate; handle code switching and correct uncertain transcripts | Reviewed meaning, numbers/units, intelligibility and task success for each released slice |
| “Teach me step by step” | Short adaptive turns, learner attempts and criterion-backed checks; different remediation and bounded review | Independent answer/transfer quality, delayed retention and transparent uncertainty |
| “Talk naturally” | Explicit mic state, interruption/stop, partial/final transcript distinction, captions/text fallback and reliable audio cancellation | Old audio stops; a late chunk cannot revive a cancelled turn or create duplicate actions |
| “Remember me” | One UID with purpose-scoped evidence/memory, correction and cross-device resume | Authorized committed state persists; another role/workspace cannot inherit private context |
| “Let me build it” | Private revisioned artifacts, bounded AI proposals, explicit apply, source-linked briefs and trusted interactive activity formats | Saved revision and validated artifact meet the user's rubric; self-review remains distinct from assessed mastery |
| “Use it anywhere” | Clear offline pack/download status, local pending attempts/drafts, explicit online-only generation and safe reconciliation | Work survives loss of connectivity; reconnect never silently fabricates a score or overwrites a newer revision |
| “It gets better” | Separate learner-state updates, personal context and reviewed product/model changes | Versioned evaluations and approved rollout/rollback; no automatic raw-dialogue training |

“Any user, anytime, anywhere” is a direction for access and reliability. The first release still has a versioned role/category/source/language/modality/device/connectivity support matrix. Unsupported ages/languages/modalities remain explicit until admission and actual acceptance pass. Existing UI locales are not automatically qualified speech languages. Live inference needs connectivity unless a separate on-device model has passed rights, safety, device and economic gates.

## Build architecture audit

The separate [Build design](../docs/architecture/build/README.md) already has eight launch tasks, BUILD-01–08, covering owned projects/revisions, recovery/conflicts, guided briefs, durable AI runs/proposals, export/assets, sharing/classroom bridge, completion/self-review and two-device failure acceptance. LATER-01/02/03 cover isolated code execution, HTML previews and publication/app data. Those are open implementation tasks, not completed backend features.

Stage3 of the design explicitly promises trusted declarative interactive artifacts. BUILD-09 makes that deliverable explicit instead of hiding it inside a generic export or model task. Voice-guided Build reuses AI-17, but consequential apply/share/export still requires current permission and exact-revision confirmation. Arbitrary generated code and public deployment retain their separate qualification gates.

## Research-to-backlog result

Five new stable tasks close specific gaps: AI-17 voice conversation; AI-18 India speech/meaning evaluation; LEARN-13 offline learning packs; BUILD-09 declarative artifacts; ACCEPT-08 controlled educational outcomes. Existing model/source/permission/Build/privacy/capacity tasks remain in force. All142 tasks map to the existing18 feature families,11 delivery layers and seven VATS capabilities, with current native prerequisites. General AGI evidence and successful education-product release remain separate decisions.

No research result here approves an unlicensed corpus, a model route, raw recording retention, experimentation on users, pricing change, automatic notification, deployment or data purge. This is a practical engineering synthesis of selected primary sources and the repository, not a comprehensive survey or a promise of future capability.
