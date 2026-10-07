# Internal frontend design handoff — 2026-10-07

The finishing design pass is implemented within the inherited Visionary interface. It uses the user's Apple/Google reference as a quality direction: clear hierarchy, comfortable spacing, predictable controls and a simple next action. It does not establish parity with either company's production products. D-045 records the implementation; CURRENT_PRODUCT_STATUS.md and FRONTEND_ACCEPTANCE_MATRIX.md retain the overall acceptance boundary.

## What changed

| Area | Result |
| --- | --- |
| All five role workspaces | Shared reading width, responsive padding, readable headings, consistent cards and quieter decorative artwork. Phone layouts reserve space for the task instead of placing art behind text. |
| Phone navigation | Compact labels stay on one line. Final five-role checks at320/390px retain readable, non-overlapping parent connection labels and avoid page overflow. |
| Home | A clear next action, optional reasoning, and collapsed learner-memory details. Fixed Home and daily-plan controls use the interface language independently of teaching language. Authored titles and project text remain verbatim. |
| Lessons | A quiet outline link, distinct source/title/language hierarchy, semantic ordered Understand → Check → Practice → Build stages, and readable representation content. Existing authored 3D and text alternatives remain connected to the same activity. |
| Navigation | Reading positions return within the mounted shell, scoped by account, workspace, pathname and query. New destinations start at the top; lazy content can finish restoring a saved position. User scrolling stops delayed restoration. Positions are not persisted across reloads. |
| Build → Ask | Project editors now have a visible page heading. Ask opens the actual Ask destination with the learning activity when available. Saving must succeed before leaving through this link. A suggested question fills an empty composer without replacing a saved question draft or sending automatically. |
| Guide presence | Reduced-motion canvas frames redraw after viewport changes; the compact control no longer becomes blank. Drawing also initializes when workspace data becomes available. |

## Review evidence

The [capture index](baseline/design-2026-10-07/README.md) records fixtures and before/after limitations. Source-mode checks cover 20 five-role Home/viewport combinations and 118 role-route/viewport combinations. The final compiled preview also has a retained 26-check professional route matrix and settled five-role Home captures. These are layout checks, not full acceptance of every task or permission state.

An actual authored cube journey covered model keyboard controls, text mode, disconnected teaching with authored fallback, a wrong answer/retry, correct check, practice, project creation, three criterion responses, save/reload, recorded application and contextual Ask/return. Returning from Ask restored the exact reading position and retained side length/rotation/text mode. Hindi and Bengali Home were checked with English teaching selected; automated tests cover five roles in both interface languages and preserve source titles and records.

Final validation: 462/462 full tests, 20/20 focused Home/Guide/artifact/voice tests, lint, both type checks, production build and diff whitespace checks pass. No public source file was edited by this pass.

## Next product review

The next content rehearsal is the founder's Chapter 1: confirm subject and chapter metadata, concepts and prerequisites, source references, a useful representation for each concept, comprehension/remediation, practice and a meaningful project. A chapter should use 3D where it explains the idea; other concepts need diagrams, tables or text. The local frontend does not yet perform general book-to-3D generation.

Native English/Hindi/Bengali review, physical screen-reader/zoom/microphone/audio/clipboard/device journeys, broader source and permission fixtures, and final owner visual acceptance remain in FRONTEND_REVIEW_WORKSHEET.md and FRONTEND_ACCEPTANCE_MATRIX.md. This handoff completes the described implementation pass; it does not close those human or wider acceptance gates or start backend work.

## Subsequent local-reference pass

D-046 applies the six supplied Classroom references and supersedes this pass's decorative Home/intro treatment. The current result and final evidence are in [REFERENCE_DESIGN_HANDOFF.md](REFERENCE_DESIGN_HANDOFF.md). Existing learning/context/language/service fixes above remain in place.
