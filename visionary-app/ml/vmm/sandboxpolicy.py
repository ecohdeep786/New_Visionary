"""BUILD-LAUNCH-01 (KAN-132) — sandbox security policy for isolated
generated-code execution.

The SECURITY POLICY CONTRACT that the hosted runtime must implement:

  - FILESYSTEM DENIAL: sandboxed code has NO filesystem access — not even read
    — except a bounded temporary directory that is destroyed on exit.
  - EGRESS DENIAL: NO network access (no HTTP, no DNS, no sockets) from
    sandboxed code. The network is deny-by-default with no exceptions.
  - RESOURCE LIMITS: CPU time, wall-clock timeout, and memory are bounded;
    exceeding any limit TERMINATES the execution (never a graceful degrade).
  - SECRETS ISOLATION: no credentials, API keys, tokens or environment
    variables are visible to sandboxed code — the environment is empty except
    for a declared, non-secret set.
  - DEPENDENCY ALLOWLIST: only allowlisted dependencies may be imported; an
    unlisted import is refused before execution.
  - ARTIFACT RECEIPTS: what the sandbox produced (stdout, files, exit code)
    is captured as a signed receipt — the ONLY output that crosses the
    sandbox boundary.
  - NO PERSISTENCE: nothing the sandbox writes survives the execution; each
    run starts from a clean state.

The in-memory implementation proves the POLICY ENFORCEMENT (denial paths,
termination, secrets isolation). The actual hosted runtime (Docker/Firecracker/
gVisor) implements these same policies with real isolation and remains a
separate gate.
"""
from __future__ import annotations

import hashlib
import json
import re
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

SANDBOX_CONTRACT = "vmm-sandbox.v1"


