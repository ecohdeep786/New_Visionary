"""VMM-22 (KAN-190) — canary/launch-qualification tests over the REAL VMM-20
kill switch: candidate declaration, canary auto-abort + rollback, promotion
gates (passed canary + SEPARATE reviewer), and the deny paths."""
import unittest

from vmm.hardening import IndependentHardening
from vmm.launchqual import MAX_REFUSAL_RATE, LaunchError, LaunchQualification

CUSTODIAN = {"uid": "uid-custodian", "role": "release-custodian"}
REVIEWER = {"reviewerUid": "uid-reviewer", "decision": "accepted", "sha": "abc123"}


def make(candidate: bool = True) -> LaunchQualification:
    lq = LaunchQualification(IndependentHardening())
    if candidate:
        lq.declare_candidate(CUSTODIAN, "tiny-d1-v3", 4, ["provider-alpha"])
    return lq


def healthy_canary(lq: LaunchQualification) -> None:
    lq.start_canary("cand_1", 10)
    for _ in range(20):
        lq.record_sample("cand_1", refused=False, latency_ms=900)


class LaunchQualificationTest(unittest.TestCase):
    def test_canary_pass_then_promotion_records_the_separate_reviewer(self):
        lq = make()
        healthy_canary(lq)
        verdict = lq.canary_verdict("cand_1")
        self.assertTrue(verdict["passed"])
        with self.assertRaises(LaunchError):
            lq.promote(CUSTODIAN, "cand_1", {"reviewerUid": "uid-custodian", "decision": "self-approved"})  # self-approval refused
        receipt = lq.promote(CUSTODIAN, "cand_1", REVIEWER)
        self.assertEqual(receipt["candidateId"], "cand_1")
        self.assertEqual(lq.served, "cand_1")

    def test_refusal_breach_auto_aborts_and_rolls_back(self):
        lq = make()
        lq.declare_candidate(CUSTODIAN, "tiny-d1-v4", 4, ["provider-alpha"])
        healthy_canary(lq)
        lq.promote(CUSTODIAN, "cand_1", REVIEWER)
        lq.start_canary("cand_2", 10)
        for _ in range(5):
            lq.record_sample("cand_2", refused=True, latency_ms=900)
        self.assertTrue(lq._candidates["cand_2"]["canary"]["aborted"])
        self.assertNotEqual(lq.served, "cand_2")
        with self.assertRaises(LaunchError):
            lq.record_sample("cand_2", False, 100)  # aborted canary accepts nothing further

    def test_promotion_gates_refuse(self):
        lq = make()
        with self.assertRaises(LaunchError):
            lq.promote(CUSTODIAN, "cand_1", REVIEWER)  # no canary at all
        lq.start_canary("cand_1", 10)
        for _ in range(19):  # below the sample bound
            lq.record_sample("cand_1", False, 500)
        with self.assertRaises(LaunchError):
            lq.promote(CUSTODIAN, "cand_1", REVIEWER)
        lq.record_sample("cand_1", False, 500)  # exactly 20 now
        verdict = lq.canary_verdict("cand_1")
        self.assertTrue(verdict["passed"])
        with self.assertRaises(LaunchError):
            lq.start_canary("cand_1", 60)  # traffic bound

    def test_kill_switch_blocks_canary_and_promotion(self):
        lq = make()
        hardening = IndependentHardening()
        lq2 = LaunchQualification(hardening)
        lq2.declare_candidate(CUSTODIAN, "tiny-d1-v3", 4, ["provider-alpha"])
        hardening.engage_kill_switch("incident")
        with self.assertRaises(LaunchError):
            lq2.start_canary("cand_1", 10)
        healthy_canary(lq2)
        with self.assertRaises(LaunchError):
            lq2.promote(CUSTODIAN, "cand_1", REVIEWER)

    def test_declaration_and_bounds_refuse(self):
        lq = LaunchQualification(IndependentHardening())
        with self.assertRaises(LaunchError):
            lq.declare_candidate({"uid": "x", "role": "admin"}, "m", 1, ["p"])  # not the custodian
        with self.assertRaises(LaunchError):
            lq.start_canary("ghost", 10)
        self.assertLessEqual(MAX_REFUSAL_RATE, 0.05)


if __name__ == "__main__":
    unittest.main()
