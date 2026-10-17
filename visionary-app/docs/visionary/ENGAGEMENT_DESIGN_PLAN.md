# Visionary engagement design direction

2026-10-08. Research and design proposal following D-047. No frontend behavior or backend implementation changes are made by this document.

## Finding

The shared visual system supplies consistent spacing, controls and navigation, but the inspected School personal learner Home and Ask entry still depend heavily on labels and text containers. Home repeats the same cube learning task in Next for you and Today's plan. Ask leads with a composer, then a mentor card, context disclosure and three text example buttons. The existing cube lesson already offers an interactive representation and a readable alternative; that pattern should inform the next experience pass.

These are interface observations and design hypotheses. Boredom, engagement or improved retention have not been measured with users. Pixel polish alone does not establish those outcomes.

## Research basis

- [Apple onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding): teach through hands-on interaction and give focused guidance near the relevant task. The source's recommendation concerns onboarding; applying it to chapter learning is our proposed extension.
- [Google's expressive design research](https://design.google/library/expressive-material-design-google-research): strategic color, shape, size and containment direct attention while familiar patterns and labels remain important. Its reported results concern Google's studied interfaces and cannot be assumed for Visionary.
- [Material motion](https://m3.material.io/styles/motion): choose a coherent motion scheme suited to the product. Visionary should use functional motion for administration and selective expression in learning moments.

## Product principle

Make the next useful action clear, make its outcome visible, and let the user continue at their own pace. Measure meaningful return and successful learning/work alongside time spent. Increased session length by itself is not an acceptance criterion.

## Proposed changes

| Surface | Proposed experience | Important constraint |
| --- | --- | --- |
| Home | One illustrated current task with chapter/concept preview and one primary action. Show distinct upcoming work or a compact outline underneath, rather than repeating the current task. | Use actual saved stage/activity; do not invent progress or estimated mastery. |
| Ask entry | Keep the question composer ready. Give the existing authored examples small Visionary visual previews and clear labels. Make the mentor's continuation compact and contextual. | Example click retains its current authored-journey behavior; never imply arbitrary-document analysis. |
| Ask response | When suitable content exists, combine a concise explanation with an accessible diagram, worked example or related activity, then offer a relevant follow-up. | Distinguish authored/connected content and preserve source/workspace context. Requires content/adapter support, not CSS-only changes. |
| Subject/chapter outline | Ordered chapters with a meaningful concept thumbnail, short goal, saved state and obvious resume action. Distinguish upcoming chapters without overwhelming the screen. | Preserve real curriculum/source titles, order, provenance and availability. |
| Learn | One concept at a time: observe a visual, change a variable, predict a result, then receive explanation. Expand derivations and longer references on demand. | Select the representation by concept. Reading and accessible controls must work without 3D. |
| Practice | Focus on one question and explanatory feedback; illustrate an error where useful, then offer a smaller step or retry. | Existing answers, scoring and private-practice boundaries remain intact. |
| Build | Show the real project output/preview, current milestone and next action. Keep supporting notes near the relevant task. | Completion is based on recorded work; a saved project is not automatically verified quality. |
| Progress | Clear stage/milestone history and concrete completed work. Use charts only where real values answer a user question. | Separate activity, assessed evidence and unverified work; no decorative mastery percentages. |

## Role and subcategory adaptation

The shell remains recognizable across roles. Vary the content presentation according to the task, not merely the accent color.

| Role | Main visual/interaction emphasis |
| --- | --- |
| Learner | Concept exploration, chapter previews, practice feedback and a tangible Build output. Younger learners get stronger scaffolding; advanced/exam learners need efficient navigation and concise reasoning. Institution/board subject content stays literal and source-aware. |
| Teacher | Lesson and worksheet previews, editable teaching sequence, classwork status and submission review. Dense management data stays in scan-friendly rows. |
| Parent | A plain-language learning summary backed by permitted evidence, with one useful support action. Different children remain separately scoped. |
| Professional | Capability/project previews and an explicit connection to the current career goal; efficient access to practice and saved work. |
| Organization | Clear cohort/content/access states, useful summaries and drill-down tables. Motion is restrained during permissions, billing and review. |

Inspect actual subcategory data and policy before creating special variants. Board, age, institution, membership and career labels alone must not fabricate a user's interests or capabilities.

## Content and visual rules

1. Start each view with a clear goal and action. Remove duplicated instructions; use a short useful explanation, then reveal background detail when requested.
2. Keep essential permissions, source/service state, errors and consequential-action information visible where it affects a decision. Consolidate repeated preview wording rather than removing truthful scope.
3. Use Visionary's existing artwork for identity and orientation. Use authored diagrams or code-native models for explanations; each visual must explain, orient or show an outcome.
4. Pair icons and meaningful labels. Retain ordered lists and familiar tables when these are the best way to scan content.
5. Animate actual state changes: selected answer, changed model, saved work and completed step. Provide reduced-motion equivalents and readable static states. No ambient movement competes with reading or input.
6. Preserve keyboard access, screen-reader text, sufficient contrast, readable en/hi/bn wrapping, and a text alternative. Do not require sound or an animation to understand feedback.
7. Celebrate specific recorded effort or completion briefly. Give a clear save/stop point and an optional next activity.

## First implementation slice

Start with learner Home, Ask entry and the existing cube chapter. Remove Home's repeated task, turn the three authored Ask examples into labelled visual choices, and improve the observe/change/predict/feedback rhythm using the cube's existing source and controls. This bounds the first change and gives a coherent flow to test before extending patterns to all role sections.

The user's Chapter 1 then supplies the real subject/chapter content. Map each concept to an appropriate diagram, simulation, worked example or 3D model; obtain actual content before claiming automatic conversion. Rehearse the connected Ask, practice and Build paths using that chapter. Backend remains a separate subsequent integration step.

## Acceptance

Observe representative users locating and starting a task, explaining what to do next, using the representation, interpreting feedback, asking a contextual question and resuming saved work. Compare task success, hesitation/backtracking, perceived clarity, perceived interest, understanding and voluntary return. Design a comprehension check around the concept, not whether someone clicked all screens.

Establish baselines before numeric improvement targets. Validate relevant role/subcategory variants and native-language/accessibility use. Existing automated route/layout/service checks continue to protect correctness, but they cannot prove that the experience is enjoyable.

## 2026-10-08 implementation update · D-048

The founder subsequently authorized three collaborating design/engineering roles. The bounded Home → Ask → curriculum cube slice is now implemented: one current Home task, labelled visual Ask examples and role tasks, compact mentor/history continuation, and optional unscored cube prediction with a dynamic text alternative. See ENGAGEMENT_IMPLEMENTATION_HANDOFF.md for final behavior and evidence. Organization policy excludes Ask; its unavailable Home entry was removed. Wider response/content patterns and deep category variants remain proposals pending actual content and acceptance. Enjoyment and voluntary return remain unmeasured hypotheses.
