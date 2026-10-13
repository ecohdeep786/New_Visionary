# Visionary frontend

Existing React/Vite public site and five-role internal workspace. Source is in `src/`, assets/fonts in `public/`, service regressions in `tests/`, and rendered-review scripts in `scripts/`. Vite, TypeScript, Tailwind, ESLint, package and lock files are owned by this directory.

From the product root use `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck` and `npm test`. From here use the same commands directly. Install with `npm ci` here or `npm run frontend:install` from the root. Output is `frontend/dist/` from the product root.

The `@/` alias still refers to `src/`; public URLs and `/src/` development module URLs are unchanged. Page/component/service/domain structure, typography and role journeys are retained. Test imports remain relative to this package. Local preview records are not migrated by relocation.

Browser-review tasks are `qa:navigation`, `qa:fonts` and `qa:design`; root equivalents begin with `frontend:qa:`. Evidence paths resolve to product documentation independently of the working directory. These are bounded historical harnesses; account/session and wider human/device acceptance remain separately recorded.

Read [the product domain map](../docs/architecture/PRODUCT_DOMAINS.md), [the internal handoff](../docs/visionary/README.md) and [integration gaps](../integration/CONTRACT_GAPS.md) before connecting live services.
