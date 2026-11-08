"""Product-owned, offline-plan-first GCP configuration. No automatic deployment.

Explicit owner apply pins configuration, commands and source; refuses differing
objects; verifies newly created resources. Never deletes, repairs or loads keys.
Hosted IAM/runtime/restore/worker acceptance remains separate.
"""
import argparse
import hashlib
import json
import re
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable
from bootstrap import run_gcloud

PROJECT, NUMBER, REGION = "visionary-research", "174851137514", "asia-south1"
MODES = ("network", "data", "storage", "queue", "protection")


class PlanError(RuntimeError):
    pass


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False)


def environment(kind="production", project=None, number=None):
    if kind not in ("production", "staging"):
        raise PlanError("INVALID_ENVIRONMENT")
    if kind == "production":
        project, number = project or PROJECT, number or NUMBER
        if (project, number) != (PROJECT, NUMBER):
            raise PlanError("PRODUCTION_TARGET_MISMATCH")
    if (not isinstance(project, str) or not re.fullmatch(r"[a-z][a-z0-9-]{4,61}[a-z0-9]", project)
            or not isinstance(number, str) or not re.fullmatch(r"[1-9][0-9]{5,19}", number)
            or kind == "staging" and (project == PROJECT or number == NUMBER)):
        raise PlanError("EXPLICIT_ISOLATED_PROJECT_REQUIRED")
    prefix = "visionary-product" if kind == "production" else "visionary-staging"
    runtime = f"{prefix}-runtime@{project}.iam.gserviceaccount.com"
    network = f"projects/{project}/global/networks/{prefix}"
    return {
        "version": 2, "environment": kind, "project": project, "projectNumber": number, "region": REGION, "runtime": runtime,
        "foundation": {"owner": "bootstrap.py / PLAT-03", "requiredApis": [
            "compute.googleapis.com", "servicenetworking.googleapis.com", "sqladmin.googleapis.com",
            "storage.googleapis.com", "cloudtasks.googleapis.com", "iam.googleapis.com"],
            "iam": "Existing runtime account required; SQL IAM/database grants remain DATA-02 / PLAT-03",
            "computeEdge": "Same-project Cloud Run/HTTPS foundation, deployment and VPC binding separately reviewed",
            "domain": "visionary.org.in" if kind == "production" else None},
        "network": {"name": prefix, "resource": network, "autoCreateSubnetworks": False, "routingMode": "REGIONAL",
            "range": prefix + "-services", "prefixLength": 20, "peeringService": "servicenetworking.googleapis.com"},
        "sql": {"instance": prefix + "-sql", "databaseVersion": "POSTGRES_16", "edition": "ENTERPRISE", "region": REGION,
            "tier": "db-custom-1-3840", "network": network, "publicIp": False, "sslMode": "ENCRYPTED_ONLY", "iamAuthentication": True,
            "backupEnabled": True, "pointInTimeRecoveryEnabled": True, "retainedBackups": 30, "deletionProtection": True,
            "databases": ["visionary_app", "visionary_retrieval"]},
        "bucket": {"name": project + "-product-private", "location": REGION.upper(), "uniformBucketLevelAccess": True,
            "publicAccessPrevention": "enforced", "versioning": True, "storageClass": "STANDARD", "runtimeRole": "roles/storage.objectUser"},
        "queue": {"name": prefix + "-jobs", "location": REGION, "maxDispatchesPerSecond": 5, "maxConcurrentDispatches": 10,
            "maxAttempts": 5, "maxRetryDuration": "3600s", "minBackoff": "1s", "maxBackoff": "300s", "maxDoublings": 5,
            "deliveryConfigured": False},
        "armor": {"name": prefix + "-edge", "priority": 1000, "rate": 600, "intervalSec": 60, "action": "throttle",
            "conformAction": "allow", "exceedAction": "deny(429)", "enforceOnKey": "IP", "defaultAction": "deny(403)",
            "backends": [prefix + "-web", prefix + "-candidate"]},
    }


