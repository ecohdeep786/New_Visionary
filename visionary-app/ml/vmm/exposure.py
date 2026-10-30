"""VMM-02 (KAN-170) — repository exposure inventory.

Scans the working tree for sensitive artifacts (credential material, private
data candidates, model weights, local databases) and produces EVIDENCE —
paths, classifications and sizes — instead of assumptions.

Privacy rule of the scanner itself: for credential-class matches the finding
records the PATH and CLASSIFICATION ONLY (no digest, never any content); for
weight/database classes it records the streamed SHA-256 so later remediation
can prove the artifact left. Oversized files are recorded as skipped, not read.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

CONTRACT = "vmm-exposure.v1"

SKIP_DIRS = {".git", "node_modules", ".tools", "dist", ".zcode", ".manus", "__pycache__", ".pytest_cache"}
_MAX_READ_BYTES = 64 * 1024 * 1024  # never stream more than this for a digest

# (classification, severity, path-regex, record_digest)
PATTERNS: list[tuple[str, str, str, bool]] = [
    # `.env.*.example` templates hold no real secrets — low, review-only class.
    ("credential-template", "low", r"\.env\..*example$", False),
    ("credential-private-key", "critical", r"\.(pem|key|p12|pfx)$", False),
    ("credential-private-key", "critical", r"(^|/)(id_rsa|id_ed25519|id_ecdsa)(\..*)?$", False),
    ("credential-config", "critical", r"(^|/)(\.env|\.env\..*|credentials?\.json|service[-_]?account.*\.json|secrets?\.(json|ya?ml|txt))$", False),
    ("credential-token-store", "critical", r"(^|/)\.netrc$|^\.npmrc$|(^|/)\.pypirc$", False),
    ("database-file", "high", r"\.(sqlite|sqlite3|db)$", True),
    ("model-weight", "high", r"\.(pt|pth|ckpt|safetensors|gguf|onnx|h5|pb)$", True),
    ("dataset-candidate", "medium", r"\.(csv|tsv|parquet)$", True),
    ("archive-candidate", "low", r"\.(zip|tar|gz|7z)$", True),
]

_EXCLUDED_UPSTREAM_MARKERS = ("/upstream/",)


def _classify(relative_path: str) -> tuple[str, str, bool, str] | None:
    normalized = relative_path.replace(os.sep, "/")
    lowered = normalized.lower()
    for classification, severity, pattern, record_digest in PATTERNS:
        if re.search(pattern, lowered):
            # Vendored upstream pins are recorded but marked as pinned provenance.
            scope = "vendored-upstream" if any(m in "/" + normalized for m in _EXCLUDED_UPSTREAM_MARKERS) else "working-tree"
            return classification, severity, record_digest, scope
    return None


def scan_tree(root: str | Path) -> dict[str, Any]:
    """Inventory the working tree; evidence only — secret contents never leave."""
    root_path = Path(root).resolve()
    findings: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    scanned_files = 0
    for current, dir_names, file_names in os.walk(root_path):
        dir_names[:] = [d for d in dir_names if d not in SKIP_DIRS]
        for name in file_names:
            full = Path(current) / name
            relative = str(full.relative_to(root_path)).replace(os.sep, "/")
            scanned_files += 1
            try:
                size = full.stat().st_size
            except OSError:
                continue
            match = _classify(relative)
            if match is None:
                continue
            classification, severity, record_digest, scope = match
            finding: dict[str, Any] = {
                "path": relative,
                "classification": classification,
                "severity": severity,
                "sizeBytes": size,
                "scope": scope,
            }
            if severity == "critical":
                # Credential-class: path + classification only. No digest, no content.
                finding["digest"] = None
                finding["evidence"] = "path-pattern match; content withheld by scanner policy"
            elif size > _MAX_READ_BYTES:
                skipped.append({"path": relative, "classification": classification, "sizeBytes": size, "reason": "oversized-not-read"})
                continue
            else:
                h = hashlib.sha256()
                with full.open("rb") as handle:
                    for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                        h.update(chunk)
                finding["digest"] = h.hexdigest()
                finding["evidence"] = "path-pattern match; streamed digest recorded"
            findings.append(finding)
    counts: dict[str, int] = {}
    for finding in findings:
        counts[finding["classification"]] = counts.get(finding["classification"], 0) + 1
    return {
        "contract": CONTRACT,
        "root": str(root_path),
        "scannedAt": datetime.now(timezone.utc).isoformat(),
        "scannedFiles": scanned_files,
        "findings": findings,
        "skippedOversized": skipped,
        "countsByClassification": counts,
        "criticalCount": sum(1 for f in findings if f["severity"] == "critical"),
        "note": "Evidence inventory only. Critical-class contents are never read or recorded by the scanner.",
    }


def write_inventory(root: str | Path, out_path: str | Path) -> Path:
    """Run the scan and persist the evidence JSON (atomically enough for local use)."""
    inventory = scan_tree(root)
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(inventory, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return out