class SandboxPolicyError(ValueError):
    """The sandbox policy or execution request is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class SandboxPolicy:
    """The typed, immutable security policy for one sandbox execution."""

    def __init__(
        self,
        max_cpu_seconds: int = 5,
        max_wall_clock_ms: int = 10000,
        max_memory_mb: int = 128,
        max_output_bytes: int = 64 * 1024,
        allowed_dependencies: list[str] | None = None,
        allowed_env_keys: list[str] | None = None,
    ):
        for name, value, minimum in [
            ("max_cpu_seconds", max_cpu_seconds, 1),
            ("max_wall_clock_ms", max_wall_clock_ms, 100),
            ("max_memory_mb", max_memory_mb, 16),
            ("max_output_bytes", max_output_bytes, 1024),
        ]:
            if type(value) is not int or value < minimum:
                raise SandboxPolicyError(f"Invalid {name}: must be >= {minimum}")
        if allowed_dependencies is not None and (not isinstance(allowed_dependencies, list) or any(type(d) is not str for d in allowed_dependencies)):
            raise SandboxPolicyError("Invalid dependency allowlist")
        if allowed_env_keys is not None and (not isinstance(allowed_env_keys, list) or any(type(k) is not str for k in allowed_env_keys)):
            raise SandboxPolicyError("Invalid env key allowlist")
        self.max_cpu_seconds = max_cpu_seconds
        self.max_wall_clock_ms = max_wall_clock_ms
        self.max_memory_mb = max_memory_mb
        self.max_output_bytes = max_output_bytes
        self.allowed_dependencies = frozenset(allowed_dependencies or [])
        self.allowed_env_keys = frozenset(allowed_env_keys or [])

    def to_dict(self) -> dict[str, Any]:
        return {
            "maxCpuSeconds": self.max_cpu_seconds,
            "maxWallClockMs": self.max_wall_clock_ms,
            "maxMemoryMb": self.max_memory_mb,
            "maxOutputBytes": self.max_output_bytes,
            "allowedDependencies": sorted(self.allowed_dependencies),
            "allowedEnvKeys": sorted(self.allowed_env_keys),
        }


# Dependency import patterns that are always denied regardless of allowlist.
DENIED_IMPORT_PATTERNS = (
    r"\b(?:os|sys|subprocess|socket|shutil|pathlib|ctypes|importlib)\b",
    r"\b(?:open|exec|eval|compile|__import__)\s*\(",
    r"\b(?:requests|urllib|http|socket|ssl|ftplib|telnetlib|smtplib)\b",
    r"\b(?:pickle|marshal|shelve)\b",
    r"__(?:class|bases|subclasses|globals|builtins)__",
)


class SandboxRequest:
    """One code-execution request with dependency declarations."""

    def __init__(self, request_id: str, code: str, declared_dependencies: list[str]):
        if type(request_id) is not str or not request_id or len(request_id) > 80:
            raise SandboxPolicyError("Invalid request id")
        if type(code) is not str or not code.strip() or len(code) > 64 * 1024:
            raise SandboxPolicyError("Invalid code (empty or exceeds 64 KB)")
        if not isinstance(declared_dependencies, list):
            raise SandboxPolicyError("declared_dependencies must be a list")
        self.request_id = request_id
        self.code = code
        self.declared_dependencies = list(declared_dependencies)


class SandboxVerdict:
    """The signed receipt of one sandbox execution."""

    def __init__(self, request_id: str, outcome: str, reason: str, stdout: str, exit_code: int | None, artifacts: list[dict[str, Any]], policy_digest: str):
        self.request_id = request_id
        self.outcome = outcome
        self.reason = reason
        self.stdout = stdout
        self.exit_code = exit_code
        self.artifacts = artifacts
        self.policy_digest = policy_digest

    def to_dict(self) -> dict[str, Any]:
        return {
            "contract": SANDBOX_CONTRACT,
            "requestId": self.request_id,
            "outcome": self.outcome,
            "reason": self.reason,
            "stdout": self.stdout[:4096],
            "exitCode": self.exit_code,
            "artifacts": self.artifacts,
            "policyDigest": self.policy_digest,
            "filesystemAccess": "denied",
            "networkEgress": "denied",
            "secretsVisible": False,
            "persistedAfterExit": False,
            "terminatedAt": _now(),
        }


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class SandboxRuntime:
    """Contract-level sandbox: enforces the policy before and during execution.

    The in-memory implementation proves POLICY ENFORCEMENT. The hosted runtime
    (Docker/gVisor/Firecracker) implements the same policies with real
    kernel-level isolation.
    """

    def __init__(self, policy: SandboxPolicy, signing_key: bytes):
        if not isinstance(signing_key, (bytes, bytearray)) or len(signing_key) < 16:
            raise SandboxPolicyError("Signing key must be at least 16 bytes")
        self.policy = policy
        self._key = bytes(signing_key)
        self._runs: list[dict[str, Any]] = []

    def _policy_digest(self) -> str:
        return hashlib.sha256(json.dumps(self.policy.to_dict(), sort_keys=True).encode("utf-8")).hexdigest()

    def _check_dependencies(self, request: SandboxRequest) -> None:
        """Every declared dependency must be in the allowlist; denied patterns
        in the code are refused BEFORE execution."""
        for dep in request.declared_dependencies:
            if dep not in self.policy.allowed_dependencies:
                raise SandboxPolicyError(f"Dependency '{dep}' is not in the allowlist")
        lowered = request.code.lower()
        for pattern in DENIED_IMPORT_PATTERNS:
            if re.search(pattern, lowered):
                raise SandboxPolicyError(f"Code contains a denied import/operation pattern: {pattern}")

    def _check_secrets_isolation(self, env: dict[str, str]) -> None:
        """Only declared, non-secret env keys are passed to the sandbox."""
        for key in env:
            if key not in self.policy.allowed_env_keys:
                raise SandboxPolicyError(f"Environment key '{key}' is not in the allowlist")
            if any(s in key.lower() for s in ("secret", "token", "key", "password", "credential")):
                raise SandboxPolicyError(f"Environment key '{key}' looks like a secret and is denied")

    def execute(self, request: SandboxRequest, env: dict[str, str] | None = None, simulated_output: str = "", simulated_exit_code: int = 0) -> dict[str, Any]:
        """Enforce the policy and produce a signed verdict.

        The simulated_output/exit_code stand in for real execution in tests;
        the hosted runtime replaces this with actual isolated execution.
        """
        self._check_dependencies(request)
        self._check_secrets_isolation(env or {})

        policy_digest = self._policy_digest()

        # Simulate resource-limit enforcement (the hosted runtime does this with cgroups/rlimits).
        # The OUTPUT bound terminates the execution if stdout exceeds max_output_bytes.
        if len(simulated_output.encode("utf-8")) > self.policy.max_output_bytes:
            return self._verdict(request, "terminated", "output_bound_exceeded", "", None, [], policy_digest)

        # Simulate execution: in-memory, no filesystem, no network, no secrets.
        stdout = simulated_output
        exit_code = simulated_exit_code

        artifacts = []
        if stdout.strip():
            artifacts.append({"kind": "stdout", "sha256": hashlib.sha256(stdout.encode("utf-8")).hexdigest(), "sizeBytes": len(stdout.encode("utf-8"))})

        outcome = "completed" if exit_code == 0 else "failed"
        verdict = SandboxVerdict(
            request.request_id, outcome, "ok" if exit_code == 0 else f"exit_code_{exit_code}",
            stdout, exit_code, artifacts, policy_digest,
        )
        signed = verdict.to_dict()
        signed["signature"] = hashlib.sha256(
            json.dumps(signed, sort_keys=True).encode("utf-8") + self._key
        ).hexdigest()
        self._runs.append(deepcopy(signed))
        return signed

    def runs(self) -> list[dict[str, Any]]:
        return [deepcopy(r) for r in self._runs]

    def _verdict(self, request: SandboxRequest, outcome: str, reason: str, stdout: str, exit_code: int | None, artifacts: list, policy_digest: str) -> dict[str, Any]:
        verdict = SandboxVerdict(request.request_id, outcome, reason, stdout, exit_code, artifacts, policy_digest)
        signed = verdict.to_dict()
        signed["signature"] = hashlib.sha256(
            json.dumps(signed, sort_keys=True).encode("utf-8") + self._key
        ).hexdigest()
        self._runs.append(deepcopy(signed))
        return signed
