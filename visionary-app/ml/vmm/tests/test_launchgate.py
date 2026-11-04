"""VMM-31 (KAN-203) — two-mode launch acceptance tests over the frozen day-one
contract: evidence-gated readiness, two-mode coherence, and separate sign-off."""
import unittest

from vmm.launchgate import LaunchGateError, TwoModeLaunchGate

FROZEN = {"mode": "teach-learn+build", "pinned": {"policy": "doc03-reference-v1", "criteria": "c1", "graph": "g1", "source": "s1"}, "dayOneCapabilities": ["explain", "doubt", "check", "build-generate", "build-deploy"]}
CUSTODIAN = {"uid": "uid-custodian", "role": "release-custodian"}
REVIEWER = {"reviewerUid": "uid-reviewer", "decision": "accepted", "sha": "abc123"}


def full_evidence(gate: TwoModeLaunchGate) -> None:
    d = gate.frozen_digest
    gate.submit_evidence("learn_loop", {"kind": "tutor-loop-check", "closed": True, "assessedBy": "backend", "frozenDigest": d})
    gate.submit_evidence("build_deploy", {"kind": "build-deploy-receipt", "testDigest": "t" * 8, "explanationDigest": "e" * 8, "frozenDigest": d})
    gate.submit_evidence("launch_qualification", {"kind": "canary-receipt", "canaryPassed": True, "reviewerUid": "uid-reviewer", "frozenDigest": d})
    gate.submit_evidence("kill_switch_drill", {"kind": "hardening-drill", "failClosed": True, "recovered": True, "frozenDigest": d})


class TwoModeLaunchTest(unittest.TestCase):
    def test_all_gates_evidenced_then_separate_signoff(self):
        gate = TwoModeLaunchGate(FROZEN)
        self.assertFalse(gate.verdict()["ready"])
        full_evidence(gate)
        verdict = gate.verdict()
        self.assertTrue(verdict["ready"])
        receipt = gate.sign_off(CUSTODIAN, REVIEWER)
        self.assertEqual(receipt["frozenDigest"], gate.frozen_digest)
        self.assertEqual(receipt["reviewer"]["reviewerUid"], "uid-reviewer")

    def test_missing_gates_block_and_prose_is_not_evidence(self):
        gate = TwoModeLaunchGate(FROZEN)
        gate.submit_evidence("learn_loop", {"kind": "tutor-loop-check", "closed": True, "assessedBy": "backend", "frozenDigest": gate.frozen_digest})
        verdict = gate.verdict()
        self.assertFalse(verdict["ready"])
        self.assertEqual(sorted(verdict["missingGates"]), ["build_deploy", "kill_switch_drill", "launch_qualification"])
        with self.assertRaises(LaunchGateError):
            gate.submit_evidence("build_deploy", {"kind": "promise", "note": "we will ship", "frozenDigest": gate.frozen_digest})
        with self.assertRaises(LaunchGateError):
            gate.sign_off(CUSTODIAN, REVIEWER)  # blocked while gates are missing

    def test_two_mode_coherence_refuses_foreign_contract_refs(self):
        gate = TwoModeLaunchGate(FROZEN)
        with self.assertRaises(LaunchGateError):
            gate.submit_evidence("learn_loop", {"kind": "tutor-loop-check", "closed": True, "assessedBy": "backend", "frozenDigest": "other-contract"})
        with self.assertRaises(LaunchGateError):
            gate.submit_evidence("launch_qualification", {"kind": "canary-receipt", "canaryPassed": True, "reviewerUid": "r", "frozenDigest": "other-contract"})

    def test_signoff_bounds(self):
        gate = TwoModeLaunchGate(FROZEN)
        full_evidence(gate)
        with self.assertRaises(LaunchGateError):
            gate.sign_off({"uid": "x", "role": "admin"}, REVIEWER)
        with self.assertRaises(LaunchGateError):
            gate.sign_off(CUSTODIAN, {"reviewerUid": "uid-custodian", "decision": "self"})  # self-signoff
        with self.assertRaises(LaunchGateError):
            gate.submit_evidence("ghost-gate", {"frozenDigest": gate.frozen_digest})

    def test_frozen_contract_shape_refuses(self):
        with self.assertRaises(LaunchGateError):
            TwoModeLaunchGate({"mode": "build-only", "dayOneCapabilities": []})
        with self.assertRaises(LaunchGateError):
            TwoModeLaunchGate({"mode": "teach-learn+build"})


if __name__ == "__main__":
    unittest.main()
