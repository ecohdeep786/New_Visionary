"""PLAT-08 (KAN-52) — backup/PITR/object-protection drill tests: digest-stamped
snapshots, byte-identical restore with identities intact, point-in-time
recovery, retention-locked immutability, and the synthetic-data refusal."""
import unittest
from datetime import datetime, timedelta, timezone

from backup_restore_drill import DrillError, BackupDrill

RECORDS = [
    {"id": "wsp-1", "ownerUid": "uid-a", "kind": "workspace", "payload": "synthetic-alpha"},
    {"id": "wsp-2", "ownerUid": "uid-b", "kind": "workspace", "payload": "synthetic-beta"},
    {"id": "att-1", "ownerUid": "uid-a", "kind": "attempt", "payload": "synthetic-attempt"},
]


class BackupDrillTest(unittest.TestCase):
    def test_snapshot_restore_is_byte_identical_with_identities_intact(self):
        drill = BackupDrill()
        drill.seed(RECORDS)
        backup = drill.snapshot("pre-migration")
        drill.seed([{"id": "wsp-3", "ownerUid": "uid-c", "kind": "workspace", "payload": "post-backup"}])
        self.assertEqual(len(drill.state()), 3)
        restored = drill.restore_latest()
        self.assertEqual(restored["digest"], backup["digest"])
        self.assertEqual(len(drill.state()), 2, "the post-backup mutation is discarded")
        self.assertEqual(drill.state()["wsp-1"]["ownerUid"], "uid-a")
        self.assertEqual(drill.state()["att-1"]["ownerUid"], "uid-a", "identities survive the restore")

    def test_point_in_time_recovery(self):
        drill = BackupDrill()
        drill.seed(RECORDS)
        drill.snapshot("t1")
        drill.seed([{"id": "extra", "ownerUid": "uid-d", "kind": "workspace", "payload": "later"}])
        drill.snapshot("t2")
        result = drill.restore_point_in_time("t1")
        self.assertNotIn("extra", drill.state())
        self.assertEqual(len(drill.state()), 3)
        drill.restore_point_in_time("t2")
        self.assertIn("extra", drill.state())
        with self.assertRaises(DrillError):
            drill.restore_point_in_time("ghost")

    def test_retention_lock_is_immutable(self):
        drill = BackupDrill()
        drill.seed(RECORDS)
        drill.snapshot("locked")
        with self.assertRaises(DrillError):
            drill.delete_snapshot("locked")  # inside the 30-day horizon
        far_future = datetime.now(timezone.utc) + timedelta(days=31)
        drill.delete_snapshot("locked", actor_now=far_future)
        with self.assertRaises(DrillError):
            drill.restore_point_in_time("locked")  # truly gone only after the horizon
        with self.assertRaises(DrillError):
            drill.delete_snapshot("ghost")

    def test_real_user_data_is_refused_synthetic_only(self):
        drill = BackupDrill()
        with self.assertRaises(DrillError):
            drill.seed([{"id": "r1", "ownerUid": "uid-real", "realUser": True, "payload": "production record"}])
        self.assertEqual(len(drill.state()), 0)
        with self.assertRaises(DrillError):
            drill.restore_latest()  # nothing to restore
        drill.seed(RECORDS)
        drill.snapshot("s1")
        drill.restore_latest()
        self.assertEqual(drill.state_digest(), drill.state_digest())  # stable digest probe


if __name__ == "__main__":
    unittest.main()
