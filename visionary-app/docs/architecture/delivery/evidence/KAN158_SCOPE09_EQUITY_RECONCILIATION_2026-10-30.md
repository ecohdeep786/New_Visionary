# SCOPE-09 (KAN-158) — Equitable-access and continuity reconciliation record

**Status:** DRAFT record for founder sign-off. This is a PLANNING RECORD produced per the
ticket ("record decision owner, benefit matrix, cost scenarios and unresolved commercial
decisions as release blockers; do not change prices, grant subsidies or advertise
unqualified features from this planning task"). It does not change prices, grant
subsidies, or add/advertise any feature.

**Decision owner:** Founder (recorded; no commercial decision is made here).
**Date:** 2026-10-30. **Branch:** `codex/principal-kan-158-equity-continuity`.

---

## 1. What exists today (verified in the repo)

- **Pricing/plan copy (single source, `/pricing`):** `frontend/src/data/pricingConfig.js`
  - `Start` (free forever, ₹0, no card): "Ask & explore — 20 questions a day", "1
    language", "7-day memory of your journey", "Basic progress snapshot".
  - `Personal` ₹299/mo (annual ₹249): "Practise mode & no-code Build", "All 20+ languages,
    voice & text", "Continuity that stays with you", "No daily cap — subject to fair use".
  - `Family` ₹499/mo (annual ₹415): "Everything in Personal", "Up to 6 members", "Parent
    view", "Private memory per member", "Weekly family digest".
  - `Institution`: "Contact Visionary" (no published number).
- **Server billing catalog:** `backend/upstream/backend/src/billing/catalog.ts`
  - `CATALOG_VERSION '2026-10-15-test-v1'`. Plans: start ₹0, personal ₹299 (29900 paise)
    / ₹2990 annual, family ₹499 / ₹4990 annual; members 1/1/6. **No Institution row.**
- **Honest copy already present:** `frontend/src/lib/primaryWorkspaceCopy.js` states "No
  real checkout, renewal, tax calculation, or payment method is connected. Paid plan limits
  and tax treatment require confirmed service policies." in EN/HI/BN.
- **Coverage evidence in the pipeline (NOT yet accepted):** AI-18 (KAN-156) language/
  speech qualification framework and AI-17 (KAN-155) voice-session contract are in
  **Testing**, awaiting the separate D-095 reviewer. No released voice/language coverage is
  accepted yet.

## 2. Copy ↔ accepted-coverage reconciliation (what the copy claims vs what is accepted)

| Copy claim (pricingConfig.js) | Accepted coverage today | Gap |
|---|---|---|
| "20+ languages, voice & text" (Personal/Family) | AI-18 qualification framework in Testing; no accepted released coverage | **AHEAD of accepted coverage** — must not be advertised as unqualified until accepted |
| "Voice input" (Personal/Family) | AI-17 voice-session contract in Testing | **AHEAD of accepted coverage** — provider adapters are still seams |
| "Practise mode & no-code Build" (Personal/Family) | Build/LEARN contract chain in Testing (not accepted) | **AHEAD of accepted coverage** until review |
| "7-day memory of your journey" (Start) vs "Continuity that stays with you" (Personal) | No server-side memory-retention config found in pinned backend | **Enforcement gap** — copy semantics must match accepted product/policy |

**Finding (matches the ticket):** dataset/model language counts and Testing status do NOT
establish released coverage. The marketing copy currently asserts capabilities whose
acceptance is still open; these are release blockers for general launch, not today's
promises to honor.

## 3. Copy ↔ server entitlement/usage configuration

- Server catalog models only plan + price + members (start/personal/family). **No
  server-side enforcement exists for** the "20 questions/day", "no daily cap / fair use",
  language, voice, or memory-retention claims (`grep` for usage/limit enforcement in
  `backend/upstream/backend/src` returned none).
- `Institution` has no price and no server row; `/contact` only.
- Consequence: entitlement/usage configuration must be implemented to MATCH whatever the
  founder decides; today the copy is the only "contract".

## 4. Benefit matrix (non-binding options; decision owner = founder)

| Consideration | Free (Start) | Paid (Personal/Family) | Institution |
|---|---|---|---|
| Retain records/evidence/artifacts | Yes — never delete learner records (privacy policy) | Yes | Yes (org-owned) |
| Bounded model context vs metered generation | 20 questions/day (needs server enforcement) | Fair-use metering (needs server enforcement) | Contract |
| Funded Learn→check→Build path | Needs definition (unresolved) | Needs definition (unresolved) | Contract |
| Low-bandwidth/shared-device access | Needs definition (unresolved) | Needs definition (unresolved) | Contract |
| Payment-lapse/resume | n/a | Define without deleting records, without income inference (unresolved) | Contract |

## 5. Cost scenarios (ESTIMATION ONLY, non-binding; owner = founder)

- No cost model is asserted. A bounded cost estimate per completed task (per KAN-124/127
  methodology) is required before any metered-generation threshold is enforced. Until then,
  "fair use" cannot be priced; no subsidy is granted here.

## 6. Unresolved commercial decisions → RELEASE BLOCKERS (owner = founder)

1. Free-tier daily cap value and enforcement mechanism (server-side).
2. Fair-use metering thresholds + cost per completed task.
3. Voice/language release gating (tie to accepted AI-18/AI-17 evidence) and how copy
   "20+ languages, voice & text" is reworded until accepted.
4. Memory-retention policy: 7-day vs "kept while active" and its server enforcement.
5. Payment-lapse/resume behavior (no deletion, no income inference).
6. Funded Learn→check→Build path and low-bandwidth/shared-device support.
7. Institution pricing/terms row in the server catalog.

These remain **release blockers** for paid/general launch until the founder decides; this
record makes no decision and does not change any price or subsidy.

## 7. Explicit non-actions (per ticket)

- No price was changed. No subsidy was granted. No unqualified feature was advertised.
- This record does NOT close any hosted/provider/coverage/commercial gate; it records the
  reconciliation and the open decisions.

## 8. Handoff

Docs-only deliverable for founder sign-off (mirrors the KAN-207 R0 docs-only signoff
practice). Exact commit on branch `codex/principal-kan-158-equity-continuity` is recorded
on the ticket; a separate reviewer/founder confirms the exact reviewed SHA before deciding
the unresolved items.