def validate(config):
    """Only exact reviewed settings; no unknown, truthy, sparse or NaN inputs."""
    try:
        if canonical(config) == canonical(environment(config["environment"], config["project"], config["projectNumber"])):
            return []
    except (KeyError, TypeError, ValueError, PlanError):
        pass
    return ["CONFIGURATION_DIFFERS_FROM_REVIEWED_PLAN"]


class Gcloud:
    def __init__(self, project):
        if not isinstance(project, str) or not re.fullmatch(r"[a-z][a-z0-9-]{4,61}[a-z0-9]", project):
            raise PlanError("INVALID_PROJECT")
        self.project = project

    def __call__(self, args, missing=False):
        if any(x == "--project" or x.startswith("--project=") for x in args):
            raise PlanError("AMBIGUOUS_PROJECT")
        try:
            result = run_gcloud([*args, "--project=" + self.project, "--quiet", "--format=json"], text=True, capture_output=True, timeout=300)
        except (OSError, subprocess.SubprocessError) as error:
            raise PlanError("GCLOUD_TRANSPORT_UNAVAILABLE") from error
        if result.returncode:
            text = (result.stderr or "").upper()
            if missing and not any(x in text for x in ("PERMISSION", "FORBIDDEN", "SERVICE_DISABLED", "UNAUTHENTICATED")) and re.search(r"\bNOT_FOUND\b|\bHTTPERROR 404\b", text):
                return None
            raise PlanError("GCLOUD_COMMAND_FAILED")
        try:
            return json.loads(result.stdout) if result.stdout.strip() else {}
        except ValueError as error:
            raise PlanError("INVALID_GCLOUD_RESPONSE") from error


def ref(value, expected):
    return value in (expected, "https://www.googleapis.com/compute/v1/" + expected)


@dataclass(frozen=True)
class Resource:
    key: str
    reads: list
    creates: list
    matches: Callable
    required: bool = False
    collection: bool = False

    def read(self, client):
        values = []
        for args in self.reads:
            value = client(args, missing=True)
            if value is None or self.collection and value == []:
                return None
            values.append(value)
        return values[0] if len(values) == 1 else values

    def accepts(self, value):
        try:
            return self.matches(value) is True
        except (TypeError, KeyError, AttributeError, ValueError):
            return False


