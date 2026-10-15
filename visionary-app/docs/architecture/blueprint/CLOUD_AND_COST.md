# Cloud choice and product cost management

**Choose GCP as the single primary application cloud for launch.** It fits the existing Firebase UID/account/payment data investment and the managed regional design. This is a fit/operational-risk decision, not a claim every GCP SKU is cheaper. [Generated scenarios](COST_SCENARIOS.md) and [calculator inputs](../../../infrastructure/cost/launch-scenarios.json) make the estimates inspectable and adjustable.

## One cloud versus two

| Option | Equivalent target stack / consequence | Decision |
| --- | --- | --- |
| GCP primary | Global HTTPS edge/CDN/Armor; Cloud Run; existing Firebase/Firestore; regional HA Cloud SQL/pgvector; GCS; Tasks/Scheduler; managed model adapter | Recommended first launch; one IAM/operations/data/network system |
| AWS primary | CloudFront/WAF/ALB; ECS Fargate or measured serverless API; RDS PostgreSQL; S3; SQS/EventBridge; identity migration or continued Firebase dependency | Viable alternative if an equivalent availability/traffic/staffing quote wins; migration and Google data dependencies must be included |
| GCP + AWS active serving/writes | Two security/deploy/telemetry systems; cross-cloud transfer, replication/conflict, queue/provider replay and failover testing | Defer.100,000 MAU alone does not justify it; not automatic DR or a cost saving |
| Optional external model/CDN/backup | Narrow provider contract with explicit data/egress/availability/purpose | Evaluate independently; this is not a requirement to duplicate the entire application |

