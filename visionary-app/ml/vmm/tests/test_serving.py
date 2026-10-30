"""VMM-11 (KAN-179) — backend-authorized serving contracts (synthetic)."""
import json
import unittest

from vmm.registry import ModelRegistry
from vmm.serving import InferenceWorker, ServingError
from vmm.supplychain import build_manifest, sign_manifest
from vmm.tinyd1 import TinyD1, TinyD1Config

KEY = b"local-ignored-config-signing-key-0123456789abcdef"
OWNER = {"uid": "uid_owner", "role": "owner"}
CUSTODIAN = {"uid": "uid_custodian", "role": "custodian"}
BACKEND = {"kind": "backend-service", "serviceId": "backend-product", "workspaceId": "ws_personal", "scopes": ["ws_personal"]}
END_USER = {"kind": "user", "uid": "uid_learner", "workspaceId": "ws_personal"}
OTHER_SCOPE = {"kind": "backend-service", "serviceId": "backend-product", "workspaceId": "ws_other", "scopes": ["ws_personal"]}

DATASET_BYTES = b"rights-cleared seed corpus v1"
CHECKPOINT_BYTES = b"tiny-d1 weights v1 (private)"
ACTIONS = ["ACT-001", "ACT-002", "ACT-003", "ACT-004", "ACT-005"]


def train_and_register():
    """Train a real Tiny-D1 from scratch and register it in the VMM-10 registry."""
    config = TinyD1Config(input_dim=7, actions=ACTIONS, seed=7)
    model = TinyD1(config)
    samples = []
    for i in range(40):
        strong = (i % 3) != 0
        vector = [float(2 + i % 5), 0.9 if strong else 0.2, 0.9 if strong else 0.2, 3.0 if strong else 0.0, 0.9 if strong else 0.2, -1.0, 2.0]
        samples.append({"vector": vector, "action": "ACT-002" if strong else "ACT-001"})
    model.fit(samples, epochs=50)

    registry = ModelRegistry(KEY)
    dataset = build_manifest(kind="dataset", artifact_id="seed-l1-core", version=1,
                             digest=__import__("hashlib").sha256(DATASET_BYTES).hexdigest(),
                             producer="mle@visionary", license="record-level-licenses", storage_class="private")
    registry.register(dataset, sign_manifest(dataset, KEY))
    checkpoint = json.dumps({"weights": {"w1": model.w1, "b1": model.b1, "w2": model.w2, "b2": model.b2}}, separators=(",", ":")).encode()
    model_manifest = build_manifest(kind="model", artifact_id="visionary-tiny-d1", version=1,
                                    digest=__import__("hashlib").sha256(checkpoint).hexdigest(),
                                    producer="mle@visionary", license="owner-only-v1", storage_class="private",
                                    lineage=[{"id": dataset["id"], "digest": dataset["digest"]}])
    registry.register(model_manifest, sign_manifest(model_manifest, KEY))
    registry.attach_artifact(OWNER, "visionary-tiny-d1", 1, checkpoint)
    registry.attach_approval(CUSTODIAN, "visionary-tiny-d1", 1, {"modelAccepted": True, "modelSafetyFailuresCount": 0})
    pin = registry.pin(OWNER, "visionary-tiny-d1", 1)
    return registry, model, pin, checkpoint


def loader_factory(trained_model):
    def loader(artifact_bytes):
        # The real deployment would deserialize the checkpoint; the contract
        # proves the worker serves the LOADED model object.
        return trained_model
    return loader


def make_worker():
    registry, model, pin, _ = train_and_register()
    worker = InferenceWorker(registry, BACKEND)
    worker.deploy(OWNER, pin, loader_factory(model))
    return worker, registry, pin


def request(**overrides):
    base = {
        "caller": BACKEND,
        "vector": [4.0, 0.9, 0.9, 3.0, 0.85, -1.0, 2.0],
        "allowedActions": ACTIONS,
        "deadlineMs": 1000,
        "requestId": "req-1",
        "modelVersion": 1,
    }
    base.update(overrides)
    return base


def teacher(vector, allowed):
    return {"action": "ACT-001", "confidence": 1.0, "abstained": False, "probs": []}


class AuthorizationContracts(unittest.TestCase):
    def test_backend_only_end_users_and_cross_scope_denied(self):
        worker, _, _ = make_worker()
        with self.assertRaises(ServingError):
            worker.infer(request(caller=END_USER))  # no public direct endpoint
        with self.assertRaises(ServingError):
            worker.infer(request(caller={"kind": "anonymous"}))
        with self.assertRaises(ServingError):
            worker.infer(request(caller=OTHER_SCOPE))  # cross-scope denial
        response = worker.infer(request())
        self.assertFalse(response["publicEndpoint"])

    def test_worker_requires_backend_service_identity_even_to_exist(self):
        with self.assertRaises(ServingError):
            InferenceWorker(ModelRegistry(KEY), {"kind": "user", "uid": "x"})

    def test_weights_never_exposed(self):
        worker, _, _ = make_worker()
        response = worker.infer(request())
        self.assertIsNone(response.get("weights"))
        self.assertFalse(worker.weights_exposed())
        self.assertFalse(response["weightsExposed"])


