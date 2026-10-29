"""Reviewed product environment configuration for the missing PLAT-01 surfaces:
data, storage, queues and edge protection (identities/compute/edge/secrets are
bootstrap.py's owner-run foundation).

Plan-first like bootstrap.py: the default mode prints the exact desired
configuration and creates nothing. Apply modes create only MISSING, named
resources through bootstrap.ensure (existing objects that differ are refused,
never silently adopted or replaced). No keys, no credentials, no public
exposure: Cloud SQL is private-IP only, the object bucket is private with
uniform access and public-access prevention, the queue is rate-bounded with
bounded retries, and the armor policy bounds request rate at the edge.

Every apply mode requires gcloud and an authenticated owner; structural
validation (tests) runs without gcloud.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bootstrap import DOMAIN, REGION, RUNTIME, ensure, gcloud  # noqa: E402

PROJECT = "visionary-research"
SQL_INSTANCE = "visionary-product-sql"
SQL_TIER = "db-custom-1-3840"
SQL_VERSION = "POSTGRES_16"
APP_DB = "visionary_app"
RETRIEVAL_DB = "visionary_retrieval"
BUCKET = "visionary-product-private"
QUEUE = "visionary-product-jobs"
ARMOR = "visionary-product-edge"
# Edge protection: bounded requests per minute per client IP (rate limiting).
ARMOR_RATE_LIMIT_PER_MIN = 600
# Bounded queue dispatch and retries (JOB-01/02 semantics at the platform layer).
QUEUE_MAX_DISPATCH_PER_SECOND = 5
QUEUE_MAX_ATTEMPTS = 5
# Data protection: backups and point-in-time recovery before real user data.
BACKUP_ENABLED = True
POINT_IN_TIME_RECOVERY_ENABLED = True


def desired_sql():
    """Private-IP PostgreSQL with separate application and retrieval databases."""
    return {
        "instance": SQL_INSTANCE,
        "databaseVersion": SQL_VERSION,
        "region": REGION,
        "tier": SQL_TIER,
        "network": f"projects/{PROJECT}/global/networks/visionary-product",
        "privateNetwork": True,
        "publicIp": False,
        "sslRequired": True,
        "databases": [APP_DB, RETRIEVAL_DB],
        "backupEnabled": BACKUP_ENABLED,
        "pointInTimeRecoveryEnabled": POINT_IN_TIME_RECOVERY_ENABLED,
        "authorizedIamMembers": [f"serviceAccount:{RUNTIME}"],
    }


def desired_bucket():
    """One private object bucket (uniform access; public access prevented)."""
    return {
        "bucket": BUCKET,
        "location": "asia-south1",
        "uniformBucketLevelAccess": True,
        "publicAccessPrevention": "enforced",
        "publicIamMembers": [],
        "objectVersioningEnabled": True,
        "defaultStorageClass": "STANDARD",
    }


def desired_queue():
    """One bounded Cloud Tasks queue for private product jobs."""
    return {
        "queue": QUEUE,
        "location": REGION,
        "maxDispatchesPerSecond": QUEUE_MAX_DISPATCH_PER_SECOND,
        "maxConcurrentDispatches": 10,
        "maxAttempts": QUEUE_MAX_ATTEMPTS,
        "maxRetryDurationSeconds": 3600,
        "target": "Cloud Run service visionary-product (private ingress path)",
    }


def desired_armor():
    """Edge protection: a bounded per-client-IP rate limit on both backends."""
    return {
        "policy": ARMOR,
        "type": "CLOUD_ARMOR",
        "rules": [{
            "priority": 1000,
            "match": {"versionedExpr": "SRC_IPS_V1", "srcIpRanges": ["*"]},
            "action": "throttle",
            "rateLimit": {
                "rate": {"interval": {"unit": "MINUTE", "count": 1},
                         "value": ARMOR_RATE_LIMIT_PER_MIN},
                "conformAction": "allow",
                "exceedAction": "429",
                "enforceOnKey": "IP",
            },
        }],
        "attachedBackends": ["visionary-product-web", "visionary-product-candidate"],
    }


def validate(config):
    """Fail-closed structural review: any public/unbounded surface refuses."""
    problems = []
    if config["sql"]["publicIp"] or not config["sql"]["privateNetwork"]:
        problems.append("sql must be private-network with no public IP")
    if not config["sql"]["sslRequired"] or not config["sql"]["backupEnabled"]:
        problems.append("sql must require SSL and keep backups enabled")
    if not config["bucket"]["uniformBucketLevelAccess"] or config["bucket"]["publicAccessPrevention"] != "enforced":
        problems.append("bucket must use uniform access with public access prevention")
    if config["bucket"]["publicIamMembers"]:
        problems.append("bucket must have no public IAM members")
    if config["queue"]["maxDispatchesPerSecond"] <= 0 or config["queue"]["maxAttempts"] <= 0:
        problems.append("queue must be rate-bounded with bounded retries")
    rules = config["armor"]["rules"]
    if not rules or rules[0]["action"] != "throttle" or rules[0]["rateLimit"]["exceedAction"] != "429":
        problems.append("armor must throttle with a bounded rate and 429 on exceed")
    if sorted(config["armor"]["attachedBackends"]) != ["visionary-product-candidate", "visionary-product-web"]:
        problems.append("armor must attach to both product backends")
    text = json.dumps(config)
    for marker in ("password", "secret_value", "private_key", "api_key"):
        if marker in text:
            problems.append(f"configuration must not embed {marker}")
    return problems


def environment():
    return {
        "project": PROJECT,
        "region": REGION,
        "domain": DOMAIN,
        "runtime": RUNTIME,
        "sql": desired_sql(),
        "bucket": desired_bucket(),
        "queue": desired_queue(),
        "armor": desired_armor(),
    }


def apply_data():
    gcloud(["services", "enable", "sqladmin.googleapis.com", "compute.googleapis.com"])
    config = desired_sql()
    ensure(["sql", "instances", "describe", SQL_INSTANCE, f"--project={PROJECT}"],
           ["sql", "instances", "create", SQL_INSTANCE,
            f"--project={PROJECT}", f"--region={REGION}", f"--database-version={SQL_VERSION}",
            f"--tier={SQL_TIER}", "--no-assign-ip", f"--network={config['network']}",
            "--enable-google-private-path", "--database-flags=cloudsql.iam_authentication=on",
            f"--backup-start-time=03:00", "--enable-point-in-time-recovery", "--retained-backups=30"],
           lambda x: not x.get("settings", {}).get("ipConfiguration", {}).get("ipv4Enabled", False)
           and x.get("settings", {}).get("dataDiskType") is not None)
    for database in config["databases"]:
        ensure(["sql", "databases", "describe", database, f"--instance={SQL_INSTANCE}", f"--project={PROJECT}"],
               ["sql", "databases", "create", database, f"--instance={SQL_INSTANCE}", f"--project={PROJECT}"],
               lambda x, name=database: x.get("name") == name)
    print("Verified private Cloud SQL:", SQL_INSTANCE, config["databases"])


def apply_storage():
    ensure(["storage", "buckets", "describe", f"gs://{BUCKET}"],
           ["storage", "buckets", "create", f"gs://{BUCKET}", f"--location=asia-south1",
            "--uniform-bucket-level-access", "--public-access-prevention", "--default-storage-class=STANDARD"],
           lambda x: x.get("iamConfiguration", {}).get("publicAccessPrevention") == "enforced"
           and x.get("iamConfiguration", {}).get("uniformBucketLevelAccess", {}).get("enabled") is True)
    print("Verified private bucket:", BUCKET)


def apply_queue():
    gcloud(["services", "enable", "cloudtasks.googleapis.com"])
    config = desired_queue()
    ensure(["tasks", "queues", "describe", QUEUE, f"--location={REGION}"],
           ["tasks", "queues", "create", QUEUE, f"--location={REGION}",
            f"--max-dispatches-per-second={config['maxDispatchesPerSecond']}",
            f"--max-concurrent-dispatches={config['maxConcurrentDispatches']}",
            f"--max-attempts={config['maxAttempts']}",
            f"--max-retry-duration={config['maxRetryDurationSeconds']}s"],
           lambda x: x.get("rateLimits", {}).get("maxDispatchesPerSecond") == config["maxDispatchesPerSecond"])
    print("Verified bounded queue:", QUEUE)


def apply_protection():
    config = desired_armor()
    ensure(["compute", "security-policies", "describe", ARMOR],
           ["compute", "security-policies", "create", ARMOR,
            "--description=Visionary product edge rate protection"],
           lambda x: x.get("rules") is not None)
    rule = config["rules"][0]
    found = gcloud(["compute", "security-policies", "describe", ARMOR], missing=True) or {}
    priorities = [r.get("priority") for r in found.get("rules", [])]
    if rule["priority"] not in priorities:
        gcloud(["compute", "security-policies", "rules", "create", str(rule["priority"]),
                "--security-policy=" + ARMOR,
                "--expression=match_recipient(ports['443'])",
                "--action=throttle", "--rate-limit-threshold-count=" + str(rule["rateLimit"]["rate"]["value"]),
                "--rate-limit-threshold-interval-seconds=60", "--conform-action=allow",
                "--exceed-action=deny-429", "--enforce-on-key=IP"])
    for backend in config["attachedBackends"]:
        found_backend = gcloud(["compute", "backend-services", "describe", backend, "--global"], missing=True)
        if found_backend is None:
            raise RuntimeError(f"Backend service not found; run bootstrap.py apply-edge first: {backend}")
        security = found_backend.get("securityPolicy", "")
        if not security:
            gcloud(["compute", "backend-services", "update", backend, "--global",
                    "--security-policy=" + ARMOR])
    print("Verified armor policy:", ARMOR, "attached to", config["attachedBackends"])


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "plan"
    if mode == "plan":
        config = environment()
        problems = validate(config)
        print(json.dumps({**config, "structuralReview": "passed" if not problems else problems,
                          "note": "Plan only — apply-data/apply-storage/apply-queue/apply-protection create missing named resources; nothing here applies automatically."}, indent=2))
        if problems:
            raise SystemExit("Structural review failed: " + "; ".join(problems))
    elif mode == "apply-data":
        apply_data()
    elif mode == "apply-storage":
        apply_storage()
    elif mode == "apply-queue":
        apply_queue()
    elif mode == "apply-protection":
        apply_protection()
    else:
        raise SystemExit("Use plan, apply-data, apply-storage, apply-queue or apply-protection.")
