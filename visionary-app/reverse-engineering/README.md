# Product research and REA

REA source imported from `morluto/rea`, commit `43738bec579fc69bab084bffa964916d43d43ed1`, under `upstream/`. Keep its MIT license, third-party notices and repository guidelines. It is an engineering toolkit outside the application backend and ML serving path.

From the product root:

```powershell
npm run rea:install
npm run rea:build
npm run rea -- --help
```

REA is installed locally to this project. No global CLI, agent MCP registration, browser target, native analysis provider or binary inspection is activated by this import. Five upstream native/artifact provider submodules remain pinned optional references. Choose and install a provider only when an investigation needs it; source import does not establish native-provider readiness.

Google and Apple product studies should focus on specific user tasks and documented/publicly observable behavior. Keep evidence, observed behavior, inferred mechanism and unknowns separate. Record a feature requirement and acceptance criteria for Visionary; public behavior alone cannot establish a company's private backend or model architecture.

Use [research/FEATURE_STUDY_TEMPLATE.md](research/FEATURE_STUDY_TEMPLATE.md) for each study. The initial candidate list is in [research/README.md](research/README.md). Results feed reviewed frontend/backend/ML work; REA is not shipped to users.
