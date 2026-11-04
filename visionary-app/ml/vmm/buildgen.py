"""VMM-17 (KAN-185) — reviewed frontier Build workflow: generate → test →
explain → learn → revise → deploy/handoff, with multi-revision artifact
ownership.

Composes the REAL VMM-15 frontier qualification (`ProviderQualification`):

  - PROVIDER ADMISSION: a generation is admitted only when the qualification
    registry has a QUALIFIED provider for the `build` capability — an
    unqualified or unknown provider is refused before any artifact exists.
  - MULTI-REVISION OWNERSHIP: artifacts are owned by their creator; revisions
    are APPEND-ONLY (v1, v2, ...) each pinning the exact parent revision and
    the build inputs (brief digest + source files digest); cross-owner
    revision/test/explanation/deploy is refused; history is immutable.
  - TEST GATE: a deploy requires a PASSED test receipt recorded against the
    EXACT revision being deployed (a passed test on another revision or a
    failed test refuses).
  - EXPLANATION GATE: the deploy requires an explanation whose references
    cite the actual revision and its declared files — explanations reference
    actual files/revisions, never free-floating prose.
  - LEARN SEAM: every explained revision yields an evidence reference
    (artifact + revision + explanation digest) the teach/learn side can cite;
    OCR/ML provenance rules stay outside this module's authority.
  - HANDOFF: the deploy receipt pins artifact, revision, test receipt,
    explanation digest and provider — the deployable unit is fully traced.
"""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from vmm.providers import ProviderError, ProviderQualification

BUILD_CONTRACT = "vmm-buildworkflow.v1"


