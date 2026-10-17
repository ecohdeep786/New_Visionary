"""Independent binary-ranking fixtures; no provider/model/database imports."""
import importlib.util
import json
import pathlib
import os
import subprocess
import sys
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("visionary_recall_metrics", ROOT / "upstream/eval/recall_eval.py")
metrics = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = metrics
spec.loader.exec_module(metrics)
CONTRACT = json.loads(pathlib.Path(__file__).with_name("retrieval-binary-v2.json").read_text(encoding="utf-8"))

class RetrievalContract(unittest.TestCase):
    def test_hand_calculated_shared_fixtures(self):
        self.assertEqual(metrics.METRIC_CONTRACT, CONTRACT["contract"])
        for fixture in CONTRACT["fixtures"]:
            with self.subTest(fixture["name"]):
                r, g = fixture["retrieved"], fixture["relevant"]
                original_r, original_g = list(r), list(g)
                results = {"recall": metrics.calculate_recall_at_k(r, g, fixture["k"]), "mrr": metrics.calculate_mrr(r, g), "ndcg": metrics.calculate_ndcg(r, g)}
                for name, value in results.items():
                    self.assertAlmostEqual(value, fixture[name], places=12)
                    self.assertGreaterEqual(value, 0)
                    self.assertLessEqual(value, 1)
                self.assertEqual(r, original_r)
                self.assertEqual(g, original_g)
    def test_invalid_python_k_and_versioned_report(self):
        for k in [None, True, 1.5]:
            self.assertEqual(metrics.calculate_recall_at_k(["a"], ["a"], k), 0)
        report = metrics.evaluate_retrieval([], lambda *args: [], verbose=False)
        self.assertEqual(report["metric_contract"], CONTRACT["contract"])

    def test_cli_requires_explicit_synthetic_mode_and_handles_selected_k(self):
        with tempfile.TemporaryDirectory(prefix="visionary-metric-contract-") as directory:
            fixture = pathlib.Path(directory) / "synthetic.jsonl"
            fixture.write_text(json.dumps(dict(question="synthetic", answer="synthetic", gold_chunk_ids=["chunk-0"])) + "\n", encoding="utf-8")
            args = [sys.executable, str(ROOT / "upstream/eval/recall_eval.py"), "--eval-set", str(fixture)]
            env = dict(os.environ, PYTHONIOENCODING="utf-8")
            denied = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", env=env)
            self.assertNotEqual(denied.returncode, 0)
            self.assertIn("dummy retrieval", denied.stderr)
            demo = subprocess.run(args + ["--demo", "--top-k", "2"], capture_output=True, text=True, encoding="utf-8", env=env)
            self.assertEqual(demo.returncode, 0, demo.stderr)
            self.assertIn("not a retrieval quality benchmark", demo.stdout)
            self.assertIn("recall@2: 1.0000", demo.stdout)

if __name__ == "__main__":
    unittest.main()
