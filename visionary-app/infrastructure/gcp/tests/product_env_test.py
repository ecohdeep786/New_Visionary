"""Command/observation contract tests. No cloud execution or credential mocks
are represented as hosted evidence. Fixtures use documented API JSON shapes."""
import copy
import json
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import product_env as p


def observed(c):
    n, s, b, q, a = (c[x] for x in ("network", "sql", "bucket", "queue", "armor"))
    match = {"versionedExpr": "SRC_IPS_V1", "config": {"srcIpRanges": ["*"]}}
    return {
        "network": {"name": n["name"], "autoCreateSubnetworks": False, "routingConfig": {"routingMode": "REGIONAL"}},
        "private-range": {"name": n["range"], "purpose": "VPC_PEERING", "addressType": "INTERNAL", "prefixLength": 20,
                          "network": "https://www.googleapis.com/compute/v1/" + n["resource"]},
        "private-peering": [{"network": f"projects/{c['projectNumber']}/global/networks/{n['name']}",
                             "reservedPeeringRanges": [n["range"]], "peering": "servicenetworking-googleapis-com"}],
        "runtime-account": {"email": c["runtime"], "disabled": False},
        "sql": {"name": s["instance"], "state": "RUNNABLE", "project": c["project"], "region": "asia-south1", "databaseVersion": "POSTGRES_16", "ipAddresses": [{"type": "PRIVATE", "ipAddress": "10.0.0.2"}],
            "settings": {"edition": "ENTERPRISE", "tier": "db-custom-1-3840", "deletionProtectionEnabled": True,
                "userLabels": {"visionary-environment": c["environment"]},
                "databaseFlags": [{"name": "cloudsql.iam_authentication", "value": "on"}],
                "ipConfiguration": {"ipv4Enabled": False, "privateNetwork": "https://www.googleapis.com/compute/v1/" + n["resource"], "sslMode": "ENCRYPTED_ONLY", "authorizedNetworks": []},
                "backupConfiguration": {"enabled": True, "pointInTimeRecoveryEnabled": True, "startTime": "03:00", "backupRetentionSettings": {"retainedBackups": 30}}}},
        "database-visionary_app": {"name": "visionary_app", "instance": s["instance"], "project": c["project"]},
        "database-visionary_retrieval": {"name": "visionary_retrieval", "instance": s["instance"], "project": c["project"]},
        "bucket": [{"name": b["name"], "projectNumber": c["projectNumber"], "location": "ASIA-SOUTH1", "storageClass": "STANDARD",
            "iamConfiguration": {"publicAccessPrevention": "enforced", "uniformBucketLevelAccess": {"enabled": True}}, "versioning": {"enabled": True}},
            {"bindings": [{"role": "roles/storage.objectUser", "members": ["serviceAccount:" + c["runtime"]]}]}],
        "queue": {"name": f"projects/{c['project']}/locations/asia-south1/queues/{q['name']}", "state": "RUNNING",
            "rateLimits": {"maxDispatchesPerSecond": 5, "maxConcurrentDispatches": 10},
            "retryConfig": {"maxAttempts": 5, "maxRetryDuration": "3600s", "minBackoff": "1s", "maxBackoff": "300s", "maxDoublings": 5}},
        "armor": {"name": a["name"], "type": "CLOUD_ARMOR", "rules": [
            {"priority": 2147483647, "action": "deny(403)", "match": match, "preview": False},
            {"priority": 1000, "action": "throttle", "match": match, "preview": False, "rateLimitOptions": {
                "rateLimitThreshold": {"count": 600, "intervalSec": 60}, "enforceOnKey": "IP", "conformAction": "allow", "exceedAction": "deny(429)"}}]},
        **{"backend-" + name: {"name": name} for name in a["backends"]},
        **{"attach-" + name: {"name": name, "securityPolicy": "https://www.googleapis.com/compute/v1/" + f"projects/{c['project']}/global/securityPolicies/{a['name']}"} for name in a["backends"]},
    }


