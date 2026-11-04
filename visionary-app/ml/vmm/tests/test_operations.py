"""VMM-23 (KAN-191) — controlled daily deployment tests over the REAL VMM-22
launch qualification and VMM-20 kill switch."""
import unittest

from vmm.hardening import IndependentHardening
from vmm.launchqual import LaunchQualification
from vmm.operations import DailyDeploymentBoard, OpsError

CUSTODIAN = {"uid": "uid-custodian", "role": "release-custodian"}
OPERATOR = {"uid": "uid-ops", "role": "ml-operator"}
REVIEWER = {"reviewerUid": "uid-reviewer", "decision": "accepted", "sha": "abc123"}


def qualified_board() -> tuple[DailyDeploymentBoard, IndependentHardening]:
    launch = LaunchQualification(IndependentHardening())
    launch.declare_candidate(CUSTODIAN, "tiny-d1-v5", 5, ["provider-alpha"])
    launch.start_canary("cand_1", 10)
    for _ in range(20):
        launch.record_sample("cand_1", False, 800)
    launch.promote(CUSTODIAN, "cand_1", REVIEWER)
    kill = IndependentHardening()
    return DailyDeploymentBoard(launch, kill), kill


class DeploymentBoardTest(unittest.TestCase):
    def test_qualified_candidate_deploys_one_decision_per_day(self):
        board, _ = qualified_board()
        board.propose_retrain(OPERATOR, "cand_1", "d" * 64, "protocol-2026-11")
        decision = board.deploy_decision(OPERATOR, "2026-11-05", "cand_1", "canary green, reviewer accepted")
        self.assertTrue(decision["canaryPassed"])
        self.assertEqual(decision["reviewerUid"], "uid-reviewer")
        with self.assertRaises(OpsError):
            board.deploy_decision(OPERATOR, "2026-11-05", "cand_1", "second same-day")  # one per day
        self.assertEqual(len(board.decisions()), 1)
        self.assertTrue(DailyDeploymentBoard.ledger_is_redacted(board.decisions()))

    def test_unqualified_and_unregistered_candidates_refuse(self):
        board, _ = qualified_board()
        board.propose_retrain(OPERATOR, "cand_2", "e" * 64, "protocol-2026-11")
        with self.assertRaises(OpsError):
            board.deploy_decision(OPERATOR, "2026-11-05", "cand_2", "no receipt")  # never qualified
        with self.assertRaises(OpsError):
            board.deploy_decision(OPERATOR, "2026-11-05", "ghost", "unknown")  # never proposed
        with self.assertRaises(OpsError):
            board.propose_retrain(OPERATOR, "cand_3", "short", "protocol")  # provenance bound

    def test_kill_switch_and_role_bounds_refuse(self):
        board, kill = qualified_board()
        board.propose_retrain(OPERATOR, "cand_1", "d" * 64, "protocol-2026-11")
        kill.engage_kill_switch("incident")
        with self.assertRaises(OpsError):
            board.deploy_decision(OPERATOR, "2026-11-05", "cand_1", "blocked")
        with self.assertRaises(OpsError):
            board.propose_retrain({"uid": "x", "role": "admin"}, "cand_9", "d" * 64, "p")
        with self.assertRaises(OpsError):
            board.deploy_decision({"uid": "y", "role": "admin"}, "2026-11-06", "cand_1", "not operator")


if __name__ == "__main__":
    unittest.main()
