# D-047 capture index

2026-10-08. Fictional accounts and browser-local saved data. PNGs use the actual preview viewport; screenshots are not full-page captures.

| File | Fixture / surface | Width | Build |
| --- | --- | --- | --- |
| student-home-desktop.png | School / personal learner Home | 1440 | Development |
| student-home-phone.png | School / personal learner Home | 321 | Development |
| learning-desktop.png | School / saved authored cube / Understand / interactive model | 1440 | Development |
| learning-phone.png | Same saved cube lesson | 390 | Development |
| teacher-classwork-desktop.png | Dev / demo school Work teacher / existing assignment | 1440 | Development |
| teacher-people-desktop.png | Same class / one connected learner | 1440 | Development |
| teacher-people-phone.png | Same roster, wrapped classroom tabs | 390 | Development |
| teacher-review-desktop.png | Existing Aarav submission, final labelled multiline feedback controls | 1440 | Development |

Early Home and lesson captures precede the final review-dialog refinement; their relevant source/layout is unchanged. An invalid phone review capture containing a transient public-page compile overlay was removed. The public compile conflict is documented in QA.md. No review was returned and no invitation was sent.

Several long route batches timed out before retaining their complete arrays. This folder does not claim a full reproducible route matrix or exhaustive error/permission coverage. Focused retained layout observations include the 390px lesson (document390/main385), roster (document390/main385), and review dialog (document390/dialog357). The review geometry observation coincided with a compiler overlay and alone does not establish a valid phone visual acceptance result.

Compiled evidence: compiled-learner-home.png (School personal learner, normal862px, final successful build), compiled-learner-home-phone.png (same Home390px), compiled-ask.png and compiled-settings.png (same workspace, normal862px). The phone/Ask/Settings captures were taken on the preceding successful compiled snapshot; the subsequent change repaired the public College page import and did not alter their internal source.

focused-compiled-layout.json retains five observations with no horizontal overflow. The requested tablet768px was reported as769px. final-compiled-errors.json records zero captured errors after the final build reload; earlier development compile errors are not erased or counted as a clean whole-session log. The final Home screenshot was visually reviewed, School learner restored, viewport reset and preview tab kept open.
