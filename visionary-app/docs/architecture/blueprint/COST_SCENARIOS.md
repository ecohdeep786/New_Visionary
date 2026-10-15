# Generated cost scenarios

Generated from versioned inputs by `npm run cost:report`. Prices checked 2026-10-15; USD gross planning only. No vendor quote, live billing change or deployment.

Models, FX, staff/content/tools, utilization and unresolved network SKUs are explicit assumptions. Compare the same workload/availability before choosing a cloud. See [method and controls](CLOUD_AND_COST.md).

| Monthly item | 10k MAU pilot | 100k MAU growth | 100k MAU / all premium model | 100k MAU /120 owned video minutes per MAU |
| --- | ---: | ---: | ---: | ---: |
| MAU / DAU | 10,000 / 2,000 | 100,000 / 20,000 | 100,000 / 20,000 | 100,000 / 20,000 |
| AI turns / provider attempts | 240,000 / 264,000 | 2,400,000 / 2,640,000 | 2,400,000 / 2,640,000 | 2,400,000 / 2,640,000 |
| Cloud Run | $420.17 | $797.73 | $797.73 | $797.73 |
| SQL HA compute/storage/backups | $298.00 | $651.20 | $651.20 | $651.20 |
| Firestore operations/storage/protection | $5.75 | $54.02 | $54.02 | $54.02 |
| Object storage/operations | $2.90 | $19.00 | $19.00 | $109.00 |
| CDN delivery/fill/lookups | $9.53 | $95.25 | $95.25 | $14,672.45 |
| Edge/WAF/API transfer | $34.89 | $94.68 | $94.68 | $94.68 |
| Identity Platform if enabled | $0.00 | $275.00 | $275.00 | $275.00 |
| Other cloud allowance | $200.00 | $700.00 | $700.00 | $3,700.00 |
| Platform subtotal | $971.23 | $2,686.86 | $2,686.86 | $20,354.06 |
| Model API assumption | $788.57 | $7,885.68 | $51,480.00 | $7,885.68 |
| Gateway fee + assumed fee tax | $87.68 | $876.77 | $876.77 | $876.77 |
| Tools/content allowance | $500.00 | $1,500.00 | $1,500.00 | $1,500.00 |
| People/operations allowance | $4,000.00 | $12,000.00 | $12,000.00 | $12,000.00 |
| Contingency | $338.97 | $1,810.88 | $8,350.03 | $4,460.96 |
| **Planning total** | $6,686.45 | $26,760.20 | $76,893.67 | $47,077.48 |
| Normalized revenue assumption | $3,715.14 | $37,151.39 | $37,151.39 | $37,151.39 |
| Revenue less planning total | $-2,971.31 | $10,391.19 | $-39,742.28 | $-9,926.09 |
| Planning total INR at assumed FX | 601,780 | 2,408,418 | 6,920,430 | 4,236,973 |
| Total / MAU | $0.67 | $0.27 | $0.77 | $0.47 |
| Model charge / logical turn | $0.00329 | $0.00329 | $0.02145 | $0.00329 |
| CDN delivered GiB | 100 | 1,000 | 1,000 | 241,000 |

FX input: INR90/USD, **illustrative, not a current exchange-rate quote**. Annual charges are normalized using exact annual totals/12. Family revenue counts the payer once. Surplus is a planning remainder before unmodeled taxes, discounts, churn, financing and actual business adjustments; it is not profit.

No Cloud Run credits, named-Firestore free quota, promotion, response-cache savings or committed-use discounts are deducted. Cloud Run includes API wait time for AI and an approximate minimum-instance idle floor. CDN tiers apply to Asia-Pacific delivery; this is not a universal per-GB quote.

## Scenario assumptions

- All workload, payer mix, model routes, FX, fee tax, allowance and retention-size figures are illustrative management inputs, not a vendor quote or actual business result.
- 12h population activity window does not mean12h per-user foreground.60 core calls assume about20min foreground (40 polls+20 other calls); recalculate for longer sessions.
- Cloud Run active time includes the product API waiting for AI. Explicit idle hours and minimum-instance floor are approximate and require billed-instance telemetry.
- Storage sizes forecast total retained/index/version/backup bytes, not an approved deletion or retention policy.
- Other-cloud allowance covers estimated Tasks/Scheduler/logging/CI/email/scan/backup/network extras; it is not a sum of verified SKU quotes.
- Business tools/content and people/operations are explicit placeholders. Replace with actual staffing, licensing, support and security budgets.
- Revenue is monthly-normalized before indirect taxes/discounts/churn; Family is charged per payer, not multiplied by six. Annual cash collection is different from normalized revenue.
- No model/provider is selected by illustrative token prices. No response-cache savings or credits assumed. Voice/image/3D inference, live video, SMS/SSO, refunds/chargebacks and additional DR costs need separate sizing if not covered by allowances.

## Reproduce

```powershell
npm run cost:estimate
npm run cost:report
npm run cost:test
```

Inputs: [scenarios](../../../infrastructure/cost/launch-scenarios.json), [dated rates](../../../infrastructure/cost/rates-2026-10-15.json). Source URLs and caveats are preserved in the rate card; raw public pricing evidence is retained locally under artifacts/research/system-design/pricing-2026-10-15/.
