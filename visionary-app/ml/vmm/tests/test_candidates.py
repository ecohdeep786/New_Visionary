"""VMM-19 (KAN-187) — candidate pipeline contracts (synthetic)."""
import json
import unittest
from datetime import datetime, timezone, timedelta

import hashlib
import unittest

from vmm.benchmarks import BenchmarkRegistry
from vmm.candidates import (
    CandidatePipeline,
    PipelineError,
    eligible_corpus,
)
from vmm.registry import ModelRegistry
from vmm.supplychain import build_manifest, sign_manifest

KEY = b"local-ignored-config-signing-key-0123456789abcdef"
OWNER = {"uid": "uid_owner", "role": "owner"}
CUSTODIAN = {"uid": "uid_custodian", "role": "custodian"}
NOW = datetime.now(timezone.utc)


def seed_records():
    return [
        {"recordId": "r1", "sourceRef": "src-1", "license": "cc-by-4", "consentRef": "c1", "contentDigest": "a" * 64, "text": "sample one", "capturedAt": NOW.isoformat()},
        {"recordId": "r2", "sourceRef": "src-2", "license": "cc-by-4", "consentRef": "c2", "contentDigest": "b" * 64, "text": "sample two", "capturedAt": NOW.isoformat()},
        {"recordId": "r3", "sourceRef": "src-3", "license": "cc-by-4", "consentRef": "c3", "contentDigest": "c" * 64, "text": "sample three", "capturedAt": NOW.isoformat()},
    ]


def seeded_registry(approved=False):
    registry = ModelRegistry(KEY)
    dataset = build_manifest(kind="dataset", artifact_id="seed-l1-core", version=1,
                             digest="a" * 64, producer="mle@visionary", license="record-level-licenses", storage_class="private")
    registry.register(dataset, sign_manifest(dataset, KEY))
    checkpoint = b"candidate weights v1"
    model = build_manifest(kind="model", artifact_id="visionary-tiny-d1", version=1,
                           digest=hashlib.sha256(checkpoint).hexdigest(), producer="mle@visionary",
                           license="owner-only-v1", storage_class="private",
                           lineage=[{"id": dataset["id"], "digest": dataset["digest"]}])
    registry.register(model, sign_manifest(model, KEY))
    registry.attach_artifact(OWNER, "visionary-tiny-d1", 1, checkpoint)
    if approved:
        registry.attach_approval(CUSTODIAN, "visionary-tiny-d1", 1, {"modelAccepted": True, "modelSafetyFailuresCount": 0})
    return registry


import hashlib


class EligibilityContracts(unittest.TestCase):
    def test_revoked_sources_excluded(self):
        corpus = eligible_corpus(seed_records(), revoked_sources={"src-1"}, benchmark_exclusion_digests=set())
        ids = [r["recordId"] for r in corpus["eligible"]]
        self.assertNotIn("r1", ids)
        self.assertIn("source_revoked", [e["reason"] for e in corpus["excluded"]])

    def test_benchmark_contamination_refused(self):
        corpus = eligible_corpus(seed_records(), revoked_sources=set(), benchmark_exclusion_digests={"b" * 64})
        ids = [r["recordId"] for r in corpus["eligible"]]
        self.assertNotIn("r2", ids)
        self.assertIn("benchmark_contamination", [e["reason"] for e in corpus["excluded"]])

    def test_retention_bound_excludes_old_records(self):
        old = NOW - timedelta(days=400)
        records = seed_records()
        records[0]["capturedAt"] = old.isoformat()
        corpus = eligible_corpus(records, revoked_sources=set(), benchmark_exclusion_digests=set(), now=NOW)
        self.assertNotIn("r1", [r["recordId"] for r in corpus["eligible"]])
        self.assertIn("retention_expired", [e["reason"] for e in corpus["excluded"]])

    def test_rights_missing_refused(self):
        records = seed_records()
        records[0]["consentRef"] = ""
        corpus = eligible_corpus(records, revoked_sources=set(), benchmark_exclusion_digests=set())
        self.assertIn("rights_missing", [e["reason"] for e in corpus["excluded"]])

    def test_corpus_digest_binds_the_eligible_set(self):
        c1 = eligible_corpus(seed_records(), revoked_sources=set(), benchmark_exclusion_digests=set())
        c2 = eligible_corpus(seed_records(), revoked_sources=set(), benchmark_exclusion_digests=set())
        self.assertEqual(c1["corpusDigest"], c2["corpusDigest"])


