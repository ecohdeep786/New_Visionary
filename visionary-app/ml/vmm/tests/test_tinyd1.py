"""VMM-07 (KAN-175) — Tiny-D1 architecture contracts (synthetic; stdlib only)."""
import json
import unittest
from pathlib import Path

from vmm.baselines import propose_teaching_reproduction
from vmm.benchmarks import BenchmarkRegistry
from vmm.features import extract_features
from vmm.tinyd1 import TinyD1, TinyD1Config, TinyD1Error

ROOT = Path(__file__).resolve().parents[3]
INPUT_DIM = 7
ACTIONS = ["ACT-001", "ACT-002", "ACT-003", "ACT-004", "ACT-005"]
CUSTODIAN = {"uid": "uid_custodian", "role": "custodian"}
RUNNER = {"uid": "uid_runner", "role": "runner"}
THRESHOLDS = dict(
    min_quality=0.6, noninferiority_margin=0.05, max_calibration_error=0.5,
    max_abstention_rate=0.6, p95_latency_ms=2500, max_per_task_cost_usd=0.01,
    min_cases_per_slice=2,
    sample_rationale="Architecture sanity probe: synthetic policy-imitation fixtures at fixture scale.",
)


def config(**overrides):
    base = dict(input_dim=INPUT_DIM, actions=ACTIONS, seed=7)
    base.update(overrides)
    return TinyD1Config(**base)


def vector(attempt_count, correct_rate, streak, p_known, missing=-1.0):
    return [float(attempt_count), correct_rate, correct_rate, streak, p_known, missing, 1.0]


def policy_samples(count=60):
    """Synthetic policy-imitation data: features from evidence, labels from the
    VMM-05 reproduction of the reference VATS pedagogy policy."""
    from vmm.seeddata import VersionedOntology  # not used for labels; keeps imports honest

    samples = []
    for i in range(count):
        corrects = (i % 3) != 0
        attempts = [corrects] * (2 + i % 5)
        p_known = 0.9 if corrects else 0.2
        evidence = {
            "contract": "vmm-scm-evidence.v1",
            "conceptId": f"concept-{i % 4}",
            "attempts": attempts,
            "sourceRefs": [f"src-{i % 5}"],
            "criteriaVersion": 1 + i % 3,
        }
        features = extract_features(evidence, scm_p_known=p_known)
        request = {
            "contractVersion": "vats-pedagogy.v1",
            "requestId": f"req-{i}",
            "scope": {
                "uid": "u", "workspaceId": "w", "sessionId": "s",
                "conceptId": evidence["conceptId"], "sourceVersion": "source-v1",
                "criteriaVersion": "rubric-v1", "graphVersion": "graph-v1", "policyVersion": "doc03-reference-v1",
                "learnerRevision": 1, "loopRevision": 1,
            },
            "nodes": [
                {"conceptId": evidence["conceptId"], "prerequisites": [], "pKnown": p_known, "assessedCount": len(attempts)},
            ],
            "teaching": {"phase": "explain", "failedChecks": 0, "maxFailedChecks": 3, "previousStrategy": None, "allowedStrategies": ["socratic", "worked_example", "analogy", "visual", "practice"]},
            "observations": {"errorClass": None, "firstEncounter": p_known < 0.35, "approvedVisualAvailable": False, "hintsOnly": False},
        }
        proposal = propose_teaching_reproduction(request)
        strategy = proposal["strategy"]
        samples.append({
            "vector": features["vector"],
            "action": ACTIONS[list(ACTIONS).index({
                "socratic": "ACT-001", "worked_example": "ACT-002", "analogy": "ACT-003", "visual": "ACT-004", "practice": "ACT-005",
            }[strategy])],
        })
    return samples


class ShapeAndMaskContracts(unittest.TestCase):
    def test_shape_is_enforced(self):
        model = TinyD1(config())
        with self.assertRaises(TinyD1Error):
            model.predict([0.1] * (INPUT_DIM - 1))
        with self.assertRaises(TinyD1Error):
            model.predict([0.1] * INPUT_DIM + [0.2])
        with self.assertRaises(TinyD1Error):
            model.predict([float("nan")] * INPUT_DIM)

    def test_masked_actions_never_selected_and_have_zero_probability(self):
        model = TinyD1(config())
        model.fit(policy_samples(20), epochs=1)
        out = model.predict(vector(4, 0.75, 2, 0.8), allowed_actions=["ACT-001", "ACT-002"])
        self.assertFalse(out["abstained"])
        self.assertIn(out["action"], ["ACT-001", "ACT-002"])
        for index, action in enumerate(ACTIONS):
            if action not in ("ACT-001", "ACT-002"):
                self.assertEqual(out["probs"][index], 0.0, "masked actions have exactly zero probability")
        self.assertNotIn(out["action"], [a for a in ACTIONS if a not in ("ACT-001", "ACT-002")])
        self.assertAlmostEqual(sum(out["probs"]), 1.0, places=5)

    def test_all_actions_forbidden_is_a_defined_abstain_output(self):
        model = TinyD1(config())
        out = model.predict(vector(4, 0.75, 2, 0.8), allowed_actions=[])
        self.assertTrue(out["abstained"])
        self.assertEqual(out["reason"], "all_actions_forbidden")

    def test_unknown_or_invalid_allowed_sets_refused(self):
        model = TinyD1(config())
        with self.assertRaises(TinyD1Error):
            model.predict(vector(4, 0.75, 2, 0.8), allowed_actions=["ACT-999"])
        with self.assertRaises(TinyD1Error):
            model.predict(vector(4, 0.75, 2, 0.8), allowed_actions="ACT-001")


