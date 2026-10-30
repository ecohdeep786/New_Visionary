"""VMM-04 (KAN-172) — hidden-set benchmark registry contracts (synthetic)."""
import json
import unittest

from vmm.benchmarks import (
    BenchmarkError,
    BenchmarkRegistry,
    expected_calibration_error,
)

CUSTODIAN = {"uid": "uid_custodian", "role": "custodian"}
RUNNER = {"uid": "uid_runner", "role": "runner"}

THRESHOLDS = dict(
    min_quality=0.8,
    noninferiority_margin=0.05,
    max_calibration_error=0.15,
    max_abstention_rate=0.1,
    p95_latency_ms=2500,
    max_per_task_cost_usd=0.01,
    min_cases_per_slice=2,
    sample_rationale="Four cases per slice approximate a two-sided 95% binomial check for p>=0.8 at this scale.",
)


def case(case_id, role="student", subject="math", modality="text", **extra):
    slice_meta = {"role": role, "subject": subject, "modality": modality}
    slice_meta.update(extra)
    return {
        "caseId": case_id,
        "slice": slice_meta,
        "contentDigest": "a" * 64,
        "graderRef": f"grader-{case_id}",
    }


def result(case_id, score=0.9, confidence=0.9, abstained=False, latency_ms=1000, cost_usd=0.002):
    return {"caseId": case_id, "score": score, "confidence": confidence, "abstained": abstained, "latencyMs": latency_ms, "costUsd": cost_usd}


def seeded_registry():
    registry = BenchmarkRegistry("vmm-bench-1")
    registry.preregister(CUSTODIAN, **THRESHOLDS)
    cases = [
        case("c1"), case("c2"), case("c3"), case("c4"),
        case("c5", role="teacher", subject="physics"),
        case("c6", role="teacher", subject="physics"),
        case("c7", modality="speech", transfer="cross-locale"),
        case("c8", modality="speech", transfer="cross-locale"),
    ]
    registry.seal_hidden_set(CUSTODIAN, cases)
    return registry, cases


class PreregistrationContracts(unittest.TestCase):
    def test_preregistration_is_custodian_only_and_must_precede_evaluation(self):
        registry = BenchmarkRegistry("b1")
        with self.assertRaises(BenchmarkError):
            registry.preregister(RUNNER, **THRESHOLDS)  # runner cannot preregister
        registry.preregister(CUSTODIAN, **THRESHOLDS)
        with self.assertRaises(BenchmarkError):
            registry.preregister(CUSTODIAN, **THRESHOLDS)  # already registered

        evaluation_first = BenchmarkRegistry("b2")
        evaluation_first.preregister(CUSTODIAN, **THRESHOLDS)
        evaluation_first.seal_hidden_set(CUSTODIAN, [case("c1"), case("c2")])
        evaluation_first.record_evaluation(RUNNER, "cand", [result("c1"), result("c2")])
        late = BenchmarkRegistry("b3")
        with self.assertRaises(BenchmarkError):
            late.seal_hidden_set(CUSTODIAN, [case("c1")])  # thresholds first

    def test_thresholds_are_immutable_and_rationale_required(self):
        registry, _ = seeded_registry()
        view = registry.thresholds()
        view["minQuality"] = 0.01
        self.assertEqual(registry.thresholds()["minQuality"], 0.8, "returned view is a copy")
        with self.assertRaises(BenchmarkError):
            BenchmarkRegistry("b9").preregister(CUSTODIAN, **{**THRESHOLDS, "sample_rationale": "too short"})

    def test_invalid_threshold_values_fail_closed(self):
        for bad in [
            {"min_quality": 1.5},
            {"max_abstention_rate": -0.1},
            {"p95_latency_ms": 0},
            {"max_per_task_cost_usd": -1},
            {"min_cases_per_slice": 0},
        ]:
            with self.subTest(bad):
                with self.assertRaises(BenchmarkError):
                    BenchmarkRegistry("bx").preregister(CUSTODIAN, **{**THRESHOLDS, **bad})


class HiddenSetContracts(unittest.TestCase):
    def test_hidden_cases_hold_no_expected_answers_and_seal_is_deterministic(self):
        registry, cases = seeded_registry()
        for record in registry.cases():
            self.assertNotIn("expected", json.dumps(record), "expected answers never enter runner-visible records")
            self.assertIn("contentDigest", record)
            self.assertIn("slice", record)
        seal = registry.seal()
        registry2, _ = seeded_registry()
        self.assertEqual(registry2.seal()["sealDigest"], seal["sealDigest"], "same case set -> same seal digest")

    def test_sealing_rules(self):
        registry = BenchmarkRegistry("b2")
        registry.preregister(CUSTODIAN, **THRESHOLDS)
        with self.assertRaises(BenchmarkError):
            registry.seal_hidden_set(RUNNER, [case("c1"), case("c2")])  # custodian only
        with self.assertRaises(BenchmarkError):
            registry.seal_hidden_set(CUSTODIAN, [case("c1"), {**case("c2"), "expected": "answer"}])  # expected leaks in
        with self.assertRaises(BenchmarkError):
            registry.seal_hidden_set(CUSTODIAN, [case("c1"), case("c1")])  # duplicate ids
        with self.assertRaises(BenchmarkError):
            registry.seal_hidden_set(CUSTODIAN, [case("c1"), {**case("c2"), "slice": {"role": "ghost", "subject": "x", "modality": "text"}}])


