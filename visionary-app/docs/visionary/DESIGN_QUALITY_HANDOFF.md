# Shared typography and meaningful outcomes

2026-10-12, D-053. Continue the inherited internal product, with the user's shared typography files as the brand source and actual recorded work as the basis for achievement feedback.

## Shared type integration

Font-family clarification (D-054): public frontend pages use Google Sans Flex; the internal product and entry screens use Google Sans. The earlier single-family assumption is superseded. See [stylesheet ownership](../../src/styles/README.md) for the independent `--font-public` / `--font-product` definitions and surface-aware compatibility alias. The D-053 evidence below remains the historical verification of the type-scale/outcome changes.

`src/styles/tokens.css` defines `--font-brand`. The authenticated shell and its portals now consume that variable, with internal integration in `src/styles/workspace-typography.css`, imported by `workspace-design.css`. The public Apple-style display helpers remain separate from the compact product type scale.

Internal body/control/label/metadata use rem values. Legacy pixel utilities that conflict with shared important declarations are normalized inside the workspace. Public display-spacing rules no longer expand internal `mt-4`/`mt-6` pairs. Inherited Indic content and portalled menus/dialogs get comfortable leading and zero tracking, while authored English content keeps its own language. No global/public typography file was changed.

## Outcome behavior

Progress leads with **Your work in this period**, before filters and detailed records. The summary derives from the existing owner-scoped report: objectives with recorded work, measured answers/correct counts, and application records when present. It never substitutes a saved draft/application for measured accuracy, invents a mastery score, or displays an achievement in an empty account. Missing sources are disclosed beside available totals. Search filters the detailed list; it does not rewrite the selected period's summary.

Learning feedback distinguishes **Understanding check recorded**, **Practice step recorded**, and a saved application. Existing service flags determine the recorded-step indicators. A passed practice makes **Apply this in Build** the primary next action; retry and explanation remain reachable. A completed application is described as saved work, with an explicit distinction from a mastery assessment. Missing project links lead back to the outline. Authored project briefs retain their source language; UI feedback has en/hi/bn copy.

The visual treatment is restrained: readable headings, one next action, a quiet evidence panel, and labelled checkmarks. There is no new sound, confetti, reward pressure, inferred streak or fabricated improvement. The intended benefit is easier recognition of what the user did and what they can do next; increased motivation/retention has not been measured.

## Validation and boundaries

Production build, full lint, both type checks and whitespace checks pass. The learning agent verified 50 source/category/pipeline regressions; the coordinator verified 27 progress/Home/navigation regressions. The isolated compiled browser checks empty/populated/partial history, actual authored sample check/practice → project, filtered totals, eight light/dark viewport samples (320/390/768/1440), 200% root text, legacy type scaling and Hindi portal leading. Changing the shared font variable in the isolated browser updates product headings and dialogs. Page errors are empty.

[Evidence and screenshots](baseline/design-quality-2026-10-12/README.md) identify the synthetic account and fixture, captured viewport limits and commands. User-owned accounts and records were not modified. The existing physical-device, actual zoom, assistive-technology, native-language, wider populated role/state and owner review remain acceptance work before backend sign-off; this pass adds no backend or native capability.
