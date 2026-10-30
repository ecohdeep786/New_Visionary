"""VMM-08 (KAN-176) — train the Visionary-owned Tiny-D1 checkpoint from
scratch and reproduce the experiment.

The training pipeline for the frozen VMM-07 architecture:

  - REPRODUCIBILITY MANIFEST: dataset hash, code/runtime (python version),
    seed, optimizer (sgd), lr, l2, epochs, architecture version — recorded
    with every run; identical seeds reproduce identical runs.
  - ACTUAL TRAINING: the owned Tiny-D1 checkpoint is trained from scratch on
    the deterministic policy-imitation corpus (VMM-05 reproduction generates
    labels, VMM-06 extractor generates features), with a seeded train/holdout
    split and a recorded per-epoch training curve.
  - REAL LOADABLE CHECKPOINT: weights serialize to JSON, reload bit-exactly,
    and produce identical predictions after the roundtrip. Checkpoint BYTES
    stay LOCAL (git-ignored) — private weights never enter public Git; only
    the digest + signed VMM-02 manifest are committed.
  - SUPPLY-CHAIN INTEGRATION: the checkpoint registers as a signed VMM-02
    manifest (kind=model, storage private) with lineage to the dataset
    manifest; tampering breaks verification.
  - REPEAT-RUN VARIANCE: identical seeds give identical metrics (variance 0);
    different seeds stay within the PREDECLARED bound (0.1 agreement spread).

The trained checkpoint is a candidate for the VMM-04 benchmark registry;
engineering success does not establish educational gains.
"""
from __future__ import annotations

import hashlib
import json
import random
import sys
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from vmm.baselines import propose_teaching_reproduction
from vmm.features import extract_features
from vmm.supplychain import build_manifest, sign_manifest, verify_signature
from vmm.tinyd1 import TinyD1, TinyD1Config

TRAINING_CONTRACT = "vmm-training.v1"

# PREDECLARED repeat-run variance bounds (recorded before runs, per ticket).
PREDECLARED_SAME_SEED_VARIANCE = 0.0
PREDECLARED_CROSS_SEED_VARIANCE = 0.1
PREDECLARED_MIN_HOLDOUT_AGREEMENT = 0.7

