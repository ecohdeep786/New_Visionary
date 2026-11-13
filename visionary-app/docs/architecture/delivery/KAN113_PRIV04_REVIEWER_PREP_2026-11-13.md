# KAN-113 / PRIV-04 — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-113-consent-policies` @ 0f58f7b1 (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The durable-notification law reviewed clean; every ticket requirement is enforced and honestly tested (7/7):

1. **Durable in-app state, server-owned per owner** — notifications are rows, read transitions persist, `markRead` is idempotent and owner-only (a stranger gets `not_owner`; unknown ids fail closed).
2. **Delivery idempotent by notificationId** — a retried delivery converges to ONE notification. Concurrency verified at the seam: the store is KEYED by notificationId (primary-key law), so even two concurrent delivers converge to one row — no duplicate can persist, and delivery is not a destructive side effect (unlike PRIV-02's sweep, no claim primitive required).
3. **Preferences honest** — an opted-out channel records `suppressed` (never silently dropped, never delivered).
4. **Quiet hours defer** — in-window deliveries are `deferred` (not dropped, not sent); the window handles midnight wrap correctly (22→7); post-window retry delivers.
5. **Retry bounded and honest** — beyond `maxAttempts` refuses (`retry_bound_exceeded`); a provider failure records `failed`, never silently lost; every attempt counted.
6. **Privacy-safe public links** — the link carries the OPAQUE TOKEN only (`/n/{token}`): no uid, no email, no subject.
7. **Server-derived email recipient** — the recipient is the account's SERVER-DERIVED verified address, never one from the payload.

## Superseded-variant cleanup (same as KAN-110/111/112)

The dev merge resolved the privacycore add/add conflicts to **dev's approved baseline** and removed this branch's stacked superseded KAN-110 variant (`privacy-core-lookups.ts`, `index.ts`, the variant's own test). The branch's OWN KAN-113 payload — the `notifications` package (types/lookups/service + `tsconfig.notifications.json` + check script + family test + its own review doc) — is genuinely new in dev and is kept.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Notification suite | `node --test backend/tests/contracts/notifications/notification.test.mjs` | **7/7 pass** |
| Backend compile (nest) + notifications tsconfig | `npm run build` + `tsc -p tsconfig.notifications.json` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live journey

PRIV-04's user surfaces are the signed-in workspace notifications screen (credential-gated → founder-gated) and the opaque-token public link (no private data, proven by the law test). Real email delivery remains founder-gated per the approved-delivery boundary; the notification law is proven by the 7/7 suite over the contract store.

## Notes for the reviewer

- Approved email DELIVERY (real provider sends) stays founder-hosted; the service composes with the verified-email seam and quiet/retry laws, tested against the contract store.
- Real email delivery at integration keys rows by notificationId — the primary-key convergence the contract store demonstrates is the law to preserve.
