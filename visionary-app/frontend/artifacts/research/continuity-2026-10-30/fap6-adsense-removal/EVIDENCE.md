# FAP-A1 AdSense removal — evidence (2026-10-30)

- Removed from `index.html`: the `google-adsense-account` meta + the adsbygoogle loader
  (ca-pub-3029364061670569). These were the only references in the repo.
- Why removal is safe even against the "ads at launch" plan: the site's own CSP already
  blocked the loader — zero ads ever rendered, the script only produced a console error
  on every page (lighthouse BP `errors-in-console` + `inspector-issues`), and it directly
  contradicted the /cookies promise ("No advertising cookies… There are no ad networks
  watching what you do here. Ever.").
- Acceptance verified: 0 googlesyndication/doubleclick/adservice requests across
  /, /student, /parent, /safety, /pricing (network probe); 0 console errors;
  served HTML contains no ad references.
- Lighthouse after: **a11y 1.0 · best-practices 1.0 · SEO 1.0 on all five routes**
  (BP was 0.92 before — the CSP console error was the sole BP defect).
- Future path (founder scope): if the planned ad-supported free tier ships, it gets a
  proper consent-aware, CSP-aware integration on the logged-in free tier — not a
  sitewide public-page loader.
