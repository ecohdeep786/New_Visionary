# Home / Guide — coordinator browser evidence

Recorded 2026-09-22 against the running local Vite preview, with the existing fictional Aarav learner account. These are scoped browser observations, not full product acceptance. No real account, external message, payment or production model was used.

## Final corrective build

- An unsupported question (“QA unsupported topic: how do stars form?”) displays the explicit curated-demo fallback and only cube/fractions activities for this minor account. The professional data scenario is absent.
- Two conversations have deliberately different QA drafts. After the final single-effect implementation, Home → Continue activity restores the fractions conversation's own draft. Browser reload retains that draft and the saved Bengali activity language. History selection restores the unrelated conversation's distinct draft. Neither draft is substituted for the other.
- A fractions activity changed to Hindi, then Bengali, preserves its activity while Ask opens the corresponding authored doubt prompt. Sending produces the prepared explanation rather than claiming arbitrary understanding. The retained history has English notice blocks with `lang=en`, Hindi explanation/action blocks with `lang=hi`, and Bengali explanation/action blocks with `lang=bn`. Legacy unknown-language and arbitrary user text remain unguessed. This checks DOM annotations, not actual screen-reader pronunciation.
- Home's saved Bengali activity heading has `lang=bn` while the surrounding interface remains English. No assumption that the entire UI has been translated.
- Browser console capture after the final resume/reload checks returned no error or warning entries.

## Responsive geometry

Mixed Hindi/Bengali Guide history was measured at all seven requested viewports. These measurements check horizontal overflow, not every visual state or device-performance characteristic.

| Viewport | Document width | Main client / scroll width |
|---|---:|---:|
| 360 × 800 | 360 | 354 / 354 |
| 390 × 844 | 390 | 384 / 384 |
| 768 × 1024 | 768 | 682 / 682 |
| 1024 × 768 | 1024 | 938 / 938 |
| 1280 × 800 | 1280 | 1194 / 1194 |
| 1440 × 900 | 1440 | 1354 / 1354 |
| 1920 × 1080 | 1920 | 1840 / 1840 |

The temporary override was reset. `baseline/wave-0.5/corrected-home-bn-default.png` is the normal 1280px viewport capture and shows the inherited white workspace, blue emphasis and restrained rail. The 360px raw screenshot (`corrected-guide-hi-360.png`) has a capture-frame scale discrepancy despite DOM width360, visualViewport scale1 and no CSS zoom; it must not be used as pixel-parity acceptance.

## Earlier keyboard and field checks, 2026-09-21

- Compact tabs: ArrowLeft from Activity selects/focuses Conversation with tabIndex0; End returns selection/focus to Activity.
- Enter opens the named history dialog. Escape returns focus to Conversation history.
- Opening deletion confirmation and choosing Keep conversation returns focus to the contextual Delete row. No conversation was deleted in browser testing.
- Pasted-material textarea has the concise explicit label and separately associated helper description. Long Bengali material and a Bengali draft fit 360px fields without horizontal scrolling.

These pre-correction focus checks remain attributed to their date; retained source behavior is reviewed separately by06. Some browser action observations required a subsequent state read because the automation deadline elapsed; completed state, not the attempted action, is the evidence above.

## Not verified

Actual screen-reader walkthrough, 200% browser zoom, reduced-motion preference emulation, public same-data pixel comparison, the complete role/connection/state matrix, and rendered storage-quota failure remain unverified. Failure/retry service contracts are covered by Node tests; that alone does not certify the rendered failure state. The shared smooth-scroll issue M-01 and StageProfile/Part W implementation remain open. No twelve-gate or launch-ready verdict follows from this evidence.