class VersionedInferenceContracts(unittest.TestCase):
    def test_response_carries_pinned_model_version_and_digest(self):
        worker, registry, pin = make_worker()
        response = worker.infer(request())
        self.assertEqual(response["modelVersion"], 1)
        self.assertEqual(response["modelId"], "visionary-tiny-d1")
        self.assertEqual(response["modelDigest"], pin["digest"])

    def test_stale_request_refused_after_rollback(self):
        worker, registry, pin = make_worker()
        # v2 exists but is unapproved; simulate a served-pin move by redeploying on a v2 pin.
        v2_checkpoint = json.dumps({"weights": {"w1": [[0.0] * 7] * 8, "b1": [0.0] * 8, "w2": [[0.0] * 8] * 5, "b2": [0.0] * 5}}, separators=(",", ":")).encode()
        v2 = build_manifest(kind="model", artifact_id="visionary-tiny-d1", version=2,
                            digest=__import__("hashlib").sha256(v2_checkpoint).hexdigest(),
                            producer="mle@visionary", license="owner-only-v1", storage_class="private",
                            lineage=[{"id": "seed-l1-core", "digest": registry.provenance("visionary-tiny-d1", 1)["chain"][-1]["digest"]}])
        registry.register(v2, sign_manifest(v2, KEY))
        # Requests still referencing version 1 while the worker re-deploys on v2 are stale.
        v2_pin = registry.pin(OWNER, "visionary-tiny-d1", 2)
        registry.attach_artifact(OWNER, "visionary-tiny-d1", 2, v2_checkpoint)
        registry.attach_approval(CUSTODIAN, "visionary-tiny-d1", 2, {"modelAccepted": True, "modelSafetyFailuresCount": 0})
        worker.deploy(OWNER, v2_pin, model_loader=lambda _b: _StubModel())
        with self.assertRaises(ServingError):
            worker.infer(request(modelVersion=1))  # stale: served version moved to 2

    def test_unapproved_version_cannot_deploy(self):
        registry, model, pin, _ = train_and_register()
        # v2 registered but NOT approved.
        v2_checkpoint = b"unapproved weights"
        v2 = build_manifest(kind="model", artifact_id="visionary-tiny-d1", version=2,
                            digest=__import__("hashlib").sha256(v2_checkpoint).hexdigest(),
                            producer="mle@visionary", license="owner-only-v1", storage_class="private",
                            lineage=[{"id": "seed-l1-core", "digest": registry.provenance("visionary-tiny-d1", 1)["chain"][-1]["digest"]}])
        registry.register(v2, sign_manifest(v2, KEY))
        worker = InferenceWorker(registry, BACKEND)
        with self.assertRaises(ServingError):
            worker.deploy(OWNER, registry.pin(OWNER, "visionary-tiny-d1", 2), model_loader=lambda _b: model)


class _StubModel:
    def predict(self, vector, allowed_actions=None):
        return {"action": ACTIONS[0], "confidence": 0.9, "abstained": False, "probs": []}


class DeadlineAndFallbackContracts(unittest.TestCase):
    def test_exhausted_deadline_yields_defined_cancellation(self):
        worker, _, _ = make_worker()
        # Queue time consumed the whole budget: deterministic cancellation.
        response = worker.infer(request(deadlineMs=1000, elapsedBeforeMs=1000))
        self.assertTrue(response["cancelled"])
        self.assertEqual(response["reason"], "deadline_exceeded")
        with self.assertRaises(ServingError):
            worker.infer(request(deadlineMs=0))
        ack = worker.cancel("req-1")
        self.assertTrue(ack["cancelled"])

    def test_abstaining_model_falls_back_to_the_accepted_baseline(self):
        worker, _, _ = make_worker()
        # Vector far outside training ranges -> the model OOD-abstains.
        response = worker.infer(request(vector=[-1.0] * 7), teacher=teacher)
        self.assertEqual(response["fallback"], "policy-teacher")
        self.assertEqual(response["action"], "ACT-001")

    def test_missing_deadline_or_request_id_refused(self):
        worker, _, _ = make_worker()
        with self.assertRaises(ServingError):
            worker.infer(request(deadlineMs=None))
        with self.assertRaises(ServingError):
            worker.infer(request(requestId=""))


if __name__ == "__main__":
    unittest.main()