class Client:
    """Injectable command transport; persisted observed JSON is independent of
    the command builder. Tests assert both actual argument lists and re-reads."""
    def __init__(self, c, mode, missing=()):
        self.c, self.mode, self.calls, self.mutations = c, mode, [], []
        self.required, self.owned = p.resources(c, mode)
        self.state, self.missing = observed(c), set(missing)
        self.reads, self.creates = {}, {}
        for r in [*self.required, *self.owned]:
            for i, args in enumerate(r.reads):
                self.reads[tuple(args)] = (r, i)
            for args in r.creates:
                self.creates[tuple(args)] = r

    def __call__(self, args, missing=False):
        self.calls.append(list(args))
        if args[:2] == ["projects", "describe"]:
            return {"projectId": self.c["project"], "projectNumber": self.c["projectNumber"], "lifecycleState": "ACTIVE"}
        if args[:2] == ["services", "list"]:
            return [{"config": {"name": x}} for x in self.c["foundation"]["requiredApis"]]
        key = tuple(args)
        if key in self.creates:
            r = self.creates[key]
            self.mutations.append(list(args))
            # Only complete multi-command initialization on its final command.
            if args == r.creates[-1]:
                self.missing.discard(r.key)
                if r.key.startswith("attach-"):
                    policy = next(arg.split("=", 1)[1] for arg in args if arg.startswith("--security-policy="))
                    self.state[r.key]["securityPolicy"] = f"https://www.googleapis.com/compute/v1/projects/{self.c['project']}/global/securityPolicies/{policy}"
                    self.state["backend-" + r.key.removeprefix("attach-")] = self.state[r.key]
            return {}
        r, i = self.reads[key]
        if r.key in self.missing:
            return [] if r.collection else None
        value = self.state[r.key]
        return copy.deepcopy(value[i] if len(r.reads) > 1 else value)


class PlanTests(unittest.TestCase):
    def test_offline_plan_has_no_sdk_side_effect(self):
        with patch.object(p, "run_gcloud", side_effect=AssertionError("SDK must not run")), patch("builtins.print") as output:
            p.main(["plan"])
        plan = json.loads(output.call_args.args[0])
        self.assertEqual(plan["planSha256"], p.digest(p.environment()))
        self.assertEqual(set(plan["commands"]), set(p.MODES))
        self.assertNotIn("secret_value", json.dumps(plan))

    def test_staging_is_explicit_separate_project_and_identity(self):
        for args in [("staging",), ("staging", p.PROJECT, "111222333444"), ("staging", "visionary-staging-check", p.NUMBER)]:
            with self.assertRaises(p.PlanError):
                p.environment(*args)
        c = p.environment("staging", "visionary-staging-check", "111222333444")
        self.assertNotEqual(c["runtime"], p.environment()["runtime"])
        self.assertIsNone(c["foundation"]["domain"])
        self.assertNotIn(p.PROJECT, p.canonical(p.reviewed_plan(c)))
        self.assertNotEqual(p.digest(c), p.digest(p.environment()))

    def test_unknown_or_unsafe_settings_cannot_pass_review(self):
        for section, key, value in [("sql", "publicIp", True), ("sql", "pointInTimeRecoveryEnabled", False), ("sql", "sslMode", "ALLOW_UNENCRYPTED_AND_ENCRYPTED"),
                ("sql", "backupEnabled", 1), ("sql", "authorizedIamMembers", ["allUsers"]), ("bucket", "versioning", False),
                ("bucket", "publicAccessPrevention", "inherited"), ("queue", "maxConcurrentDispatches", -1), ("queue", "maxAttempts", 0),
                ("queue", "maxDispatchesPerSecond", float("inf")), ("armor", "rate", 0), ("armor", "enforceOnKey", "ALL"), ("bucket", "password", "forbidden")]:
            with self.subTest(section=section, key=key):
                c = p.environment(); c[section][key] = value
                self.assertTrue(p.validate(c))
                with self.assertRaises((p.PlanError, ValueError)):
                    p.digest(c)

    def test_approval_includes_command_projection_and_source(self):
        c = p.environment(); original = p.digest(c)
        with patch.object(p, "resources", return_value=([], [])):
            self.assertNotEqual(original, p.digest(c))
        with patch.object(p.Path, "read_text", return_value="different source"):
            self.assertNotEqual(original, p.digest(c))

    def test_apply_requires_explicit_target_and_exact_plan_before_transport(self):
        with self.assertRaisesRegex(p.PlanError, "EXPLICIT_APPLY_TARGET"):
            p.main(["apply-queue"])
        client = Client(p.environment(), "queue", ["queue"])
        with self.assertRaisesRegex(p.PlanError, "EXACT_PLAN"):
            p.reconcile(p.environment(), "queue", "0" * 64, client)
        self.assertEqual(client.calls, [])


