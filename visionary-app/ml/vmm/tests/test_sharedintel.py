"""VMM-18 (KAN-186) — shared-intelligence journey tests: commit across all
four surfaces, deterministic second-device resume, five-role sharing with
immediate revocation, and the deny paths. The journey anchors into the REAL
KAN-197 ScopedMemory."""
import unittest

from vmm.memory import MemoryError
from vmm.sharedintel import SHARE_ROLES, SURFACES, SharedIntelligenceError, SharedIntelligenceJourney

OWNER = {"uid": "uid-learner"}
OTHER = {"uid": "uid-stranger"}


def ref(kind: str, detail: str) -> dict:
    return {"kind": kind, "detail": detail, "pinned": "v1"}


class SharedIntelligenceTest(unittest.TestCase):
    def test_commit_across_all_four_surfaces_and_resume_on_a_second_device(self):
        journey = SharedIntelligenceJourney(OWNER)
        for surface in SURFACES:
            artifact = journey.commit(OWNER, surface, ref(surface, f"{surface} outcome"))
            self.assertEqual(artifact["surface"], surface)
        state = journey.resume_state()
        self.assertEqual(state["committed"], 4)
        self.assertEqual(state["perSurface"], {"learn": 1, "ask": 1, "practice": 1, "build": 1})
        # Second device rebuilds the SAME state deterministically.
        replay = SharedIntelligenceJourney(OWNER)
        for surface in SURFACES:
            replay.commit(OWNER, surface, ref(surface, f"{surface} outcome"))
        self.assertEqual(replay.resume_state(), state)

    def test_owner_reads_all_but_only_the_owner_can_commit(self):
        journey = SharedIntelligenceJourney(OWNER)
        journey.commit(OWNER, "learn", ref("loop", "check passed"))
        self.assertEqual(len(journey.read_as(OWNER, "student")), 1)
        with self.assertRaises(SharedIntelligenceError):
            journey.commit(OTHER, "learn", ref("loop", "hijack"))
        with self.assertRaises(SharedIntelligenceError):
            journey.commit(OWNER, "ghost-surface", ref("x", "y"))

    def test_role_sharing_grants_scoped_read_and_revocation_cuts_immediately(self):
        journey = SharedIntelligenceJourney(OWNER)
        journey.commit(OWNER, "build", ref("artifact", "revision 1"))
        with self.assertRaises(SharedIntelligenceError):
            journey.read_as({"uid": "uid-teacher"}, "teacher")  # not granted yet
        journey.share_with(OWNER, "teacher")
        granted = journey.read_as({"uid": "uid-teacher"}, "teacher")
        self.assertEqual(len(granted), 1)
        self.assertIn("refDigest", granted[0])
        self.assertNotIn("kind", granted[0])  # digest references only, no raw payload
        journey.share_with(OWNER, "company")
        self.assertEqual(len(journey.read_as({"uid": "uid-company"}, "company")), 1)
        journey.revoke(OWNER, "teacher")
        with self.assertRaises(SharedIntelligenceError):
            journey.read_as({"uid": "uid-teacher"}, "teacher")  # cut immediately
        self.assertEqual(len(journey.read_as({"uid": "uid-company"}, "company")), 1)

    def test_role_rules_refuse(self):
        journey = SharedIntelligenceJourney(OWNER)
        with self.assertRaises(SharedIntelligenceError):
            journey.share_with(OWNER, "student")  # the student IS the owner
        with self.assertRaises(SharedIntelligenceError):
            journey.share_with(OWNER, "ghost-role")
        with self.assertRaises(SharedIntelligenceError):
            journey.read_as({"uid": "uid-x"}, "student")  # a student viewer must be the owner
        with self.assertRaises(SharedIntelligenceError):
            journey.read_as({"uid": "uid-guardian"}, "guardian")  # never granted
        with self.assertRaises(SharedIntelligenceError):
            journey.revoke(OTHER, "teacher")  # non-owner revocation
        journey.share_with(OWNER, "guardian")
        with self.assertRaises(SharedIntelligenceError):
            journey.revoke(OWNER, "professional")  # no grant to revoke

    def test_every_commit_anchors_into_the_real_scoped_memory(self):
        journey = SharedIntelligenceJourney(OWNER)
        journey.commit(OWNER, "practice", ref("attempt", "correct with ocr provenance"))
        with self.assertRaises(MemoryError):
            # The memory anchor is the OWNER's: a stranger cannot remember into it.
            journey._memory.remember(OTHER, "injected", ["learn"], "external")


if __name__ == "__main__":
    unittest.main()
