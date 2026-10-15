# Typography and stylesheet ownership

Font families are defined once in [tokens.css](tokens.css):

| Surface | Token | Preferred family | Styles |
| --- | --- | --- | --- |
| Public frontend / landing pages | `--font-public` | Google Sans Flex | `apple-typography.css`, `public-system.css`, `public-bridge.css`, `premium.css`, `rhythm.css` |
| Internal workspace and product entry (sign-in, registration, onboarding) | `--font-product` | Google Sans | `workspace-typography.css`; workspace layout/theme rules remain in `components/dashboard/workspace*.css` |
| Shared controls and wordmark | `--font-brand` | Inherits the active surface | Compatibility alias; defaults to public, switches within product surfaces |

`index.css` loads both font resources and the shared/public styles. `DashboardLayout` imports the internal typography and outcome styles through `workspace-design.css`. Internal styling is scoped to `.visionary-workspace` and its portals; public display sizes and rhythm are not the product type scale.

Use `var(--font-public)` in public-only CSS. The public React `fontStack` export points to that token. Use `var(--font-product)` in internal-only CSS. Shared components should inherit their font or use the surface-aware `--font-brand` alias; Tailwind `font-sans`, `font-heading`, and `font-paragraph` follow that alias. Avoid copying literal font stacks into components. Change one surface's token without editing the other.

Product entry, loading and error containers outside the normal workspace use `data-font-surface="product"`. The body switches font inheritance only while a product marker/workspace is mounted, covering portalled dialogs, menus, tooltips and toasts. Leaving the product restores public inheritance without a JavaScript body-style mutation. Public helpers remain explicitly tied to `--font-public`.

The shared route fallback/error boundary uses `src/lib/fontSurface.js` for existing product-entry routes and the `/dashboard` path boundary. New product routes should declare the product marker in their layout and update that fallback mapping if necessary.

Maintain existing rem text scaling, script-appropriate leading, theme/contrast and focus behavior. Do not apply marketing display classes to product controls. Font resources use self-hosted files in `public/fonts` with readable fallback stacks when unavailable.

Run `npm run build`, `npm run lint`, `npm run typecheck`, and `scripts/font-surface-review.mjs` against a running dev/preview server when changing this contract. The browser review checks independent token changes, overlays, product entry, recovery markers and public ↔ product navigation.


## Shared public typography and icons

