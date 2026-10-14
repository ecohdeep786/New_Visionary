# Apple typography reference and Visionary audit

Reviewed 13 October 2026. Measurements are rendered CSS pixels at a 16px root, at requested viewport widths of 1440, 820 and 390px. Visionary implements the scale in rem. This is a browser study of representative text roles, not Apple's internal design specification or an exhaustive inventory of every section.

## Sources and measured roles

The four requested sources were compared with three additional product pages:

| Source | Representative role / source class | Desktop size/leading | Tablet | Phone | Weight |
| --- | --- | --- | --- | --- | --- |
| [Education Initiative](https://www.apple.com/in/education-initiative/) | Editorial chapter, `typography-section-headline` | 64/68 | 56/60 | 40/44 | 600 |
| Education | Chapter introduction, `typography-label` | 24/28 | 21/25 | 21/25 | 600 |
| Education | Router heading, `router-item-headline` | 40/44 | 32/36 | 28/32 | 600 |
| Education | Router explanation and link | 21/25 | 21/25 | 19/23 | 400 |
| Education | Values title / explanation, `typography-tout` | 19/23 | 19/23 | 19/23 | 600 / 400 |
| [Watch](https://www.apple.com/watch/) | Compact chapter | 48/52 | 40/44 | 32/36 | 600 |
| Watch | Product / accordion heading | 28/32 | 24/28 | 21/25 | 600 |
| Watch | Small benefit label | 17/21 | 17/21 | 14/18 | 600 |
| [Vision Pro](https://www.apple.com/apple-vision-pro/) | Closer-look chapter | 56/60 | 48/52 | 32/40 | 600 |
| Vision Pro | Experience tab | 24/28 | 19/23 | 19/23 | 700 |
| Vision Pro | Technology feature heading | 32/36 | 24/28 | 21/25 | 700 |
| [AirPods](https://www.apple.com/airpods/) | Device name, `typography-compare-device-headline` | 24/28 | 21/25 | 21/25 | 600 |
| AirPods | Comparison chapter | 64/68 | 64/68 | 32/36 | 600 |
| AirPods | Promotional chapter | 48/52 | 40/44 | 32/36 | 600 |
| [iPhone](https://www.apple.com/iphone/) | Lineup chapter | 56/60 | 48/52 | 28/32 | 600 |
| iPhone | Ecosystem heading | 24/28 | 21/25 | 19/23 | 600 |
| [iPad Pro](https://www.apple.com/ipad-pro/) | Highlights chapter, `typography-site-headline` | 56/60 | 48/52 | 32/36 | 600 |
| iPad Pro | Elevated statement, `typography-site-headline-elevated` | 80/84 | 64/68 | 40/44 | 600 |
| iPad Pro | Regular technical chapter | 48/52 | 40/44 | 32/36 | 600 |
| [MacBook Air](https://www.apple.com/macbook-air/) | Highlights chapter | 56/60 | 48/52 | 28/32 | 600 |
| MacBook Air | Chapter label | 24/28 | 21/25 | 21/25 | 600 |
| MacBook Air | Sustainability heading | 28/32 | 24/28 | 21/25 | 600 |

Different contexts have deliberate exceptions. AirPods keeps its comparison heading at 64px on tablet; iPhone and MacBook Air use a smaller mobile highlights tier than iPad Pro. Vision Pro's closer-look phone heading has extra leading. Vision Pro also uses 700 for some features and tabs. Neither “all H2 are 64px” nor “all large type is 700” describes these pages accurately.

The snapshots included responsive duplicate nodes and animated/scaled content. Unusual fractional device-heading sizes and hidden copies were not adopted as canonical tokens. The table identifies selected stable profiles; its rows must not be generalized to every heading on their source page.

## Additional pages reviewed 14 October 2026

The two pages requested for this pass that were not in the table above:

| Source | Representative role | Desktop size/leading | Weight | Notes |
| --- | --- | --- | --- | --- |
| [Mac](https://www.apple.com/mac/) | Product page title (Mac) | 80/84 | 600 | Left-aligned hero; tracking -0.015em (-1.2px @80) |
| Mac | Content chapter (Explore the lineup. / Get to know Mac. / Help me choose. / Mac essentials.) | 48/52 | 600 | Left-aligned; tracking -0.003em (-0.144px @48) |
| Mac | Sub-chapter statement (Give us the old. Save on the new.) | 32/36 | 600 | Centered; tracking +0.004em (+0.128px @32) |
| Mac | Card/link heading (Shop cards, Get-to-know cards, compare tiles) | 17/21 | 600 | Left; tracking -0.022em (-0.374px @17) |
| [Shop Beats Accessories](https://www.apple.com/shop) | Store list page — not comparable to content chapters | — | — | Only the 12/16 footer-navigation headings are in the initial DOM; main content loads client-side. No page heading profile adopted. |

The Mac card heading tier equals the Watch "small benefit label" tier (17/21, 14/18 on phone) from the earlier table — it is not a new scale.

## 14 October 2026 verification — Student page

Confirmed with the browser at 1440 / 820 / 390 that the Student page already applies Apple's sizes for every content role (font sizes, not weights). Weights remain the approved semibold 600 headings / 400 body. No font-size edits were warranted — changing already-matching values would be gratuitous and risky.

| Student section | Role (Apple) | 1440 | 820 | 390 |
| --- | --- | --- | --- | --- |
| 02 struggle / 04 journey / 07 language / 10 journey-flow / 12 cta | Editorial chapter | 64/68 | 56/60 | 40/44 |
| 09 support values (11 trust) | Education values | 19/23 | 19/23 | 19/23 |
| 05 intelligence | Elevated statement (iPad Pro profile) | 80/84 | 64/68 | 40/44 |
| All non-hero section intro/sub | Education chapter introduction | 24/28 | 21/25 | 21/25 |
| 05 intelligence sub | Router-style lead | 21/29 | 21/25 | 21/25 |
| 09 achievement / 13 explore | Functional chapter (Watch compact tier) | 48/52 | 40/44 | 32/36 |
| Explore card name | Card name (AirPods profile) | 24/28 | 21/25 | 21/25 |
| Explore card copy | Card body | 17/23 | 17/23 | 17/23 |

The hero (01) remains the teacher-matched state and is excluded from this pass by design. The only measured stray is the fixed persona hero sub at clamp(18px,1.4vw,24px) weight 500 plus its 48px phone headline floor — outside this scope.

## Tracking, font treatment and links

| Selected profile | Desktop tracking | Tablet | Phone |
| --- | --- | --- | --- |
| Education editorial heading | -0.009em | -0.005em | 0 |
| Watch compact chapter | -0.003em | 0 | +0.004em |
| Watch feature heading | +0.007em | +0.009em | +0.011em |
| AirPods device name | +0.009em | +0.011em | +0.011em |
| Education router heading | 0 | +0.004em | +0.007em |
| iPad Pro highlights | -0.005em | -0.003em | +0.004em |
| iPad Pro elevated statement | -0.015em | -0.009em | -0.02em |
| Education introduction | +0.009em | +0.011em | +0.011em |
| Education values | +0.012em | +0.012em | +0.012em |
| Regular 17px body/link | -0.022em | -0.022em | -0.022em |

Apple uses SF Pro Display and SF Pro Text; Visionary continues using its self-hosted Google Sans Flex. Normal text is upright. Sampled editorial headings use sentence case rather than universally uppercase tags. The text hierarchy relies on size, weight, leading and spacing rather than widespread decorative styles.

Sampled light-content text is #1d1d1f and text links are #0066cc. Links have no default underline and acquire one on hover. Embedded links inherit the surrounding text role: Education router links are larger than values links. Filled actions use their own contrast colors and compact leading. Dark content needs the corresponding light ink and blue link tokens.

Equal CSS values do not imply equal visual width or optical weight. The existing local files are static instances at optical size 18; enabling an optical-sizing property cannot turn them into variable optical fonts. The genuine 600 face matches the existing Google Sans Flex version and default axes; provenance is in `public/fonts/README.md`. It is selected only for public content through the same-typeface `Google Sans Flex Content` registration. The fixed hero keeps its original registration.

## Text positioning and line length

Education's editorial sections share a centered 980px desktop text frame and a 692px tablet frame. Chapter headings, introductions and values align to that frame's left edge. At phone size, the frame has 24px gutters. Its chapter introduction starts 19.2px below the desktop heading and 16.8px below it at smaller widths; values explanations start 15.2px below their 19px title.

These are contextual frames, not universal margins. A left-aligned editorial chapter, a centered promotion, a full-width gallery and a two-column router have different text positions. Education's sampled desktop chapter heading is capped at 830px while its introduction spans the 980px frame; router copy sits in narrower columns. Apple also uses deliberate line breaks and nonbreaking spaces. Applying `text-wrap: balance` everywhere does not reproduce that composition.

Visionary's `public-editorial-frame` reproduces the Education spine for shared values. Other containers, existing heading breaks, gallery widths and text alignment remain owned by their layouts. The shared adapter sets readable role limits, but a later visual review must check the resulting line count with Google Sans Flex. Preserve meaningful author-supplied breaks and judge actual rendered lines rather than character count alone.

## Icon findings and implementation limits

Education's sampled playback circle is 36px with a 2-unit outline. Its story plus affordance uses a 20px glyph in a 36px circle. Watch accordion chevrons are compact shapes with surrounding whitespace. Link glyphs scale with the text and use about 0.3em separation.

`public-icons.css` centralizes those control dimensions and contextual link scaling. Existing Lucide paths remain Visionary's pictograms. The generic 1.75-unit stroke and 14/20/24/40px pictogram roles are our consistent adaptation; they are not a claim that all Apple symbols have identical paths, strokes or boxes. Optical glyph bounds matter as well as the SVG width. Logos, charts, illustrations and the complete fixed hero are excluded. Accessible labels, focus states and disabled behavior remain necessary when matching the visual controls.

## Current frontend assessment and corrections

The existing foundation was close for Education editorial chapters, Watch compact chapters, regular body/link text and Education values. It was not a complete or exact Apple match. The production audit identified these concrete shared corrections:

1. The legacy large content statement, including Student's intelligence chapter, was forced to weight 700. It now uses the measured semibold elevated-statement profile, with responsive tracking. Explicit `statement` and `emphasis` roles distinguish 600 headlines from intentionally bold 700 display copy.
2. Product card names remained 24/28 on tablets. They now use AirPods' 24/28 → 21/25 → 21/25 profile through the shared tokens; no page-specific font override was added.
3. The measured 56/60 → 48/52 → 32/36 highlights profile was missing from the role API. It is now available as `data-type="product-section"` for the later layout pass. It does not replace Education's 64px chapter scale automatically.

Student's current role mapping is editorial chapters at 64/56/40, functional achievement/explore chapters at 48/40/32, feature/accordion titles at 28/24/21, the large intelligence statement at 80/64/40 with weight 600, and values at 19/23 with distinct 600/400 weights. Explore card names use the corrected 24/21/21 scale. Content, local typeface, fixed hero and existing component structure are preserved.

The public adapter reaches the existing landing routes through semantic headings and legacy type utilities. Explicit `data-type` roles win over that compatibility mapping. A semantic tag alone cannot infer editorial intent perfectly: the later page reviews should assign the appropriate existing role when necessary, rather than invent local pixel values. Ordinary explanation copy, semibold editorial introductions, small labels, photo stories and UI controls must remain distinguishable.

Remaining design review concerns are section composition, text line count, heading width, alignment, media framing and glyph optical alignment. They cannot be certified as “perfect Apple quality” from a global stylesheet alone. The shared roles provide a measured, consistent foundation for that review without changing the hero or rewriting approved content.

## Validation of this correction

- All 24 public landing routes were inspected at desktop and phone widths. Sampled non-hero headings and paragraphs used Google Sans Flex, and no document-level horizontal overflow was found in those 48 checks. This verifies coverage and fit, not every section's visual composition.
- Student's statement rendered at 80/84, 64/68 and 40/44 with weight 600 and the selected responsive tracking. Explore names rendered at 24/28, 21/25 and 21/25. The narrowest additional viewport requested was 320px (the browser reported 321px); no horizontal overflow was found.
- Student hero font family, size, leading, tracking and weight were equal before and after at the three reference widths.
- Lint, type checking, production build and all nine existing workspace tests passed. The existing React `fetchPriority` warning in the unchanged hero component remains outside this correction.
