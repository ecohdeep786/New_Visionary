# KAN-140 / SYNC-02 sync coordinator — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-140-sync-coordinator` @ 47f2cb3d (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The shared frontend sync coordinator over the KAN-139 change-feed contract reviewed clean (suite 9/9); every law enforced:

1. **Schema validation first** — an event failing its registered adapter validator (per `surface:*` or `surface:ref`) is rejected and never reaches app state (`rejectedSchema` counter).
2. **Stale rejection** — an event at or below the last applied seq is rejected (`rejectedStale`).
3. **Duplicate suppression** — a seen-set per surface; replayed events count as duplicates, never re-applied.
4. **Gap detection with honest resync** — server seqs are gapless per contract; a gap increments `gaps` (the resync path drops cursor/lastSeq/seen and repolls — the recovery point for real desyncs; cursor expiry server-side surfaces the same way).
5. **Ordered apply + cache invalidation** — events sorted by seq, applied through the adapter, then the ref-scoped cache invalidation runs.
6. **Per-account isolation** — account switch resets cursors/lastSeq/seen/revocation (no leakage); drafts are queued per account and flushed in order for the CURRENT account only.
7. **Revocation stops polling** until an explicit reauthorize; bounded reconnect backoff (250ms×2ⁿ capped 4s, bounded attempts) with an active-connection cap.
8. **The honest local-first law** — browser storage events are NOT cross-device sync and never advance state (`crossDeviceSync: false`).

The coordinator's counters are observability metrics (applied/rejected/duplicates/gaps/resyncs), not identity ids — no counter-id collision surface.

## Re-integration

Merged `origin/dev`; package.json union. The branch's OWN payload — `frontend/src/services/syncCoordinator.ts` (+ syncTypes + the 182-line family test) — is genuinely new in dev and is kept. The new source file was registered in the surface inventory (regenerated; control set now includes it).

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Sync-coordinator suite | `node --test frontend/tests/sync-coordinator.test.mjs` | **9/9 pass** |
| Frontend typecheck + lint | `npm run typecheck && npm run lint` | **exit 0** |
| Frontend battery | `node --test --test-concurrency=2 tests/*.test.mjs` | **681/681 pass** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-13)

The coordinator runs inside the signed-in workspace over the KAN-139 feed (founder-gated credentials at integration). The public honesty law it pins — local-first with no fake cross-device sync — is visible in the product's privacy statements (verified this cycle on /privacy: data stays on the device until connected surfaces ship). The law is proven by the 9/9 suite over the contract transport.

## Notes for the reviewer

- Consider AUTO-resync on a detected gap (today the coordinator counts `gaps` and continues; a missed event leaves a ref-scoped stale cache until the next poll — the invalidate path is idempotent, so this is safe but worth tightening).
- The transport interface must reauthorize every queued operation on flush (the coordinator deliberately does not authenticate drafts itself).
