"""Owner-operated, explicit one-time GCP setup. No keys or DNS credentials.

Default prints a plan. apply-edge creates missing, named edge resources only;
apply-identity creates the narrowly scoped GitHub deployment identity. Existing
objects are checked instead of silently adopting or replacing unrelated ones.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

PROJECT = "visionary-fd6d2"
NUMBER = "1022011629348"
REGION = "asia-south1"
SERVICE = "visionary-product"
DOMAIN = "visionary.org.in"
DEPLOYER = f"visionary-github-deployer@{PROJECT}.iam.gserviceaccount.com"
RUNTIME = f"visionary-product-runtime@{PROJECT}.iam.gserviceaccount.com"
POOL = f"projects/{NUMBER}/locations/global/workloadIdentityPools/visionary-github"
WORKFLOW = "ecohdeep786/New_Visionary/.github/workflows/production.yml@refs/heads/main"
CONDITION = ("assertion.repository_id == '1357462978' && "
             "assertion.repository_owner_id == '221676162' && "
             "assertion.ref == 'refs/heads/main' && "
             f"assertion.workflow_ref == '{WORKFLOW}' && "
             "(assertion.event_name == 'push' || assertion.event_name == 'workflow_dispatch')")
BACKEND = f"https://www.googleapis.com/compute/v1/projects/{PROJECT}/global/backendServices/"


def gcloud(args, missing=False):
    result = subprocess.run(["gcloud", *args, f"--project={PROJECT}", "--quiet", "--format=json"], text=True, capture_output=True, timeout=300)
    if result.returncode:
        if missing and ("NOT_FOUND" in result.stderr or "was not found" in result.stderr):
            return None
        raise RuntimeError(f"GCP command failed: {' '.join(args[:4])}\n{result.stderr}")
    return json.loads(result.stdout) if result.stdout.strip() else {}


def ensure(describe, create, matches):
    found = gcloud(describe, missing=True)
    if found is None:
        gcloud(create)
        found = gcloud(describe)
    if not matches(found):
        raise RuntimeError(f"Existing resource differs from this plan: {' '.join(describe[:4])}")
    print("Verified:", " ".join(describe[:4]))
    return found


def edge_urlmap():
    return {"name": "visionary-product-web", "defaultUrlRedirect": {"hostRedirect": DOMAIN, "httpsRedirect": True, "stripQuery": False},
            "hostRules": [{"hosts": [DOMAIN], "pathMatcher": "product"}],
            "pathMatchers": [{"name": "product", "defaultService": BACKEND + "visionary-product-web", "routeRules": [
                {"priority": 1, "matchRules": [{"fullPathMatch": "/__deploy-check", "ignoreCase": False}],
                 "service": BACKEND + "visionary-product-candidate"}]}],
            "tests": [{"host": DOMAIN, "path": "/__deploy-check", "service": BACKEND + "visionary-product-candidate"},
                      *[{"host": DOMAIN, "path": path, "service": BACKEND + "visionary-product-web"}
                        for path in ["/login", "/api/auth/me", "/__deploy-check/", "/__deploy-check/api/auth/me", "/__deploy-check-other", "/__DEPLOY-CHECK"]]]}


def ensure_url_map(desired):
    describe = ["compute", "url-maps", "describe", desired["name"], "--global"]
    found = gcloud(describe, missing=True)
    with tempfile.TemporaryDirectory(prefix="visionary-edge-") as temporary:
        source = Path(temporary) / "urlmap.json"
        source.write_text(json.dumps(desired), encoding="utf-8")
        if found is None:
            gcloud(["compute", "url-maps", "import", desired["name"], f"--source={source}", "--global"])
            found = gcloud(describe)
        if any(found.get(key) != desired[key] for key in ["defaultUrlRedirect", "hostRules", "pathMatchers"]):
            raise RuntimeError("Existing URL map differs; review it manually rather than overwriting it.")
        # The validate API targets an existing URL map, so import it before validating on first setup.
        gcloud(["compute", "url-maps", "validate", f"--source={source}", "--global", "--load-balancing-scheme=EXTERNAL_MANAGED"])
    return found


def apply_edge():
    gcloud(["services", "enable", "compute.googleapis.com"])
    address = ensure(["compute", "addresses", "describe", "visionary-product-ip", "--global"],
                     ["compute", "addresses", "create", "visionary-product-ip", "--global", "--ip-version=IPV4", "--network-tier=PREMIUM"],
                     lambda x: x.get("addressType") == "EXTERNAL" and x.get("ipVersion") == "IPV4")
    for neg, backend, tag in [("visionary-product-mumbai", "visionary-product-web", None), ("visionary-product-candidate", "visionary-product-candidate", "ci-candidate")]:
        neg_flags = [f"--region={REGION}"]
        ensure(["compute", "network-endpoint-groups", "describe", neg, *neg_flags],
               ["compute", "network-endpoint-groups", "create", neg, *neg_flags, "--network-endpoint-type=SERVERLESS", f"--cloud-run-service={SERVICE}", *([f"--cloud-run-tag={tag}"] if tag else [])],
               lambda x, tag=tag: x.get("networkEndpointType") == "SERVERLESS" and x.get("cloudRun", {}).get("service") == SERVICE and x.get("cloudRun", {}).get("tag", "") == (tag or ""))
        forwarded_for = "X-Forwarded-For:{client_ip_address},{server_ip_address}"
        backend_obj = ensure(["compute", "backend-services", "describe", backend, "--global"],
                             ["compute", "backend-services", "create", backend, "--global", "--load-balancing-scheme=EXTERNAL_MANAGED", "--protocol=HTTP", "--custom-request-header=" + forwarded_for],
                             lambda x: x.get("loadBalancingScheme") == "EXTERNAL_MANAGED" and not x.get("enableCDN", False) and not x.get("healthChecks"))
        group = f"https://www.googleapis.com/compute/v1/projects/{PROJECT}/regions/{REGION}/networkEndpointGroups/{neg}"
        existing = [entry.get("group") for entry in backend_obj.get("backends", [])]
        if not existing:
            gcloud(["compute", "backend-services", "add-backend", backend, "--global", f"--network-endpoint-group={neg}", f"--network-endpoint-group-region={REGION}"])
        elif existing != [group]:
            raise RuntimeError("Backend has unexpected endpoint groups; refusing to modify it.")
        headers = backend_obj.get("customRequestHeaders", [])
        if headers != [forwarded_for]:
            if headers:
                raise RuntimeError("Backend has unexpected custom request headers; refusing to replace them.")
            gcloud(["compute", "backend-services", "update", backend, "--global", "--custom-request-header=" + forwarded_for])
            backend_obj = gcloud(["compute", "backend-services", "describe", backend, "--global"])
            if backend_obj.get("customRequestHeaders") != [forwarded_for]:
                raise RuntimeError("Load balancer did not install the verified client-IP header policy.")
    desired = edge_urlmap()
    ensure_url_map(desired)
    ensure(["compute", "ssl-certificates", "describe", "visionary-product-cert", "--global"],
           ["compute", "ssl-certificates", "create", "visionary-product-cert", "--domains=" + DOMAIN, "--global"],
           lambda x: x.get("type") == "MANAGED" and x.get("managed", {}).get("domains") == [DOMAIN])
    ensure(["compute", "target-https-proxies", "describe", "visionary-product-https", "--global"],
           ["compute", "target-https-proxies", "create", "visionary-product-https", "--url-map=visionary-product-web", "--ssl-certificates=visionary-product-cert", "--global"],
           lambda x: x.get("urlMap", "").endswith("/urlMaps/visionary-product-web") and len(x.get("sslCertificates", [])) == 1 and x["sslCertificates"][0].endswith("/sslCertificates/visionary-product-cert"))
    ensure(["compute", "forwarding-rules", "describe", "visionary-product-https", "--global"],
           ["compute", "forwarding-rules", "create", "visionary-product-https", "--global", "--load-balancing-scheme=EXTERNAL_MANAGED", "--network-tier=PREMIUM", "--address=visionary-product-ip", "--target-https-proxy=visionary-product-https", "--ports=443"],
           lambda x: x.get("IPAddress") == address["address"] and x.get("portRange") == "443-443" and x.get("target", "").endswith("/targetHttpsProxies/visionary-product-https"))
    redirect = {"name": "visionary-product-http", "defaultUrlRedirect": {"hostRedirect": DOMAIN, "httpsRedirect": True, "stripQuery": False}}
    found = gcloud(["compute", "url-maps", "describe", redirect["name"], "--global"], missing=True)
    if found is None:
        with tempfile.TemporaryDirectory(prefix="visionary-redirect-") as temporary:
            source = Path(temporary) / "redirect.json"
            source.write_text(json.dumps(redirect), encoding="utf-8")
            gcloud(["compute", "url-maps", "import", redirect["name"], f"--source={source}", "--global"])
    elif found.get("defaultUrlRedirect") != redirect["defaultUrlRedirect"]:
        raise RuntimeError("Existing HTTP redirect differs.")
    ensure(["compute", "target-http-proxies", "describe", "visionary-product-http", "--global"],
           ["compute", "target-http-proxies", "create", "visionary-product-http", "--url-map=visionary-product-http", "--global"],
           lambda x: x.get("urlMap", "").endswith("/urlMaps/visionary-product-http"))
    ensure(["compute", "forwarding-rules", "describe", "visionary-product-http", "--global"],
           ["compute", "forwarding-rules", "create", "visionary-product-http", "--global", "--load-balancing-scheme=EXTERNAL_MANAGED", "--network-tier=PREMIUM", "--address=visionary-product-ip", "--target-http-proxy=visionary-product-http", "--ports=80"],
           lambda x: x.get("IPAddress") == address["address"] and x.get("portRange") == "80-80" and x.get("target", "").endswith("/targetHttpProxies/visionary-product-http"))
    print(json.dumps({"dnsProvider": "GoDaddy", "type": "A", "name": "@", "value": address["address"], "domain": DOMAIN, "dnsChanged": False}))


def apply_identity():
    gcloud(["services", "enable", "iam.googleapis.com", "iamcredentials.googleapis.com", "sts.googleapis.com"])
    ensure(["iam", "service-accounts", "describe", DEPLOYER],
           ["iam", "service-accounts", "create", "visionary-github-deployer", "--display-name=Visionary main GitHub deployment"], lambda x: x.get("email") == DEPLOYER and not x.get("disabled"))
    ensure(["iam", "workload-identity-pools", "describe", "visionary-github", "--location=global"],
           ["iam", "workload-identity-pools", "create", "visionary-github", "--location=global", "--display-name=Visionary GitHub main"], lambda x: x.get("state") == "ACTIVE" and not x.get("disabled"))
    mappings = {"google.subject": "assertion.sub", "attribute.repository_id": "assertion.repository_id", "attribute.repository_owner_id": "assertion.repository_owner_id", "attribute.ref": "assertion.ref"}
    provider = ensure(["iam", "workload-identity-pools", "providers", "describe", "github-main", "--workload-identity-pool=visionary-github", "--location=global"],
                      ["iam", "workload-identity-pools", "providers", "create-oidc", "github-main", "--workload-identity-pool=visionary-github", "--location=global", "--issuer-uri=https://token.actions.githubusercontent.com", "--attribute-mapping=" + ",".join(f"{k}={v}" for k, v in mappings.items()), "--attribute-condition=" + CONDITION],
                      lambda x: x.get("state") == "ACTIVE" and not x.get("disabled") and x.get("oidc", {}).get("issuerUri") == "https://token.actions.githubusercontent.com" and not x.get("oidc", {}).get("allowedAudiences") and x.get("attributeMapping") == mappings and x.get("attributeCondition") == CONDITION)
    principal = f"principalSet://iam.googleapis.com/{POOL}/attribute.repository_id/1357462978"
    for args in [
        ["iam", "service-accounts", "add-iam-policy-binding", DEPLOYER, "--role=roles/iam.workloadIdentityUser", "--member=" + principal],
        ["run", "services", "add-iam-policy-binding", SERVICE, f"--region={REGION}", "--role=roles/run.developer", "--member=serviceAccount:" + DEPLOYER],
        ["artifacts", "repositories", "add-iam-policy-binding", "visionary-product", f"--location={REGION}", "--role=roles/artifactregistry.writer", "--member=serviceAccount:" + DEPLOYER],
        ["iam", "service-accounts", "add-iam-policy-binding", RUNTIME, "--role=roles/iam.serviceAccountUser", "--member=serviceAccount:" + DEPLOYER],
    ]:
        gcloud(args)
    print(json.dumps({"GCP_WORKLOAD_IDENTITY_PROVIDER": provider["name"], "serviceAccount": DEPLOYER, "privateKeysCreated": False}))


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "plan"
    if mode == "apply-edge":
        apply_edge()
    elif mode == "apply-identity":
        apply_identity()
    elif mode == "plan":
        print(json.dumps({"project": PROJECT, "region": REGION, "domain": DOMAIN, "service": SERVICE,
                          "edge": ["1 global IPv4", "2 serverless NEGs (main and exact health-only candidate)", "2 global backend services (each replaces untrusted X-Forwarded-For)", "2 URL maps", "1 managed apex TLS certificate", "HTTP and HTTPS proxies/forwarding rules"],
                          "approvedBaseEstimateUSDPer730Hours": 18.25, "usageAdditional": True,
                          "identity": DEPLOYER, "condition": CONDITION,
                          "grants": ["WIF user on deployer for exact repository identity", "Run developer on existing service", "Artifact Registry writer on existing repository", "actAs on existing runtime identity"],
                          "forwardedForOverride": "X-Forwarded-For:{client_ip_address},{server_ip_address}",
                          "dnsChanged": False, "workflowActivated": False, "urlmap": edge_urlmap()}, indent=2))
    else:
        raise SystemExit("Use plan, apply-edge or apply-identity.")
