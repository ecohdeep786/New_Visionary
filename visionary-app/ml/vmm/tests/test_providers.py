"""VMM-15 (KAN-183) — provider qualification contracts (synthetic adapters)."""
import unittest

from vmm.providers import ProviderError, ProviderQualification

CUSTODIAN = {"uid": "uid_custodian", "role": "custodian"}
THRESHOLDS = {"minTaskQuality": 0.75, "maxLatencyMs": 2000, "maxPerTaskCostUsd": 0.01, "minEnglishGrounding": 0.9, "minSamples": 4}
DATA_TERMS = {"retention": "90d", "region": "in", "trainingUse": "none"}


class SyntheticAdapter:
    """A stable synthetic adapter: fixed version, deterministic outputs."""

    def __init__(self, version: str, score: float, latency_ms: int, cost_usd: float):
        self._version = version
        self._score = score
        self._latency = latency_ms
        self._cost = cost_usd

    def version(self) -> str:
        return self._version

    def invoke(self, task: dict) -> dict:
        return {"score": self._score, "latencyMs": self._latency, "costUsd": self._cost}


TASKS = [{"grounded": True, "toolsUsed": ["read-source"]} for _ in range(5)]


def qualified_flow(provider_id="provider-alpha", adapter=None, data_terms=None):
    q = ProviderQualification()
    q.preregister_thresholds(CUSTODIAN, THRESHOLDS)
    q.register_profile(
        provider_id, ["teach", "reason"], (adapter or SyntheticAdapter("adp-1", 0.9, 800, 0.004)).version(),
        data_terms or DATA_TERMS, consumer_chat_available=True, tools=["read-source"],
    )
    q.measure(provider_id, adapter or SyntheticAdapter("adp-1", 0.9, 800, 0.004), TASKS)
    verdict = q.qualify(provider_id, CUSTODIAN)
    return q, verdict


class QualificationContracts(unittest.TestCase):
    def test_meets_thresholds_qualified(self):
        q, verdict = qualified_flow()
        self.assertTrue(verdict["qualified"])
        self.assertEqual(verdict["failures"], [])
        self.assertTrue(verdict["dataTermsAccepted"])

    def test_quality_below_threshold_not_qualified(self):
        _, verdict = qualified_flow(adapter=SyntheticAdapter("adp-1", 0.5, 800, 0.004))
        self.assertFalse(verdict["qualified"])
        self.assertIn("task_quality", verdict["failures"])

    def test_latency_and_cost_gates(self):
        _, slow = qualified_flow(adapter=SyntheticAdapter("adp-1", 0.9, 5000, 0.004))
        self.assertIn("latency", slow["failures"])
        _, expensive = qualified_flow(adapter=SyntheticAdapter("adp-1", 0.9, 800, 0.5))
        self.assertIn("cost", expensive["failures"])

    def test_english_grounding_gate(self):
        q = ProviderQualification()
        q.preregister_thresholds(CUSTODIAN, THRESHOLDS)
        q.register_profile("p", ["teach"], "adp-1", DATA_TERMS, True, ["read-source"])
        weak_tasks = [{"grounded": False, "toolsUsed": ["read-source"]} for _ in range(5)]
        q.measure("p", SyntheticAdapter("adp-1", 0.9, 800, 0.004), weak_tasks)
        verdict = q.qualify("p", CUSTODIAN)
        self.assertIn("english_grounding", verdict["failures"])
        self.assertFalse(verdict["qualified"])

    def test_tools_gate(self):
        q = ProviderQualification()
        q.preregister_thresholds(CUSTODIAN, THRESHOLDS)
        q.register_profile("p", ["teach"], "adp-1", DATA_TERMS, True, ["render-visual"])  # read-source missing
        q.measure("p", SyntheticAdapter("adp-1", 0.9, 800, 0.004), TASKS)
        verdict = q.qualify("p", CUSTODIAN)
        self.assertIn("tools", verdict["failures"])


class NoBrandRankingContracts(unittest.TestCase):
    def test_consumer_chat_availability_is_irrelevant(self):
        # A consumer-chat-available provider that fails thresholds is NOT qualified.
        _, verdict = qualified_flow(adapter=SyntheticAdapter("adp-1", 0.3, 3000, 0.2))
        self.assertFalse(verdict["qualified"])
        self.assertTrue(verdict["consumerChatAvailableIrrelevant"])

    def test_registry_has_no_provider_ranking_operation(self):
        q, _ = qualified_flow()
        with self.assertRaises(ProviderError):
            q.refuse_ranking()
        # Capability routing returns a deterministic SET, not a ranking.
        route = q.capability_route("teach")
        self.assertEqual([p["providerId"] for p in route["qualifiedProviders"]], ["provider-alpha"])

    def test_capability_routing_skips_unqualified(self):
        q, _ = qualified_flow("provider-alpha")
        q2 = q  # same registry
        q2.register_profile("provider-beta", ["teach"], "adp-1", DATA_TERMS, True, ["read-source"])
        q2.measure("provider-beta", SyntheticAdapter("adp-1", 0.3, 800, 0.004), TASKS)
        q2.qualify("provider-beta", CUSTODIAN)
        route = q2.capability_route("teach")
        ids = [p["providerId"] for p in route["qualifiedProviders"]]
        self.assertEqual(ids, ["provider-alpha"], "unqualified provider never routes")


class StabilityAndOrderingContracts(unittest.TestCase):
    def test_adapter_version_mismatch_refused(self):
        q = ProviderQualification()
        q.preregister_thresholds(CUSTODIAN, THRESHOLDS)
        q.register_profile("p", ["teach"], "adp-1", DATA_TERMS, True, ["read-source"])
        with self.assertRaises(ProviderError):
            q.measure("p", SyntheticAdapter("adp-2", 0.9, 800, 0.004), TASKS)  # serve-time adapter drift

    def test_thresholds_preregistered_before_measurement(self):
        q = ProviderQualification()
        with self.assertRaises(ProviderError):
            q.register_profile("p", ["teach"], "adp-1", DATA_TERMS, True, ["read-source"])
        q.preregister_thresholds(CUSTODIAN, THRESHOLDS)
        q.register_profile("p", ["teach"], "adp-1", DATA_TERMS, True, ["read-source"])
        q.measure("p", SyntheticAdapter("adp-1", 0.9, 800, 0.004), TASKS)
        with self.assertRaises(ProviderError):
            q.preregister_thresholds(CUSTODIAN, THRESHOLDS)  # frozen after measurement exists

    def test_data_terms_mandatory(self):
        q = ProviderQualification()
        q.preregister_thresholds(CUSTODIAN, THRESHOLDS)
        with self.assertRaises(ProviderError):
            q.register_profile("p", ["teach"], "adp-1", {"retention": "90d"}, True, ["read-source"])
        # Unaccepted training-use terms block qualification.
        q.register_profile("p2", ["teach"], "adp-1", {"retention": "90d", "region": "in", "trainingUse": "allowed"}, True, ["read-source"])
        q.measure("p2", SyntheticAdapter("adp-1", 0.9, 800, 0.004), TASKS)
        verdict = q.qualify("p2", CUSTODIAN)
        self.assertFalse(verdict["dataTermsAccepted"])
        self.assertFalse(verdict["qualified"])


if __name__ == "__main__":
    unittest.main()
