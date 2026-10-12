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

Maintain existing rem text scaling, script-appropriate leading, theme/contrast and focus behavior. Do not apply marketing display classes to product controls. Font resources use the existing Google Fonts delivery with readable fallback stacks when unavailable.

Run `npm run build`, `npm run lint`, `npm run typecheck`, and `scripts/font-surface-review.mjs` against a running dev/preview server when changing this contract. The browser review checks independent token changes, overlays, product entry, recovery markers and public ↔ product navigation.
