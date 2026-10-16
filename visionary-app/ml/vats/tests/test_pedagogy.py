"""Synthetic shared Node/Python policy cases; no provider/DB or training import."""
from copy import deepcopy
import json
from pathlib import Path
import unittest
from vats.pedagogy import propose_teaching, InvalidSnapshot

ROOT = Path(__file__).resolve().parents[3]
FIXTURES = json.loads((ROOT / "integration/contracts/fixtures/vats-pedagogy.v1.json").read_text(encoding="utf-8"))["fixtures"]


class PedagogyContract(unittest.TestCase):
    def test_independent_shared_cases_are_deterministic_and_do_not_mutate_evidence(self):
        for fixture in FIXTURES:
            with self.subTest(fixture["name"]):
                before = deepcopy(fixture["request"])
                self.assertEqual(propose_teaching(before), fixture["expected"])
                self.assertEqual(before, fixture["request"])
                before["nodes"].reverse()
                self.assertEqual(propose_teaching(before), fixture["expected"])

    def test_invalid_or_unpinned_graphs_cannot_produce_a_teaching_proposal(self):
        for bad in ["cycle", "missing", "duplicate", "nan", "negative", "bool", "extra", "policy", "revision", "strategy", "count", "no-evidence", "too-many", "unhashable"]:
            with self.subTest(bad):
                request = deepcopy(FIXTURES[0]["request"])
                node = request["nodes"][0]
                if bad == "cycle": node["prerequisites"] = ["newton"]
                elif bad == "missing": node["prerequisites"] = ["unknown"]
                elif bad == "duplicate": request["nodes"].append(deepcopy(node))
                elif bad == "nan": node["pKnown"] = float("nan")
                elif bad == "negative": node["pKnown"] = -0.1
                elif bad == "bool": node["pKnown"] = True
                elif bad == "extra": request["mastered"] = True
                elif bad == "policy": request["scope"]["policyVersion"] = "unreleased"
                elif bad == "revision": request["scope"]["learnerRevision"] = True
                elif bad == "strategy": request["teaching"]["allowedStrategies"] = ["execute_code"]
                elif bad == "unhashable": request["teaching"]["allowedStrategies"] = [[]]
                elif bad == "count": request["teaching"]["failedChecks"] = 4
                elif bad == "no-evidence": node["pKnown"] = None
                elif bad == "too-many": request["nodes"] = [node] * 513
                with self.assertRaises(InvalidSnapshot): propose_teaching(request)

    def test_unavailable_visual_falls_back_without_silently_granting_a_new_capability(self):
        request = deepcopy(FIXTURES[0]["request"])
        request["observations"].update(firstEncounter=True, approvedVisualAvailable=False)
        self.assertEqual(propose_teaching(request)["strategy"], "worked_example")
        request["teaching"]["allowedStrategies"] = ["visual"]
        self.assertEqual(propose_teaching(request)["action"], "review")
        ancestor = deepcopy(next(f["request"] for f in FIXTURES if f["name"] == "earliest-prerequisite-gap"))
        ancestor["observations"].update(firstEncounter=True, approvedVisualAvailable=True)
        self.assertEqual(propose_teaching(ancestor)["strategy"], "worked_example")


if __name__ == "__main__": unittest.main()
