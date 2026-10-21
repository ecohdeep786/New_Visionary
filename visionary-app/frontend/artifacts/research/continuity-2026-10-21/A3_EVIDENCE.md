# A3 · Hex sweep — evidence record (FAP-43)

**Task:** FAP-43 (Epic A / FAP-36) · **Branch:** `gl-kan-201-a3-hex` from verified `origin/dev` `30109a0f`.
**Accepted by:** standing founder authorization.

## Scope executed — mechanical legacy→law remap on the public surface

**1,144 value replacements across 58 files** (near 1:1 line substitution character: 57 files, +1126/−1124 incl. manifest), via `a3-hex-after/sweep.mjs` (script of record, reproducible with `--apply`):

| Legacy (Google) | Law (measured Apple) | Typical context |
| --- | --- | --- |
| `#4285F4` / `#1a73e8` / `#0b57d0` / `#174ea6` | `#0066cc` | links, icon chips, focus colors, info text |
| `#3367d6` | `#0071e3` | hovers of former blue fills |
| `#5f6368` | `#6e6e73` (graphite) | secondary text |
| `#9AA0A6` | `#86868b` (muted) | tertiary text, placeholders |
| `#dadce0` | `#d2d2d7` (line) | borders, dividers |
| `#f8f9fa` / `#f1f3f4` | `#f5f5f7` (ground) | band/wash fills, tokens track |
| `#202124` / `#121317` / `#3c4043` | `#1d1d1f` (ink) | headline/copy/fill inks |
| `#2c2d31` | `#272729` | legacy ink hovers |
| `#EA4335` | `#e30000` | error text |
| `#34A853` | `#34c759` | success states |
| `#FBBC04` | `#ff9500` | highlight/warm accent |
| `#e8f0fe` / `#e8f0fd` / `#D2E3FC` | `rgba(0,102,204,0.10)` | chip washes, `::selection`, active chips |
| `#e6f4ea` | `rgba(52,199,89,0.12)` | green washes |
| `rgba(66,133,244,…)` | `rgba(0,102,204,…)` | alpha washes/borders |
| `#8ab4f8` | `#2997ff` | light blue (dark-reserve family) |

Plus:
- **Accent-gradient law ramp:** the sanctioned headline gradient (`public-system.css` `.accent-gradient`) was built on the Google ramp; a blanket swap would have degenerated it. Hand-crafted to `linear-gradient(92deg, #0066cc 0%, #2997ff 100%)` (deep-to-bright law blue).
- **`tokens.js` deprecated keys retagged** (`deepBlue`, `chipBg`, `surfaceBlue`) so remaining consumers (`ui.jsx` chip primitive, persona pages, `Landing.jsx` BRAND map) render law colors without breakage; keys migrate at A5 activation, then drop.
- **Sweep artifact fix:** tint-wash map produced invalid `#rgba(...)` on `#`-prefixed hexes (20 artifacts in 12 files caught by the self-review pass; `fix-artifacts.mjs` stripped them).
- **Brand-glyph rule:** Google four-color G logo (`GoogleIcon.jsx`, glyph fills in `SocialAuthButtons.jsx`) unchanged — brand asset, sanctioned. Its UI chrome (button border `#dadce0`, hover wash, icon greys) **was** lawed by hand.

## Self-review loop (fixed by iteration, exactly as the protocol demands)

1. Dry run (1039 hits/53 files) → 174ea6 + D2E3FC + 1a73e8 discovered unmapped → map extended, applied (1,144 total).
2. `AuthUI.jsx` was missing from the public file list → its field/label/divider primitives (25 hits) were still Google → added to list, re-applied.
3. `#rgba(` artifact pass (20 in 12 files).
4. Interactive_COOKIE-name none: residue checker (`check-residue.mjs`) is the source-truth gate.

## Verification (all green)

| Check | Result |
| --- | --- |
| `scope:audit:write` | ✅ regenerated |
| lint · typecheck (both configs) · build (25.73s) | ✅ |
| `npm test` | ✅ **550/550** |
| Source residue check | ✅ **PUBLIC SET CLEAN — 0 legacy hexes** (documented exceptions: tokens.js alias source; 4 G-brand glyph colors) |
| Rendered DOM scan (21 banned Google RGB families incl. blues/greys/ink/error/success tints) | ✅ **27/27 public routes CLEAN** (`a3-scan-receipt.json`) |
| Captures | ✅ 18/18 — biggest movers `/student /teacher /organization /updates /terms /signin` × 1440/1024/390 in `a3-hex-after/` |

## Boundary receipts

- **Out of scope (product interior, separately maintained):** `components/dashboard/**`, `pages/dashboard/**`, `styles/workspace*.css`, `billing.css` (interior), `guide-premium.css`, `components/onboarding/**` — their legacy values remain untouched by A3 by design (workspace dialect has its own KAN-146 premium pass).
- **A4 (FAP-44):** bridge inventory (`apple-typography.css` `!important` sets) — only the interactive exemption landed (A2); tier separation audit belongs here next.
- **A5 (FAP-45):** `ui.jsx` law keys ↔ tokens cleanup (drop `deepBlue/chipBg/surfaceBlue` aliases when activation lands).
