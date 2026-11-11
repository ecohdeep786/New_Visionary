# KAN-87 / AI-05 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for KAN-87 [AI-05] before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: stack integration (merge of dev `2e0b1fbb`; package.json scripts unioned — all twenty-six family checks live incl. the domain's own registered gate), data-04 rolling-clock fix (byte-identical).

## TWO CANDIDATE IMPLEMENTATIONS — reviewer's choice

KAN-87 has two candidate branches, both pushed, same scoped-cache domain:

1. **`codex/principal-kan-87-cache-key-rework` @ tip `ca414afe`** (RECOMMENDED): the scoped-cache implementation PLUS a hardening commit (`c151aaba`) that (a) makes the cache scope key an UNAMBIGUOUS JSON serialization (no delimiter-collision class), (b) makes the `purpose` binding REQUIRED in the full-scope assertion (a cache without a purpose refuses for every kind — the unsafe-global-cache law tightened), and (c) passes the FULL binding to delivery-time reauthorization (KAN-64 semantics over the whole scope, not just uid+version). Suite **8/8**.
2. `codex/principal-kan-87-scoped-cache` @ `768306c7`: the earlier generation without the hardening. Suite 6/6 (fewer tests — the hardened cases don't exist there).

The rework candidate strictly dominates: same law, same files, plus the hardening and its tests. The reviewer should merge the REWORK branch and let the scoped-cache candidate remain as the superseded generation (or retire it).

## Gate evidence on the rework merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Scoped-cache suite (AI-05's own acceptance) | `node --test backend/tests/contracts/scopedcache/scoped-cache.test.mjs` (after `npx tsc -p tsconfig.scopedcache.json`, exit 0) | **8/8 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The cache lookup/reauthorization seams are injected (map onto KAN-64's reauthorization law). Hosted caching at scale stays founder-gated as originally recorded.