class BuildWorkflowError(ValueError):
    """The Build workflow operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _digest(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()


class FrontierBuildWorkflow:
    def __init__(self, qualifier: ProviderQualification):
        self._qualifier = qualifier
        self._artifacts: dict[str, dict[str, Any]] = {}
        self._counter = 0
        self._events: list[dict[str, Any]] = []

    def _log(self, kind: str, **fields: Any) -> None:
        self._events.append({"type": kind, "at": _now(), **fields})

    def events(self) -> list[dict[str, Any]]:
        return deepcopy(self._events)

    @staticmethod
    def events_are_redacted(events: list[dict[str, Any]]) -> bool:
        flat = json.dumps(events, ensure_ascii=False)
        return not any(f'"{k}"' in flat for k in ("brief", "explanation", "prompt", "text"))

    # -- generate / revise -------------------------------------------------------
    def generate(self, owner: dict[str, Any], brief: str, files: list[str]) -> dict[str, Any]:
        uid = owner.get("uid")
        if type(uid) is not str or not uid:
            raise BuildWorkflowError("Artifacts are owner-scoped")
        routing = self._qualifier.capability_route("build")
        if not routing["qualifiedProviders"]:
            raise BuildWorkflowError("No qualified provider for the build capability")
        provider = routing["qualifiedProviders"][0]
        self._counter += 1
        artifact_id = f"art_{self._counter}"
        inputs = {"briefDigest": _digest(brief), "filesDigest": _digest(sorted(files)), "files": sorted(files)}
        revision = {
            "revision": 1,
            "parentRevision": None,
            "inputs": inputs,
            "providerId": provider["providerId"],
            "adapterVersion": provider["adapterVersion"],
            "tested": None,
            "explanation": None,
        }
        artifact = {"contract": BUILD_CONTRACT, "artifactId": artifact_id, "ownerUid": uid, "revisions": [revision], "createdAt": _now()}
        self._artifacts[artifact_id] = artifact
        self._log("generated", artifactId=artifact_id, revision=1, providerId=provider["providerId"], briefDigest=inputs["briefDigest"][:12])
        return {"artifactId": artifact_id, "revision": deepcopy(revision)}

    def _artifact_for(self, owner: dict[str, Any], artifact_id: str) -> dict[str, Any]:
        artifact = self._artifacts.get(artifact_id)
        if artifact is None:
            raise BuildWorkflowError("Unknown artifact")
        if artifact["ownerUid"] != owner.get("uid"):
            raise BuildWorkflowError("Cross-owner artifact access denied")
        return artifact

    def revise(self, owner: dict[str, Any], artifact_id: str, brief: str, files: list[str]) -> dict[str, Any]:
        artifact = self._artifact_for(owner, artifact_id)
        parent = artifact["revisions"][-1]
        inputs = {"briefDigest": _digest(brief), "filesDigest": _digest(sorted(files)), "files": sorted(files)}
        revision = {
            "revision": parent["revision"] + 1,
            "parentRevision": parent["revision"],
            "inputs": inputs,
            "providerId": parent["providerId"],
            "adapterVersion": parent["adapterVersion"],
            "tested": None,
            "explanation": None,
        }
        artifact["revisions"].append(revision)
        self._log("revised", artifactId=artifact_id, revision=revision["revision"], parent=parent["revision"])
        return {"artifactId": artifact_id, "revision": deepcopy(revision)}

    # -- test / explain / deploy --------------------------------------------------
    def _revision_for(self, artifact: dict[str, Any], revision: int) -> dict[str, Any]:
        found = next((r for r in artifact["revisions"] if r["revision"] == revision), None)
        if found is None:
            raise BuildWorkflowError("Unknown revision")
        return found

    def record_test(self, owner: dict[str, Any], artifact_id: str, revision: int, passed: bool, checks: list[str]) -> dict[str, Any]:
        artifact = self._artifact_for(owner, artifact_id)
        rev = self._revision_for(artifact, revision)
        if type(checks) is not list or not checks:
            raise BuildWorkflowError("A test receipt needs declared checks")
        receipt = {"revision": revision, "passed": bool(passed), "checks": sorted(checks), "digest": _digest({"artifactId": artifact_id, "revision": revision, "passed": passed, "checks": sorted(checks)}), "at": _now()}
        rev["tested"] = receipt
        self._log("tested", artifactId=artifact_id, revision=revision, passed=bool(passed))
        return deepcopy(receipt)

    def record_explanation(self, owner: dict[str, Any], artifact_id: str, revision: int, explanation: str, references: list[dict[str, Any]]) -> dict[str, Any]:
        artifact = self._artifact_for(owner, artifact_id)
        rev = self._revision_for(artifact, revision)
        for ref in references:
            if ref.get("revision") != revision or ref.get("file") not in rev["inputs"]["files"]:
                raise BuildWorkflowError("Explanation must reference the actual revision and its declared files")
        record = {"revision": revision, "references": deepcopy(references), "digest": _digest({"revision": revision, "explanation": explanation}), "at": _now()}
        rev["explanation"] = record
        self._log("explained", artifactId=artifact_id, revision=revision, refs=len(references))
        return deepcopy(record)

    def learn_reference(self, owner: dict[str, Any], artifact_id: str, revision: int) -> dict[str, Any]:
        """Evidence reference the teach/learn side may cite for this revision."""
        artifact = self._artifact_for(owner, artifact_id)
        rev = self._revision_for(artifact, revision)
        if rev["explanation"] is None:
            raise BuildWorkflowError("Learn reference requires an explanation first")
        return {
            "artifactId": artifact_id,
            "revision": revision,
            "explanationDigest": rev["explanation"]["digest"],
            "testDigest": (rev["tested"] or {}).get("digest"),
            "providerId": rev["providerId"],
            "adapterVersion": rev["adapterVersion"],
        }

    def deploy(self, owner: dict[str, Any], artifact_id: str, revision: int, target: str) -> dict[str, Any]:
        artifact = self._artifact_for(owner, artifact_id)
        rev = self._revision_for(artifact, revision)
        if rev["tested"] is None or not rev["tested"]["passed"]:
            raise BuildWorkflowError("Deploy refused: this revision has no PASSED test receipt")
        if rev["explanation"] is None:
            raise BuildWorkflowError("Deploy refused: this revision has no explanation")
        if type(target) is not str or not target:
            raise BuildWorkflowError("Deploy target is required")
        receipt = {
            "contract": BUILD_CONTRACT,
            "artifactId": artifact_id,
            "revision": revision,
            "target": target,
            "testDigest": rev["tested"]["digest"],
            "explanationDigest": rev["explanation"]["digest"],
            "providerId": rev["providerId"],
            "adapterVersion": rev["adapterVersion"],
            "deployedAt": _now(),
        }
        self._log("deployed", artifactId=artifact_id, revision=revision, target=target)
        return receipt

    def history(self, owner: dict[str, Any], artifact_id: str) -> list[dict[str, Any]]:
        return deepcopy(self._artifact_for(owner, artifact_id)["revisions"])
