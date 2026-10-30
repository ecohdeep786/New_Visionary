"""VMM-10 (KAN-178) — model registry contracts (synthetic artifacts)."""
import hashlib
import json
import unittest

from vmm.registry import ModelRegistry, RegistryError
from vmm.supplychain import AccessDenied
from vmm.supplychain import build_manifest, sign_manifest

KEY = b"local-ignored-config-signing-key-0123456789abcdef"
OWNER = {"uid": "uid_owner", "role": "owner"}
CUSTODIAN = {"uid": "uid_custodian", "role": "custodian"}
CONSUMER = {"uid": "uid_consumer", "role": "consumer"}

DATASET_BYTES = b"rights-cleared seed corpus v1"
CHECKPOINT_BYTES = b"tiny-d1 weights v1 (private)"


def dataset_manifest():
    manifest = build_manifest(
        kind="dataset", artifact_id="seed-l1-core", version=1,
        digest=hashlib.sha256(DATASET_BYTES).hexdigest(), producer="mle@visionary",
        license="record-level-licenses", storage_class="private",
    )
    return manifest, sign_manifest(manifest, KEY)


def model_manifest(dataset, version=1, digest=None):
    manifest = build_manifest(
        kind="model", artifact_id="visionary-tiny-d1", version=version,
        digest=digest or hashlib.sha256(CHECKPOINT_BYTES).hexdigest(),
        producer="mle@visionary", license="owner-only-v1", storage_class="private",
        lineage=[{"id": dataset["id"], "digest": dataset["digest"]}],
    )
    return manifest, sign_manifest(manifest, KEY)


def accepted_report():
    return {"modelAccepted": True, "modelSafetyFailuresCount": 0, "slices": []}


def seeded_registry(with_artifact=True, approval=True):
    registry = ModelRegistry(KEY)
    dataset, ds_sig = dataset_manifest()
    registry.register(dataset, ds_sig)
    model, m_sig = model_manifest(dataset)
    registry.register(model, m_sig)
    if with_artifact:
        registry.attach_artifact(OWNER, "visionary-tiny-d1", 1, CHECKPOINT_BYTES)
    if approval:
        registry.attach_approval(CUSTODIAN, "visionary-tiny-d1", 1, accepted_report())
    return registry, dataset, model


class RegistrationContracts(unittest.TestCase):
    def test_rejects_wrong_signature_schema_and_immutability_violations(self):
        registry = ModelRegistry(KEY)
        dataset, ds_sig = dataset_manifest()
        registry.register(dataset, ds_sig)
        model, m_sig = model_manifest(dataset)
        registry.register(model, m_sig)  # registered FIRST

        tampered_manifest = json.loads(json.dumps(model))
        tampered_manifest["license"] = "public-domain"
        with self.assertRaises(RegistryError):
            registry.register(tampered_manifest, m_sig)  # signature no longer valid
        with self.assertRaises(RegistryError):
            registry.register({"contract": "other"}, m_sig)  # wrong schema
        model_v1_again, _ = model_manifest(dataset, digest="c" * 64)  # same id+version, different digest
        with self.assertRaises(RegistryError):
            registry.register(model_v1_again, sign_manifest(model_v1_again, KEY))

        # Idempotent identical re-registration is allowed.
        again, again_sig = model_manifest(dataset)
        self.assertTrue(registry.register(again, again_sig)["idempotent"])

    def test_lineage_breach_refused(self):
        registry = ModelRegistry(KEY)
        model, m_sig = model_manifest({"id": "ghost-dataset", "digest": "a" * 64})
        with self.assertRaises(RegistryError):
            registry.register(model, m_sig)  # parent not registered


class PinningContracts(unittest.TestCase):
    def test_deterministic_pinning_and_exact_resolve(self):
        registry, dataset, model = seeded_registry()
        pin1 = registry.pin(CONSUMER, "visionary-tiny-d1", 1)
        pin2 = registry.pin(CONSUMER, "visionary-tiny-d1", 1)
        self.assertEqual(pin1, pin2, "pinning is deterministic")
        resolved = registry.resolve(pin1)
        self.assertEqual(resolved["id"], "visionary-tiny-d1")
        self.assertEqual(resolved["version"], 1)
        self.assertEqual(resolved["digest"], hashlib.sha256(CHECKPOINT_BYTES).hexdigest())

    def test_no_floating_latest_and_unknown_versions_refused(self):
        registry, _, _ = seeded_registry()
        self.assertFalse(hasattr(registry, "resolve_latest"), "no floating-latest resolve exists")
        with self.assertRaises(RegistryError):
            registry.pin(CONSUMER, "visionary-tiny-d1", 99)


