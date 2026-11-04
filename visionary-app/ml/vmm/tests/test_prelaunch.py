"""VMM-32 (KAN-204) — prelaunch readiness tests: evidence-referenced items,
honest blocked verdicts, go/no-go with a separate reviewer, and a recorded
NO-GO as a first-class outcome."""
import unittest

from vmm.prelaunch import PrelaunchError, PrelaunchReadiness

OPERATOR = {"uid": "uid-ops", "role": "ml-operator"}
CUSTODIAN = {"uid": "uid-custodian", "role": "release-custodian"}
REVIEWER = {"reviewerUid": "uid-reviewer", "decision": "accepted", "sha": "abc123"}


def ref(kind: str) -> dict:
    return {"kind": kind, "digest": ("d" * 16), "at": "2026-11-05"}


def fully_closed() -> PrelaunchReadiness:
    board = PrelaunchReadiness()
    board.close_item(OPERATOR, "learning", "two_mode_launch_receipt", ref("launchgate"))
    board.close_item(OPERATOR, "learning", "impact_evaluation_reference", ref("impact"))
    board.close_item(OPERATOR, "market_update", "staged_update_pointer", ref("pointer"))
    board.close_item(OPERATOR, "market_update", "rollback_pointer", ref("pointer"))
    board.close_item(OPERATOR, "operations", "runbook_reference", ref("runbook"))
    board.close_item(OPERATOR, "operations", "kill_switch_drill", ref("hardening"))
    board.close_item(OPERATOR, "operations", "deploy_decision_ledger", ref("ops"))
    return board


class PrelaunchTest(unittest.TestCase):
    def test_all_items_closed_then_go_with_separate_reviewer(self):
        board = fully_closed()
        verdict = board.verdict()
        self.assertTrue(verdict["ready"])
        record = board.decide(CUSTODIAN, "go", REVIEWER)
        self.assertEqual(record["decision"], "go")
        self.assertEqual(len(board.decisions()), 1)

    def test_blocked_verdict_names_items_and_go_refuses(self):
        board = PrelaunchReadiness()
        board.close_item(OPERATOR, "learning", "two_mode_launch_receipt", ref("launchgate"))
        verdict = board.verdict()
        self.assertFalse(verdict["ready"])
        self.assertIn("operations/runbook_reference", verdict["missingItems"])
        with self.assertRaises(PrelaunchError):
            board.decide(CUSTODIAN, "go", REVIEWER)
        record = board.decide(CUSTODIAN, "no-go", REVIEWER)  # a NO-GO is always recordable
        self.assertEqual(record["decision"], "no-go")

    def test_prose_and_unknown_items_refuse(self):
        board = PrelaunchReadiness()
        with self.assertRaises(PrelaunchError):
            board.close_item(OPERATOR, "learning", "two_mode_launch_receipt", {"note": "looks fine"})
        with self.assertRaises(PrelaunchError):
            board.close_item(OPERATOR, "learning", "ghost_item", ref("x"))
        with self.assertRaises(PrelaunchError):
            board.close_item(OPERATOR, "unknown_category", "runbook_reference", ref("x"))
        with self.assertRaises(PrelaunchError):
            board.close_item({"uid": "z", "role": "admin"}, "learning", "two_mode_launch_receipt", ref("x"))

    def test_decision_bounds(self):
        board = fully_closed()
        with self.assertRaises(PrelaunchError):
            board.decide({"uid": "x", "role": "admin"}, "go", REVIEWER)
        with self.assertRaises(PrelaunchError):
            board.decide(CUSTODIAN, "go", {"reviewerUid": "uid-custodian"})  # self-approval
        with self.assertRaises(PrelaunchError):
            board.decide(CUSTODIAN, "maybe", REVIEWER)


if __name__ == "__main__":
    unittest.main()