def resources(c, mode):
    p, n, s, b, q, a = c["project"], c["network"], c["sql"], c["bucket"], c["queue"], c["armor"]
    network = Resource("network", [["compute", "networks", "describe", n["name"]]],
        [["compute", "networks", "create", n["name"], "--subnet-mode=custom", "--bgp-routing-mode=regional"]],
        lambda x: x.get("name") == n["name"] and x.get("autoCreateSubnetworks") is False and x.get("routingConfig", {}).get("routingMode") == "REGIONAL")
    address = Resource("private-range", [["compute", "addresses", "describe", n["range"], "--global"]],
        [["compute", "addresses", "create", n["range"], "--global", "--purpose=VPC_PEERING", "--prefix-length=20", "--network=" + n["resource"]]],
        lambda x: x.get("name") == n["range"] and x.get("purpose") == "VPC_PEERING" and x.get("addressType") == "INTERNAL" and x.get("prefixLength") == 20 and ref(x.get("network"), n["resource"]))
    peering = Resource("private-peering", [["services", "vpc-peerings", "list", "--network=" + n["name"], "--service=" + n["peeringService"]]],
        [["services", "vpc-peerings", "connect", "--network=" + n["name"], "--service=" + n["peeringService"], "--ranges=" + n["range"]]],
        lambda x: isinstance(x, list) and len(x) == 1 and x[0].get("network") == f"projects/{c['projectNumber']}/global/networks/{n['name']}" and x[0].get("reservedPeeringRanges") == [n["range"]] and x[0].get("peering") == "servicenetworking-googleapis-com", collection=True)
    account = Resource("runtime-account", [["iam", "service-accounts", "describe", c["runtime"]]], [],
        lambda x: x.get("email") == c["runtime"] and x.get("disabled", False) is False, required=True)
    if mode == "network":
        return [], [network, address, peering]
    if mode == "data":
        sql = Resource("sql", [["sql", "instances", "describe", s["instance"]]], [[
            "sql", "instances", "create", s["instance"], "--region=" + REGION, "--database-version=POSTGRES_16", "--edition=enterprise",
            "--tier=" + s["tier"], "--no-assign-ip", "--network=" + n["resource"], "--ssl-mode=ENCRYPTED_ONLY",
            "--database-flags=cloudsql.iam_authentication=on", "--backup-start-time=03:00", "--enable-point-in-time-recovery",
            "--retained-backups-count=30", "--deletion-protection"]], lambda x: matches_sql(x, c))
        databases = [Resource("database-" + name, [["sql", "databases", "describe", name, "--instance=" + s["instance"]]],
            [["sql", "databases", "create", name, "--instance=" + s["instance"]]],
            lambda x, name=name: x.get("name") == name and x.get("instance") == s["instance"] and x.get("project") == p) for name in s["databases"]]
        return [network, address, peering, account], [sql, *databases]
    if mode == "storage":
        bucket = Resource("bucket", [["storage", "buckets", "describe", "gs://" + b["name"], "--raw"], ["storage", "buckets", "get-iam-policy", "gs://" + b["name"]]], [
            ["storage", "buckets", "create", "gs://" + b["name"], "--location=" + REGION, "--uniform-bucket-level-access", "--public-access-prevention", "--default-storage-class=STANDARD"],
            ["storage", "buckets", "update", "gs://" + b["name"], "--versioning"],
            ["storage", "buckets", "add-iam-policy-binding", "gs://" + b["name"], "--member=serviceAccount:" + c["runtime"], "--role=" + b["runtimeRole"]]], lambda x: matches_bucket(x, c))
        return [account], [bucket]
    if mode == "queue":
        queue = Resource("queue", [["tasks", "queues", "describe", q["name"], "--location=" + REGION]], [[
            "tasks", "queues", "create", q["name"], "--location=" + REGION, "--max-dispatches-per-second=5", "--max-concurrent-dispatches=10",
            "--max-attempts=5", "--max-retry-duration=3600s", "--min-backoff=1s", "--max-backoff=300s", "--max-doublings=5"]], lambda x: matches_queue(x, c))
        return [], [queue]
    if mode == "protection":
        policy_ref = f"projects/{p}/global/securityPolicies/{a['name']}"
        backends = [Resource("backend-" + name, [["compute", "backend-services", "describe", name, "--global"]], [],
            lambda x, name=name: x.get("name") == name and (not x.get("securityPolicy") or ref(x.get("securityPolicy"), policy_ref)), required=True) for name in a["backends"]]
        policy = Resource("armor", [["compute", "security-policies", "describe", a["name"]]], [
            ["compute", "security-policies", "create", a["name"], "--type=CLOUD_ARMOR"],
            ["compute", "security-policies", "rules", "update", "2147483647", "--security-policy=" + a["name"], "--action=deny-403"],
            ["compute", "security-policies", "rules", "create", "1000", "--security-policy=" + a["name"], "--src-ip-ranges=*", "--action=throttle",
             "--rate-limit-threshold-count=600", "--rate-limit-threshold-interval-sec=60", "--conform-action=allow", "--exceed-action=deny-429", "--enforce-on-key=IP"]], lambda x: matches_armor(x, c))
        attachments = [Resource("attach-" + name, [["compute", "backend-services", "describe", name, "--global"]],
            [["compute", "backend-services", "update", name, "--global", "--security-policy=" + a["name"]]], lambda x: ref(x.get("securityPolicy"), policy_ref)) for name in a["backends"]]
        return backends, [policy, *attachments]
    raise PlanError("INVALID_MODE")


