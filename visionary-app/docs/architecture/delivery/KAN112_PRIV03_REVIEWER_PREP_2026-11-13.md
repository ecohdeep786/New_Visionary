# KAN-112 / PRIV-03 — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-112-consent-ledger` @ c9caae25 (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The tombstone-aware backup-restore law reviewed clean; every ticket requirement is enforced in order:

1. **DERIVED classes are never revived** — checked FIRST for every record (erased caches/artifacts stay erased).
2. **DELETION tombstones win** — per (owner, dataClass); erased records are dropped on restore, never resurrected.
3. **CONSENT-REVOCATION tombstones win** — learning-data records (`learning_text`, `conversations`) for a consent-revoked learner are dropped; non-guarded classes restore.
4. **CURRENT policy re-validation** — a record carrying a field the current policy no longer permits is dropped (the backup-era policy does not survive).
5. **Raw private text refuses the record** (`raw_private_text`) — substring probe over the serialized payload; the fail direction is over-dropping (safe).
6. **The receipt is honest** — per-drop reasons and counts; recovery never silently resurrects prohibited access.

## Superseded-variant cleanup (same as KAN-110/111)

The dev merge resolved the privacycore add/add conflicts to **dev's approved baseline** and removed this branch's stacked superseded KAN-110 variant (`privacy-core-lookups.ts`, `index.ts`, the variant's own test). The branch's OWN KAN-112 payload — the `restoretombstone` package (types/lookups/service + `tsconfig.restoretombstone.json` + check script + family test + its own review doc) — is genuinely new in dev and is kept.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Restore-tombstone suite | `node --test backend/tests/contracts/restoretombstone/restore-tombstone.test.mjs` | **6/6 pass** |
| Backend compile (nest) + restoretombstone tsconfig | `npm run build` + `tsc -p tsconfig.restoretombstone.json` | **exit 0** |
| Privacycore suite (KAN-110 baseline intact) | `node scripts/provision-check.mjs --suite privacycore` | **52/52 pass** (manifest copied to dist — nest build omits JSON assets, harness law) |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live journey

PRIV-03's surface (backup restore) is an owner-authenticated server operation with no public UI; the tombstone/policy composition is proven by the 6/6 suite over the contract store plus the privacycore control-plane. The user-facing privacy reference screen is credential-gated (founder-gated).

## Notes for the reviewer

- **Integration note**: the real owning store should implement `restoreRecord` as an UPSERT keyed by record identity — a retried restore then cannot duplicate rows. Either way the security law holds: tombstone filtering is pass-stable, so even a repeated restore cannot revive prohibited access (unlike PRIV-02's destructive sweep, no atomic claim is required here).
- The raw-private-text probe is a serialized substring check — fail-closed (over-drops); a structured field probe at integration would be tighter but the law direction is correct.
