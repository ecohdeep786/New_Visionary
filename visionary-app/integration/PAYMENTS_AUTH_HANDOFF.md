# Auth foundation for payment design

D-067,15 October2026. The local connected auth/onboarding slice is ready to support payment system design. This does not certify a production payment service or the remaining authentication providers.

| Concern | Contract for payment implementation |
| --- | --- |
| Customer identity | Use the server-verified Firebase UID as the canonical account/customer link. Never infer identity or merge customers by email, IP or browser metadata. |
| Request authority | Reuse verified device/session, expiry/revocation, exact Origin/CSRF and expected-account checks for browser mutations. Do not trust a browser role, local subscription record or supplied UID. |
| Server integration | `main-auth` currently boots only the isolated Firebase product module. Imported legacy JWT/payment controllers are not certified for Firebase accounts. Review a shared guard/service boundary before exposing billing routes. |
| Setup state | Completed onboarding and introduction are account preferences; they do not establish a paid entitlement, organization membership or guardian relationship. |
| Price and access | Own prices, currency, customer/subscription mappings, usage and entitlements on the server. Client checkout success alone cannot activate access. |
| Provider events | Verify webhook signatures with server secrets; use durable event deduplication and transactional state transitions, including delayed/out-of-order events, cancellation and refunds. |
| UI transitions | Keep loading/retry states and account-switch guards. After ambiguous checkout failures, reconcile server state before starting another charge. |

The payment provider, India availability, commercial model, taxes and deployment/webhook topology require the next design discussion. No checkout, billing secret, paid entitlement or production payment configuration is introduced here. Remaining auth gates include live provider/delivery/device/load acceptance, Microsoft/phone/SSO/linking, verified guardian-first admission and reviewed GCP ingress/deployment. See [the auth contract](FIREBASE_AUTH_CONTRACT.md).
