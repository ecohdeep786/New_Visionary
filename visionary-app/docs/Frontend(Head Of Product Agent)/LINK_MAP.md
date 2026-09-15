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
3. Orphan route (reachable nowhere) = gate G1 fail.
4. Renamed route ⇒ redirect + LINK_MAP update in same commit.
5. Crawl script (or manual matrix) result attached to STATUS each wave.