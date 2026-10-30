"""VMM-30 (KAN-202) — resumable goals + proactive assistance contracts."""
import json
import unittest

from vmm.longgoals import GoalRunError, LongRunningGoal, ProactiveAssistant

OWNER = {"kind": "user", "uid": "uid_learner"}
STEPS = ["diagnostic", "practice-1", "practice-2", "mock-exam", "review"]


def started_session():
    session = LongRunningGoal("goal-run-1", OWNER, STEPS)
    session.acquire_lease("worker-a", lease_ms=60000)
    return session


class ResumableContracts(unittest.TestCase):
    def test_checkpoint_resume_identical_after_restart(self):
        session = started_session()
        session.complete_step("worker-a", "diagnostic")
        session.complete_step("worker-a", "practice-1")
        checkpoint = session.checkpoint()
        resumed = LongRunningGoal.resume(checkpoint)
        self.assertTrue(session.identical(resumed), "restart recovery is identical")
        self.assertEqual(resumed.progress()["completed"], 2)

    def test_lease_race_denied_and_stale_lease_reacquirable(self):
        session = started_session()
        with self.assertRaises(GoalRunError):
            session.acquire_lease("worker-b", lease_ms=60000)  # live lease held
        # Lease expiry: simulate expiry by rewinding the timestamp.
        from datetime import datetime, timezone
        session.lease["expiresAt"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        # Ensure expiry is strictly in the past.
        session.lease["expiresAt"] = "2000-01-01T00:00:00+00:00"
        event = session.acquire_lease("worker-b", lease_ms=60000)  # stale lease re-acquirable
        self.assertEqual(event["detail"]["workerId"], "worker-b")

    def test_only_leaseholder_advances(self):
        session = LongRunningGoal("g", OWNER, STEPS)
        session.acquire_lease("worker-a")
        with self.assertRaises(GoalRunError):
            session.complete_step("worker-b", "diagnostic")
        session.complete_step("worker-a", "diagnostic")

    def test_cancel_stops_everything(self):
        session = started_session()
        session.cancel(OWNER)
        with self.assertRaises(GoalRunError):
            session.complete_step("worker-a", "diagnostic")
        with self.assertRaises(GoalRunError):
            session.acquire_lease("worker-a")
        with self.assertRaises(GoalRunError):
            session.cancel({"uid": "uid_stranger"})

    def test_progress_is_deterministic(self):
        session = started_session()
        session.complete_step("worker-a", "diagnostic")
        self.assertEqual(session.progress(), {"goalId": "goal-run-1", "completed": 1, "total": 5, "fraction": 0.2})
        session.complete_step("worker-a", "practice-1")
        session.complete_step("worker-a", "practice-2")
        session.complete_step("worker-a", "mock-exam")
        session.complete_step("worker-a", "review")
        self.assertEqual(session.progress()["fraction"], 1.0)


class ProactiveContracts(unittest.TestCase):
    def test_opt_in_gate_and_immediate_revocation(self):
        assistant = ProactiveAssistant()
        not_opted = assistant.suggest("uid", "review-reminder", "s1", "time to review", now_hour=12)
        self.assertFalse(not_opted["delivered"])
        self.assertEqual(not_opted["reason"], "not_opted_in")
        assistant.set_opt_in("uid", "review-reminder", True)
        delivered = assistant.suggest("uid", "review-reminder", "s2", "time to review", now_hour=12)
        self.assertTrue(delivered["delivered"])
        assistant.set_opt_in("uid", "review-reminder", False)  # permission change: immediate
        blocked = assistant.suggest("uid", "review-reminder", "s3", "time to review", now_hour=12)
        self.assertFalse(blocked["delivered"])

    def test_quiet_hours_honored(self):
        assistant = ProactiveAssistant()
        assistant.set_opt_in("uid", "review-reminder", True)
        blocked = assistant.suggest("uid", "review-reminder", "s1", "x", now_hour=23)  # 22..7 quiet
        self.assertEqual(blocked["reason"], "quiet_hours")
        delivered = assistant.suggest("uid", "review-reminder", "s2", "x", now_hour=12)
        self.assertTrue(delivered["delivered"])

    def test_dismissed_never_resurface_and_frequency_capped(self):
        assistant = ProactiveAssistant()
        assistant.set_opt_in("uid", "review-reminder", True)
        self.assertTrue(assistant.suggest("uid", "review-reminder", "s1", "x", now_hour=12)["delivered"])
        self.assertTrue(assistant.suggest("uid", "review-reminder", "s2", "x", now_hour=12)["delivered"])
        capped = assistant.suggest("uid", "review-reminder", "s3", "x", now_hour=12)
        self.assertEqual(capped["reason"], "frequency_cap")
        assistant.dismiss("uid", "s1")
        resurfaced = assistant.suggest("uid", "review-reminder", "s1", "x", now_hour=9)  # new day
        self.assertFalse(resurfaced["delivered"])
        self.assertEqual(resurfaced["reason"], "previously_dismissed")

    def test_suggestions_never_execute_and_real_receipts_exist(self):
        assistant = ProactiveAssistant()
        assistant.set_opt_in("uid", "review-reminder", True)
        delivered = assistant.suggest("uid", "review-reminder", "s1", "review ratios", now_hour=12)
        self.assertFalse(delivered["executed"])
        self.assertTrue(delivered["requiresExplicitConsent"])
        consent = assistant.consent_for_action("uid", "act-1", consented=False)
        self.assertFalse(consent["executed"])
        receipts = assistant.receipts("uid")
        self.assertEqual(len(receipts), 1)
        self.assertEqual(receipts[0]["ownerUid"], "uid")

    def test_no_always_on_or_default_unsolicited(self):
        assistant = ProactiveAssistant()
        # Without ANY opt-in nothing is delivered: no default unsolicited messages.
        blocked = assistant.suggest("uid", "review-reminder", "s1", "x", now_hour=12)
        self.assertFalse(blocked["delivered"])


if __name__ == "__main__":
    import json
    unittest.main()