class RightsContracts(unittest.TestCase):
    def test_consumers_never_read_private_artifact_bytes(self):
        registry, _, _ = seeded_registry()
        pin = registry.pin(CONSUMER, "visionary-tiny-d1", 1)
        with self.assertRaises(AccessDenied):
            registry.load_artifact(CONSUMER, pin)  # private artifact bytes denied (typed denial)
        owner_bytes = registry.load_artifact(OWNER, pin)
        self.assertEqual(owner_bytes, CHECKPOINT_BYTES)

    def test_wrong_digest_artifact_refused(self):
        registry, dataset, model = seeded_registry(with_artifact=False)
        with self.assertRaises(RegistryError):
            registry.attach_artifact(OWNER, "visionary-tiny-d1", 1, b"wrong bytes")
        with self.assertRaises(RegistryError):
            registry.attach_artifact(CONSUMER, "visionary-tiny-d1", 1, CHECKPOINT_BYTES)  # wrong rights


class ApprovalAndRollbackContracts(unittest.TestCase):
    def test_deployment_requires_approval_and_rejects_failed_reports(self):
        registry = ModelRegistry(KEY)
        dataset, ds_sig = dataset_manifest()
        registry.register(dataset, ds_sig)
        model_v1, m1_sig = model_manifest(dataset, version=1)
        model_v2, m2_sig = model_manifest(dataset, version=2, digest="d" * 64)
        registry.register(model_v1, m1_sig)
        registry.register(model_v2, m2_sig)

        self.assertEqual(registry.deployment_status("visionary-tiny-d1", 1)["status"], "registered")
        with self.assertRaises(RegistryError):
            registry.attach_approval(CUSTODIAN, "visionary-tiny-d1", 1, {"modelAccepted": False})
        with self.assertRaises(RegistryError):
            registry.attach_approval({"uid": "x", "role": "owner"}, "visionary-tiny-d1", 1, accepted_report())
        registry.attach_approval(CUSTODIAN, "visionary-tiny-d1", 1, accepted_report())
        self.assertEqual(registry.deployment_status("visionary-tiny-d1", 1)["status"], "approved")
        self.assertEqual(registry.deployment_status("visionary-tiny-d1", 2)["status"], "registered", "v2 not approved")

    def test_deterministic_rollback_to_earlier_approved_version(self):
        registry = ModelRegistry(KEY)
        dataset, ds_sig = dataset_manifest()
        registry.register(dataset, ds_sig)
        v1, s1 = model_manifest(dataset, version=1)
        v2, s2 = model_manifest(dataset, version=2, digest="d" * 64)
        registry.register(v1, s1)
        registry.register(v2, s2)
        registry.attach_artifact(OWNER, "visionary-tiny-d1", 1, CHECKPOINT_BYTES)
        registry.attach_approval(CUSTODIAN, "visionary-tiny-d1", 1, accepted_report())
        registry.attach_approval(CUSTODIAN, "visionary-tiny-d1", 2, accepted_report())

        registry.set_served(OWNER, "visionary-tiny-d1", 2)
        receipt = registry.rollback(OWNER, "visionary-tiny-d1", from_version=2, to_version=1)
        self.assertEqual(receipt["servedVersion"], 1)
        self.assertFalse(receipt["userRecordsChanged"], "rollback never touches user records")
        self.assertEqual(registry.served_version("visionary-tiny-d1"), 1)
        # Forward rollback refused.
        with self.assertRaises(RegistryError):
            registry.rollback(OWNER, "visionary-tiny-d1", from_version=1, to_version=2)


class IndependentVerificationContracts(unittest.TestCase):
    def test_anyone_verifies_artifact_without_operator_trust(self):
        registry, dataset, model = seeded_registry()
        report = registry.verify_artifact("visionary-tiny-d1", 1, CHECKPOINT_BYTES)
        self.assertTrue(report["verified"])
        self.assertTrue(report["digestOk"] and report["signatureOk"] and report["lineageOk"])
        tampered = registry.verify_artifact("visionary-tiny-d1", 1, b"tampered weights")
        self.assertFalse(tampered["verified"])
        self.assertTrue(tampered["digestOk"] is False or tampered["digestOk"] is False)

    def test_provenance_walks_dataset_to_model(self):
        registry, dataset, model = seeded_registry()
        chain = registry.provenance("visionary-tiny-d1", 1)["chain"]
        self.assertEqual([c["kind"] for c in chain], ["model", "dataset"])
        self.assertEqual(chain[-1]["id"], "seed-l1-core")


if __name__ == "__main__":
    unittest.main()
