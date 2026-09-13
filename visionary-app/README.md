# Visionary App

Visionary public site and internal learning workspace, built with React and Vite.

## Prerequisites

1. Clone the repository.
2. Navigate to `visionary-app`.
3. Install dependencies: `npm install`.

## Run Locally

```bash
npm run dev
```

Open the local URL printed by Vite.

## Internal Workspace

The authenticated workspace starts at `/dashboard/home`, after role-based onboarding.
It supports personal learning alongside optional class, family, and organization connections.
This is a browser-local frontend preview, not production authentication or cloud storage.
Use fictional data only. AI, payment processing, usage metering, and ad delivery are not connected.

See [the workspace handoff](docs/internal-workspace.md) for architecture, QA evidence, and launch requirements.

## Checks

```bash
npm run lint
npm run typecheck
node --test tests/workspace.test.mjs
```

## Build And Preview

```bash
npm run build
npm run preview
```
