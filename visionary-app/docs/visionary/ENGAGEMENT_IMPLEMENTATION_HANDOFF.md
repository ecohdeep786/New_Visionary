# Home, Ask and cube experience handoff

2026-10-08 · D-048. Implements the first slice proposed in ENGAGEMENT_DESIGN_PLAN.md on top of D-047's shared visual system.

## Three collaborating roles

The founder explicitly requested three designers/engineers. Product design implemented Home's single current task. UX/UI engineering implemented visual Ask choices and a compact mentor continuation. Human-centered design implemented the optional cube prediction, keyboard return and current-dimension text alternative. The integrating agent supplied shared responsive styles, reviewed the interactions and corrected an unavailable organization Home link.

## Result

- Home shows the current pending plan task once. Exact task identifiers identify the current row; the known saved-unit alias also requires its continuation path. Distinct and completed rows remain visible. Service records are unchanged. The current task's deferral says **Remove from today's plan**: a saved learning activity may remain the fallback continuation after deferral.
- Ask keeps the question composer first, followed by labelled visual choices. Learners see the existing eligible cube/fraction/data examples. Professionals see a labelled data demo and real Career/Build links. Teacher and parent entry choices use their actual task links and Visionary's own illustrations. Compact mentor and history continuations retain source labels and handlers.
- The curriculum cube representation groups Observe and Change one thing, then offers an optional prediction disclosure. A learner can choose a volume or reveal an explanation directly. Try a side length changes the existing representation and returns focus to its native slider or text-mode control. Text mode shows the current saved dimensions and formula beside the unchanged authored explanation. Prediction choices are temporary component state; no scores, mastery or progress evidence are created.
- Shared styles provide responsive visual cards, readable controls, clear keyboard focus and reduced-motion support. Static previews are decorative; accessible names come from meaningful text.
- Organization permissions currently exclude Ask. Home no longer offers an unavailable Ask link, including its error-state continuation. No permission was expanded. Organization task-card code in Guide remains unreachable under the current policy and is not counted as an accepted organization Ask flow.

## Validation and evidence

The full service regression suite passes **467/467**, including five new Home presentation tests. Focused Home/Guide/learning/source tests pass **103/103**. Final lint, both TypeScript configurations, production build and whitespace validation are recorded in QA.md. The full suite preceded the last text-summary, responsive CSS and organization-link presentation refinements; final lint/types/build and browser review cover those refinements.

Browser checks use fictional local School administrator workspaces. Actual controls verified Home's single continuation, role-adapted Ask entry, unsent draft return, visual cube demo launch, optional prediction with and without a choice, model/text switching, native keyboard slider adjustment, saved side changes and focus return. The temporary draft was cleared, original cube side 3/rotation 25/model mode restored, and the newly tested authored demo conversation retained in history. No scored answer, review, assignment or access action was submitted.

Screenshots and retained layout observations are indexed in [the evidence directory](baseline/engagement-2026-10-08/README.md). Development captures and compiled captures are distinguished. Measured browser viewports are emulation, not physical-device acceptance. Native Hindi/Bengali linguistic review, assistive-technology/device testing and user enjoyment/retention measurements remain open.

## Next content pass

The founder's Chapter 1 is the next content input. Map its actual concepts to suitable diagrams, worked examples, simulations or 3D models and rehearse chapter → learning → contextual Ask → practice → Build. The present change completes the bounded experience slice; it does not complete every deep role/subcategory state, prove Apple/Google production parity, or commence backend integration.

Concurrent public landing-page edits and earlier internal work were preserved. No public source was edited by this slice. No release or commit was requested.
