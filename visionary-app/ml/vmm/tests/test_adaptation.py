"""VMM-29 (KAN-201) — personal adaptation contracts (synthetic)."""
import unittest

from vmm.adaptation import AdaptationError, PersonalAdaptation


def receipt(rid, concept="newton", correct=True):
    return {"receiptId": rid, "conceptId": concept, "correct": correct, "assessedBy": "backend"}


class IngestionContracts(unittest.TestCase):
    def test_only_backend_verified_outcomes_ingest(self):
        adaptation = PersonalAdaptation()
        self.assertTrue(adaptation.ingest_verified_outcome(receipt("r1"))["ingested"])
        with self.assertRaises(AdaptationError):
            adaptation.ingest_verified_outcome({"receiptId": "r2", "conceptId": "newton", "correct": True, "assessedBy": "model"})
        with self.assertRaises(AdaptationError):
            adaptation.ingest_verified_outcome({"receiptId": "r3", "conceptId": "newton", "correct": True, "assessedBy": "client"})
        dup = adaptation.ingest_verified_outcome(receipt("r1"))
        self.assertTrue(dup["duplicate"])

    def test_invalid_receipts_fail_closed(self):
        adaptation = PersonalAdaptation()
        for bad in [
            {"receiptId": "", "conceptId": "c", "correct": True, "assessedBy": "backend"},
            {"receiptId": "r", "conceptId": "c", "correct": "yes", "assessedBy": "backend"},
            {"receiptId": "r", "conceptId": "c", "assessedBy": "backend"},
        ]:
            with self.subTest(bad):
                with self.assertRaises(AdaptationError):
                    adaptation.ingest_verified_outcome(bad)


class ModeSeparationContracts(unittest.TestCase):
    def test_memory_only_changes_preference_never_mastery(self):
        adaptation = PersonalAdaptation()
        adaptation.set_memory_tags(["prefers-analogy"])
        adapted = adaptation.adapt("newton")
        self.assertEqual(adapted["memoryOnly"]["strategyPreference"], "analogy")
        self.assertEqual(adapted["memoryOnly"]["p_init"], adapted["coldStart"]["p_init"], "memory never moves mastery")
        self.assertFalse(adapted["memoryOnly"]["masteryMoved"])

    def test_verified_outcome_adapts_the_prior(self):
        adaptation = PersonalAdaptation()
        for i in range(6):
            adaptation.ingest_verified_outcome(receipt(f"r{i}", correct=True))
        adapted = adaptation.adapt("newton")
        self.assertGreater(adapted["verifiedOutcome"]["p_init"], adapted["coldStart"]["p_init"], "verified outcomes raise the prior")
        self.assertEqual(adapted["verifiedOutcome"]["verifiedAttempts"], 6)

    def test_artifact_success_is_a_separate_ledger_never_touching_mastery(self):
        adaptation = PersonalAdaptation()
        before = adaptation.adapt("newton")["coldStart"]["p_init"]
        for i in range(5):
            adaptation.record_artifact_outcome(f"build-{i}", True)
        after = adaptation.adapt("newton")["coldStart"]["p_init"]
        self.assertEqual(before, after, "artifact success never moves understanding")
        self.assertEqual(len(adaptation._artifact_outcomes), 5)


class MeasuredComparisonContracts(unittest.TestCase):
    def test_improvement_established_only_over_the_predeclared_delta(self):
        adaptation = PersonalAdaptation()
        for i in range(8):
            adaptation.ingest_verified_outcome(receipt(f"r{i}", correct=True))
        report = adaptation.compare_modes("newton", [True] * 6)
        self.assertFalse(report["inconclusive"])
        self.assertTrue(report["improvementEstablished"], "verified-outcome adaptation beats cold-start by the delta")

    def test_insufficient_heldout_samples_inconclusive(self):
        adaptation = PersonalAdaptation()
        for i in range(4):
            adaptation.ingest_verified_outcome(receipt(f"r{i}", correct=True))
        report = adaptation.compare_modes("newton", [True] * 2)
        self.assertTrue(report["inconclusive"])
        self.assertFalse(report["improvementEstablished"])
        self.assertEqual(report["reason"], "insufficient_heldout_samples")

    def test_no_verified_outcomes_no_claim(self):
        adaptation = PersonalAdaptation()
        report = adaptation.improvement_report("newton")
        self.assertFalse(report["improvementEstablished"])
        self.assertTrue(report["inconclusive"])
        self.assertEqual(report["reason"], "no_verified_outcomes")


class OverInterventionContracts(unittest.TestCase):
    def test_over_intervention_flagged_past_the_bound(self):
        adaptation = PersonalAdaptation()
        for i in range(5):
            adaptation.record_correction(f"session-{i % 2}")
        report = adaptation.over_intervention_report({"session-0": 3, "session-1": 2})
        self.assertTrue(report["overInterventionDetected"])
        self.assertEqual(report["overInterventionSessions"], {"session-0": 3})
        self.assertEqual(report["maxCorrectionsPerSession"], 2)

    def test_within_bound_not_flagged(self):
        adaptation = PersonalAdaptation()
        adaptation.record_correction("session-0")
        report = adaptation.over_intervention_report({"session-0": 1})
        self.assertFalse(report["overInterventionDetected"])


class DeterminismContracts(unittest.TestCase):
    def test_adaptation_is_deterministic_and_idempotent(self):
        a1 = PersonalAdaptation()
        a2 = PersonalAdaptation()
        for i in range(5):
            a1.ingest_verified_outcome(receipt(f"r{i}", correct=(i % 2 == 0)))
            a2.ingest_verified_outcome(receipt(f"r{i}", correct=(i % 2 == 0)))
        self.assertEqual(a1.adapt("newton"), a2.adapt("newton"))


if __name__ == "__main__":
    unittest.main()
