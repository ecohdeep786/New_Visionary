"""VMM-02 (KAN-170) — exposure inventory scanner contracts (synthetic temp tree)."""
import tempfile
import unittest
from pathlib import Path

from vmm.exposure import scan_tree


def make_tree(root: Path):
    (root / "ml" / "vmm").mkdir(parents=True, exist_ok=True)
    (root / "data").mkdir(parents=True, exist_ok=True)
    # Credential-class matches: path/classification only, content never recorded.
    (root / ".env").write_text("TOP_SECRET_TOKEN=super-secret-value\n", encoding="utf-8")
    # `.env.*.example` templates are low-severity, review-only (no real secrets).
    (root / "backend").mkdir(exist_ok=True)
    (root / "backend" / ".env.firebase.example").write_text("API_KEY=\n", encoding="utf-8")
    (root / "keys").mkdir(exist_ok=True)
    (root / "keys" / "service-account.json").write_text('{"private_key": "SECRET"}', encoding="utf-8")
    # Weight + dataset classes: streamed digest recorded.
    (root / "ml" / "vmm" / "tiny-d1.ckpt").write_bytes(b"\x00" * 2048)
    (root / "data" / "seed.csv").write_text("a,b\n1,2\n", encoding="utf-8")
    # Ordinary file: no match.
    (root / "ml" / "vmm" / "supplychain.py").write_text("print('ok')\n", encoding="utf-8")
    # Vendored upstream match is scoped, not treated as a working-tree leak.
    (root / "ml" / "upstream").mkdir(parents=True, exist_ok=True)
    (root / "ml" / "upstream" / "secrets.yaml").write_text("token: pinned-only\n", encoding="utf-8")
    # Skipped directory contents are never inventoried.
    (root / "node_modules").mkdir(exist_ok=True)
    (root / "node_modules" / "leak.env").write_text("Y=2\n", encoding="utf-8")


class ExposureScanner(unittest.TestCase):
    def test_classifies_matches_and_never_records_credential_content(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            make_tree(root)
            report = scan_tree(root)
            by_path = {f["path"].replace("\\", "/"): f for f in report["findings"]}

            self.assertIn(".env", by_path)
            self.assertEqual(by_path[".env"]["classification"], "credential-config")
            self.assertEqual(by_path[".env"]["severity"], "critical")
            self.assertIsNone(by_path[".env"]["digest"], "credential digests are never recorded")
            self.assertNotIn("super-secret-value", str(report), "scanner must not leak contents")

            self.assertIn("backend/.env.firebase.example", by_path)
            self.assertEqual(by_path["backend/.env.firebase.example"]["classification"], "credential-template")
            self.assertEqual(by_path["backend/.env.firebase.example"]["severity"], "low")

            self.assertIn("keys/service-account.json", by_path)
            self.assertEqual(by_path["keys/service-account.json"]["classification"], "credential-config")

            self.assertIn("ml/vmm/tiny-d1.ckpt", by_path)
            self.assertEqual(by_path["ml/vmm/tiny-d1.ckpt"]["classification"], "model-weight")
            self.assertIsNotNone(by_path["ml/vmm/tiny-d1.ckpt"]["digest"], "weights record a streamed digest")

            self.assertIn("data/seed.csv", by_path)
            self.assertEqual(by_path["data/seed.csv"]["classification"], "dataset-candidate")

            self.assertNotIn("ml/vmm/supplychain.py", by_path, "ordinary source is not a finding")

    def test_vendored_upstream_scoped_and_skipped_dirs_never_scanned(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            make_tree(root)
            report = scan_tree(root)
            by_path = {f["path"].replace("\\", "/"): f for f in report["findings"]}

            self.assertIn("ml/upstream/secrets.yaml", by_path)
            self.assertEqual(by_path["ml/upstream/secrets.yaml"]["scope"], "vendored-upstream")
            self.assertNotIn("node_modules/leak.env", by_path, "skipped directories are never scanned")
            self.assertEqual(report["criticalCount"], 3, "all credential-class findings are critical")

    def test_summary_counts_are_accurate(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            make_tree(root)
            report = scan_tree(root)
            self.assertEqual(
                report["countsByClassification"],
                {"credential-config": 3, "credential-template": 1, "model-weight": 1, "dataset-candidate": 1},
            )
            self.assertGreater(report["scannedFiles"], 4)


if __name__ == "__main__":
    unittest.main()
