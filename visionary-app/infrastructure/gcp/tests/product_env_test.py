"""Structural tests for the reviewed product environment configuration.

These run without gcloud: they exercise the pure desired-config functions and
the fail-closed validator, proving that no public/unbounded surface and no
embedded credential can pass review.
"""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import product_env  # noqa: E402


class DesiredConfigTests(unittest.TestCase):
    def test_sql_is_private_with_recovery_and_two_databases(self):
        sql = product_env.desired_sql()
        self.assertTrue(sql["privateNetwork"])
        self.assertFalse(sql["publicIp"])
        self.assertTrue(sql["sslRequired"])
        self.assertTrue(sql["backupEnabled"])
        self.assertTrue(sql["pointInTimeRecoveryEnabled"])
        self.assertEqual(sql["databases"], ["visionary_app", "visionary_retrieval"])
        self.assertEqual(sql["authorizedIamMembers"],
                         ["serviceAccount:" + product_env.RUNTIME])

    def test_bucket_is_private_by_construction(self):
        bucket = product_env.desired_bucket()
        self.assertTrue(bucket["uniformBucketLevelAccess"])
        self.assertEqual(bucket["publicAccessPrevention"], "enforced")
        self.assertEqual(bucket["publicIamMembers"], [])

    def test_queue_is_bounded(self):
        queue = product_env.desired_queue()
        self.assertGreater(queue["maxDispatchesPerSecond"], 0)
        self.assertGreaterEqual(queue["maxAttempts"], 1)
        self.assertLessEqual(queue["maxAttempts"], 10)
        self.assertLessEqual(queue["maxRetryDurationSeconds"], 6 * 3600)

    def test_armor_throttles_with_bounded_rate(self):
        armor = product_env.desired_armor()
        rule = armor["rules"][0]
        self.assertEqual(rule["action"], "throttle")
        self.assertEqual(rule["rateLimit"]["exceedAction"], "429")
        self.assertGreater(rule["rateLimit"]["rate"]["value"], 0)
        self.assertEqual(sorted(armor["attachedBackends"]),
                         ["visionary-product-candidate", "visionary-product-web"])


class ValidateTests(unittest.TestCase):
    def base(self):
        return product_env.environment()

    def test_reviewed_config_passes(self):
        self.assertEqual(product_env.validate(self.base()), [])

    def test_public_sql_refuses(self):
        config = self.base()
        config["sql"]["publicIp"] = True
        self.assertTrue(any("private-network" in p for p in product_env.validate(config)))

    def test_public_bucket_refuses(self):
        config = self.base()
        config["bucket"]["publicAccessPrevention"] = "inherited"
        config["bucket"]["publicIamMembers"] = ["allUsers"]
        problems = product_env.validate(config)
        self.assertTrue(any("public access prevention" in p for p in problems))
        self.assertTrue(any("no public IAM members" in p for p in problems))

    def test_unbounded_queue_refuses(self):
        config = self.base()
        config["queue"]["maxAttempts"] = 0
        self.assertTrue(any("bounded retries" in p for p in product_env.validate(config)))

    def test_missing_armor_throttle_refuses(self):
        config = self.base()
        config["armor"]["rules"][0]["action"] = "allow"
        self.assertTrue(any("throttle" in p for p in product_env.validate(config)))

    def test_embedded_credential_refuses(self):
        config = self.base()
        config["bucket"]["note"] = "password: hunter2"
        problems = product_env.validate(config)
        self.assertTrue(any("password" in p for p in problems))


if __name__ == "__main__":
    unittest.main()