AWS Mumbai Fargate official offer data shows meaningful sustained-compute alternatives: x86 on-demand Linux CPU$0.04256/vCPU-hour and RAM$0.004655/GiB-hour; ARM rates differ. Running tasks are not equivalent to Cloud Run request billing. Add matching database HA, ALB, networking, queues, logs, auth and team burden before concluding a platform is cheaper. [Fargate pricing](https://aws.amazon.com/fargate/pricing/)

CloudFront currently offers fixed-price plans as well as other pricing paths. Compare feature/usage/availability requirements and origin charges; a Google origin can still incur Google egress. A cheap headline CDN plan is not a full-platform cost comparison. [CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/)

Start with regional HA and tested backup/restore on GCP. Preserve portability through containers, versioned HTTP/event contracts, PostgreSQL schema, object manifests and model-provider ports. Add a second cloud only for a documented requirement, realistic equivalent quote and proved restore/failover policy.

## Verified rates versus assumptions

Checked15 October2026, USD on-demand public prices. Exact table bindings and hashes are retained under `artifacts/research/system-design/pricing-2026-10-15/`. The [tracked rate card](../../../infrastructure/cost/rates-2026-10-15.json) records URLs, region/edition and caveats. No credentials or existing-project billing configuration was inspected for the study.

| Area | Verified calculation basis | Important boundary |
| --- | --- | --- |
| Cloud Run, Mumbai Tier1, request billing | Active CPU$0.000024/vCPU-s, RAM$0.0000025/GiB-s; minimum-instance idle CPU$0.0000025/vCPU-s; requests$0.40/M | Effective concurrency, billed startup/tail/idle and provider wait time determine cost; gross credits not deducted. [Pricing](https://cloud.google.com/run/pricing) |
| Cloud SQL Enterprise general-purpose, Mumbai HA | CPU$0.0991/vCPU-hour; RAM$0.0168/GiB-hour; HA SSD$0.408/GiB-month; used backups$0.096/GiB-month | HA already includes redundancy.4vCPU/16GiB at730h = $485.596 compute;300GiB SSD +450GiB backups brings this scenario to$651.196. Explicitly select Enterprise, since edition defaults can differ. [Pricing](https://cloud.google.com/sql/pricing), [editions](https://docs.cloud.google.com/sql/docs/postgres/editions-intro) |
| Firestore Standard, Mumbai | Per100k reads$0.035/writes$0.104/deletes$0.012; data$0.104/GiB-month; PITR$0.1731; backup$0.035 | Named database has no free quota; ID`default` differs from special`(default)`. Count index/transaction/listener/retry work. [Pricing](https://cloud.google.com/firestore/pricing) |
| Standard object storage, Mumbai | $0.02/GiB-month plus flat-namespace operations | Include retained versions/soft deletes, transformations and transfer; cold tiers have different retrieval/retention economics. [Pricing](https://cloud.google.com/storage/pricing) |
| Cloud CDN Asia-Pacific delivery | First10TiB$0.09/GiB, next140TiB$0.06, next850TiB$0.05; in-region fill$0.02/GiB; lookup$0.0075/10k | Destination-based tiers; fill and delivery are distinct. Private/noncacheable bytes have another path. [Pricing](https://cloud.google.com/cdn/pricing) |
| Edge/security | Global forwarding-rule group$0.025/hour; Armor Standard policy/rule/request rates recorded in input | Exact global ALB India processing and non-CDN API-egress SKU remain visibly unverified scenario rates. No duplicate Cloud Run/LB outbound charge. [LB](https://cloud.google.com/load-balancing/pricing), [Armor](https://cloud.google.com/armor/pricing) |
| Identity | Identity Platform Tier1 at100k measured auth MAU = $275/month | Applies only if enabled; basic non-phone Firebase Auth differs. SMS and SAML/OIDC are separate. Do not infer enabled edition from SDK use. [Identity pricing](https://cloud.google.com/identity-platform/pricing), [Firebase](https://firebase.google.com/pricing) |
| Payments | Published standard Razorpay fee2% plus applicable GST | Exclude temporary promotions; merchant/subscription/method/settlement/refund terms need confirmation. Fee-tax input is an assumption, not legal guidance. [Pricing](https://razorpay.com/pricing/) |

Model rates, model quality, payer mix, people/content/tool allowances, utilization, FX and unresolved network rates are **illustrative inputs**, not verified commercial quotes. INR90/USD is a scenario parameter, not a live exchange-rate claim. Actual INR vendor billing/tax treatment can differ. No response-cache savings, provider promotions, free-tier or committed-use discount is assumed.

## Workload and arithmetic

Baseline:100kMAU *20% daily active *4 logical AI turns/day *30days =2.4M turns/month.3,000 input and700 output tokens/turn yield7.2B/1.68B tokens before retry amplification. The calculator adds10% provider attempts and a2% premium-route assumption. It separately sizes the product API's time waiting for AI; otherwise AI appears deceptively cheap to host.

Cloud Run planning approximates active instance-seconds as summed request residence/effective concurrency, with a startup/tail multiplier. Minimum-instance idle time is the larger of an explicit idle window and the remaining minimum-month floor, avoiding adding both idle estimates. This is not a reconstruction of actual metering or a capacity guarantee. Replace with billed-instance telemetry; low utilization can make small pilots expensive per user.

Database operations are estimated from requests and per-request read/write work; SQL compute/storage/backups are separate. SQL data must include indexes and growing evidence history.6M evidence events/month at2KiB/event including index overhead is roughly11.4GiB/month before replicas/backups. A retention-size forecast is not permission to retain student information indefinitely.

Revenue uses exact annual totals/12 rather than rounded marketing equivalents. Family counts one payer rather than six full-price users, while all beneficiaries contribute workload. Institution revenue remains unpriced/contract-led. Normalized revenue differs from cash received and is before indirect taxes, discounts, refunds and churn. The planning remainder is not accounting profit.

## What the scenarios say

The generated growth case estimates **$2,686.86/month platform**, **$7,885.68 model calls**, then adds payment fees, explicit business/content/tools and people/operations allowances plus contingency for a **$26,760.20 planning total**. These are scenario results, not a budget commitment. The assumed$12k people/operations allowance is a major part of the total and must be replaced with the actual team plan.

Changing only to the illustrative premium model rate drives model calls to$51,480/month. Adding120 minutes of owned video per MAU adds240,000GiB of delivery. The [generated table](COST_SCENARIOS.md) shows both stress cases. Model choice, usage, media bytes and operations can dominate raw database cost. Do not buy a second cloud or train a model merely because one database line appears expensive.

## Cost controls by owner

| Owner | Controls before launch | Signal / action |
| --- | --- | --- |
| Product/AI | Server usage reservation; per-UID/workspace/household concurrency; token/context/output budgets; bounded retries and approved fallback | Cost per useful answer, free/paid cohort consumption, unresolved reservations; degrade expensive optional work while preserving account/payment |
| Catalog/model quality | Authored core explanations, compact relevant context, evaluated small-model route; optional batch embeddings | Compare measured accepted quality and cost; do not assume global personalized-response cache savings |
| Database | Cursor/batch queries, indexes/constraints, bounded device touches, short transactions, no keystroke/progress-tick writes | Reads/writes/abort rate, pool/query time, growth/index bytes; adjust access pattern before scaling instances |
| Media | Approved embeds where appropriate; owned renditions, size/minute quotas, lifecycle and controlled cache fill | GiB per learner/minute/source; separate voice/image/3D/live-stream budgets |
| Cloud/operations | Queue dispatch cap, concurrency/instance/pool limits, observability retention, log redaction and staged environments | Daily burn forecast, cost labels, queue age, retry storms; alert and pause optional jobs |
| Commercial | Confirm paid/family/institution units, processor fees, discounts, tax and actual supplier terms | Cohort contribution before/after support/content/team cost; revise the offering only through reviewed product policy |

Current public Start20questions/day and paid fair-use wording are product promises, not already implemented production inference budgets. Define questions versus guided turns, languages, media and Family/institution pooled use explicitly before enforcement. This study does not silently change pricing, quotas or checkout terms.

Set alerts at useful fractions of budget and a forecasted month-end burn threshold. **Alerts-only budgets do not stop spend.** Current GCP documentation also describes spend caps for supported services, with scope/enforcement-delay limitations; assess their failure boundary separately. Application reservations remain necessary, and account/payment recovery should survive an AI budget pause. [Budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets)

## Budget worksheet before launch

Replace every assumption with measured workload/contract: DAU/session time, core calls and polling, model tokens/attempts/route/version, quota and response time, evidence/object growth, media destinations/bytes, configured auth edition, SQL edition/size, network SKUs, merchant fees and actual staffing/content/support/security costs. Add DR replica/copies, restore drills, SMS/SSO or generative media if enabled. Run the calculator again and benchmark under the same configuration. A low cost estimate without matching learning quality, permissions and failure recovery is not an acceptable optimization.
