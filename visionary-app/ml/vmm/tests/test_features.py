"""VMM-06 (KAN-174) — feature-contract tests (synthetic; no provider/DB)."""
import json
import unittest
from pathlib import Path

from vmm.seeddata import VersionedOntology
from vmm.features import (
    FEATURE_ORDER,
    FeatureGateError,
    assert_train_serve_parity,
    extract_features,
    golden_digest,
    leakage_report,
    uncertainty,
    validate_misconception_labels,
)

ROOT = Path(__file__).resolve().parents[3]
GOLDEN = json.loads((ROOT / "ml/vmm/tests/golden/features-v1.json").read_text(encoding="utf-8"))


def evidence(**overrides):
    base = {
        "contract": "vmm-scm-evidence.v1",
        "conceptId": "newtons-second-law",
        "attempts": [True, True, False, True, True],
        "sourceRefs": ["src-consented-001", "src-consented-002"],
        "criteriaVersion": 3,
    }
    base.update(overrides)
    return base


def ontology():
    mc = VersionedOntology("misconception-ontology", "MC")
    mc.register("rate-ratio confusion", "Learner treats a rate as a ratio of totals.")
    return mc


class FeatureExtractionContracts(unittest.TestCase):
    def test_deterministic_versioned_vector_with_fixed_order(self):
        one = extract_features(evidence(), scm_p_known=0.72)
        two = extract_features(evidence(), scm_p_known=0.72)
        self.assertEqual(one, two)
        self.assertEqual(one["featureVersion"], 1)
        self.assertEqual(one["featureOrder"], list(FEATURE_ORDER))
        self.assertEqual(len(one["vector"]), len(FEATURE_ORDER))
        named = dict(zip(one["featureOrder"], one["vector"]))
        self.assertEqual(named["attempt_count"], 5)
        self.assertEqual(named["correct_rate"], 0.8)
        self.assertEqual(named["current_streak"], 2.0)

    def test_missingness_is_explicit_never_silently_zero(self):
        # scm_p_known missingness is the CALLER's explicit choice: passing None is refused.
        with self.assertRaises(FeatureGateError):
            extract_features(evidence(), scm_p_known=None)
        # An empty attempt window (cutoff 0) encodes rate features as MISSING.
        empty = extract_features(evidence(attempts=[]), scm_p_known=0.5, cutoff=0)
        self.assertIn(-1.0, empty["vector"], "missing numerics use the sentinel")
        self.assertTrue(any(empty["missingMask"].values()), "missingness mask records the gaps")

    def test_time_leakage_cutoff_equals_truncated_extraction(self):
        full_evidence = evidence()
        for k in range(len(full_evidence["attempts"]) + 1):
            with self.subTest(k):
                bounded = extract_features(full_evidence, scm_p_known=0.6, cutoff=k)
                truncated = extract_features(evidence(attempts=full_evidence["attempts"][:k]), scm_p_known=0.6)
                self.assertEqual(bounded["vector"], truncated["vector"], f"cutoff {k} sees no future attempts")

    def test_future_outcomes_and_identities_are_refused_at_the_gate(self):
        for field, value in [("buildOutcome", {"successful": True}), ("misconceptionLabels", ["MC-001"]), ("uid", "uid_learner"), ("sessionId", "sess-9")]:
            with self.subTest(field):
                with self.assertRaises(FeatureGateError):
                    extract_features(evidence(**{field: value}), scm_p_known=0.5)

    def test_labels_are_targets_and_never_features_unsupported_refused(self):
        mc = ontology()
        # Labels in evidence are a future-outcome leak — refused at the gate.
        with self.assertRaises(FeatureGateError):
            extract_features(evidence(misconceptionLabels=[]), scm_p_known=0.5)
        with self.assertRaises(FeatureGateError):
            extract_features(evidence(misconceptionLabels=["MC-001"]), scm_p_known=0.5)
        # The label-side gate validates training labels against the pinned ontology.
        with self.assertRaises(FeatureGateError):
            validate_misconception_labels(["MC-999"], mc)
        self.assertEqual(validate_misconception_labels(["MC-001"], mc), ["MC-001"])
        # Revoked sources gate extraction.
        with self.assertRaises(FeatureGateError):
            extract_features(evidence(), scm_p_known=0.5, revoked_sources=frozenset({"src-consented-001"}))


class GoldenParityContracts(unittest.TestCase):
    def test_golden_fixtures_reproduce_exactly(self):
        for case in GOLDEN["cases"]:
            with self.subTest(case["name"]):
                extracted = extract_features(case["evidence"], scm_p_known=case["scmPKnown"], cutoff=case.get("cutoff"))
                self.assertEqual(extracted["vector"], case["expectedVector"])
                self.assertEqual(extracted["vectorDigest"], case["expectedVectorDigest"])
                self.assertEqual(
                    golden_digest({"featureVersion": extracted["featureVersion"], "vector": extracted["vector"]}),
                    case["expectedVectorDigest"],
                )

    def test_train_serve_parity_proven_via_shared_extractor(self):
        case = GOLDEN["cases"][0]
        train_vector = extract_features(case["evidence"], scm_p_known=case["scmPKnown"], cutoff=case.get("cutoff"))
        serve_vector = extract_features(case["evidence"], scm_p_known=case["scmPKnown"], cutoff=case.get("cutoff"))
        self.assertTrue(assert_train_serve_parity(train_vector, serve_vector))
        drifted = dict(serve_vector)
        drifted["featureVersion"] = train_vector["featureVersion"] + 1
        with self.assertRaises(FeatureGateError):
            assert_train_serve_parity(train_vector, drifted)


class LeakageContracts(unittest.TestCase):
    def test_source_and_content_leakage_detected_across_split(self):
        train = [{"sourceRefs": ["src-1", "src-2"], "contentDigest": "a" * 64}]
        eval_clean = [{"sourceRefs": ["src-3"], "contentDigest": "b" * 64}]
        eval_leaky = [{"sourceRefs": ["src-2"], "contentDigest": "a" * 64}]
        clean = leakage_report(train, eval_clean)
        self.assertFalse(clean["leakageDetected"])
        leaky = leakage_report(train, eval_leaky)
        self.assertTrue(leaky["leakageDetected"])
        self.assertEqual(leaky["sharedSourceRefs"], ["src-2"])
        self.assertEqual(leaky["sharedContentDigests"], ["a" * 64])


class UncertaintyContracts(unittest.TestCase):
    def test_few_attempts_wide_band_and_abstain_recommended(self):
        wide = uncertainty(0.5, 1)
        self.assertEqual(wide["band"], "wide")
        self.assertTrue(wide["abstainRecommended"])
        self.assertGreater(wide["intervalHigh"] - wide["intervalLow"], 0.5, "one attempt cannot bound the estimate tightly")

    def test_many_attempts_tight_band_containing_the_estimate(self):
        tight = uncertainty(0.8, 400)
        self.assertEqual(tight["band"], "tight")
        self.assertFalse(tight["abstainRecommended"])
        self.assertLessEqual(tight["intervalLow"], 0.8)
        self.assertGreaterEqual(tight["intervalHigh"], 0.8)
        self.assertLess(tight["intervalHigh"] - tight["intervalLow"], 0.2)

    def test_deterministic_and_validated(self):
        self.assertEqual(uncertainty(0.7, 30), uncertainty(0.7, 30))
        with self.assertRaises(FeatureGateError):
            uncertainty(1.5, 10)
        with self.assertRaises(FeatureGateError):
            uncertainty(0.5, -1)


if __name__ == "__main__":
    unittest.main()
