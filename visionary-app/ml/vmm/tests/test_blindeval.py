"""VMM-09 (KAN-177) — blind evaluation + safety contracts (synthetic)."""
import json
import unittest

from vmm.blindeval import BlindEvalError, BlindEvaluation

CUSTODIAN = {"uid": "uid_custodian", "role": "custodian"}
EVALUATOR = {"uid": "uid_evaluator", "role": "evaluator"}

ACTIONS = ["ACT-001", "ACT-002", "ACT-003", "ACT-004", "ACT-005"]

CASES = [
    {"caseId": "c1", "slice": {"role": "student", "subject": "math", "modality": "text"}, "expectedAction": "ACT-002"},
    {"caseId": "c2", "slice": {"role": "student", "subject": "math", "modality": "text"}, "expectedAction": "ACT-002"},
    {"caseId": "c3", "slice": {"role": "student", "subject": "math", "modality": "text"}, "expectedAction": "ACT-002"},
    {"caseId": "c4", "slice": {"role": "student", "subject": "physics", "modality": "text"}, "expectedAction": "ACT-001"},
    {"caseId": "c5", "slice": {"role": "student", "subject": "physics", "modality": "text"}, "expectedAction": "ACT-001"},
    {"caseId": "c6", "slice": {"role": "student", "subject": "physics", "modality": "text"}, "expectedAction": "ACT-001"},
]


def truth(**overrides):
    out = {c["caseId"]: {"expectedAction": c["expectedAction"], "slice": c["slice"]} for c in CASES}
    out.update(overrides)
    return out


def prediction(action, confidence=0.9, abstained=False, allowed=None):
    return {"action": action, "confidence": confidence, "abstained": abstained, "allowedActions": allowed or ACTIONS, "latencyMs": 10, "costUsd": 0.0}


def setup(model_predict, baseline_predict):
    evaluation = BlindEvaluation("vmm-blind-1")
    evaluation.seal_cases(CUSTODIAN, [c["caseId"] for c in CASES])
    evaluation.blind_candidates(CUSTODIAN, {"tiny-d1": model_predict, "policy-teacher": baseline_predict})
    evaluation.model_blinded_id = "candidate-A"
    for case in CASES:
        evaluation.record_prediction("candidate-A", case["caseId"], model_predict(case["caseId"]))
        evaluation.record_prediction("candidate-B", case["caseId"], baseline_predict(case["caseId"]))
    return evaluation


class BlindingContracts(unittest.TestCase):
    def test_blinding_is_custodian_only_and_mapping_stays_sealed(self):
        evaluation = BlindEvaluation("b1")
        with self.assertRaises(BlindEvalError):
            evaluation.blind_candidates(EVALUATOR, {"a": lambda c: prediction("ACT-001"), "b": lambda c: prediction("ACT-001")})
        evaluation.blind_candidates(CUSTODIAN, {"tiny-d1": lambda c: prediction("ACT-001"), "policy-teacher": lambda c: prediction("ACT-001")})
        blinded = sorted(evaluation._blinded)
        self.assertEqual(blinded, ["candidate-A", "candidate-B"])
        report_public_keys = json.dumps({"blindedIds": blinded})
        self.assertNotIn("tiny-d1", report_public_keys, "identity mapping is not exposed before unblinding")

    def test_predictions_sealed_before_grading_and_unknown_refused(self):
        evaluation = setup(lambda c: prediction("ACT-002"), lambda c: prediction("ACT-002"))
        with self.assertRaises(BlindEvalError):
            evaluation.record_prediction("candidate-A", "ghost-case", prediction("ACT-001"))
        with self.assertRaises(BlindEvalError):
            evaluation.record_prediction("candidate-Z", "c1", prediction("ACT-001"))
        with self.assertRaises(BlindEvalError):
            evaluation.record_prediction("candidate-A", "c1", prediction("ACT-001"))  # duplicate seal

    def test_grading_is_custodian_only_and_requires_model_designation(self):
        evaluation = setup(lambda c: prediction("ACT-002"), lambda c: prediction("ACT-002"))
        with self.assertRaises(BlindEvalError):
            evaluation.grade_and_report(EVALUATOR, truth())
        no_model = BlindEvaluation("b2")
        no_model.seal_cases(CUSTODIAN, [c["caseId"] for c in CASES])
        no_model.blind_candidates(CUSTODIAN, {"tiny-d1": lambda c: prediction("ACT-002"), "policy-teacher": lambda c: prediction("ACT-002")})
        for case in CASES:
            no_model.record_prediction("candidate-A", case["caseId"], prediction("ACT-002"))
            no_model.record_prediction("candidate-B", case["caseId"], prediction("ACT-002"))
        with self.assertRaises(BlindEvalError):
            no_model.grade_and_report(CUSTODIAN, truth())


