# Application backend

Organization backend imported from `visionaryorg/visionary-dev`, commit `81e861be4a87b8af02c9f986d6874e82be20b1b7`. Code and Prisma schema live in `upstream/backend/`; reviewed deployment source lives in `upstream/deploy/`.

From the product root, use `npm run backend:install`, `npm run backend:build` and, after configuration, `npm run backend:dev`. Windows tasks use the project-local Node 20 runtime. Source imports and dependency installation do not start a server, apply migrations, send OTP email or connect a model.

Read [the integration handoff](../integration/README.md) before configuring databases or replacing frontend preview services. Authentication and all product authorization belong here. The current imported schema needs the five-role workspace, membership and consent model reconciled with the existing product contract.
