# REA toolkit

REA source imported from `morluto/rea`, commit `43738bec579fc69bab084bffa964916d43d43ed1`, under `upstream/`. Keep its MIT license, third-party notices and repository guidelines. It is an engineering toolkit outside the application backend and ML serving path.

From the product root:

```powershell
npm run rea:install
npm run rea:build
npm run rea -- --help
```

REA is installed locally to this project. No global CLI, agent MCP registration, browser target, native analysis provider or binary inspection is activated by this import. Five upstream native/artifact provider submodules remain pinned optional references. Choose and install a provider only when an investigation needs it; source import does not establish native-provider readiness.

Google and Apple product studies should focus on specific user tasks and documented/publicly observable behavior. Keep evidence, observed behavior, inferred mechanism and unknowns separate. Record a feature requirement and acceptance criteria for Visionary; public behavior alone cannot establish a company's private backend or model architecture.

Visionary study scripts, reports, templates and evidence indexes live in [the separate research folder](../research/README.md). Use its [study template](../research/FEATURE_STUDY_TEMPLATE.md) for new investigations. Product architecture and implementation plans live in [docs/architecture](../docs/architecture/README.md); raw local captures remain in `artifacts/research/`. Keep this folder for the pinned toolkit and its setup guide. REA is not shipped to users.
