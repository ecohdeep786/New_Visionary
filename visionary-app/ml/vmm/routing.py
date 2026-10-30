"""VMM-14 (KAN-182) — AIRA multi-model routing with safe context, tools and
memory authority.

The orchestration contract connecting AIRA's deterministic coordination to the
accepted source/learner/goal/artifact contracts:

  - CONTEXT CARRIES REFERENCES, NEVER PRIVATE HISTORY: contextRefs are opaque;
    every ref is permission-checked through the caller-supplied authorizer, and
    the routing decision transports ONLY authorized refs — never content.
  - TOOLS ARE ALLOWLIST-INTERSECTED: request tools ∩ model-profile tools ∩ the
    global allowlist; unknown tools are refused outright.
  - MEMORY IS CONSENT-BOUND: memory scopes resolve only with ACTIVE consent;
    revoked consent and cross-scope reads are denied.
  - STALE REVISIONS AND REVOKED PERMISSIONS ARE REFUSED: context refs carry
    revisions; a ref below the current revision is stale and rejected, and a
    permission revoked after request construction fails closed.
  - MODE / VOICE-TEXT HANDOFF: modality handoff records the SAME pinned context
    (no content re-scoping across a handoff).
  - DETERMINISTIC ROUTING: the versioned routing table maps request classes to
    model profiles (pinned versions, fallback order); the same request always
    routes identically; a stale table version is refused; when every model in
    the chain is unavailable the router REFUSES (safe abstention), never
    falling back to an unauthorized model.
"""
from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

ROUTING_CONTRACT = "vmm-aira-routing.v1"