class CandidateExerciseContracts(unittest.TestCase):
    def test_reproducible_bounded_candidate(self):
        registry = seeded_registry()
        import unittest as _u
        benchmark = BenchmarkRegistry("bench")
        pipeline = CandidatePipeline(registry, benchmark, seed=7, max_samples=10, max_epochs=5)
        corpus = eligible_corpus(seed_records(), revoked_sources=set(), benchmark_exclusion_digests=set())
        run_a = pipeline.train_candidate(corpus)
        pipeline_b = CandidatePipeline(seeded_registry(), BenchmarkRegistry("bench2"), seed=7, max_samples=10, max_epochs=5)
        run_b = pipeline_b.train_candidate(corpus)
        self.assertEqual(run_a["trainingCurve"], run_b["trainingCurve"], "same seed -> identical training")
        self.assertLess(run_a["finalLoss"], run_a["trainingCurve"][0], "loss decreases")
        self.assertEqual(run_a["candidateId"], run_b["candidateId"])

    def test_exercise_bound_enforced(self):
        registry = seeded_registry()
        benchmark = BenchmarkRegistry("bench")
        pipeline = CandidatePipeline(registry, benchmark, seed=7, max_samples=2, max_epochs=5)
        with self.assertRaises(PipelineError):
            pipeline.train_candidate(eligible_corpus(seed_records(), revoked_sources=set(), benchmark_exclusion_digests=set()))

    def test_empty_corpus_refused(self):
        registry = seeded_registry()
        pipeline = CandidatePipeline(registry, BenchmarkRegistry("bench"), seed=7)
        with self.assertRaises(PipelineError):
            pipeline.train_candidate(eligible_corpus([], revoked_sources=set(), benchmark_exclusion_digests=set()))

    def test_lineage_chain_complete(self):
        registry = seeded_registry()
        pipeline = CandidatePipeline(registry, BenchmarkRegistry("bench"), seed=7)
        corpus = eligible_corpus(seed_records(), revoked_sources=set(), benchmark_exclusion_digests=set())
        pipeline.train_candidate(corpus)
        chain = pipeline.lineage()
        self.assertEqual([c["kind"] for c in chain], ["dataset", "candidate"])
        self.assertTrue(all(c["digest"] for c in chain))


class ReleaseContracts(unittest.TestCase):
    def test_promote_hold_rollback_paths(self):
        registry = seeded_registry(approved=False)
        pipeline = CandidatePipeline(registry, BenchmarkRegistry("bench"), seed=7)
        report = {"modelAccepted": True, "modelSafetyFailuresCount": 0}
        status = registry.deployment_status("visionary-tiny-d1", 1)
        self.assertEqual(status["status"], "registered", "candidate starts unapproved (HOLD)")
        held = pipeline.hold()
        self.assertTrue(held["held"])
        promoted = pipeline.promote(CUSTODIAN, report)
        self.assertTrue(promoted["promoted"])
        self.assertEqual(registry.deployment_status("visionary-tiny-d1", 1)["status"], "approved")
        # Register + approve v2 so there is a real forward version to roll back FROM.
        checkpoint = b"candidate weights v2"
        model_v2 = build_manifest(kind="model", artifact_id="visionary-tiny-d1", version=2,
                                  digest=hashlib.sha256(checkpoint).hexdigest(), producer="mle@visionary",
                                  license="owner-only-v1", storage_class="private",
                                  lineage=[{"id": "seed-l1-core", "digest": "a" * 64}])
        registry.register(model_v2, sign_manifest(model_v2, KEY))
        registry.attach_approval(CUSTODIAN, "visionary-tiny-d1", 2, report)
        rollback = pipeline.rollback(OWNER, from_version=2, to_version=1)
        self.assertEqual(rollback["servedVersion"], 1)
        self.assertFalse(rollback["userRecordsChanged"])

    def test_failed_report_refused_promotion(self):
        registry = seeded_registry(approved=False)
        pipeline = CandidatePipeline(registry, BenchmarkRegistry("bench"), seed=7)
        with self.assertRaises(Exception):
            pipeline.promote(CUSTODIAN, {"modelAccepted": False, "modelSafetyFailuresCount": 2})  # failed report refused

    def test_personal_state_remains_distinct_from_global_weights(self):
        pipeline = CandidatePipeline(seeded_registry(), BenchmarkRegistry("bench"), seed=7)
        self.assertTrue(pipeline.personal_state_distinct(), "no adaptation-state API exists on the pipeline")


if __name__ == "__main__":
    unittest.main()
