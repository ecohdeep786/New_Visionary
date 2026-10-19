#!/usr/bin/env bash
set -euo pipefail
kan29_revision="${1:-}"
kan29_public_config="${2:-}"
[[ "$kan29_revision" =~ ^[a-f0-9]{40}$ && -f "$kan29_public_config" ]] || { echo 'Supply the exact source SHA and a public Firebase Web SDK JSON file.' >&2; exit 2; }
[[ -f infrastructure/gcp/Dockerfile && -f backend/upstream/backend/tsconfig.product.json ]] || { echo 'Run from the extracted product root.' >&2; exit 2; }
kan29_project='visionary-fd6d2'
kan29_region='asia-south1'
kan29_registry="${kan29_region}-docker.pkg.dev"
kan29_image="${kan29_registry}/${kan29_project}/visionary-product/product:${kan29_revision}"
kan29_build_args=()
while IFS= read -r kan29_arg; do kan29_build_args+=(--build-arg "$kan29_arg"); done < <(python3 - "$kan29_public_config" <<'PY'
import json,sys
config=json.load(open(sys.argv[1],encoding='utf-8'))
keys=['VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_APP_ID','VITE_FIREBASE_STORAGE_BUCKET','VITE_FIREBASE_MESSAGING_SENDER_ID']
if config.get('VITE_FIREBASE_PROJECT_ID')!='visionary-fd6d2' or any(not isinstance(config.get(k,''),str) or '\n' in config.get(k,'') or '\r' in config.get(k,'') for k in keys) or any(not config.get(k) for k in keys[:4]):
    raise SystemExit('Invalid/mismatched public Firebase build configuration')
for key in keys:
    print(key+'='+config.get(key,''))
PY
)
[[ "${#kan29_build_args[@]}" -eq 12 ]] || { echo 'Public build configuration did not validate.' >&2; exit 2; }
# A temporary credential-helper reference contains no copied password/key. Cloud
# Shell's existing authorized gcloud session supplies short-lived registry access.
export DOCKER_CONFIG
DOCKER_CONFIG="$(mktemp -d /tmp/kan29-docker-config-XXXXXXXX)"
printf '{"credHelpers":{"%s":"gcloud"}}\n' "$kan29_registry" > "$DOCKER_CONFIG/config.json"
gcloud artifacts repositories describe visionary-product --location="$kan29_region" --project="$kan29_project" >/dev/null 2>&1 || gcloud artifacts repositories create visionary-product --repository-format=docker --location="$kan29_region" --project="$kan29_project" --quiet
docker build -f infrastructure/gcp/Dockerfile --label "org.opencontainers.image.revision=$kan29_revision" "${kan29_build_args[@]}" -t "$kan29_image" .
docker push "$kan29_image"
gcloud artifacts docker images describe "$kan29_image" --project="$kan29_project" --format=json > image-receipt.json
printf 'Built and pushed exact source %s. Image receipt saved; no service has been deployed.\n' "$kan29_revision"