def matches_sql(value, c):
    s, settings = c["sql"], value.get("settings", {})
    ip, backup = settings.get("ipConfiguration", {}), settings.get("backupConfiguration", {})
    return (value.get("name") == s["instance"] and value.get("state") == "RUNNABLE" and value.get("project") == c["project"] and value.get("region") == REGION
        and value.get("databaseVersion") == "POSTGRES_16" and settings.get("edition") == "ENTERPRISE" and settings.get("tier") == s["tier"]
        and ip.get("ipv4Enabled") is False and not ip.get("authorizedNetworks") and ref(ip.get("privateNetwork"), c["network"]["resource"])
        and ip.get("sslMode") == "ENCRYPTED_ONLY" and not any(x.get("type") == "PRIMARY" for x in value.get("ipAddresses", []))
        and backup.get("enabled") is True and backup.get("pointInTimeRecoveryEnabled") is True
        and backup.get("backupRetentionSettings", {}).get("retainedBackups") == 30 and backup.get("startTime") == "03:00"
        and settings.get("deletionProtectionEnabled") is True
        and settings.get("databaseFlags") == [{"name": "cloudsql.iam_authentication", "value": "on"}])


def matches_bucket(value, c):
    if not isinstance(value, list) or len(value) != 2:
        return False
    b, policy = value
    desired, iam = c["bucket"], b.get("iamConfiguration", {})
    bindings = policy.get("bindings", [])
    return (b.get("name") == desired["name"] and str(b.get("projectNumber")) == c["projectNumber"]
        and b.get("location") == desired["location"] and b.get("storageClass") == "STANDARD"
        and iam.get("publicAccessPrevention") == "enforced" and iam.get("uniformBucketLevelAccess", {}).get("enabled") is True
        and b.get("versioning", {}).get("enabled") is True
        and not b.get("lifecycle", {}).get("rule")
        and not any(member in ("allUsers", "allAuthenticatedUsers") for binding in bindings for member in binding.get("members", []))
        and [binding.get("role") for binding in bindings if "serviceAccount:" + c["runtime"] in binding.get("members", [])] == [desired["runtimeRole"]]
        and any(binding.get("role") == desired["runtimeRole"] and "serviceAccount:" + c["runtime"] in binding.get("members", []) and not binding.get("condition") for binding in bindings))


def matches_queue(value, c):
    return (value.get("name") == f"projects/{c['project']}/locations/{REGION}/queues/{c['queue']['name']}" and value.get("state") == "RUNNING"
        and value.get("rateLimits", {}).get("maxDispatchesPerSecond") == 5 and value.get("rateLimits", {}).get("maxConcurrentDispatches") == 10
        and value.get("retryConfig") == {"maxAttempts": 5, "maxRetryDuration": "3600s", "minBackoff": "1s", "maxBackoff": "300s", "maxDoublings": 5}
        and not value.get("httpTarget") and not value.get("appEngineRoutingOverride"))


def matches_armor(value, c):
    a = c["armor"]
    rules = sorted(value.get("rules", []), key=lambda r: r.get("priority", -1))
    if value.get("name") != a["name"] or value.get("type") != "CLOUD_ARMOR" or len(rules) != 2:
        return False
    throttle, default = rules
    match = {"versionedExpr": "SRC_IPS_V1", "config": {"srcIpRanges": ["*"]}}
    return (throttle.get("priority") == 1000 and throttle.get("match") == match and throttle.get("action") == "throttle"
        and throttle.get("preview", False) is False and throttle.get("rateLimitOptions") == {
            "rateLimitThreshold": {"count": 600, "intervalSec": 60}, "conformAction": "allow", "exceedAction": "deny(429)", "enforceOnKey": "IP"}
        and default.get("priority") == 2147483647 and default.get("match") == match and default.get("action") == "deny(403)" and default.get("preview", False) is False)


