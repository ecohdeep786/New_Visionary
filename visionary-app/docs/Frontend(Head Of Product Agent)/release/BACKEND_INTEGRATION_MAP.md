# BACKEND INTEGRATION MAP — Visionary Landing (Wave L6 handoff)

What the backend team needs to connect, without frontend rework.

## 1. Auth entry points (landing pack surface only)
| Route | Frontend behavior | Backend contract |
|---|---|---|
| /login | Email/password + social buttons; on success navigates to safeReturnTo() or /dashboard/home | `appClient.auth.loginViaEmailPassword(email, password)`, `loginWithProvider(provider, "/")` |
| /register | Account creation (same client) | base44 entity `User` |
| /forgot-password /forgot-user-id | Recovery flows (mock) | Production recovery endpoints — SWAP REQUIRED |
| /reset-password | Token-based reset (mock) | Production reset endpoint — SWAP REQUIRED |
| /signin | Redirect alias → /login (no page) | n/a |

Auth state: `AuthContext` wraps the app; `isLoadingAuth` gates LandingEntry.
Backend must implement `auth.me()` server-side; currently localStorage-backed (preview repository).

## 2. Service interfaces to replace (deterministic mocks → real services)
All data access flows through `src/services/workspaceService` + `src/api/appClient`
(domain types per docs/MASTER_SPEC.md §12). Pages never import fixtures directly —
swap the service layer, not the pages.

## 3. Forms on public pages (mock states wired; production endpoints pending)
| Page | Form | States | Contract needed |
|---|---|---|---|
| /contact | Contact form (name/email/type/message) | idle/submitting/success/error (mock, 900ms) | Contact submission endpoint |
| /partners | Partnership application | 4-state mock | Partnership application endpoint |
| /referral | Referral access request | 4-state mock | Referral program endpoint |
| /careers | Open-roles notify-me | 4-state mock | Careers notify endpoint |
| /download | Launch notify-me | 4-state mock | Notify endpoint |

## 4. Contract freeze points (frontend will not change these)
- Routes: 27 public routes per LINK_MAP (routeMeta.js is the source of truth for titles/meta).
- Meta system: routeMeta.js entries are PM-owned; backend work must not edit them.
- Design tokens: MASTER_SPEC §3.1 — backend-driven UI must consume the same tokens.
- CTA targets: /register?plan=start|personal|family (plan ids in src/data/pricingConfig.js).
- Pricing figures: ₹299 Personal / ₹499 Family (provisional) — fixture-owned; backend
  billing must read the same ids (start/personal/family/institution).
- Grievance contact: grievance@visionary.org.in (DPDP Act 2023) — must be live at launch.
- Motion: reduced-motion kill is global; backend-driven animation must respect it.

## 5. What the backend does NOT need to touch
- src/pages/landing/*, src/components/landing/* (visual layer complete, waves L1–L6).
- routeMeta/PageMeta/head system, sitemap/robots (release engineering owns these).
