# FAP-72 — Onboarding language list never presents an unserved language as switchable (2026-11-13)

Branch `zcode/fap-72-onboarding-language-truth`; Testing, NOT deployed (found branch — owner deploys). Live journey + all gates verified.

## Finding (confirmed live)

The onboarding "Preferred learning language" surface lists 14 languages (English, Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Urdu, Odia, Assamese, Others) while the deployed workspace serves exactly **en/hi/bn** (locale mapping: Hindi→hi, Bengali→bn, else en). Choosing Tamil/Telugu/… implied a switchable interface the product does not deliver — the same false-affordance class F-31 already removed from the public footer.

**Second, worse surface found live**: the auth/onboarding header+footer component `LanguageSelector.jsx` offered **English, हिन्दी, Español, Français, Deutsch, العربية, 中文, 日本語, Português, Русский** and changed NOTHING — its selection is local component state only. Driven live on the production register page: clicking **Español** relabels the button to "Español" while the page heading stays "Create a Visionary account" in English. That is the strongest form of a fake switch.

## Fix

- **Deleted** `frontend/src/components/auth/LanguageSelector.jsx` and its mounts in `AuthLayout.jsx` (footer) + `OnboardingLayout.jsx` (header) — the F-31 precedent applied to the auth/onboarding surface. No language is presented as switchable when it is not.
- **Promoted to the established honest pattern** (`Apple "Available in U.S. English"` law, as FAP-83): `stepConfigs.jsx` now exports `SERVED_UI_LANGUAGES` (English/Hindi/Bengali) and `UI_LANGUAGE_NOTE = "UI currently available in English, Hindi and Bengali — your choice helps us prioritise."`. The full 14 remain as a **saved content-interest preference** (never a UI switch) and every language-preference surface carries the honest note:
  - `ProductSetupFields.jsx` — under the "Preferred learning language" Select.
  - `StudentContextForm.jsx` — under the learner teaching-medium ChoiceGrid.
- Surface review + audit regenerated (control files 238 → 237; the deleted component's obsolete record dropped from `product-surface-review.json`).

## Law test — `frontend/tests/fap72-onboarding-language-truth.test.mjs` (4/4)

1. stepConfigs exports the served set (exactly en/hi/bn) and the honest note naming English, Hindi and Bengali + roadmap framing.
2. Every onboarding language-preference surface references the note beside the full content-interest list.
3. No cosmetic fake switch remains: the LanguageSelector file is deleted and neither layout mounts it.
4. The locale mapping still serves exactly en/hi/bn — a non-served pick cannot switch the UI.

## Gates (beta baseline)

| Gate | Result |
| --- | --- |
| Frontend typecheck (`tsc -p jsconfig.json + tsconfig.domain.json`) | **exit 0** |
| Frontend lint | **exit 0** |
| Production build (`vite build`) | **ok** |
| Frontend test battery (`node --test tests/*.test.mjs`) | **792/792** (incl. the new law test + product-surface) |
| Surface audit + coupled artifacts | **regenerated, check exits 0** |
| Repo check gate | **exit 0** |

## Live journey (in-app browser, https://visionary.org.in/register, 2026-11-13)

Observed the fake selector mounted live; clicked Español — page stayed English (button label only). Confirms the defect class end to end. The fix is on the branch; production keeps the old build until the owner deploys.

## Notes

- Removing the selector also removes the only "हिन्दी" quick-switch on the auth pages; the workspace's real served hi/bn UI switching is unaffected (it happens inside the signed-in workspace, not the auth chrome) — verified by the home-interface-language + FAP-83 laws which still pass unchanged.