class EvaluationAndGradingContracts(unittest.TestCase):
    def test_record_evaluation_refuses_unknown_cases_and_threshold_mismatch(self):
        registry, cases = seeded_registry()
        with self.assertRaises(BenchmarkError):
            registry.record_evaluation(RUNNER, "cand", [result("ghost-case")])
        with self.assertRaises(BenchmarkError):
            registry.record_evaluation(RUNNER, "cand", [result("c1", abstained=True, score=0.7)])  # abstained scores 0

        other = BenchmarkRegistry("other")
        other.preregister(CUSTODIAN, **{**THRESHOLDS, "min_quality": 0.5})
        other.seal_hidden_set(CUSTODIAN, [case("c1"), case("c2")])
        self.assertIsNotNone(other.thresholds_digest)
        self.assertNotEqual(other.thresholds_digest, registry.thresholds_digest)

    def test_grading_is_custodian_only_and_per_slice_noninferiority_gates_overall(self):
        registry, cases = seeded_registry()
        results = [result("c1"), result("c2"), result("c3"), result("c4"), result("c5"), result("c6"), result("c7"), result("c8")]
        registry.record_evaluation(RUNNER, "cand-strong", results)
        with self.assertRaises(BenchmarkError):
            registry.grade(RUNNER, "cand-strong")  # runner cannot grade
        verdict = registry.grade(CUSTODIAN, "cand-strong")
        self.assertTrue(verdict["engineeringBenchmarkSuccess"])
        self.assertFalse(verdict["educationalGainsEstablished"], "engineering success never establishes educational gains")

        # Strong overall but ONE weak slice (teacher/physics) -> overall fails.
        weak_slice = [result("c1"), result("c2"), result("c3"), result("c4"), result("c5", score=0.2), result("c6", score=0.2), result("c7"), result("c8")]
        registry.record_evaluation(RUNNER, "cand-uneven", weak_slice)
        verdict_uneven = registry.grade(CUSTODIAN, "cand-uneven")
        self.assertFalse(verdict_uneven["engineeringBenchmarkSuccess"])
        teacher_slice = next(s for s in verdict_uneven["slices"] if s["slice"]["role"] == "teacher")
        self.assertFalse(teacher_slice["noninferior"])

    def test_abstention_p95_cost_and_calibration_gates(self):
        registry, _ = seeded_registry()
        # c7/c8 abstain (2/8 = 0.25 > 0.1) -> overall fails even with good scores.
        results = [result("c1"), result("c2"), result("c3"), result("c4"), result("c5"), result("c6"),
                   result("c7", abstained=True, score=0.0, confidence=0.1), result("c8", abstained=True, score=0.0, confidence=0.1)]
        registry.record_evaluation(RUNNER, "cand-abstaining", results)
        verdict = registry.grade(CUSTODIAN, "cand-abstaining")
        self.assertFalse(verdict["engineeringBenchmarkSuccess"])

        registry2, _ = seeded_registry()
        slow = [result("c1", latency_ms=9000), result("c2"), result("c3"), result("c4"),
                result("c5"), result("c6"), result("c7"), result("c8")]
        registry2.record_evaluation(RUNNER, "cand-slow", slow)
        self.assertFalse(registry2.grade(CUSTODIAN, "cand-slow")["engineeringBenchmarkSuccess"])

        registry3, _ = seeded_registry()
        overconfident = [result("c1", score=0.0, confidence=1.0), result("c2", score=0.0, confidence=1.0),
                         result("c3"), result("c4"), result("c5"), result("c6"), result("c7"), result("c8")]
        registry3.record_evaluation(RUNNER, "cand-miscalibrated", overconfident)
        self.assertFalse(registry3.grade(CUSTODIAN, "cand-miscalibrated")["engineeringBenchmarkSuccess"])

    def test_min_cases_per_slice_enforced(self):
        registry = BenchmarkRegistry("b3")
        registry.preregister(CUSTODIAN, **THRESHOLDS)  # min_cases_per_slice = 2
        registry.seal_hidden_set(CUSTODIAN, [case("c1"), case("c2"), case("c3"), case("c4")])
        registry.record_evaluation(RUNNER, "cand", [result("c1"), result("c2"), result("c3"), result("c4")])
        verdict = registry.grade(CUSTODIAN, "cand")
        # All four cases land in one slice with n=4 >= 2; the single-slice dataset passes.
        self.assertTrue(verdict["engineeringBenchmarkSuccess"])
        # A second slice with a single case would fail min-cases.
        registry.seal_hidden_set(CUSTODIAN, [case("c1"), case("c2"), case("c5", role="teacher")])
        registry.record_evaluation(RUNNER, "cand-thin", [result("c1"), result("c2"), result("c5")])
        thin = registry.grade(CUSTODIAN, "cand-thin")
        self.assertFalse(thin["engineeringBenchmarkSuccess"])


class CalibrationContract(unittest.TestCase):
    def test_ece_is_zero_for_perfectly_calibrated_and_positive_for_overconfident(self):
        perfect = expected_calibration_error([1.0, 0.0], [True, False])
        self.assertEqual(perfect, 0.0)
        overconfident = expected_calibration_error([1.0, 1.0], [True, False])
        self.assertGreater(overconfident, 0.4)


if __name__ == "__main__":
    unittest.main()
