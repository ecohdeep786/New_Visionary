"""VMM-05 (KAN-173) — baselines contracts (synthetic; no provider/DB/training deps)."""
import json
import unittest
from copy import deepcopy
from pathlib import Path

from vats.pedagogy import propose_teaching as reference_propose, InvalidSnapshot
from vmm.baselines import (
    BKTParameters,
    NaiveBayesClassifier,
    bkt_update,
    propose_teaching_reproduction,
    scm_project,
)
from vmm.benchmarks import BenchmarkRegistry

ROOT = Path(__file__).resolve().parents[3]
FIXTURES = json.loads((ROOT / "integration/contracts/fixtures/vats-pedagogy.v1.json").read_text(encoding="utf-8"))["fixtures"]

CUSTODIAN = {"uid": "uid_custodian", "role": "custodian"}
RUNNER = {"uid": "uid_runner", "role": "runner"}

THRESHOLDS = dict(
    min_quality=0.7,
    noninferiority_margin=0.05,
    max_calibration_error=0.4,
    max_abstention_rate=0.5,
    p95_latency_ms=2500,
    max_per_task_cost_usd=0.01,
    min_cases_per_slice=2,
    sample_rationale="Baseline acceptance probe: four cases per slice bounds the binomial at this fixture scale.",
)


class PedagogyReproductionContract(unittest.TestCase):
    """REPRODUCE is proven: independent reimplementation == reference on ALL fixtures."""

    def test_reproduction_matches_reference_on_every_shared_fixture(self):
        for fixture in FIXTURES:
            with self.subTest(fixture["name"]):
                request = deepcopy_request(fixture["request"])
                expected = fixture["expected"]
                self.assertEqual(propose_teaching_reproduction(deepcopy_request(request)), expected)
                self.assertEqual(reference_propose(deepcopy_request(request)), expected)

    def test_reproduction_refuses_the_same_invalid_snapshots_as_reference(self):
        base = deepcopy_request(FIXTURES[0]["request"])
        mutations = {
            "cycle": lambda r: r["nodes"][0]["prerequisites"].append(r["nodes"][-1]["conceptId"]),
            "missing": lambda r: r["nodes"][0]["prerequisites"].append("unknown"),
            "duplicate": lambda r: r["nodes"].append(deepcopy(r["nodes"][0])),
            "nan": lambda r: r["nodes"][0].__setitem__("pKnown", float("nan")),
            "negative": lambda r: r["nodes"][0].__setitem__("pKnown", -0.2),
            "bool": lambda r: r["nodes"][0].__setitem__("pKnown", True),
            "extra": lambda r: r["nodes"][0].__setitem__("extra", 1),
            "policy": lambda r: r["scope"].__setitem__("policyVersion", "unpinned"),
            "revision": lambda r: r["scope"].__setitem__("learnerRevision", "x"),
            "strategy": lambda r: r["teaching"]["allowedStrategies"].append("hypnosis"),
            "count": lambda r: r["teaching"].__setitem__("maxFailedChecks", 0),
            "no-evidence": lambda r: r["nodes"][0].__setitem__("assessedCount", 0) or r["nodes"][0].__setitem__("pKnown", 0.9),
            "too-many": lambda r: r.update(nodes=[deepcopy(r["nodes"][0]) for _ in range(600)]),
            "unhashable": lambda r: r["nodes"][0].__setitem__("prerequisites", [["x"]]),
            "phase": lambda r: r["teaching"].__setitem__("phase", "unknown"),
            "errorClass": lambda r: r["observations"].__setitem__("errorClass", "unknown"),
            "failed-without-previous": lambda r: r["teaching"].__setitem__("failedChecks", 1) or r["teaching"].__setitem__("previousStrategy", None),
        }
        for name, mutate in mutations.items():
            with self.subTest(name):
                mutated = deepcopy_request(base)
                mutate(mutated)
                ref_raised = ref_result = None
                try:
                    ref_result = reference_propose(deepcopy_request(mutated))
                except Exception as exc:  # noqa: BLE001 — the reference refuses
                    ref_raised = exc
                if ref_raised is not None:
                    with self.assertRaises(Exception):
                        propose_teaching_reproduction(deepcopy_request(mutated))
                else:
                    self.assertEqual(propose_teaching_reproduction(deepcopy_request(mutated)), ref_result)


def deepcopy_request(request):
    return json.loads(json.dumps(request))


