"""VMM-26 (KAN-198) — verified scoped corrections contracts (synthetic)."""
import unittest

from vmm.corrections import CorrectionAuthority, CorrectionError, owned_ref

UID = "uid_learner"
REF = owned_ref(UID, "mem-entry-1")
DIGEST = "a" * 64
ACTOR = {"uid": UID}
STRANGER = {"uid": "uid_stranger"}
REVIEWER = {"uid": "uid_reviewer", "role": "reviewer"}


def confirm_memory(actor, ref, digest, fix):
    return "confirmed_error"


def refute_memory(actor, ref, digest, fix):
    return "false_correction"


def preference_memory(actor, ref, digest, fix):
    return "valid_preference"


class ClassificationContracts(unittest.TestCase):
    def test_confirmed_error_repairable(self):
        authority = CorrectionAuthority({"memory": confirm_memory})
        record = authority.report_correction(ACTOR, "memory", REF, DIGEST, "fix the retained note")
        self.assertEqual(record["classification"], "confirmed_error")

    def test_false_correction_recorded_and_refused_repair(self):
        authority = CorrectionAuthority({"memory": refute_memory})
        record = authority.report_correction(ACTOR, "memory", REF, DIGEST, "I think this is wrong")
        self.assertEqual(record["classification"], "false_correction")
        with self.assertRaises(CorrectionError):
            authority.apply_repair(ACTOR, "memory", REF, DIGEST, new_revision=2)

    def test_valid_preference_recorded_no_repair(self):
        authority = CorrectionAuthority({"memory": preference_memory})
        record = authority.report_correction(ACTOR, "memory", REF, DIGEST, "I simply prefer the other wording")
        self.assertEqual(record["classification"], "valid_preference")
        with self.assertRaises(CorrectionError):
            authority.apply_repair(ACTOR, "memory", REF, DIGEST, new_revision=2)
        self.assertFalse(authority.is_stale("memory", REF, 2))


class ScopedRepairContracts(unittest.TestCase):
    def test_repair_invalidates_only_the_affected_revision(self):
        authority = CorrectionAuthority({"memory": confirm_memory, "ocr": confirm_memory})
        authority.report_correction(ACTOR, "memory", REF, DIGEST, "fix")
        receipt = authority.apply_repair(ACTOR, "memory", REF, DIGEST, new_revision=2)
        self.assertTrue(authority.is_stale("memory", REF, 2))
        self.assertFalse(authority.is_stale("memory", REF, 1), "earlier revision untouched")
        self.assertFalse(authority.is_stale("ocr", REF, 2), "other domains untouched")

    def test_repair_requires_exact_digest_match(self):
        authority = CorrectionAuthority({"memory": confirm_memory})
        authority.report_correction(ACTOR, "memory", REF, DIGEST, "fix")
        with self.assertRaises(CorrectionError):
            authority.apply_repair(ACTOR, "memory", REF, "b" * 64, new_revision=2)

    def test_unauthorized_edits_rejected(self):
        authority = CorrectionAuthority({"memory": confirm_memory})
        with self.assertRaises(CorrectionError):
            authority.report_correction(STRANGER, "memory", REF, DIGEST, "fix")
        # A reviewer may act on any ref.
        record = authority.report_correction(REVIEWER, "memory", REF, DIGEST, "reviewer-confirmed fix")
        self.assertEqual(record["classification"], "confirmed_error")
        with self.assertRaises(CorrectionError):
            authority.apply_repair(STRANGER, "memory", REF, DIGEST, new_revision=2)

    def test_repair_history_append_only_and_inspectable(self):
        authority = CorrectionAuthority({"memory": confirm_memory})
        authority.report_correction(ACTOR, "memory", REF, DIGEST, "fix")
        authority.apply_repair(ACTOR, "memory", REF, DIGEST, new_revision=2)
        history = authority.history(ACTOR, "memory", REF)
        kinds = [(r.get("classification"), r.get("kind")) for r in history]
        self.assertIn(("confirmed_error", None), kinds)
        self.assertIn((None, "repair"), kinds)
        with self.assertRaises(CorrectionError):
            authority.history(STRANGER, "memory", REF)


class RecurrenceContracts(unittest.TestCase):
    def test_recurrence_escalates_and_closes_the_loop(self):
        authority = CorrectionAuthority({"memory": confirm_memory}, max_recurrence=3)
        for i in range(3):
            digest = f"{i:064x}"
            authority.report_correction(ACTOR, "memory", REF, digest, f"fix {i}")
            receipt = authority.apply_repair(ACTOR, "memory", REF, digest, new_revision=10 + i)
            status = authority.recurrence_status("memory", REF)
            self.assertEqual(receipt["escalatedToReview"], status["escalatedToReview"])
        self.assertTrue(authority.recurrence_status("memory", REF)["loopClosed"], "never unbounded")

    def test_below_bound_does_not_escalate(self):
        authority = CorrectionAuthority({"memory": confirm_memory}, max_recurrence=3)
        authority.report_correction(ACTOR, "memory", REF, DIGEST, "fix")
        authority.apply_repair(ACTOR, "memory", REF, DIGEST, new_revision=2)
        self.assertFalse(authority.recurrence_status("memory", REF)["escalatedToReview"])


if __name__ == "__main__":
    unittest.main()