class TrainingAndOutputContracts(unittest.TestCase):
    def test_training_reduces_loss_and_is_deterministic(self):
        samples = policy_samples(40)
        model_a = TinyD1(config())
        losses_a = model_a.fit(samples, epochs=30)
        model_b = TinyD1(config())
        losses_b = model_b.fit(samples, epochs=30)
        self.assertLess(losses_a[-1], losses_a[0], "training reduces the loss")
        self.assertEqual(losses_a, losses_b, "identical seed -> identical training trajectory")
        self.assertEqual(
            model_a.predict(vector(4, 0.9, 3, 0.9)),
            model_b.predict(vector(4, 0.9, 3, 0.9)),
            "deterministic predictions",
        )

    def test_held_out_agreement_with_the_policy_teacher_is_high(self):
        samples = policy_samples(60)
        model = TinyD1(config())
        model.fit(samples[:40], epochs=60)
        agreement = 0
        total = 0
        for sample in samples[40:]:
            out = model.predict(sample["vector"])
            total += 1
            agreement += 1 if out.get("action") == sample["action"] else 0
        self.assertGreaterEqual(agreement / total, 0.7, "Tiny-D1 imitates the frozen teacher on held-out fixtures")

    def test_parameter_count_matches_the_documented_frozen_size(self):
        self.assertEqual(TinyD1(config()).parameter_count(), 109, "8x7+8 + 5x8+5")

    def test_confidence_floor_abstains(self):
        model = TinyD1(config(abstain_below=0.99))
        model.fit(policy_samples(20), epochs=1)
        out = model.predict(vector(4, 0.75, 2, 0.8))
        self.assertTrue(out["abstained"])
        self.assertEqual(out["reason"], "below_confidence_floor")


class OODContracts(unittest.TestCase):
    def test_excessive_missingness_abstains(self):
        model = TinyD1(config())
        model.fit(policy_samples(30), epochs=5)
        out = model.predict([-1.0] * INPUT_DIM)
        self.assertTrue(out["abstained"])
        self.assertEqual(out["reason"], "excessive_missingness")

    def test_out_of_range_features_abstain_instead_of_confident_nonsense(self):
        model = TinyD1(config())
        model.fit(policy_samples(30), epochs=5)
        out = model.predict(vector(4, 250.0, 2, 0.8))  # correct_rate far outside [0,1] training range
        self.assertTrue(out["abstained"])
        self.assertEqual(out["reason"], "out_of_distribution")


class ConditionalHeadContracts(unittest.TestCase):
    def test_conditional_head_without_sufficient_labels_is_refused(self):
        cfg = config(conditional_heads={"misconception": {"labelSpace": ["MC-001", "MC-002"], "minPerClass": 3}})
        model = TinyD1(cfg)
        samples = policy_samples(10)
        for sample in samples[:3]:
            sample["misconceptionLabels"] = ["MC-001"]
        with self.assertRaises(TinyD1Error):
            model.fit(samples, epochs=1)  # MC-002 has 0 labels < 3

    def test_conditional_head_with_sufficient_labels_trains(self):
        cfg = config(conditional_heads={"misconception": {"labelSpace": ["MC-001", "MC-002"], "minPerClass": 2}})
        model = TinyD1(cfg)
        samples = policy_samples(10)
        for i, sample in enumerate(samples[:4]):
            sample["misconceptionLabels"] = ["MC-001"] if i % 2 == 0 else ["MC-002"]
        model.fit(samples, epochs=1)
        self.assertTrue(model.trained)
        self.assertEqual(model.parameter_count(), 109 + 2 * 8 + 2, "head adds out_dim x hidden + out_dim")


class RegistryIntegrationContracts(unittest.TestCase):
    def test_tiny_d1_is_evaluated_through_the_vmm04_registry(self):
        registry = BenchmarkRegistry("vmm-bench-tinyd1")
        registry.preregister(CUSTODIAN, **THRESHOLDS)
        cases = []
        for i in range(1, 5):
            cases.append({
                "caseId": f"case-{i}",
                "slice": {"role": "student", "subject": "math", "modality": "text"},
                "contentDigest": f"{i:064x}",
                "graderRef": f"grader-{i}",
            })
        registry.seal_hidden_set(CUSTODIAN, cases)

        model = TinyD1(config())
        model.fit(policy_samples(40), epochs=40)
        results = []
        for hidden in registry.cases():
            out = model.predict(vector(4, 0.85, 3, 0.85))
            results.append({
                "caseId": hidden["caseId"],
                "score": 0.0 if out["abstained"] else 1.0,
                "confidence": out["confidence"],
                "abstained": out["abstained"],
                "latencyMs": 9,
                "costUsd": 0.0,
            })
        registry.record_evaluation(RUNNER, "tiny-d1", results)
        verdict = registry.grade(CUSTODIAN, "tiny-d1")
        self.assertTrue(verdict["engineeringBenchmarkSuccess"])
        self.assertFalse(verdict["educationalGainsEstablished"])


if __name__ == "__main__":
    unittest.main()
