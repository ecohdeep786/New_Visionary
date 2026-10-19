import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import bootstrap  # noqa: E402


class EnsureUrlMapTests(unittest.TestCase):
    def test_first_run_imports_before_validating(self):
        desired = bootstrap.edge_urlmap()
        existing = {
            "defaultUrlRedirect": desired["defaultUrlRedirect"],
            "hostRules": desired["hostRules"],
            "pathMatchers": desired["pathMatchers"],
        }
        calls = []

        def fake_gcloud(args, missing=False):
            calls.append((args, missing))
            if args[:4] == ["compute", "url-maps", "describe", desired["name"]]:
                return None if missing else existing
            if args[:3] == ["compute", "url-maps", "import"]:
                source = Path(args[4].removeprefix("--source="))
                self.assertEqual(json.loads(source.read_text(encoding="utf-8")), desired)
                return {}
            if args[:3] == ["compute", "url-maps", "validate"]:
                source = Path(args[3].removeprefix("--source="))
                self.assertEqual(json.loads(source.read_text(encoding="utf-8")), desired)
                return {"loadSucceeded": True, "testPassed": True}
            self.fail(f"Unexpected gcloud call: {args}")

        with patch.object(bootstrap, "gcloud", side_effect=fake_gcloud):
            self.assertEqual(bootstrap.ensure_url_map(desired), existing)

        operation_order = [args[2] for args, _ in calls if args[:2] == ["compute", "url-maps"]]
        self.assertEqual(operation_order, ["describe", "import", "describe", "validate"])


if __name__ == "__main__":
    unittest.main()
