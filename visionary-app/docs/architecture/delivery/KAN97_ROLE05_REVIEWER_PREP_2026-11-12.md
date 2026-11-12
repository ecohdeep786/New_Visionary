# KAN-97 / ROLE-05 — reviewer-corrector pass (2026-11-12)

Reviewer-prep for `codex/principal-kan-97-professional-records` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `c260894e`; package.json scripts unioned — all thirty-six family checks live incl. the domain's own registered gate), data-04 settled to dev's evolved version.

## Correction — company-authorization gap closed

`addCompanyRecord`, `sponsorMembership`, and `companyView` never verified the actor belonged to the company: **any actor could add records to or view members of ANY company** (cross-company record injection and membership exposure). Fixed with a server-derived `companyMemberOf` seam, split by authority level:

- **Company records**: the actor must be an AFFILIATED member (employee or company principal) — definition validation ordered first (a malformed request is malformed regardless of authority).
- **Sponsorship and company views**: the actor must be the COMPANY-SIDE PRINCIPAL (the `company_<id>` uid form + membership — the employee affiliation alone is not enough for company-authority actions).

Also: record/sponsorship/share ids use `randomUUID` (instance counters collided across service instances); tests seeded with company membership.

## Review finding (verified, no further defect)

The separation law reviewed clean and is structurally enforced: personal-learning references refuse in company records (hint list); the company view contains company-scope records and explicitly granted items ONLY (`personalLearningCount: 0` made explicit); a company-side personal-learning read always refuses; share revocation is owner-only; read denies uniformly.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Professional suite (ROLE-05's own acceptance) | `node --test backend/tests/contracts/professional/professional.test.mjs` (after `npx tsc -p tsconfig.professional.json`, exit 0) | **6/6 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | settled to dev's evolved version | **exact** |

## Notes for the reviewer

- The SQL adapter implements `companyMemberOf` (join to the company-membership table) — the enforcement source. Hosted professional flows at scale stay founder-gated as originally recorded.