class ReconcileTests(unittest.TestCase):
    def apply(self, client):
        return p.reconcile(client.c, client.mode, p.digest(client.c), client, wait=lambda _: None)

    def test_existing_correct_state_is_read_only_and_replay_converges(self):
        for mode in p.MODES:
            with self.subTest(mode=mode):
                client = Client(p.environment(), mode)
                self.assertEqual(self.apply(client)["createdOrAttached"], [])
                self.assertEqual(client.mutations, [])

    def test_missing_resources_are_created_then_observed_and_repeat_has_no_writes(self):
        for mode in ("network", "data", "storage", "queue"):
            with self.subTest(mode=mode):
                c = p.environment(); required, owned = p.resources(c, mode)
                client = Client(c, mode, [r.key for r in owned])
                receipt = self.apply(client)
                self.assertEqual(receipt["createdOrAttached"], [r.key for r in owned])
                self.assertGreater(len(client.mutations), 0)
                count = len(client.mutations)
                self.assertEqual(self.apply(client)["createdOrAttached"], [])
                self.assertEqual(count, len(client.mutations))

    def test_known_drift_and_missing_prerequisites_stop_all_mutations(self):
        c = p.environment(); client = Client(c, "data", ["sql", "network"])
        with self.assertRaisesRegex(p.PlanError, "PREREQUISITE_MISSING"):
            self.apply(client)
        self.assertEqual(client.mutations, [])
        client = Client(c, "data", ["sql"]); client.state["database-visionary_retrieval"]["project"] = "foreign-project"
        with self.assertRaisesRegex(p.PlanError, "RESOURCE_DRIFT"):
            self.apply(client)
        self.assertEqual(client.mutations, [])

    def test_protection_is_verified_before_both_backend_attachments(self):
        c = p.environment(); client = Client(c, "protection", ["armor"])
        for name in c["armor"]["backends"]:
            client.state["attach-" + name] = {"name": name}
        receipt = self.apply(client)
        self.assertEqual(receipt["createdOrAttached"], ["armor", *["attach-" + x for x in c["armor"]["backends"]]])
        self.assertTrue(all(x[:2] == ["compute", "security-policies"] for x in client.mutations[:3]))
        self.assertEqual(len(client.mutations), 5)
        self.assertEqual(self.apply(client)["createdOrAttached"], [])

    def test_newly_created_resource_visibility_retry_is_bounded(self):
        c = p.environment(); client = Client(c, "queue", ["queue"])
        def transport(args, missing=False):
            result = client(args, missing)
            if args[:3] == ["tasks", "queues", "describe"]:
                return None
            return result
        waits = []
        with self.assertRaisesRegex(p.PlanError, "CREATED_RESOURCE_UNAVAILABLE"):
            p.reconcile(c, "queue", p.digest(c), transport, wait=waits.append)
        self.assertEqual(waits, [1, 1, 1, 1]); self.assertEqual(len(client.mutations), 1)

    def test_changed_state_between_preflight_and_create_is_not_overwritten(self):
        c = p.environment(); client = Client(c, "queue", ["queue"]); reads = 0
        def transport(args, missing=False):
            nonlocal reads
            if args[:3] == ["tasks", "queues", "describe"]:
                reads += 1
                if reads == 2:
                    client.missing.clear(); client.state["queue"]["retryConfig"]["maxAttempts"] = -1
            return client(args, missing)
        with self.assertRaisesRegex(p.PlanError, "RESOURCE_DRIFT"):
            p.reconcile(c, "queue", p.digest(c), transport)
        self.assertEqual(client.mutations, [])

    def test_observed_project_and_required_api_mismatch_stop_before_mutation(self):
        for fault in ("project", "apis"):
            c = p.environment(); client = Client(c, "queue", ["queue"])
            def transport(args, missing=False):
                value = client(args, missing)
                if fault == "project" and args[:2] == ["projects", "describe"]:
                    value["projectNumber"] = "111222333444"
                if fault == "apis" and args[:2] == ["services", "list"]:
                    return []
                return value
            with self.assertRaises(p.PlanError):
                p.reconcile(c, "queue", p.digest(c), transport)
            self.assertEqual(client.mutations, [])
    def test_created_but_wrong_or_unreadable_resource_is_never_verified(self):
        client = Client(p.environment(), "queue", ["queue"])
        client.state["queue"]["retryConfig"]["maxAttempts"] = -1
        with self.assertRaisesRegex(p.PlanError, "CREATED_RESOURCE_DRIFT"):
            self.apply(client)
        self.assertEqual(len(client.mutations), 1)
        with self.assertRaisesRegex(p.PlanError, "RESOURCE_DRIFT"):
            self.apply(client)
        self.assertEqual(len(client.mutations), 1)

    def test_projection_uses_real_security_flags(self):
        c = p.environment()
        sql = p.resources(c, "data")[1][0].creates[0]
        self.assertIn("--ssl-mode=ENCRYPTED_ONLY", sql); self.assertIn("--retained-backups-count=30", sql)
        self.assertNotIn("--retained-backups=30", sql)
        bucket = p.resources(c, "storage")[1][0]
        self.assertIn("--raw", bucket.reads[0]); self.assertIn("--versioning", bucket.creates[1])
        armor = p.resources(c, "protection")[1][0].creates[-1]
        self.assertIn("--src-ip-ranges=*", armor); self.assertIn("--rate-limit-threshold-interval-sec=60", armor)
        self.assertNotIn("--expression=match_recipient(ports['443'])", armor)

    def test_backend_with_foreign_policy_is_never_overwritten(self):
        client = Client(p.environment(), "protection", ["armor"])
        name = client.c["armor"]["backends"][1]
        client.state["backend-" + name]["securityPolicy"] = "projects/foreign/global/securityPolicies/other"
        # The command map shares the same describe call between prerequisite/attachment.
        client.state["attach-" + name] = client.state["backend-" + name]
        with self.assertRaisesRegex(p.PlanError, "RESOURCE_DRIFT"):
            self.apply(client)
        self.assertEqual(client.mutations, [])