ACTION_BY_STRATEGY = {
    "socratic": "ACT-001",
    "worked_example": "ACT-002",
    "analogy": "ACT-003",
    "visual": "ACT-004",
    "practice": "ACT-005",
}
STRATEGIES = ["socratic", "worked_example", "analogy", "visual", "practice"]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _digest(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


def build_policy_corpus(count: int, seed: int) -> dict[str, Any]:
    """Deterministic policy-imitation corpus: features via VMM-06, labels via
    the VMM-05 reproduction of the reference VATS pedagogy."""
    rng = random.Random(seed)
    samples = []
    for i in range(count):
        strong = (i % 3) != 0
        attempt_count = 2 + (i * 7 + seed) % 5
        attempts = [strong] * attempt_count
        p_known = 0.9 if strong else 0.2
        first_encounter = i % 4 == 0
        evidence = {
            "contract": "vmm-scm-evidence.v1",
            "conceptId": f"concept-{i % 4}",
            "attempts": attempts,
            "sourceRefs": [f"src-consented-{i % 5}"],
            "criteriaVersion": 1 + i % 3,
        }
        features = extract_features(evidence, scm_p_known=p_known)
        request = {
            "contractVersion": "vats-pedagogy.v1",
            "requestId": f"req-{seed}-{i}",
            "scope": {
                "uid": "u", "workspaceId": "w", "sessionId": "s",
                "conceptId": evidence["conceptId"], "sourceVersion": "source-v1",
                "criteriaVersion": "rubric-v1", "graphVersion": "graph-v1",
                "policyVersion": "doc03-reference-v1", "learnerRevision": 1, "loopRevision": 1,
            },
            "nodes": [{"conceptId": evidence["conceptId"], "prerequisites": [], "pKnown": p_known, "assessedCount": len(attempts)}],
            "teaching": {
                "phase": "explain", "failedChecks": 0, "maxFailedChecks": 3,
                "previousStrategy": None,
                "allowedStrategies": STRATEGIES,
            },
            "observations": {"errorClass": None, "firstEncounter": first_encounter, "approvedVisualAvailable": False, "hintsOnly": False},
        }
        proposal = propose_teaching_reproduction(request)
        action = ACTION_BY_STRATEGY[proposal["strategy"]]
        samples.append({"vector": features["vector"], "action": action, "allowedActions": list(ACTION_BY_STRATEGY.values())})
        _ = rng.random()  # consume RNG deterministically
    return {"samples": samples, "corpusDigest": _digest({"count": count, "seed": seed, "samples": samples})}


def training_manifest(seed: int, epochs: int, corpus_digest: str, holdout_fraction: float = 0.25) -> dict[str, Any]:
    """The reproducibility manifest: dataset hash, code/runtime, seed, optimizer."""
    return {
        "contract": TRAINING_CONTRACT,
        "datasetDigest": corpus_digest,
        "datasetSize": None,  # filled by the run
        "architecture": "vmm-tinyd1.v1",
        "architectureVersion": 1,
        "runtime": f"python-{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "optimizer": "sgd",
        "seed": seed,
        "epochs": epochs,
        "lr": 0.05,
        "l2": 1e-4,
        "holdoutFraction": holdout_fraction,
        "recordedAt": _now(),
    }


def _split(samples: list[dict[str, Any]], seed: int, holdout_fraction: float) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    order = list(range(len(samples)))
    random.Random(seed).shuffle(order)
    holdout_count = max(1, int(len(samples) * holdout_fraction))
    holdout = [samples[i] for i in order[:holdout_count]]
    train = [samples[i] for i in order[holdout_count:]]
    return train, holdout


def train_from_scratch(seed: int, corpus_count: int = 80, epochs: int = 60) -> dict[str, Any]:
    """Train the owned Tiny-D1 checkpoint from scratch; return the run record."""
    corpus = build_policy_corpus(corpus_count, seed)
    manifest = training_manifest(seed, epochs, corpus["corpusDigest"])
    manifest["datasetSize"] = corpus_count
    train, holdout = _split(corpus["samples"], seed, manifest["holdoutFraction"])

    config = TinyD1Config(
        input_dim=7, actions=list(ACTION_BY_STRATEGY.values()), seed=seed,
        hidden_dim=8, abstain_below=0.5, max_missing_fraction=0.5, l2=1e-4, lr=0.05,
    )
    model = TinyD1(config)
    curve = model.fit(train, epochs=epochs)

    correct = 0
    for sample in holdout:
        out = model.predict(sample["vector"], allowed_actions=sample.get("allowedActions"))
        if not out["abstained"] and out.get("action") == sample["action"]:
            correct += 1
    holdout_agreement = correct / len(holdout)

    return {
        "manifest": manifest,
        "model": model,
        "config": config,
        "trainingCurve": [round(l, 6) for l in curve],
        "initialLoss": curve[0],
        "finalLoss": curve[-1],
        "trainSize": len(train),
        "holdoutSize": len(holdout),
        "holdoutAgreement": round(holdout_agreement, 6),
    }


def save_checkpoint(model: TinyD1, run: dict[str, Any], path: str | Path) -> dict[str, Any]:
    """Serialize weights + manifest to a LOCAL (git-ignored) JSON artifact."""
    artifact = {
        "contract": TRAINING_CONTRACT,
        "manifest": run["manifest"],
        "config": {
            "input_dim": model.config.input_dim,
            "actions": model.config.actions,
            "hidden_dim": model.config.hidden_dim,
            "seed": model.config.seed,
            "abstain_below": model.config.abstain_below,
            "max_missing_fraction": model.config.max_missing_fraction,
            "l2": model.config.l2,
            "lr": model.config.lr,
        },
        "weights": {"w1": model.w1, "b1": model.b1, "w2": model.w2, "b2": model.b2},
        "observedRanges": model._observed_ranges,
        "trainingCurve": run["trainingCurve"],
        "holdoutAgreement": run["holdoutAgreement"],
        "savedAt": _now(),
    }
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(artifact, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    return {"path": str(out), "checkpointDigest": hashlib.sha256(out.read_bytes()).hexdigest()}


def load_checkpoint(path: str | Path) -> tuple[TinyD1, dict[str, Any]]:
    """Load a checkpoint and restore the model bit-exactly."""
    artifact = json.loads(Path(path).read_text(encoding="utf-8"))
    if artifact.get("contract") != TRAINING_CONTRACT:
        raise ValueError("Not a VMM training checkpoint")
    cfg = artifact["config"]
    config = TinyD1Config(
        input_dim=cfg["input_dim"], actions=cfg["actions"], hidden_dim=cfg["hidden_dim"],
        seed=cfg["seed"], abstain_below=cfg["abstain_below"],
        max_missing_fraction=cfg["max_missing_fraction"], l2=cfg["l2"], lr=cfg["lr"],
    )
    model = TinyD1(config)
    weights = artifact["weights"]
    model.w1 = [list(row) for row in weights["w1"]]
    model.b1 = list(weights["b1"])
    model.w2 = [list(row) for row in weights["w2"]]
    model.b2 = list(weights["b2"])
    model._observed_ranges = [tuple(r) for r in artifact["observedRanges"]]
    model._trained = True
    return model, artifact


def register_checkpoint(checkpoint_digest: str, dataset_digest: str, signing_key: bytes, dataset_manifest_digest: str | None = None) -> dict[str, Any]:
    """Register the private checkpoint as a signed VMM-02 manifest (kind=model)."""
    manifest = build_manifest(
        kind="model",
        artifact_id="visionary-tiny-d1",
        version=1,
        digest=checkpoint_digest,
        producer="mle@visionary",
        license="owner-only-v1",
        storage_class="private",
        lineage=[{"id": "seed-l1-core", "digest": dataset_digest}],
    )
    signature = sign_manifest(manifest, signing_key)
    return {"manifest": manifest, "signature": signature}


def verify_checkpoint_registration(registration: dict[str, Any], signing_key: bytes) -> bool:
    return verify_signature(registration["manifest"], registration["signature"], signing_key)


def repeat_run_experiment(runs: int = 3, corpus_count: int = 80, epochs: int = 60) -> dict[str, Any]:
    """Repeat the experiment: same-seed runs must be identical; cross-seed
    holdout-agreement spread must stay within the PREDECLARED bound."""
    same_seed = [train_from_scratch(7, corpus_count, epochs) for _ in range(runs)]
    agreements = [run["holdoutAgreement"] for run in same_seed]
    same_seed_spread = max(agreements) - min(agreements)
    cross_seed = [train_from_scratch(seed, corpus_count, epochs) for seed in (7, 11, 23)]
    cross_agreements = [run["holdoutAgreement"] for run in cross_seed]
    cross_seed_spread = max(cross_agreements) - min(cross_agreements)
    return {
        "contract": TRAINING_CONTRACT,
        "sameSeedRuns": runs,
        "sameSeedAgreements": agreements,
        "sameSeedSpread": round(same_seed_spread, 6),
        "sameSeedWithinBound": same_seed_spread <= PREDECLARED_SAME_SEED_VARIANCE,
        "crossSeedAgreements": cross_agreements,
        "crossSeedSpread": round(cross_seed_spread, 6),
        "crossSeedWithinBound": cross_seed_spread <= PREDECLARED_CROSS_SEED_VARIANCE,
        "predeclaredBounds": {
            "sameSeed": PREDECLARED_SAME_SEED_VARIANCE,
            "crossSeed": PREDECLARED_CROSS_SEED_VARIANCE,
            "minHoldoutAgreement": PREDECLARED_MIN_HOLDOUT_AGREEMENT,
        },
        "curves": [run["trainingCurve"] for run in same_seed],
        "manifests": [run["manifest"] for run in cross_seed],
    }
