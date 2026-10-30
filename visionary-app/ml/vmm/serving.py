"""VMM-11 (KAN-179) — backend-authorized private Tiny serving with versioned
inference.

The serving contract over the VMM-10 registry:

  - BACKEND-ONLY AUTHORIZATION: predictions are served ONLY to the registered
    backend service identity within its allowed scopes. End-user identities,
    anonymous callers and out-of-scope workspaces are denied — there is NO
    public direct model endpoint, and model weights never leave the vault.
  - VERSIONED INFERENCE ON A PINNED MODEL: the worker serves exactly the pinned
    APPROVED version from the registry; a request referencing a version that no
    longer matches the served pin (e.g. after a rollback) is refused as stale.
  - DEADLINE + CANCELLATION: every request carries a deadline; an exhausted
    deadline yields a defined CANCELLED response (never a late result).
  - SAFE FALLBACK: when the model abstains (below the confidence floor or OOD),
    the worker falls back to the ACCEPTED baseline (the VMM-05 policy teacher)
    and marks the response `fallback` — never to an unvalidated path.

The worker is the serving-side CONTRACT; the hosted deployment itself remains a
separate gate and is not claimed closed here.
"""
from __future__ import annotations

import time
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from vmm.registry import ModelRegistry, RegistryError

SERVING_CONTRACT = "vmm-serving.v1"


class ServingError(PermissionError):
    """The serving request is not authorized."""


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class InferenceWorker:
    """Backend-authorized Tiny-D1 serving on a pinned, approved model."""

    def __init__(self, registry: ModelRegistry, service_identity: dict[str, Any]):
        if service_identity.get("kind") != "backend-service":
            raise ServingError("Only a backend service identity may operate the worker")
        self._registry = registry
        self._service = deepcopy(service_identity)
        self._scopes: set[str] = set(service_identity.get("scopes", []))
        self._served_manifest: dict[str, Any] | None = None
        self._model: Any = None
        self._pin: dict[str, Any] | None = None

    def deploy(self, owner: dict[str, Any], pin_token: dict[str, Any], model_loader) -> dict[str, Any]:
        """Load the pinned APPROVED version (owner authorizes the vault read)."""
        status = self._registry.deployment_status(pin_token["pinnedModel"], pin_token["pinnedVersion"])
        if status["status"] != "approved":
            raise ServingError("Only an approved model version may be deployed")
        manifest = self._registry.resolve(pin_token)
        artifact_bytes = self._registry.load_artifact({"uid": owner.get("uid"), "role": "owner"}, pin_token)
        self._model = model_loader(artifact_bytes)
        self._served_manifest = manifest
        self._pin = deepcopy(pin_token)
        return {
            "deployed": True,
            "modelId": manifest["id"],
            "version": manifest["version"],
            "digest": manifest["digest"],
            "publicEndpoint": False,
        }

    def authorize(self, caller: dict[str, Any]) -> None:
        """Backend service identity + scope check. End users are denied."""
        if caller.get("kind") != "backend-service" or caller.get("serviceId") != self._service.get("serviceId"):
            raise ServingError("Predictions are backend-authorized only; no public model endpoint")
        scope = caller.get("workspaceId")
        if scope not in self._scopes:
            raise ServingError(f"Cross-scope denial: workspace '{scope}' is not served by this worker")

    def _served_pin_matches(self, request_version: int) -> bool:
        return self._served_manifest is not None and self._served_manifest["version"] == request_version

    def infer(self, request: dict[str, Any], teacher=None) -> dict[str, Any]:
        """One versioned inference: authz -> scope -> staleness -> deadline ->
        prediction (with safe fallback) -> receipt."""
        started = time.perf_counter()
        self.authorize(request.get("caller"))
        if self._model is None or self._served_manifest is None:
            raise ServingError("Worker has no deployed model")
        if not self._served_pin_matches(request.get("modelVersion", self._served_manifest["version"])):
            raise ServingError("Stale request: the served model version has moved (rollback or redeploy)")
        deadline_ms = request.get("deadlineMs")
        if type(deadline_ms) is not int or deadline_ms <= 0:
            raise ServingError("A positive deadlineMs is required")
        elapsed_before = request.get("elapsedBeforeMs", 0)
        if type(elapsed_before) is not int or elapsed_before < 0:
            raise ServingError("Invalid elapsedBeforeMs")
        request_id = request.get("requestId")
        if type(request_id) is not str or not request_id:
            raise ServingError("A requestId is required")

        elapsed_ms = elapsed_before + int((time.perf_counter() - started) * 1000)
        if elapsed_ms >= deadline_ms:
            return self._cancelled(request_id, "deadline_exceeded", elapsed_ms)

        prediction = self._model.predict(request["vector"], allowed_actions=request.get("allowedActions"))
        fallback = None
        if prediction.get("abstained") and teacher is not None:
            fallback = "policy-teacher"
            prediction = teacher(request["vector"], request.get("allowedActions"))

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        if elapsed_ms >= deadline_ms:
            return self._cancelled(request_id, "deadline_exceeded", elapsed_ms)
        return {
            "contract": SERVING_CONTRACT,
            "requestId": request_id,
            "modelId": self._served_manifest["id"],
            "modelVersion": self._served_manifest["version"],
            "modelDigest": self._served_manifest["digest"],
            "action": prediction.get("action"),
            "confidence": prediction.get("confidence"),
            "abstained": prediction.get("abstained", False),
            "probs": prediction.get("probs"),
            "fallback": fallback,
            "latencyMs": elapsed_ms,
            "publicEndpoint": False,
            "weightsExposed": False,
            "at": _now_iso(),
        }

    @staticmethod
    def _cancelled(request_id: str, reason: str, elapsed_ms: int) -> dict[str, Any]:
        return {
            "contract": SERVING_CONTRACT,
            "requestId": request_id,
            "cancelled": True,
            "reason": reason,
            "latencyMs": elapsed_ms,
            "publicEndpoint": False,
        }

    def cancel(self, request_id: str) -> dict[str, Any]:
        """Defined cancellation acknowledgment for an in-flight request."""
        return {"requestId": request_id, "cancelled": True, "reason": "cancelled_by_caller", "at": _now_iso()}

    def weights_exposed(self) -> bool:
        """The worker never exposes model weights through any response path."""
        return False