def reviewed_plan(c):
    if validate(c):
        raise PlanError("INVALID_PLAN")
    commands = {}
    for mode in MODES:
        required, owned = resources(c, mode)
        commands[mode] = {"prerequisites": [{"key": r.key, "observe": r.reads} for r in required],
            "resources": [{"key": r.key, "observe": r.reads, "createOnlyIfMissing": r.creates} for r in owned]}
    sources = {name: hashlib.sha256(Path(__file__).with_name(name).read_text(encoding="utf-8").encode()).hexdigest()
               for name in ("product_env.py", "bootstrap.py")}
    return {"configuration": c, "commands": commands, "sourceSha256": sources}


def digest(c):
    return hashlib.sha256(canonical(reviewed_plan(c)).encode()).hexdigest()


def reconcile(config, mode, approved_digest, client, wait=time.sleep):
    config = json.loads(canonical(config))
    if approved_digest != digest(config):
        raise PlanError("EXACT_PLAN_APPROVAL_REQUIRED")
    project = client(["projects", "describe", config["project"]])
    if project.get("projectId") != config["project"] or str(project.get("projectNumber")) != config["projectNumber"] or project.get("lifecycleState") != "ACTIVE":
        raise PlanError("OBSERVED_PROJECT_MISMATCH")
    enabled = client(["services", "list", "--enabled"])
    if not isinstance(enabled, list) or not set(config["foundation"]["requiredApis"]).issubset({x.get("config", {}).get("name") for x in enabled}):
        raise PlanError("FOUNDATION_APIS_REQUIRED")
    prerequisites, owned = resources(config, mode)
    observations = {}
    for resource in [*prerequisites, *owned]:
        value = resource.read(client)
        if value is None:
            if resource in prerequisites or resource.required:
                raise PlanError("PREREQUISITE_MISSING:" + resource.key)
        elif not resource.accepts(value):
            if not (resource.key.startswith("attach-") and isinstance(value, dict) and not value.get("securityPolicy")):
                raise PlanError("RESOURCE_DRIFT:" + resource.key)
        observations[resource.key] = value
    created = []
    for resource in owned:
        value = observations[resource.key]
        needs_attachment = resource.key.startswith("attach-") and value is not None and not value.get("securityPolicy")
        if value is not None and not needs_attachment:
            continue
        current = resource.read(client)
        if current is not None and resource.accepts(current):
            continue
        if current is not None and not (needs_attachment and isinstance(current, dict) and not current.get("securityPolicy")):
            raise PlanError("RESOURCE_DRIFT:" + resource.key)
        for args in resource.creates:
            client(args)
        for attempt in range(5):
            observed = resource.read(client)
            if observed is not None:
                if not resource.accepts(observed):
                    raise PlanError("CREATED_RESOURCE_DRIFT:" + resource.key)
                break
            if attempt == 4:
                raise PlanError("CREATED_RESOURCE_UNAVAILABLE:" + resource.key)
            wait(1)
        created.append(resource.key)
    return {"planSha256": approved_digest, "environment": config["environment"], "project": config["project"],
            "verified": [x.key for x in owned], "createdOrAttached": created,
            "scope": "Named configuration only; no hosted/runtime/IAM/restore/worker acceptance"}


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", nargs="?", default="plan", choices=["plan", *["apply-" + mode for mode in MODES]])
    parser.add_argument("--environment", choices=["staging", "production"])
    parser.add_argument("--project")
    parser.add_argument("--project-number")
    parser.add_argument("--approved-plan-sha256")
    args = parser.parse_args(argv)
    if args.mode != "plan" and not all((args.environment, args.project, args.project_number)):
        raise PlanError("EXPLICIT_APPLY_TARGET_REQUIRED")
    config = environment(args.environment or "production", args.project, args.project_number)
    if args.mode == "plan":
        print(json.dumps({**reviewed_plan(config), "planSha256": digest(config),
            "note": "Offline plan only. Owner must review exact environment/digest before explicit apply. Nothing applied."}, indent=2))
    else:
        print(json.dumps(reconcile(config, args.mode.removeprefix("apply-"), args.approved_plan_sha256, Gcloud(config["project"]))))


if __name__ == "__main__":
    try:
        main()
    except PlanError as error:
        raise SystemExit(str(error))
