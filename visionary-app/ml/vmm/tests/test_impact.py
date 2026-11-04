"""VMM-21 (KAN-189) — impact evaluation tests: verified backend outcomes only,
strict separation from benchmark/fluency scores, retention/transfer kinds,
stakeholder usefulness as a separate ledger, and honest uncertainty bounds."""
import unittest

from vmm.impact import MIN_COHORT, ImpactError, LearningImpactEvaluator


def backend_actor() -> dict:
    return {"assessedBy": "backend"}


def seeded(protocol="protocol-2026-11") -> LearningImpactEvaluator:
    ev = LearningImpactEvaluator(protocol)
    for i in range(MIN_COHORT):
        ev.record_assessment(backend_actor(), f"uid-{i}", "tutoring", 0.2, 0.2 + 0.03 + (i % 5) * 0.01)
    return ev


class ImpactTest(unittest.TestCase):
    def test_verified_gains_evaluate_with_honest_uncertainty(self):
        ev = seeded()
        verdict = ev.evaluate()
        self.assertEqual(verdict["cohort"], MIN_COHORT)
        self.assertGreater(verdict["meanGain"], 0.0)
        self.assertTrue(verdict["ci95"][0] < verdict["meanGain"] < verdict["ci95"][1])
        self.assertGreater(verdict["standardError"], 0.0)
        self.assertEqual(verdict["separateLedgers"], {"benchmarks": 0, "stakeholder": 0})

    def test_self_assessed_and_frontend_outcomes_are_refused(self):
        ev = LearningImpactEvaluator("protocol-2026-11")
        with self.assertRaises(ImpactError):
            ev.record_assessment({"assessedBy": "self"}, "uid-x", "tutoring", 0.2, 0.5)
        with self.assertRaises(ImpactError):
            ev.record_assessment({"assessedBy": "frontend"}, "uid-x", "build", 0.2, 0.9)
        with self.assertRaises(ImpactError):
            ev.record_assessment(backend_actor(), "uid-x", "fluency", 0.2, 0.9)
        with self.assertRaises(ImpactError):
            ev.record_assessment(backend_actor(), "uid-x", "tutoring", 1.2, 0.9)

    def test_benchmarks_never_enter_or_decorate_the_impact_ledger(self):
        ev = seeded()
        before = len(ev.impacts())
        entry = ev.ingest_benchmark("mmlu-mini", 0.87)
        self.assertFalse(entry["entersImpactLedger"])
        self.assertEqual(len(ev.impacts()), before, "the impact ledger is untouched")
        verdict = ev.evaluate()
        self.assertIsNone(verdict.get("benchmarkMean"), "benchmark scores do not decorate the impact verdict")
        for record in ev.impacts():
            self.assertIsNone(record["benchmarkScore"])
            self.assertIsNone(record["mlClassificationRef"])
        with self.assertRaises(ImpactError):
            ev.impact_from_benchmarks()

    def test_retention_transfer_and_stakeholder_ledgers(self):
        ev = seeded()
        ev.record_assessment(backend_actor(), "uid-r", "retention", 0.6, 0.55, delay_days=30)
        ev.record_assessment(backend_actor(), "uid-t", "transfer", 0.5, 0.62, delay_days=7)
        ev.record_stakeholder_feedback("teacher", 4, "art_1")
        ev.record_stakeholder_feedback("guardian", 5, "art_1")
        verdict = ev.evaluate()
        self.assertEqual(verdict["retentionRecords"], 1)
        self.assertEqual(verdict["transferRecords"], 1)
        self.assertEqual(verdict["stakeholderMean"], 4.5)
        with self.assertRaises(ImpactError):
            ev.record_stakeholder_feedback("company", 4, "art_1")
        with self.assertRaises(ImpactError):
            ev.record_stakeholder_feedback("teacher", 9, "art_1")

    def test_uncertainty_honesty_refuses_tiny_cohorts_and_unpinned_protocols(self):
        ev = LearningImpactEvaluator("protocol-2026-11")
        for i in range(MIN_COHORT - 1):
            ev.record_assessment(backend_actor(), f"uid-{i}", "tutoring", 0.2, 0.5)
        with self.assertRaises(ImpactError):
            ev.evaluate()
        with self.assertRaises(ImpactError):
            LearningImpactEvaluator("")
        with self.assertRaises(ImpactError):
            LearningImpactEvaluator(None)


if __name__ == "__main__":
    unittest.main()
