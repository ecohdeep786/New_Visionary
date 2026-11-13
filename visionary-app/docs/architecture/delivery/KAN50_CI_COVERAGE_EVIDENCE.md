# KAN-50 / PLAT-06 product CI evidence

The product workflow runs on pull requests and pushes to dev, main, and beta. The production job requires successful checks and runs only on trusted main events in the product repository with publishing enabled. It builds and smoke-tests the production image before publishing and passes the published image to the separately enabled deployment step.

## Repeat the checks

Run from `visionary-app`.

```sh
npm --prefix frontend ci --ignore-scripts --no-audit --no-fund
node infrastructure/gcp/ci-audit.mjs
node --test infrastructure/gcp/tests/ci-audit.test.mjs infrastructure/gcp/tests/release.test.mjs
```

The audit parses the actual workflow and checks triggers, permissions, pinned actions, required build and test steps, dependency audits, keyless authentication, contract setup, image smoke and publication order, deployment wiring, and job timeouts. Dependency audits cover the production runtime, integration contracts, and data job. Regression tests exercise disabled or commented checks, widened permissions, static credentials, a foreign federation provider, and release gating failures.

The release behavior tests independently exercise candidate checks before traffic moves, stale-main refusal, promotion and post-promotion rollback. The workflow audit checks the deployment command and its inputs. It does not infer execution from markers in the release source.

## Hosted evidence

[Production run 39405370084](https://github.com/ecohdeep786/New_Visionary/actions/runs/39405370084) completed checks, image build, container smoke, keyless publish, and deployment. The [production runbook](../../../infrastructure/gcp/README.md) records the no-traffic candidate probe, promotion, and operator rollback to the initial baseline followed by restoration. The KAN-47 production receipt records a later rollback from secret version 2 to version 1 and restoration of version 2.

The candidate route checks a Cloud Run revision on the production service. The container smoke runs with no network. Hosted staging with isolated identity and data remains an open phase acceptance item. The owner removed `visionary-uat` from the product plan, and this task has not provisioned a replacement environment.