class ObservationTests(unittest.TestCase):
    def check_changes(self, mode, key, changes):
        c = p.environment(); r = next(r for r in p.resources(c, mode)[1] if r.key == key)
        self.assertTrue(r.accepts(observed(c)[key]))
        for label, change in changes:
            with self.subTest(label=label):
                value = observed(c)[key]; change(value); self.assertFalse(r.accepts(value))

    def test_sql_observation_checks_all_declared_security_properties(self):
        self.check_changes("data", "sql", [
            ("PITR", lambda x: x["settings"]["backupConfiguration"].__setitem__("pointInTimeRecoveryEnabled", False)),
            ("TLS", lambda x: x["settings"]["ipConfiguration"].__setitem__("sslMode", "ALLOW_UNENCRYPTED_AND_ENCRYPTED")),
            ("foreign network", lambda x: x["settings"]["ipConfiguration"].__setitem__("privateNetwork", "projects/foreign/global/networks/other")),
            ("public", lambda x: x["settings"]["ipConfiguration"].__setitem__("ipv4Enabled", True)),
            ("IAM", lambda x: x["settings"].__setitem__("databaseFlags", [])),
            ("backups", lambda x: x["settings"]["backupConfiguration"]["backupRetentionSettings"].__setitem__("retainedBackups", 1)),
            ("identity", lambda x: x.__setitem__("project", "foreign")),
            ("suspended", lambda x: x.__setitem__("state", "SUSPENDED")),
            ("deletion", lambda x: x["settings"].__setitem__("deletionProtectionEnabled", False))])

    def test_bucket_checks_raw_versioning_iam_project_and_public_access(self):
        self.check_changes("storage", "bucket", [
            ("versioning", lambda x: x[0].__setitem__("versioning", {})),
            ("public IAM", lambda x: x[1]["bindings"].append({"role": "roles/storage.objectViewer", "members": ["allUsers"]})),
            ("authenticated public", lambda x: x[1]["bindings"].append({"role": "roles/storage.objectViewer", "members": ["allAuthenticatedUsers"]})),
            ("wrong project", lambda x: x[0].__setitem__("projectNumber", "111222333444")),
            ("missing runtime", lambda x: x[1].__setitem__("bindings", [])),
            ("excess runtime role", lambda x: x[1]["bindings"].append({"role": "roles/storage.admin", "members": ["serviceAccount:" + p.environment()["runtime"]]})),
            ("automatic purge", lambda x: x[0].__setitem__("lifecycle", {"rule": [{"action": {"type": "Delete"}, "condition": {"age": 1}}]})),
            ("uniform", lambda x: x[0]["iamConfiguration"]["uniformBucketLevelAccess"].__setitem__("enabled", False))])

    def test_queue_checks_concurrency_retries_routing_and_scope(self):
        self.check_changes("queue", "queue", [
            ("concurrency", lambda x: x["rateLimits"].__setitem__("maxConcurrentDispatches", 0)),
            ("unlimited retries", lambda x: x["retryConfig"].__setitem__("maxAttempts", -1)),
            ("wrong backoff", lambda x: x["retryConfig"].__setitem__("maxBackoff", "1s")),
            ("foreign target", lambda x: x.__setitem__("httpTarget", {"uriOverride": {"host": "example.invalid"}})),
            ("paused", lambda x: x.__setitem__("state", "PAUSED"))])

    def test_armor_rejects_preview_bypass_extra_rules_and_wrong_threshold(self):
        self.check_changes("protection", "armor", [
            ("preview", lambda x: x["rules"][1].__setitem__("preview", True)),
            ("threshold", lambda x: x["rules"][1]["rateLimitOptions"]["rateLimitThreshold"].__setitem__("count", 0)),
            ("bypass", lambda x: x["rules"].append({"priority": 1, "action": "allow"})),
            ("default allow", lambda x: x["rules"][0].__setitem__("action", "allow")),
            ("different key", lambda x: x["rules"][1]["rateLimitOptions"].__setitem__("enforceOnKey", "ALL"))])