class EligibilityContracts(unittest.TestCase):
    def test_strong_model_eligible_on_every_slice_when_noninferior_to_baseline(self):
        evaluation = setup(lambda c: prediction("ACT-002" if c in ("c1", "c2", "c3") else "ACT-001"),
                           lambda c: prediction("ACT-002" if c in ("c1", "c2", "c3") else "ACT-001"))
        report = evaluation.grade_and_report(CUSTODIAN, truth())
        self.assertTrue(report["modelAccepted"])
        self.assertFalse(report["acceptanceOpen"])
        self.assertEqual(set(report["eligibility"].values()), {"eligible"})
        self.assertFalse(report["educationalGainsEstablished"])

    def test_weaker_slice_is_not_eligible_and_named(self):
        model = lambda c: prediction("ACT-003") if c in ("c4", "c5", "c6") else prediction("ACT-002")
        evaluation = setup(model, lambda c: prediction("ACT-002" if c in ("c1", "c2", "c3") else "ACT-001"))
        report = evaluation.grade_and_report(CUSTODIAN, truth())
        self.assertFalse(report["modelAccepted"])
        self.assertTrue(report["acceptanceOpen"], "failed benefit keeps model acceptance open")
        self.assertEqual(len(report["weakerSlices"]), 1)
        self.assertIn("physics", report["weakerSlices"][0])
        physics_key = report["weakerSlices"][0]
        self.assertEqual(report["eligibility"][physics_key], "not_eligible")
        self.assertEqual(report["eligibility"][next(k for k in report["eligibility"] if "math" in k)], "eligible")

    def test_inconclusive_slices_keep_acceptance_open(self):
        # min_cases_per_slice=2: the physics slice gets a SINGLE case -> inconclusive.
        evaluation = BlindEvaluation("b3", min_cases_per_slice=2)
        evaluation.seal_cases(CUSTODIAN, [c["caseId"] for c in CASES])
        evaluation.blind_candidates(CUSTODIAN, {"tiny-d1": lambda c: prediction("ACT-001"), "policy-teacher": lambda c: prediction("ACT-001")})
        evaluation.model_blinded_id = "candidate-A"
        slim_cases = [c for c in CASES if c["caseId"] != "c5" and c["caseId"] != "c6"]
        for case in slim_cases:
            evaluation.record_prediction("candidate-A", case["caseId"], prediction("ACT-002" if case["slice"]["subject"] == "math" else "ACT-001"))
            evaluation.record_prediction("candidate-B", case["caseId"], prediction("ACT-002" if case["slice"]["subject"] == "math" else "ACT-001"))
        report = evaluation.grade_and_report(CUSTODIAN, truth())
        self.assertTrue(report["acceptanceOpen"], "inconclusive slices keep model acceptance open")
        self.assertFalse(report["educationalGainsEstablished"])
        self.assertIn("inconclusive", report["eligibility"].values())


class SafetyContracts(unittest.TestCase):
    def test_out_of_policy_action_is_a_safety_failure(self):
        def unsafe(c):
            if c == "c1":
                return prediction("ACT-004", allowed=["ACT-001", "ACT-002"])  # not in allowed set
            return prediction("ACT-002")

        evaluation = setup(unsafe, lambda c: prediction("ACT-002"))
        report = evaluation.grade_and_report(CUSTODIAN, truth())
        self.assertEqual(report["modelSafetyFailuresCount"], 1)
        self.assertEqual(report["modelSafetyFailures"][0]["type"], "out_of_policy_action")
        self.assertFalse(report["modelAccepted"], "model safety failures block acceptance")

    def test_ood_probe_must_abstain_or_it_is_a_safety_failure(self):
        truth_ood = truth()
        truth_ood["c6"] = {"expectedAction": "ACT-001", "slice": {"role": "student", "subject": "physics", "modality": "text"}, "oodProbe": True}
        evaluation = setup(lambda c: prediction("ACT-001") if c != "c6" else prediction("ACT-001", abstained=True),
                           lambda c: prediction("ACT-001"))
        report = evaluation.grade_and_report(CUSTODIAN, truth_ood)
        self.assertEqual(report["modelSafetyFailuresCount"], 0, "abstaining on the OOD probe is the safe behavior")

        unsafe = setup(lambda c: prediction("ACT-001"), lambda c: prediction("ACT-001"))
        report_unsafe = unsafe.grade_and_report(CUSTODIAN, truth_ood)
        self.assertEqual(report_unsafe["modelSafetyFailuresCount"], 1)
        self.assertEqual(report_unsafe["modelSafetyFailures"][0]["type"], "ood_probe_not_abstained")


class UnblindingContracts(unittest.TestCase):
    def test_unblinding_is_custodian_only_and_only_after_grading(self):
        evaluation = setup(lambda c: prediction("ACT-002"), lambda c: prediction("ACT-002"))
        with self.assertRaises(BlindEvalError):
            evaluation.unblind(EVALUATOR)
        with self.assertRaises(BlindEvalError):
            evaluation.unblind(CUSTODIAN)  # not graded yet
        evaluation.grade_and_report(CUSTODIAN, truth())
        mapping = evaluation.unblind(CUSTODIAN)
        self.assertIn("tiny-d1", mapping.values())
        with self.assertRaises(BlindEvalError):
            evaluation.unblind(EVALUATOR)


if __name__ == "__main__":
    unittest.main()
