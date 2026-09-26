# Link Integrity Map (01-PM owns; 09-qa verifies every wave)
## Route inventory
/ /student /teacher /parent /professional /organization /how-it-works /pricing /download
/about /research /community /updates /partners /referral /privacy /terms /cookies /safety
/security /accessibility /careers /contact /register /signin /404

## Required global links
Nav: persona switcher (5) · How it works · For organizations · Pricing · Download · About ·
Help · Sign in · Get Started(/register).
Footer: product (how-it-works, pricing, download, research), categories (5 personas),
trust (privacy, terms, cookies, safety, security, accessibility), company (about, careers,
contact, community, updates, partners, referral), auth (signin, register).

## Per-page in-page links (minimum)
Persona pages: hero CTA /register + secondary /how-it-works; explore rail → other 4 personas;
modal links → /how-it-works /privacy /security /terms /parent /organization /partners /community /contact /help.
Pricing: /register per plan; org row → /contact. Download: platform anchors + /how-it-works.
Trust pages: cross-links to related trust pages + /contact for grievances.

## Rules
1. Every <Link to> must exist in inventory or be an approved external (https) with rel/target.
2. No dead anchors; in-page anchors need matching ids.
3. Orphan route (reachable nowhere) = gate G1 fail — except routes on the accepted-orphan list below.
4. Renamed route ⇒ redirect + LINK_MAP update in same commit.
5. Crawl script (or manual matrix) result attached to STATUS each wave.

## Wave L1 PM decisions (2026-09-16)
- Redirect alias: `/signin` → `/login` (LINK_MAP rule 4; `/login` stays the canonical auth-entry
  route since it is linked everywhere). Implemented in App.jsx. Inventory keeps `/signin` as alias.
- Accepted orphans (recorded, exempt from G1):
  - `/dev/scenarios` — dev-only preview pack (DEV builds only).
  - `/reset-password` — utility route, reached only via the email recovery link; not linked in-app.
  - `/onboarding` — internal pack surface behind auth; not a public marketing page.
  - `/dashboard` — internal pack surface behind auth.
- Footer social links: removed until real profile URLs exist (no href="#" may ship). Re-add with
  real https URLs + rel/target when profiles go live.
- Meta matrix for all 27 public routes approved (title ≤60 chars + description; see
  src/lib/routeMeta.js — 08-seo drafted, 01-PM approved).
- Repo extras not in the original inventory, now recorded: /login (canonical sign-in),
  /forgot-password, /forgot-user-id, /help, /career (redirect → /careers).