class TransportTests(unittest.TestCase):
    def test_missing_is_narrow_and_auth_failure_never_becomes_create_permission(self):
        for stderr, missing in [("NOT_FOUND: thing", True), ("PERMISSION_DENIED: may be NOT_FOUND", False),
                ("SERVICE_DISABLED: NOT_FOUND", False), ("network timeout", False), ("resource not found maybe", False)]:
            with self.subTest(stderr=stderr), patch.object(p, "run_gcloud", return_value=SimpleNamespace(returncode=1, stderr=stderr, stdout="")) as run:
                if missing:
                    self.assertIsNone(p.Gcloud("visionary-staging-check")(["example", "describe"], missing=True))
                else:
                    with self.assertRaisesRegex(p.PlanError, "GCLOUD_COMMAND_FAILED"):
                        p.Gcloud("visionary-staging-check")(["example", "describe"], missing=True)
                self.assertIn("--project=visionary-staging-check", run.call_args.args[0])
                self.assertEqual(run.call_args.kwargs["timeout"], 300)

    def test_duplicate_target_and_malformed_json_fail_closed(self):
        with self.assertRaisesRegex(p.PlanError, "AMBIGUOUS_PROJECT"):
            p.Gcloud(p.PROJECT)(["example", "--project=foreign"])
        with patch.object(p, "run_gcloud", return_value=SimpleNamespace(returncode=0, stdout="not-json")):
            with self.assertRaisesRegex(p.PlanError, "INVALID_GCLOUD_RESPONSE"):
                p.Gcloud(p.PROJECT)(["example"])


if __name__ == "__main__":
    unittest.main()