References: [Apple Education](https://www.apple.com/in/education-initiative/), [Watch](https://www.apple.com/watch/), [Vision Pro](https://www.apple.com/apple-vision-pro/) and [AirPods](https://www.apple.com/airpods/). Computed styles were inspected at desktop, tablet and phone sizes in October 2026. Apple uses separate editorial, compact chapter, feature and metadata tiers.

The expanded seven-page study, source contexts, responsive exceptions and Student audit are recorded in [apple-reference-notes.md](apple-reference-notes.md). These are selected role profiles measured on the references, not a claim that every Apple page uses an identical scale.

| Content role (`data-type`) | Desktop >1068px | Tablet 735-1068px | Phone <=734px | Weight |
| --- | --- | --- | --- | --- |
| `display` - Education editorial chapter | 64/68 | 56/60 | 40/44 | 600 |
| `product-section` - iPad Pro highlights chapter | 56/60 | 48/52 | 32/36 | 600 |
| `section` - Watch compact chapter | 48/52 | 40/44 | 32/36 | 600 |
| `feature` - feature/accordion title | 28/32 | 24/28 | 21/25 | 600 |
| `card-name` - AirPods product/card name | 24/28 | 21/25 | 21/25 | 600 |
| `editorial-card` - large editorial card | 40/44 | 32/36 | 28/32 | 600 |
| `story` - photo story/dialog title | 48/52 | 40/44 | 28/32 | 600 |
| `emphasis` - major content statement | 80/84 | 64/68 | 40/44 | 700 |
| `statement` - iPad Pro elevated headline | 80/84 | 64/68 | 40/44 | 600 |
| `editorial-lead` - editorial introduction | 24/28 | 21/25 | 21/25 | 600 |
| `lead` - explanatory introduction | 21/29 | 21/29 | 21/29 | 600 |
| `body` - explanation/body link | 17/25 | 17/25 | 17/25 | 400 |
| `metadata` - compact label | 14/18 | 14/18 | 14/18 | 400 |
| `caption` - photo caption/section tag | 12/16 | 12/16 | 12/16 | 600 |
| `fine` - supporting fine print | 13/20 | 13/20 | 13/20 | 400 |
| `value-title` / `value-body` - Education values | 19/23 | 19/23 | 19/23 | 600 / 400 |
| `editorial-body` / `editorial-link` - Education router | 21/25 | 21/25 | 19/23 | 400 |

Sizes are font-size/line-height in CSS pixels at a 16px root. The implementation uses rem so browser text preferences can scale them.

- `tokens.css` owns local font resources and surface-specific family selection.
- `rhythm.css` owns content sizes, leading, tracking, weight roles, gutters and heading/support gaps. Original root tokens remain independent for fixed heroes and product surfaces.
- `apple-typography.css` applies roles to public content. Existing pages are adapted through semantic headings and legacy type utilities. Shared primitives declare their roles. Future layout refinements can use `data-type="display"`, `data-type="body"`, etc. Explicit roles take precedence over the compatibility adapter.
- `public-icons.css` owns pictogram sizes/strokes, inline spacing, gallery circles, accordion glyphs and story affordances; `index.css` imports it globally.
- `components/landing/system/tokens.js` exports CSS variable references for content. The fixed hero retains its independent value.

Editorial tracking is -0.009em / -0.005em / 0. Compact chapter tracking is -0.003em / 0 / +0.004em. Feature tracking is +0.007em / +0.009em / +0.011em. Body uses -0.022em. Education editorial heading-to-introduction space is 0.8 times the introduction size: 19.2px on desktop and 16.8px on tablet/phone. The shared values component uses `public-editorial-frame`: a 980px desktop / 692px tablet text spine with 24px phone gutters, matching Education. Other page layout widths remain page-owned for the later layout pass.

Product-section tracking is -0.005em / -0.003em / +0.004em. The semibold statement profile uses -0.015em / -0.009em / -0.02em, measured on iPad Pro elevated headlines. The legacy 80px content statement now selects this 600 role automatically. `emphasis` retains a separate 700 role for deliberately bold display copy; it is not the default for large headings. Product-section is available for the later layout pass without changing every editorial chapter to 56px.

### Icon roles

| Role | Shared rule |
| --- | --- |
| Inline link glyph | 1em box, 0.3em text-to-glyph gap, rounded 1.75-unit stroke |
| Compact / supporting / feature / large pictogram | 14 / 20 / 24 / 40px |
| Gallery previous/next/play/pause | 36px circle, 24px glyph box, 2-unit stroke |
| Story-card plus | 20px glyph in a 36px circle, 3-unit stroke |
| Accordion chevron | 24px box containing a compact path |
| Dialog close | 20px glyph, 36px control |

Lucide pictograms automatically consume shared roles. Custom UI SVGs use `public-icon` and a role class (`public-icon-chevron`, `public-icon-plus`, etc.). New circular controls use `public-icon-control`; existing gallery controls are recognized by their accessible action names. Photos, logos, charts and illustration SVGs are excluded from generic sizing. Preserve labels, disabled states and focus rings.

The boundary excludes `01-hero`, complete sections containing H1, and nested hero content. Workspace and authentication/product surfaces retain their separate typography and icons. This is the shared type/icon foundation; identical Apple layouts, line breaks and pictogram shapes require separate page-design work.

### Genuine local semibold

`public/fonts/GoogleSansFlex-Semibold.ttf` is a genuine 600 static instance of the official Google Sans Flex 4.005 source, matching the version and default design axes of the existing local faces. Its source, license, checksum and generation details are in `public/fonts/README.md`.

The CSS alias `Google Sans Flex Content` registers the existing local 400/500/700 files plus the new 600 face. It is the same Google Sans Flex typeface, rather than an additional font family design. Only public content sections select the alias through `--font-public-content`; fixed heroes, navigation and product surfaces keep their original font registrations. This avoids changing a hero that previously resolved a 600 request to its original Bold face.

Explicit `data-type` declarations use the `public-type-roles` cascade layer with important properties so compatibility selectors cannot silently replace their size. This is necessary while legacy utility and inline declarations coexist with the shared system.

Education text contrast uses #1d1d1f for headings, editorial introductions and value explanations. Text-only links use #0066cc on light content, with no default underline and an underline on hover; filled actions retain their contrast colors. Dark content resolves the same roles from its dark color tokens. The values tier uses +0.012em tracking and 0.8em title-to-explanation spacing. The family difference still affects glyph shapes and line breaks; equal CSS metrics do not make the entire page an identical Apple layout.
