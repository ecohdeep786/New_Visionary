# KAN-139 / SYNC-01 durable change feeds — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-139-durable-change-feeds` @ a394a4cd (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — two REAL defects, corrected

The change-feed law (seven released surfaces, reference-ids-only records, private-content refusal, server-issued opaque cursors, per-poll reauthorization, honest retention expiry, observation-only) reviewed sound EXCEPT:

1. **The sequence fence was a read-then-write race.** `recordEvent` derived `seq = latestSeq + 1` across TWO store calls: two concurrent appends for the same (owner, surface) both read the same latest seq and both appended the SAME number — breaking the strictly-increasing ordered-replay guarantee the whole feed exists for. **Fix (the atomic-write law, 19th proof):** the fence now lives INSIDE the store's single critical section — `appendEvent` derives the seq from the last committed record in the same append and returns the committed event with its store-assigned seq. Integration law pinned in the interface doc: ONE transaction computing `INSERT … COALESCE(MAX(seq),0)+1` per (owner, surface), never read-then-insert. New test: eight interleaved appends yield strictly 1..8 with no duplicates or gaps.
2. **Cursor tokens were counter+Math.random** — the KAN-101 guessable-authorization-artifact class (a cursor is a capability). Now `cur_{randomUUID}`.

Otherwise the law held: private-content hints refuse the record (`private_content_refused`), cursors are server-issued and reauthorized per poll (a valid token presented by a different caller refuses uniformly), tampered/unknown tokens refuse, foreign surface/cursor pairings refuse, retention-window expiry reports `cursor_expired` with the resync point, and the feed is observation-only (`observation_only` — no execution through the feed).

## Re-integration

Merged `origin/dev`; package.json union; privacycore at dev's approved baseline. The branch's OWN payload — the `changefeed` package (types/lookups/service/index + `tsconfig.changefeed.json` + family test) — is genuinely new in dev and is kept.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Changefeed suite (incl. the new atomic-fence test) | `node --test backend/tests/contracts/changefeed/changefeed.test.mjs` | **11/11 pass** |
| Backend compile (nest) + changefeed tsconfig | `npm run build` + `tsc -p tsconfig.changefeed.json` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-13)

The feed is an owning-store observation record with no public surface (sync clients consume it authenticated; founder-gated at integration). The public honesty boundary was verified in the KAN-132 pass. The law is proven by the 11/11 suite over the contract store.

## Notes for the reviewer

- The integration MUST keep the fence inside one transaction per append (`COALESCE(MAX(seq),0)+1` under a row lock on the (owner,surface) log, or a sequence table with atomic increment) — a check-then-insert re-introduces the race.
- Cursor tokens are capabilities: keep them crypto-random and server-issued; re-derive authority on every poll.
