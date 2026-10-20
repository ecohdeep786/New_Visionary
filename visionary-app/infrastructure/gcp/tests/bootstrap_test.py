import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import bootstrap  # noqa: E402


class MissingResourceTests(unittest.TestCase):
    def test_recognizes_run_service_message(self):
        self.assertTrue(bootstrap.missing_resource(
            "ERROR: (gcloud.run.services.describe) Cannot find service [visionary-product]"))

    def test_recognizes_not_found_marker(self):
        self.assertTrue(bootstrap.missing_resource("ERROR: NOT_FOUND: resource missing"))

    def test_does_not_hide_other_failures(self):
        self.assertFalse(bootstrap.missing_resource("PERMISSION_DENIED: caller lacks access"))


class EnsureRetryTests(unittest.TestCase):
    def test_retries_describe_after_create(self):
        describe = ["example", "describe", "thing"]
        create = ["example", "create", "thing"]
        reads = 0
        calls = []

        def fake_gcloud(args, missing=False):
            nonlocal reads
            calls.append(args)
            if args == describe:
                reads += 1
                return None if reads <= 2 else {"ready": True}
            if args == create:
                return {}
            self.fail(f"Unexpected gcloud call: {args}")

        with patch.object(bootstrap, "gcloud", side_effect=fake_gcloud), patch.object(bootstrap.time, "sleep") as sleep:
            self.assertEqual(bootstrap.ensure(describe, create, lambda x: x.get("ready")), {"ready": True})

        sleep.assert_called_once_with(2)
        self.assertEqual(calls, [describe, create, describe, describe])


class PlaceholderServiceTests(unittest.TestCase):
    def service(self):
        return {
            "metadata": {"annotations": {"run.googleapis.com/maxScale": "1", "run.googleapis.com/ingress": "all"}},
            "spec": {"template": {"spec": {
                "serviceAccountName": bootstrap.RUNTIME,
                "containerConcurrency": 20,
                "timeoutSeconds": 30,
                "containers": [{
                    "image": bootstrap.PLACEHOLDER_IMAGE,
                    "resources": {"limits": {"cpu": "1", "memory": "512Mi"}},
                }],
            }}},
        }

    def test_accepts_exact_placeholder(self):
        self.assertTrue(bootstrap.placeholder_service(self.service()))

    def test_rejects_unrelated_or_unbounded_services(self):
        mutations = [
            lambda s: s["spec"]["template"]["spec"]["containers"][0].update(image="example.test/product:latest"),
            lambda s: s["spec"]["template"]["spec"].update(serviceAccountName="owner@example.test"),
            lambda s: s["spec"]["template"]["spec"].update(containerConcurrency=80),
            lambda s: s["spec"]["template"]["spec"].update(timeoutSeconds=300),
            lambda s: s["spec"]["template"]["spec"]["containers"][0]["resources"]["limits"].update(memory="1Gi"),
            lambda s: s["metadata"]["annotations"].update({"run.googleapis.com/maxScale": "10"}),
            lambda s: s["metadata"]["annotations"].update({"run.googleapis.com/ingress": "internal"}),
        ]
        for mutate in mutations:
            service = self.service()
            mutate(service)
            self.assertFalse(bootstrap.placeholder_service(service))

    def test_fresh_foundation_sets_service_cap_before_placeholder_validation(self):
        service = self.service()
        service['metadata']['annotations'].pop('run.googleapis.com/maxScale')
        service['status'] = {'url': 'https://placeholder.run.app'}
        calls = []
        reads = 0

        def fake_gcloud(args, missing=False):
            nonlocal reads
            calls.append(args)
            if args[:3] == ['run', 'services', 'describe']:
                reads += 1
                return None if reads == 1 else service
            if args[:3] == ['run', 'services', 'update']:
                self.assertIn('--max=1', args)
                service['metadata']['annotations']['run.googleapis.com/maxScale'] = '1'
            return {}

        with patch.object(bootstrap, 'gcloud', side_effect=fake_gcloud), patch.object(bootstrap, 'ensure'), patch.object(bootstrap, 'ensure_secret'):
            bootstrap.apply_foundation()
        operations = [args[2] for args in calls if args[:2] == ['run', 'services']]
        self.assertEqual(operations, ['describe', 'describe', 'update', 'describe', 'update-traffic'])


class RunGcloudTests(unittest.TestCase):
    def test_windows_cmd_shim_uses_shell(self):
        with patch.object(bootstrap.os, "name", "nt"), patch.object(bootstrap.subprocess, "run", return_value="ok") as run:
            self.assertEqual(bootstrap.run_gcloud(["services", "list"], capture_output=True), "ok")
        args, kwargs = run.call_args
        self.assertIsInstance(args[0], str)
        self.assertIn("gcloud services list", args[0])
        self.assertTrue(kwargs["shell"])

    def test_non_windows_uses_argument_list(self):
        with patch.object(bootstrap.os, "name", "posix"), patch.object(bootstrap.subprocess, "run", return_value="ok") as run:
            self.assertEqual(bootstrap.run_gcloud(["services", "list"]), "ok")
        args, kwargs = run.call_args
        self.assertEqual(args[0], ["gcloud", "services", "list"])
        self.assertNotIn("shell", kwargs)


class EnsureSecretTests(unittest.TestCase):
    def test_retries_until_version_is_enabled(self):
        reads = 0

        def fake_gcloud(args, missing=False):
            nonlocal reads
            if args[:2] == ["secrets", "describe"]:
                return {"name": bootstrap.SECRET}
            if args[:3] == ["secrets", "versions", "describe"]:
                reads += 1
                return None if reads == 1 else {"state": "ENABLED"}
            self.fail(f"Unexpected gcloud call: {args}")

        with patch.object(bootstrap, "gcloud", side_effect=fake_gcloud), patch.object(bootstrap.time, "sleep") as sleep:
            self.assertEqual(bootstrap.ensure_secret(), {"name": bootstrap.SECRET})

        sleep.assert_called_once_with(2)
        self.assertEqual(reads, 2)


class EnsureUrlMapTests(unittest.TestCase):
    def test_first_run_imports_before_validating(self):
        desired = bootstrap.edge_urlmap()
        existing = {
            "defaultUrlRedirect": desired["defaultUrlRedirect"],
            "hostRules": desired["hostRules"],
            "pathMatchers": desired["pathMatchers"],
        }
        calls = []

        def fake_gcloud(args, missing=False):
            calls.append((args, missing))
            if args[:4] == ["compute", "url-maps", "describe", desired["name"]]:
                return None if missing else existing
            if args[:3] == ["compute", "url-maps", "import"]:
                source = Path(args[4].removeprefix("--source="))
                self.assertEqual(json.loads(source.read_text(encoding="utf-8")), desired)
                return {}
            if args[:3] == ["compute", "url-maps", "validate"]:
                source = Path(args[3].removeprefix("--source="))
                self.assertEqual(json.loads(source.read_text(encoding="utf-8")), desired)
                return {"loadSucceeded": True, "testPassed": True}
            self.fail(f"Unexpected gcloud call: {args}")

        with patch.object(bootstrap, "gcloud", side_effect=fake_gcloud):
            self.assertEqual(bootstrap.ensure_url_map(desired), existing)

        operation_order = [args[2] for args, _ in calls if args[:2] == ["compute", "url-maps"]]
        self.assertEqual(operation_order, ["describe", "import", "describe", "validate"])


if __name__ == "__main__":
    unittest.main()