class RoutingError(ValueError):
    """The routing operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class AIRARouter:
    """Deterministic multi-model routing with safe context/tools/memory."""

    def __init__(
        self,
        routing_table: dict[str, Any],
        context_authorizer: Any,
        consent_ledger: Any,
        global_tools: list[str],
    ):
        if routing_table.get("contract") != ROUTING_CONTRACT:
            raise RoutingError("Not an AIRA routing table")
        self.table = deepcopy(routing_table)
        self._authorizer = context_authorizer  # callable(ref, workspaceId) -> bool
        self._consents = consent_ledger        # consent ledger seam (VMM-03 style)
        if not isinstance(global_tools, list) or any(type(t) is not str for t in global_tools):
            raise RoutingError("Invalid global tool allowlist")
        self._global_tools = list(global_tools)

    def route(self, caller: dict[str, Any], request: dict[str, Any]) -> dict[str, Any]:
        """One deterministic routing decision (backend-only)."""
        if caller.get("kind") != "backend-service":
            raise RoutingError("AIRA routing is backend-only")
        request_class = request.get("requestClass")
        entries = [e for e in self.table.get("routes", []) if e.get("requestClass") == request_class]
        if not entries:
            raise RoutingError(f"Unknown request class: {request_class}")
        entry = entries[0]
        workspace = request.get("workspaceId")
        if type(workspace) is not str or not workspace:
            raise RoutingError("Invalid workspaceId")
        if request.get("tableVersion") != self.table.get("tableVersion"):
            raise RoutingError("Stale routing table version")

        # --- safe context: references only, each permission-checked -----------
        authorized_refs = []
        for ref in request.get("contextRefs", []):
            if type(ref) is not dict or set(ref) != {"ref", "revision"}:
                raise RoutingError("Context refs must be {ref, revision} pairs")
            if type(ref["revision"]) is not int or ref["revision"] < 1:
                raise RoutingError("Invalid context revision")
            if not callable(self._authorizer) or not self._authorizer(ref["ref"], workspace):
                raise RoutingError(f"Permission denied for context ref: {ref['ref']}")
            if ref["revision"] < self._current_revision(ref["ref"]):
                raise RoutingError(f"Stale revision for context ref: {ref['ref']}")
            if self._revoked(ref["ref"], workspace):
                raise RoutingError(f"Permission revoked for context ref: {ref['ref']}")
            authorized_refs.append({"ref": ref["ref"], "revision": ref["revision"]})

        # --- tools: allowlist intersection ------------------------------------
        profile = entry.get("model", {})
        requested_tools = request.get("tools", [])
        if not isinstance(requested_tools, list):
            raise RoutingError("Invalid tools")
        unknown = [t for t in requested_tools if t not in self._global_tools]
        if unknown:
            raise RoutingError(f"Unknown tools: {sorted(unknown)}")
        allowed_tools = sorted(set(requested_tools) & set(profile.get("tools", [])) & set(self._global_tools))

        # --- memory: consent-bound scopes -------------------------------------
        memory_scopes = []
        for scope in request.get("memoryScopes", []):
            if type(scope) is not str or not scope:
                raise RoutingError("Invalid memory scope")
            if not scope.startswith(f"{workspace}|"):
                raise RoutingError(f"Cross-scope memory denied: {scope}")
            if not self._consents.active(scope):
                raise RoutingError(f"Memory consent not active for scope: {scope}")
            memory_scopes.append(scope)

        # --- deterministic model selection with fallback order -----------------
        chain = profile.get("fallbackOrder", [])
        if not chain:
            raise RoutingError("Model profile has no fallback order")
        available = [m for m in chain if self._model_available(m)]
        if not available:
            return {
                "contract": ROUTING_CONTRACT,
                "routed": False,
                "reason": "all_models_unavailable_safe_refusal",
                "requestClass": request_class,
                "tableVersion": self.table.get("tableVersion"),
            }
        chosen = available[0]
        return {
            "contract": ROUTING_CONTRACT,
            "routed": True,
            "requestClass": request_class,
            "model": chosen,
            "pinnedModelVersion": profile.get("pinnedVersions", {}).get(chosen),
            "fallbackOrder": available,
            "authorizedContextRefs": authorized_refs,
            "allowedTools": allowed_tools,
            "memoryScopes": memory_scopes,
            "modality": request.get("modality", "text"),
            "modeHandoff": request.get("modeHandoff"),
            "tableVersion": self.table.get("tableVersion"),
            "contextCarriesReferencesOnly": True,
        }

    def handoff_mode(self, caller: dict[str, Any], prior_decision: dict[str, Any], new_modality: str) -> dict[str, Any]:
        """Mode/voice-text handoff: the SAME pinned context re-routes with the new modality."""
        if new_modality not in ("text", "speech"):
            raise RoutingError("Invalid handoff modality")
        handoff_request = {
            "caller": caller,
            "requestClass": prior_decision["requestClass"],
            "workspaceId": caller.get("workspaceId"),
            "contextRefs": prior_decision["authorizedContextRefs"],
            "tools": prior_decision["allowedTools"],
            "memoryScopes": prior_decision["memoryScopes"],
            "modality": new_modality,
            "modeHandoff": {"from": prior_decision.get("modality", "text"), "to": new_modality},
            "tableVersion": prior_decision["tableVersion"],
        }
        decision = self.route(caller, handoff_request)
        if decision.get("routed"):
            decision["modeHandoff"] = handoff_request["modeHandoff"]
        return decision

    # ---- seams (supply at integration) ---------------------------------------

    def _current_revision(self, ref: str) -> int:
        holder = getattr(self, "revision_lookup", None)
        return holder(ref) if callable(holder) else ref_revision_floor(ref)

    def _revoked(self, ref: str, workspace: str) -> bool:
        revocations = getattr(self, "revocation_lookup", None)
        return revocations(ref, workspace) if callable(revocations) else False

    def _model_available(self, model: str) -> bool:
        availability = getattr(self, "availability_lookup", None)
        return availability(model) if callable(availability) else True


def ref_revision_floor(ref: str) -> int:
    return 1


class ConsentLedger:
    """Contract-true consent seam: active consents only; revocation is immediate."""

    def __init__(self):
        self._active: set[str] = set()

    def grant(self, scope: str) -> None:
        self._active.add(scope)

    def revoke(self, scope: str) -> None:
        self._active.discard(scope)

    def active(self, scope: str) -> bool:
        return scope in self._active
