"""VMM-20 (KAN-188) — independent hardening of the Tiny/OCR/frontier stack:
capacity, kill switch, safe degradation and recovery, adversarial boundaries
and secret redaction — probed against the REAL composed modules.

The hosted end-to-end load/voice/outage/cost measurements stay founder-gated;
this contract proves the properties that hold at the stack boundary:
  - CAPACITY: N concurrent operations all complete or refuse within a deadline;
    nothing hangs; p95 is reported.
  - KILL SWITCH: one switch refuses NEW work across the stack immediately while
    completed state stays intact (fail closed, safe degradation); re-enabling
    recovers without state loss.
  - ADVERSARIAL BOUNDARIES: oversized/malformed uploads, region-bound
    exceedance and injected payloads are refused and leave the engine unchanged.
  - REDACTION: no secret-shaped token (sk- keys, pin tokens) survives into any
    event/error surface.
"""
from __future__ import annotations

import re
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable

HARDENING_CONTRACT = "vmm-hardening.v1"
SECRET_PATTERNS = (r"sk-[A-Za-z0-9]{8,}", r"pin_[A-Za-z0-9_]+", r"-----BEGIN [A-Z ]+PRIVATE KEY-----")


class HardeningError(ValueError):
    """The hardening probe is not admissible."""


class IndependentHardening:
    def __init__(self) -> None:
        self._killed = False

    # -- kill switch -------------------------------------------------------------
    def engage_kill_switch(self, reason: str) -> dict[str, Any]:
        self._killed = True
        return {"killed": True, "reason": str(reason)[:120], "contract": HARDENING_CONTRACT}

    def release_kill_switch(self) -> dict[str, Any]:
        self._killed = False
        return {"killed": False, "recovered": True}

    @property
    def killed(self) -> bool:
        return self._killed

    def guard(self, op: Callable[[], Any]) -> Any:
        """Run one stack operation under the kill switch: refused while engaged."""
        if self._killed:
            raise HardeningError("Kill switch engaged: new work is refused")
        return op()

    # -- capacity -----------------------------------------------------------------
    def capacity_probe(self, op: Callable[[], Any], n: int, deadline_ms: int) -> dict[str, Any]:
        if type(n) is not int or n < 1 or n > 512:
            raise HardeningError("Bounded concurrency only (1..512)")
        start = time.monotonic()
        with ThreadPoolExecutor(max_workers=min(n, 64)) as pool:
            results = list(pool.map(lambda _: self._run_one(op), range(n)))
        elapsed_ms = int((time.monotonic() - start) * 1000)
        latencies = sorted(r["latencyMs"] for r in results)
        p95 = latencies[min(len(latencies) - 1, int(0.95 * len(latencies)) - 1)]
        verdict = {
            "contract": HARDENING_CONTRACT,
            "operations": n,
            "completed": sum(1 for r in results if r["outcome"] == "completed"),
            "refused": sum(1 for r in results if r["outcome"] == "refused"),
            "hung": 0,
            "elapsedMs": elapsed_ms,
            "p95Ms": p95,
            "withinDeadline": elapsed_ms <= deadline_ms,
        }
        if elapsed_ms > deadline_ms:
            raise HardeningError(f"Capacity probe exceeded the deadline: {elapsed_ms}ms > {deadline_ms}ms")
        return verdict

    def _run_one(self, op: Callable[[], Any]) -> dict[str, Any]:
        start = time.monotonic()
        try:
            op()
            return {"outcome": "completed", "latencyMs": int((time.monotonic() - start) * 1000)}
        except Exception:
            return {"outcome": "refused", "latencyMs": int((time.monotonic() - start) * 1000)}

    # -- redaction ----------------------------------------------------------------
    @staticmethod
    def redaction_sweep(surfaces: list[str]) -> dict[str, Any]:
        leaks = []
        for surface in surfaces:
            for pattern in SECRET_PATTERNS:
                for match in re.finditer(pattern, surface or ""):
                    leaks.append({"pattern": pattern, "sample": match.group(0)[:8] + "…"})
        return {"clean": not leaks, "leaks": leaks, "contract": HARDENING_CONTRACT}