class SCMBaselineContracts(unittest.TestCase):
    def test_bkt_update_moves_toward_truth_and_stays_bounded(self):
        params = BKTParameters(p_init=0.3, learn_t=0.1, slip=0.1, guess=0.15)
        after_correct = bkt_update(0.3, True, params)
        after_wrong = bkt_update(0.3, False, params)
        self.assertGreater(after_correct, 0.3, "a correct attempt raises p(known)")
        self.assertLess(after_wrong, 0.3, "a wrong attempt lowers p(known)")
        for value in (after_correct, after_wrong):
            self.assertTrue(0.0 <= value <= 1.0)
        self.assertEqual(bkt_update(0.3, True, params), after_correct, "deterministic")

    def test_invalid_parameters_and_attempts_fail_closed(self):
        for bad in [(0.0, 0.1, 0.1, 0.15), (0.3, 1.0, 0.1, 0.15), (0.3, 0.1, -0.1, 0.15), (float("nan"), 0.1, 0.1, 0.15), (0.3, 0.1, 0.1, "x")]:
            with self.subTest(bad):
                with self.assertRaises(ValueError):
                    BKTParameters(*bad)
        params = BKTParameters(0.3, 0.1, 0.1, 0.15)
        with self.assertRaises(ValueError):
            scm_project("c1", [True, "yes"], params, "src-1", 1)

    def test_scm_projection_bounded_never_grants_mastery_and_carries_provenance(self):
        strong_params = BKTParameters(p_init=0.2, learn_t=0.15, slip=0.05, guess=0.1)
        strong = scm_project("c1", [True] * 8, strong_params, "src-consented-1", 3)
        # With a small learning transition, repeated wrongs drive p(known) to the floor.
        weak_params = BKTParameters(p_init=0.5, learn_t=0.02, slip=0.05, guess=0.1)
        weak = scm_project("c1", [False] * 8, weak_params, "src-consented-1", 3)
        self.assertGreater(strong["pKnown"], 0.9, "eight corrects drive p(known) high")
        self.assertLess(weak["pKnown"], 0.1, "eight wrongs drive p(known) low")
        self.assertFalse(strong["masteryGranted"], "the estimate NEVER grants mastery")
        self.assertEqual(strong["sourceRef"], "src-consented-1")
        self.assertEqual(strong["criteriaVersion"], 3)
        self.assertEqual(strong["attemptCount"], 8)


class StatisticalClassifierContracts(unittest.TestCase):
    def test_classifier_learns_distinguishable_classes_and_abstains_on_unknown(self):
        train = (
            [{"tokens": ["rate", "ratio", "wrong", "denominator"], "label": "MC-001"}] * 6
            + [{"tokens": ["unit", "conversion", "mixed", "meters"], "label": "MC-002"}] * 6
        )
        classifier = NaiveBayesClassifier(abstain_below=0.75).train(train)
        hit = classifier.predict(["rate", "ratio", "denominator"])
        self.assertFalse(hit["abstained"])
        self.assertEqual(hit["label"], "MC-001")
        other = classifier.predict(["unit", "conversion", "meters"])
        self.assertEqual(other["label"], "MC-002")
        # Unseen vocabulary -> low confidence -> explicit abstention, not a guess.
        abstained = classifier.predict(["quantum", "flux"])
        self.assertTrue(abstained["abstained"])

    def test_classifier_is_deterministic_and_validates_inputs(self):
        train = [{"tokens": ["a", "b"], "label": "X"}, {"tokens": ["c", "d"], "label": "Y"}]
        c1 = NaiveBayesClassifier().train(train)
        c2 = NaiveBayesClassifier().train(train)
        self.assertEqual(c1.predict(["a"]), c2.predict(["a"]))
        with self.assertRaises(ValueError):
            NaiveBayesClassifier().train([{"tokens": "not-a-list", "label": "X"}])
        with self.assertRaises(ValueError):
            NaiveBayesClassifier().predict(["a"])
        with self.assertRaises(ValueError):
            NaiveBayesClassifier(abstain_below=2.0)


class BenchmarkIntegrationContracts(unittest.TestCase):
    """The baseline is evaluated THROUGH the VMM-04 registry like any candidate."""

    def _registry(self):
        registry = BenchmarkRegistry("vmm-bench-baseline")
        registry.preregister(CUSTODIAN, **THRESHOLDS)
        cases = []
        index = 0
        for subject in ("math", "physics"):
            for _ in range(3):
                index += 1
                cases.append({
                    "caseId": f"case-{index}",
                    "slice": {"role": "student", "subject": subject, "modality": "text"},
                    "contentDigest": f"{index:064x}",
                    "graderRef": f"grader-{index}",
                })
        registry.seal_hidden_set(CUSTODIAN, cases)
        return registry, cases

    def test_classifier_results_flow_through_the_registry_and_grade_custodian_only(self):
        registry, cases = self._registry()
        train = (
            [{"tokens": ["rate", "ratio"], "label": "MC-001"}] * 6
            + [{"tokens": ["unit", "meters"], "label": "MC-002"}] * 6
        )
        classifier = NaiveBayesClassifier(abstain_below=0.0).train(train)

        results = []
        for hidden in registry.cases():
            tokens = ["rate", "ratio"] if int(hidden["caseId"].split("-")[1]) % 2 == 1 else ["unit", "meters"]
            prediction = classifier.predict(tokens)
            results.append({
                "caseId": hidden["caseId"],
                "score": 0.0 if prediction["abstained"] else 1.0,
                "confidence": prediction["confidence"],
                "abstained": prediction["abstained"],
                "latencyMs": 12,
                "costUsd": 0.0,
            })
        registry.record_evaluation(RUNNER, "nb-baseline", results)
        verdict = registry.grade(CUSTODIAN, "nb-baseline")
        self.assertTrue(verdict["engineeringBenchmarkSuccess"], "a strong baseline on easy slices passes the registered gates")
        self.assertFalse(verdict["educationalGainsEstablished"], "engineering success never establishes educational gains")

    def test_degraded_slice_fails_noninferiority(self):
        registry, cases = self._registry()
        results = []
        for hidden in registry.cases():
            subject = hidden["slice"]["subject"]
            score = 1.0 if subject == "math" else 0.0  # physics slice collapses
            results.append({"caseId": hidden["caseId"], "score": score, "confidence": 0.9, "abstained": False, "latencyMs": 10, "costUsd": 0.0})
        registry.record_evaluation(RUNNER, "nb-degraded", results)
        verdict = registry.grade(CUSTODIAN, "nb-degraded")
        self.assertFalse(verdict["engineeringBenchmarkSuccess"], "one collapsed slice fails overall")


if __name__ == "__main__":
    unittest.main()
