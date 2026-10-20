#!/usr/bin/env bash
set -euo pipefail
# Compatibility entrypoint for the historical KAN-29 Cloud Shell handoff.
# The original reviewed implementation remains in Git history at 79797d1a.
printf '%s\n' 'This manual publication flow is retired. Production uses visionary-research and the reviewed GitHub main workflow in .github/workflows/production.yml. No cloud operation was performed.' >&2
exit 2
