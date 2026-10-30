"""BUILD-LAUNCH-01 (KAN-132) — sandbox security policy contracts (synthetic)."""
import unittest

from vmm.sandboxpolicy import (
    SandboxPolicy,
    SandboxPolicyError,
    SandboxRequest,
    SandboxRuntime,
)

KEY = b"local-ignored-config-signing-key-0123456789abcdef"
BACKEND = {"kind": "backend-service", "serviceId": "backend-product"}

POLICY = SandboxPolicy(
    max_cpu_seconds=5,
    max_wall_clock_ms=10000,
    max_memory_mb=128,
    max_output_bytes=65536,
    allowed_dependencies=["math", "json", "re"],
    allowed_env_keys=["PYTHONPATH", "SANDBOX_ID"],
)


def request(code="print('hello')", deps=None, req_id="req-1"):
    return SandboxRequest(req_id, code, deps or ["math", "json"])


class PolicyContracts(unittest.TestCase):
    def test_policy_is_immutable_and_bounded(self):
        self.assertEqual(POLICY.max_cpu_seconds, 5)
        self.assertEqual(POLICY.max_memory_mb, 128)
        self.assertIn("math", POLICY.allowed_dependencies)
        self.assertNotIn("os", POLICY.allowed_dependencies)

    def test_invalid_policies_fail_closed(self):
        for bad in [
            {"max_cpu_seconds": 0}, {"max_wall_clock_ms": 50},
            {"max_memory_mb": 8}, {"max_output_bytes": 512},
        ]:
            with self.subTest(bad):
                with self.assertRaises(SandboxPolicyError):
                    SandboxPolicy(**bad)


class DependencyContracts(unittest.TestCase):
    def test_allowlisted_dependencies_accepted(self):
        runtime = SandboxRuntime(POLICY, KEY)
        verdict = runtime.execute(request())
        self.assertEqual(verdict["outcome"], "completed")

    def test_unallowlisted_dependency_refused_before_execution(self):
        runtime = SandboxRuntime(POLICY, KEY)
        with self.assertRaises(SandboxPolicyError):
            runtime.execute(request(deps=["os", "sys"]))

    def test_denied_import_patterns_refused_in_code(self):
        for code in [
            "import os\nprint(os.listdir('/'))",
            "import subprocess\nsubprocess.run(['ls'])",
            "open('/etc/passwd')",
            "__import__('os').system('rm -rf /')",
            "import requests\nrequests.get('https://evil.com')",
            "eval('__import__(\"os\")')",
        ]:
            with self.subTest(code[:30]):
                runtime = SandboxRuntime(POLICY, KEY)
                with self.assertRaises(SandboxPolicyError):
                    runtime.execute(request(code=code))


class SecretsIsolationContracts(unittest.TestCase):
    def test_no_secrets_in_environment(self):
        runtime = SandboxRuntime(POLICY, KEY)
        with self.assertRaises(SandboxPolicyError):
            runtime.execute(request(), env={"SECRET_KEY": "super-secret"})
        with self.assertRaises(SandboxPolicyError):
            runtime.execute(request(), env={"API_TOKEN": "tok_123"})

    def test_declared_env_keys_accepted(self):
        runtime = SandboxRuntime(POLICY, KEY)
        verdict = runtime.execute(request(), env={"PYTHONPATH": "/sandbox", "SANDBOX_ID": "run-1"})
        self.assertEqual(verdict["outcome"], "completed")

    def test_undeclared_env_keys_refused(self):
        runtime = SandboxRuntime(POLICY, KEY)
        with self.assertRaises(SandboxPolicyError):
            runtime.execute(request(), env={"UNKNOWN_VAR": "value"})


class ResourceLimitContracts(unittest.TestCase):
    def test_output_bound_terminates(self):
        tight = SandboxPolicy(max_cpu_seconds=5, max_wall_clock_ms=10000, max_memory_mb=128, max_output_bytes=1024, allowed_dependencies=["math", "json"])
        runtime = SandboxRuntime(tight, KEY)
        verdict = runtime.execute(request(code="print('x' * 2000)"), simulated_output="x" * 2000)
        self.assertEqual(verdict["outcome"], "terminated")
        self.assertEqual(verdict["reason"], "output_bound_exceeded")


class ArtifactReceiptContracts(unittest.TestCase):
    def test_artifacts_captured_with_digests(self):
        runtime = SandboxRuntime(POLICY, KEY)
        verdict = runtime.execute(request(), simulated_output="hello world", simulated_exit_code=0)
        self.assertEqual(verdict["outcome"], "completed")
        self.assertEqual(len(verdict["artifacts"]), 1)
        self.assertEqual(verdict["artifacts"][0]["kind"], "stdout")
        self.assertTrue(verdict["artifacts"][0]["sha256"])
        self.assertTrue(verdict["policyDigest"])

    def test_failed_execution_still_produces_a_signed_receipt(self):
        runtime = SandboxRuntime(POLICY, KEY)
        verdict = runtime.execute(request(), simulated_output="traceback...", simulated_exit_code=1)
        self.assertEqual(verdict["outcome"], "failed")
        self.assertTrue(verdict["signature"])
        self.assertEqual(len(runtime.runs()), 1, "receipt retained")

    def test_all_verdicts_document_deny_paths(self):
        runtime = SandboxRuntime(POLICY, KEY)
        verdict = runtime.execute(request())
        self.assertEqual(verdict["filesystemAccess"], "denied")
        self.assertEqual(verdict["networkEgress"], "denied")
        self.assertFalse(verdict["secretsVisible"])
        self.assertFalse(verdict["persistedAfterExit"])


if __name__ == "__main__":
    unittest.main()
