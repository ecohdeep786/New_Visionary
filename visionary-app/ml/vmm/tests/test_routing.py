"""VMM-14 (KAN-182) — AIRA routing contracts (synthetic)."""
import unittest

from vmm.routing import AIRARouter, ConsentLedger, RoutingError

BACKEND = {"kind": "backend-service", "serviceId": "backend-product", "workspaceId": "ws_personal"}
END_USER = {"kind": "user", "uid": "uid_learner"}

TABLE = {
    "contract": "vmm-aira-routing.v1",
    "tableVersion": 3,
    "routes": [
        {
            "requestClass": "teach-explain",
            "model": {
                "fallbackOrder": ["tiny-d1", "frontier-provider"],
                "pinnedVersions": {"tiny-d1": 1, "frontier-provider": "fp-2026-10"},
                "tools": ["read-source", "render-visual"],
            },
        }
    ],
}

CONTEXT_AUTH = lambda ref, workspace: not ref.startswith("private-")
REVISIONS = {"doc-a": 5, "doc-b": 2}
CONSENTS = ConsentLedger()
CONSENTS.grant("ws_personal|learner-journey")
CONSENTS.grant("ws_personal|progress-notes")


def router(**overrides):
    r = AIRARouter(
        TABLE,
        overrides.get("context_auth", CONTEXT_AUTH),
        overrides.get("consents", CONSENTS),
        ["read-source", "render-visual", "run-check"],
    )
    r.revision_lookup = lambda ref: REVISIONS.get(ref, 1)
    r.availability_lookup = overrides.get("availability", lambda m: True)
    return r


def request(**overrides):
    base = {
        "caller": BACKEND,
        "requestClass": "teach-explain",
        "workspaceId": "ws_personal",
        "contextRefs": [{"ref": "doc-a", "revision": 5}, {"ref": "doc-b", "revision": 2}],
        "tools": ["read-source"],
        "memoryScopes": ["ws_personal|learner-journey"],
        "modality": "text",
        "tableVersion": 3,
    }
    base.update(overrides)
    return base


class RoutingContracts(unittest.TestCase):
    def test_backend_only_and_deterministic(self):
        r = router()
        with self.assertRaises(RoutingError):
            r.route(END_USER, request())
        d1 = r.route(BACKEND, request())
        d2 = r.route(BACKEND, request())
        self.assertTrue(d1["routed"])
        self.assertEqual(d1, d2, "same request routes identically")
        self.assertEqual(d1["model"], "tiny-d1")

    def test_unknown_request_class_and_stale_table_refused(self):
        r = router()
        with self.assertRaises(RoutingError):
            r.route(BACKEND, request(requestClass="unknown-class"))
        with self.assertRaises(RoutingError):
            r.route(BACKEND, request(tableVersion=2))

    def test_context_carries_references_only_and_permission_checked(self):
        r = router()
        decision = r.route(BACKEND, request())
        self.assertTrue(decision["contextCarriesReferencesOnly"])
        self.assertEqual(decision["authorizedContextRefs"], [{"ref": "doc-a", "revision": 5}, {"ref": "doc-b", "revision": 2}])
        with self.assertRaises(RoutingError):
            r.route(BACKEND, request(contextRefs=[{"ref": "private-diary", "revision": 1}]))

    def test_stale_revision_and_revoked_permission_refused(self):
        r = router()
        with self.assertRaises(RoutingError):
            r.route(BACKEND, request(contextRefs=[{"ref": "doc-a", "revision": 4}]))  # stale
        r.revocation_lookup = lambda ref, ws: ref == "doc-b"
        with self.assertRaises(RoutingError):
            r.route(BACKEND, request(contextRefs=[{"ref": "doc-b", "revision": 2}]))  # revoked


class ToolContracts(unittest.TestCase):
    def test_allowlist_intersection_and_unknown_refused(self):
        r = router()
        decision = r.route(BACKEND, request(tools=["read-source", "run-check"]))
        self.assertEqual(decision["allowedTools"], ["read-source"], "run-check not in the model profile")
        with self.assertRaises(RoutingError):
            r.route(BACKEND, request(tools=["shell-exec"]))


class MemoryContracts(unittest.TestCase):
    def test_consent_active_grants_and_cross_scope_denied(self):
        r = router()
        decision = r.route(BACKEND, request())
        self.assertEqual(decision["memoryScopes"], ["ws_personal|learner-journey"])
        with self.assertRaises(RoutingError):
            r.route(BACKEND, request(memoryScopes=["ws_other|learner-journey"]))

    def test_revoked_consent_denied_immediately(self):
        consents = ConsentLedger()
        consents.grant("ws_personal|learner-journey")
        r = router(consents=consents)
        ok = r.route(BACKEND, request())
        self.assertTrue(ok["routed"])
        consents.revoke("ws_personal|learner-journey")
        with self.assertRaises(RoutingError):
            r.route(BACKEND, request())


class FallbackAndHandoffContracts(unittest.TestCase):
    def test_fallback_order_and_safe_refusal_when_all_unavailable(self):
        r = router(availability=lambda m: m != "tiny-d1")
        decision = r.route(BACKEND, request())
        self.assertEqual(decision["model"], "frontier-provider", "fallback to the next model in the chain")
        r_all_down = router(availability=lambda m: False)
        refusal = r_all_down.route(BACKEND, request())
        self.assertFalse(refusal["routed"])
        self.assertEqual(refusal["reason"], "all_models_unavailable_safe_refusal")

    def test_mode_handoff_keeps_the_same_pinned_context(self):
        r = router()
        prior = r.route(BACKEND, request())
        handoff = r.handoff_mode(BACKEND, prior, "speech")
        self.assertTrue(handoff["routed"])
        self.assertEqual(handoff["authorizedContextRefs"], prior["authorizedContextRefs"])
        self.assertEqual(handoff["modeHandoff"], {"from": "text", "to": "speech"})
        with self.assertRaises(RoutingError):
            r.handoff_mode(BACKEND, prior, "hologram")


if __name__ == "__main__":
    unittest.main()
