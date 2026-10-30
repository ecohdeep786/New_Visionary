"""VMM-25 (KAN-197) — memory contracts (synthetic)."""
import unittest

from vmm.memory import MemoryAuthority, MemoryError, ScopedMemory

OWNER = {"uid": "uid_learner"}
COMPANY_MEMBER = {"uid": "uid_staff", "role": "company-member", "companyId": "company-1"}
OUTSIDER = {"uid": "uid_stranger"}


def personal_memory():
    memory = ScopedMemory("personal", "uid_learner")
    memory.remember(OWNER, "Learner prefers visual explanations", ["preference", "visual"], "tutor-loop")
    memory.remember(OWNER, "Preparing for CBSE 2027 boards", ["goal", "exam"], "goals-planner")
    return memory


class DurabilityContracts(unittest.TestCase):
    def test_entries_hash_chained_and_tamper_detected(self):
        memory = personal_memory()
        report = memory.verify_chain()
        self.assertTrue(report["ok"])
        # Tamper with an entry in place.
        memory._entries[0]["body"]["text"] = "tampered"
        broken = memory.verify_chain()
        self.assertFalse(broken["ok"])
        self.assertEqual(broken["brokenAtSeq"], 1)

    def test_long_gap_recovery_rebuilds_identically(self):
        memory = personal_memory()
        before = memory.verify_chain()
        recovered = ScopedMemory("personal", "uid_learner")
        recovered._entries = [dict(e) for e in memory._entries]
        recovered._chain_digest = memory._chain_digest
        after = recovered.verify_chain()
        self.assertEqual(after, before, "long-gap recovery verifies identically")


class CorrectionContracts(unittest.TestCase):
    def test_correction_appends_bound_to_original_never_rewrites(self):
        memory = personal_memory()
        original_count = len(memory._entries)
        correction = memory.correct(OWNER, 1, "Learner prefers worked examples")
        self.assertEqual(correction["kind"], "correction")
        self.assertEqual(correction["body"]["correctsSeq"], 1)
        self.assertEqual(len(memory._entries), original_count + 1, "append-only")
        self.assertEqual(memory._entries[0]["body"]["text"], "Learner prefers visual explanations", "original untouched")

    def test_effective_view_reflects_latest_correction(self):
        memory = personal_memory()
        memory.correct(OWNER, 1, "Learner prefers worked examples")
        retrieved = memory.retrieve(OWNER, ["preference"])
        self.assertEqual(len(retrieved), 1)
        self.assertEqual(retrieved[0]["text"], "Learner prefers worked examples", "superseded entry excluded")

    def test_disable_excludes_but_stays_inspectable(self):
        memory = personal_memory()
        memory.disable(OWNER, 2, "outdated goal")
        self.assertEqual(memory.retrieve(OWNER, ["exam"]), [], "disabled entries excluded from retrieval")
        audit = memory.inspect(OWNER)
        self.assertEqual(len(audit), 3, "disabled entries remain inspectable")

    def test_forget_drops_content_keeps_chain(self):
        memory = personal_memory()
        tombstone = memory.forget(OWNER, 1)
        self.assertTrue(tombstone["body"]["contentDropped"])
        self.assertTrue(memory.verify_chain()["ok"], "chain stays intact across a forget")
        self.assertEqual(memory.retrieve(OWNER, ["preference"]), [], "forgotten content unretrievable")
        audit = memory.inspect(OWNER)
        self.assertEqual(audit[-1]["kind"], "forget", "tombstone recorded at the chain tail")


class SeparationContracts(unittest.TestCase):
    def test_personal_company_separation(self):
        authority = MemoryAuthority("uid_learner", company_id="company-1")
        authority.personal.remember(OWNER, "personal note", ["personal"], "tutor-loop")
        authority.company.remember(COMPANY_MEMBER, "company curriculum note", ["company"], "company-planner")
        with self.assertRaises(MemoryError):
            authority.company.remember(OWNER, "sneaky", ["x"], "y")  # personal uid cannot write company scope
        with self.assertRaises(MemoryError):
            authority.personal.remember(COMPANY_MEMBER, "sneaky", ["x"], "y")

    def test_company_scope_demands_company_role(self):
        authority = MemoryAuthority("uid_learner", company_id="company-1")
        with self.assertRaises(MemoryError):
            authority.scope_for(OUTSIDER, "company")
        member = authority.scope_for(COMPANY_MEMBER, "company")
        self.assertEqual(member.scope, "company")

    def test_canonical_records_untouched(self):
        authority = MemoryAuthority("uid_learner")
        self.assertTrue(authority.canonical_records_untouched(), "no project/assessment mutation API exists")


class RetrievalContracts(unittest.TestCase):
    def test_relevance_ranking_deterministic_with_freshness(self):
        memory = personal_memory()
        memory.remember(OWNER, "Visual preference also applies to physics", ["preference", "physics"], "tutor-loop")
        retrieved = memory.retrieve(OWNER, ["preference"])
        self.assertEqual(len(retrieved), 2)
        self.assertEqual(retrieved[0]["matches"], retrieved[1]["matches"], "deterministic ranking")
        self.assertTrue(all("ageDays" in r for r in retrieved))
        self.assertFalse(any(r["stale"] for r in retrieved), "fresh entries are not stale")

    def test_stale_entries_flagged(self):
        memory = ScopedMemory("personal", "uid_learner")
        memory.remember(OWNER, "old note", ["old"], "legacy")
        memory._entries[0]["capturedAt"] = "2025-01-01T00:00:00+00:00"  # ~300 days old
        retrieved = memory.retrieve(OWNER, ["old"])
        self.assertTrue(retrieved[0]["stale"])

    def test_cross_owner_access_denied(self):
        memory = personal_memory()
        for operation in (
            lambda: memory.remember(OUTSIDER, "x", ["t"], "s"),
            lambda: memory.correct(OUTSIDER, 1, "x"),
            lambda: memory.disable(OUTSIDER, 1, "x"),
            lambda: memory.forget(OUTSIDER, 1),
            lambda: memory.inspect(OUTSIDER),
            lambda: memory.retrieve(OUTSIDER, ["preference"]),
        ):
            with self.assertRaises(MemoryError):
                operation()


if __name__ == "__main__":
    unittest.main()
