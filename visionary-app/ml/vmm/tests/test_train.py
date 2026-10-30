"""VMM-08 (KAN-176) — training + reproduction contracts (synthetic corpus)."""
import json
import os
import tempfile
import unittest
from pathlib import Path

from vmm.supplychain import build_manifest as vmm_manifest
from vmm.train import (
    PREDECLARED_CROSS_SEED_VARIANCE,
    PREDECLARED_MIN_HOLDOUT_AGREEMENT,
    PREDECLARED_SAME_SEED_VARIANCE,
    build_policy_corpus,
    load_checkpoint,
    register_checkpoint,
    repeat_run_experiment,
    save_checkpoint,
    train_from_scratch,
    verify_checkpoint_registration,
)
from vmm.tinyd1 import TinyD1, TinyD1Config

KEY = b"local-ignored-config-signing-key-0123456789abcdef"


class CorpusContracts(unittest.TestCase):
    def test_corpus_is_deterministic_and_digest_bound(self):
        one = build_policy_corpus(40, seed=7)
        two = build_policy_corpus(40, seed=7)
        self.assertEqual(one["corpusDigest"], two["corpusDigest"], "same seed -> identical corpus")
        self.assertEqual(len(one["samples"]), 40)
        three = build_policy_corpus(40, seed=11)
        self.assertNotEqual(one["corpusDigest"], three["corpusDigest"], "different seed -> different corpus")


class TrainingReproductionContracts(unittest.TestCase):
    def test_from_scratch_run_meets_predeclared_thresholds(self):
        run = train_from_scratch(seed=7, corpus_count=80, epochs=60)
        self.assertLess(run["finalLoss"], run["initialLoss"], "training curve decreases")
        self.assertGreaterEqual(run["holdoutAgreement"], PREDECLARED_MIN_HOLDOUT_AGREEMENT)
        self.assertEqual(run["manifest"]["seed"], 7)
        self.assertEqual(run["manifest"]["optimizer"], "sgd")
        self.assertTrue(run["manifest"]["datasetDigest"], "eligible dataset hash retained")
        self.assertTrue(run["manifest"]["runtime"].startswith("python-"), "runtime recorded")

    def test_identical_seed_reproduces_identically_variance_zero(self):
        run_a = train_from_scratch(seed=7, corpus_count=60, epochs=40)
        run_b = train_from_scratch(seed=7, corpus_count=60, epochs=40)
        self.assertEqual(run_a["trainingCurve"], run_b["trainingCurve"], "same seed -> identical curve")
        self.assertEqual(run_a["holdoutAgreement"], run_b["holdoutAgreement"])
        self.assertEqual(
            abs(run_a["holdoutAgreement"] - run_b["holdoutAgreement"]),
            PREDECLARED_SAME_SEED_VARIANCE,
            "same-seed variance stays within the predeclared bound (0)",
        )

    def test_cross_seed_variance_stays_within_the_predeclared_bound(self):
        report = repeat_run_experiment(runs=2, corpus_count=60, epochs=40)
        self.assertTrue(report["sameSeedWithinBound"])
        self.assertTrue(report["crossSeedWithinBound"], f"cross-seed spread {report['crossSeedSpread']} <= {PREDECLARED_CROSS_SEED_VARIANCE}")
        self.assertEqual(report["predeclaredBounds"]["crossSeed"], PREDECLARED_CROSS_SEED_VARIANCE)


class CheckpointContracts(unittest.TestCase):
    def test_checkpoint_roundtrip_produces_identical_predictions(self):
        run = train_from_scratch(seed=7, corpus_count=60, epochs=40)
        model = run["model"]
        probe = run["model"].config.actions  # any probe vector
        probe_vector = [0.8, 0.9, 0.9, 3.0, 0.85, -1.0, 2.0]
        before = model.predict(probe_vector)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "tiny-d1-v1.checkpoint.json"
            saved = save_checkpoint(model, run, path)
            loaded, artifact = load_checkpoint(path)
            after = loaded.predict(probe_vector)
            self.assertEqual(before, after, "load restores the model bit-exactly")
            self.assertEqual(artifact["manifest"]["seed"], 7)
            self.assertTrue(artifact["trainingCurve"])
            self.assertEqual(saved["checkpointDigest"], __import__("hashlib").sha256(path.read_bytes()).hexdigest())

    def test_checkpoint_registers_as_signed_private_manifest(self):
        run = train_from_scratch(seed=7, corpus_count=60, epochs=40)
        dataset_manifest = vmm_manifest(
            kind="dataset", artifact_id="seed-l1-core", version=1,
            digest=run["manifest"]["datasetDigest"], producer="mle@visionary",
            license="record-level-licenses", storage_class="private",
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "cp.json"
            saved = save_checkpoint(run["model"], run, path)
            registration = register_checkpoint(saved["checkpointDigest"], run["manifest"]["datasetDigest"], KEY)
            self.assertTrue(verify_checkpoint_registration(registration, KEY))
            self.assertEqual(registration["manifest"]["kind"], "model")
            self.assertEqual(registration["manifest"]["storageClass"], "private")
            self.assertEqual(registration["manifest"]["digest"], saved["checkpointDigest"])
            self.assertEqual(registration["manifest"]["lineage"][0]["id"], "seed-l1-core")
            # Tampering with the recorded digest breaks verification.
            tampered = json.loads(json.dumps(registration))
            tampered["manifest"]["digest"] = "b" * 64
            self.assertFalse(verify_checkpoint_registration(tampered, KEY))


class PrivacyContracts(unittest.TestCase):
    def test_checkpoint_bytes_are_gitignored_weights_never_in_git(self):
        repo = Path(__file__).resolve().parents[3]
        gitignore = (repo / ".gitignore").read_text(encoding="utf-8")
        self.assertIn("ml/vmm/evidence/checkpoints/", gitignore, "private checkpoint bytes are git-ignored")


if __name__ == "__main__":
    unittest.main()
