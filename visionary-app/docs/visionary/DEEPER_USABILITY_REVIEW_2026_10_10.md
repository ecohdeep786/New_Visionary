# Deeper workspace usability review — D-052

Delivered 2026-10-10. This continues D-051 in the internal frontend. Parent reports, learner progress, professional career and teacher/organization summaries now share a clearer overview-to-detail hierarchy. Backend integration remains deferred.

## Implemented

- Parent reports show three real summary values: completed activities, explicitly shared projects and explicitly shared goals. Unavailable shared sources are labelled Unavailable, rather than zero. A visible note explains that shared copies may predate the selected period.
- Project summaries and successful classwork digests use native expandable details. Existing privacy explanations and records remain inside the detail; failed classwork reads remain visible with Retry. Failed project reads open their detail immediately. Progress and retention, goals and transitions remain visible sections.
- Child and period selections stay in the report URL. Detail panels reset when that context changes. The contextual Ask action is preserved.
- Learner progress puts the full evidence policy inside Evidence sources and limits. A short visible note still explains that recorded activity is not an ability score. Period/search controls and evidence calculations are unchanged.
- Career shows the personal/company boundary as a labelled expandable detail, leaving the direction form easier to reach. The full boundary explanation and Review connections remain available.
- Teacher and organization summary values use one divided metric strip. Class links have 44px action targets. Shared disclosures have generous targets, visible keyboard focus, responsive wrapping and reduced-motion support.
- Added parent labels in English, Hindi and Bengali. Existing Visionary artwork, colors and source/permission handlers are retained. No public landing files were changed.

## Design rationale and references

Applied deliberate hierarchy and progressive disclosure from [Apple's layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout), shared structures from [Material layout examples](https://m3.material.io/foundations/layout/canonical-examples/overview), and consistent text roles from [Material typography guidance](https://m3.material.io/styles/typography/applying-type). These are implementation principles, not evidence of equivalence to Apple or Google products.

## Verification

Final `npm run build`, `npm run lint`, `npm run typecheck` and `git diff --check` pass. Both type configurations are included in typecheck. 52 focused regressions pass with no failures, skips or cancellations:

```text
node --test tests/parent-*.test.mjs tests/learning-progress.test.mjs tests/professional-*.test.mjs tests/organization-permissions.test.mjs tests/classroom-scope.test.mjs
```

The 483-test full-suite result belongs to D-051; it was not rerun for this presentation-only continuation. Logs are `scripts-tmp/design-continuation-20261010-{build,lint,typecheck,tests}.txt`.

Browser review retained eleven rendered development observations across five roles and five compiled observations for learner progress, parent reports and career. All measured document widths match viewport widths. Requested 320px measured 321px in this browser; the other review widths were 390px and 1280px. Enter/Space toggles, visible focus, Maya's 30-day selection, retained explanations and empty evidence were checked. Compiled assets use `index-DeuXM6i3.js`; the final captured browser error log is empty. See [the evidence index](baseline/design-continuation-2026-10-10/README.md).

The fictional Anika scenario was used on isolated port 5176. This review exercised no assessment answers, draft saves, submissions, sharing, permission changes, messages or payments. Original port 5173 records and server were preserved; the original learner Home and default viewport were restored. Temporary review servers were stopped.

## Acceptance boundary

These checks cover the described presentation changes and real empty-state/context interactions. Populated report versions, failed-source rendering, every category/state permutation, native-language user review, physical devices, screen readers, actual zoom and representative child/adult usability need further acceptance. Service regressions and source inspection do not substitute for those rendered cases. No whole-frontend production, two-year-old independent-usability or AGI certification is implied.
