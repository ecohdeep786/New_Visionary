"""VMM-07 (KAN-175) — Visionary-Tiny-D1: frozen action-ranking architecture.

The chosen candidate is a SMALL feed-forward ranker over the VATS pedagogical
action set (the ACT-### strategies of ml/vats/pedagogy.py), consuming VMM-06
feature vectors:

    input(FEATURE dim) -> dense(hidden, tanh) -> dense(action logits) -> masked softmax

Frozen contract (see ml/vmm/TINY_D1_ARCHITECTURE.md for the candidate-size
comparison with simpler baselines):

  - MASKED OUTPUTS: only actions in the caller's ALLOWED set may be selected;
    masked logits are -inf before the softmax, so masked probabilities are
    exactly 0 and a masked action is never ranked first.
  - ALL-ACTIONS-FORBIDDEN is a DEFINED output, not a crash: an empty allowed
    set yields `{"abstained": True, "reason": "all_actions_forbidden"}`.
  - SHAPE is enforced: input length must equal the configured input dim.
  - LOSS: masked cross-entropy + L2 regularization; SGD, fully deterministic
    under a fixed seed (stdlib random only — no framework dependency).
  - CALIBRATION + ABSTENTION: softmax probabilities with a confidence floor;
    predictions below the floor abstain. OOD inputs (missingness above the
    training bound, or features outside the observed range by a margin) also
    abstain instead of producing confident nonsense.
  - CONDITIONAL HEADS: an extra head (e.g. misconception classification) may be
    enabled ONLY with sufficient labeled inputs — enabling it without enough
    labels per class is refused, never silently degraded.

This module trains and ranks; it does NOT claim educational gains, and any
benchmark success goes through the VMM-04 registry like every other candidate.
"""
from __future__ import annotations

import math
import random
from typing import Any

TINY_D1_CONTRACT = "vmm-tinyd1.v1"
ARCHITECTURE_VERSION = 1
_NEG_INF = -1e9


class TinyD1Error(ValueError):
    """Architecture/config/usage contract violation."""


class AllActionsForbidden(TinyD1Error):
    """Every action is masked — a defined abstain outcome for the caller."""


def _softmax_masked(logits: list[float], allowed: set[int]) -> list[float]:
    masked = [logit if i in allowed else _NEG_INF for i, logit in enumerate(logits)]
    peak = max(masked[i] for i in allowed)
    exps = [math.exp(masked[i] - peak) if i in allowed else 0.0 for i in range(len(logits))]
    total = sum(exps)
    return [e / total for e in exps]


class TinyD1Config:
    """Frozen architecture configuration."""

    def __init__(
        self,
        input_dim: int,
        actions: list[str],
        hidden_dim: int = 8,
        seed: int = 7,
        abstain_below: float = 0.5,
        max_missing_fraction: float = 0.5,
        l2: float = 1e-4,
        lr: float = 0.05,
        conditional_heads: dict[str, Any] | None = None,
    ):
        if type(input_dim) is not int or input_dim < 1:
            raise TinyD1Error("Invalid input_dim")
        if not actions or any(type(a) is not str for a in actions) or len(actions) != len(set(actions)):
            raise TinyD1Error("Invalid action set")
        if type(hidden_dim) is not int or hidden_dim < 1:
            raise TinyD1Error("Invalid hidden_dim")
        if type(seed) is not int:
            raise TinyD1Error("Invalid seed")
        for name, value in [("abstain_below", abstain_below), ("max_missing_fraction", max_missing_fraction)]:
            if type(value) not in (int, float) or not 0.0 <= value <= 1.0:
                raise TinyD1Error(f"Invalid {name}")
        if type(l2) not in (int, float) or l2 < 0 or type(lr) not in (int, float) or lr <= 0:
            raise TinyD1Error("Invalid l2/lr")
        self.input_dim = input_dim
        self.actions = list(actions)
        self.hidden_dim = hidden_dim
        self.seed = seed
        self.abstain_below = float(abstain_below)
        self.max_missing_fraction = float(max_missing_fraction)
        self.l2 = float(l2)
        self.lr = float(lr)
        # Conditional heads: {"misconception": {"labelSpace": [...], "minPerClass": n}}
        self.conditional_heads = dict(conditional_heads or {})

    def parameter_count(self) -> int:
        out_dim = len(self.actions) + sum(
            len(h.get("labelSpace", [])) for h in self.conditional_heads.values()
        )
        hidden_params = self.hidden_dim * self.input_dim + self.hidden_dim
        head_params = out_dim * self.hidden_dim + out_dim
        return hidden_params + head_params


class TinyD1:
    """The frozen Tiny-D1 ranker: deterministic train/predict with masked outputs."""

    def __init__(self, config: TinyD1Config):
        self.config = config
        rng = random.Random(config.seed)
        bound_in = 1.0 / math.sqrt(config.input_dim)
        bound_out = 1.0 / math.sqrt(config.hidden_dim)
        self.w1 = [[rng.uniform(-bound_in, bound_in) for _ in range(config.input_dim)] for _ in range(config.hidden_dim)]
        self.b1 = [0.0] * config.hidden_dim
        self.w2 = [[rng.uniform(-bound_out, bound_out) for _ in range(config.hidden_dim)] for _ in range(len(config.actions))]
        self.b2 = [0.0] * len(config.actions)
        # Conditional misconception head (shares the hidden layer).
        self.heads: dict[str, dict[str, Any]] = {}
        mc = config.conditional_heads.get("misconception")
        if mc:
            self._enable_conditional_head("misconception", mc, rng)
        self._observed_ranges: list[tuple[float, float]] | None = None
        self._trained = False

    def _enable_conditional_head(self, name: str, spec: dict[str, Any], rng: random.Random) -> None:
        label_space = spec.get("labelSpace")
        min_per_class = spec.get("minPerClass", 1)
        if not isinstance(label_space, list) or not label_space or any(type(l) is not str for l in label_space):
            raise TinyD1Error(f"Conditional head '{name}' requires a non-empty labelSpace")
        if type(min_per_class) is not int or min_per_class < 1:
            raise TinyD1Error(f"Conditional head '{name}' requires minPerClass >= 1")
        rng.uniform(-0.1, 0.1)  # keep the RNG stream identical whether or not a head is enabled
        self.heads[name] = {"labelSpace": list(label_space), "minPerClass": min_per_class}

    # ---- shape + mask helpers ----------------------------------------------

    def _check_shape(self, vector: list[float]) -> None:
        if not isinstance(vector, list) or len(vector) != self.config.input_dim or any(
            type(v) not in (int, float) or not math.isfinite(v) for v in vector
        ):
            raise TinyD1Error("Input shape mismatch: expected a finite vector of length input_dim")

    def _allowed(self, allowed_actions: list[str] | set[str] | None) -> set[int]:
        action_set = set(self.config.actions)
        if allowed_actions is None:
            return set(range(len(self.config.actions)))
        if not isinstance(allowed_actions, (list, set)):
            raise TinyD1Error("allowed_actions must be a list/set of action ids")
        unknown = [a for a in allowed_actions if a not in action_set]
        if unknown:
            raise TinyD1Error(f"Unknown action ids: {sorted(unknown)}")
        return {self.config.actions.index(a) for a in allowed_actions}

    # ---- forward / backward -------------------------------------------------

    def _forward(self, vector: list[float]) -> tuple[list[float], list[float]]:
        hidden = [math.tanh(sum(self.w1[j][i] * vector[i] for i in range(self.config.input_dim)) + self.b1[j]) for j in range(self.config.hidden_dim)]
        logits = [sum(self.w2[k][j] * hidden[j] for j in range(self.config.hidden_dim)) + self.b2[k] for k in range(len(self.config.actions))]
        return hidden, logits

    def predict(self, vector: list[float], allowed_actions: list[str] | set[str] | None = None) -> dict[str, Any]:
        """Masked softmax ranking with calibration + abstention + OOD gates."""
        self._check_shape(vector)
        allowed = self._allowed(allowed_actions)
        if not allowed:
            return {"abstained": True, "reason": "all_actions_forbidden", "probs": [0.0] * len(self.config.actions)}
        if self._observed_ranges is not None:
            missing = sum(1 for v in vector if v == -1.0) / len(vector)
            out_of_range = any(
                v != -1.0 and not (lo - 1.5 <= v <= hi + 1.5) for v, (lo, hi) in zip(vector, self._observed_ranges)
            )
            if missing > self.config.max_missing_fraction or out_of_range:
                return {
                    "abstained": True,
                    "reason": "out_of_distribution" if out_of_range else "excessive_missingness",
                    "probs": [0.0] * len(self.config.actions),
                }
        hidden, logits = self._forward(vector)
        probs = _softmax_masked(logits, allowed)
        best_index = max(allowed, key=lambda i: probs[i])
        confidence = probs[best_index]
        ranking = sorted(allowed, key=lambda i: probs[i], reverse=True)
        output: dict[str, Any] = {
            "contract": TINY_D1_CONTRACT,
            "architectureVersion": ARCHITECTURE_VERSION,
            "probs": [round(p, 6) for p in probs],
            "ranking": [self.config.actions[i] for i in ranking],
            "action": self.config.actions[best_index],
            "confidence": round(confidence, 6),
            "abstained": confidence < self.config.abstain_below,
        }
        if output["abstained"]:
            output["reason"] = "below_confidence_floor"
        return output

    def _backward(self, vector: list[float], target_index: int, allowed: set[int], l2_scale: float) -> float:
        hidden, logits = self._forward(vector)
        probs = _softmax_masked(logits, allowed)
        loss = -math.log(max(probs[target_index], 1e-12))
        d_logits = [p - (1.0 if i == target_index else 0.0) if i in allowed else 0.0 for i, p in enumerate(probs)]
        d_hidden = [0.0] * self.config.hidden_dim
        for k in range(len(self.config.actions)):
            if d_logits[k] == 0.0:
                continue
            for j in range(self.config.hidden_dim):
                grad = d_logits[k] * hidden[j] + self.config.l2 * l2_scale * self.w2[k][j]
                self.w2[k][j] -= self.config.lr * grad
                d_hidden[j] += d_logits[k] * self.w2[k][j]
            self.b2[k] -= self.config.lr * d_logits[k]
        for j in range(self.config.hidden_dim):
            d_pre = d_hidden[j] * (1.0 - hidden[j] * hidden[j])
            for i in range(self.config.input_dim):
                grad = d_pre * vector[i] + self.config.l2 * l2_scale * self.w1[j][i]
                self.w1[j][i] -= self.config.lr * grad
            self.b1[j] -= self.config.lr * d_pre
        return loss

    # ---- training ------------------------------------------------------------

    def fit(self, samples: list[dict[str, Any]], epochs: int = 40) -> list[float]:
        """samples: [{vector, action, allowedActions?}] — deterministic SGD.

        Conditional heads validate label sufficiency BEFORE any training.
        """
        for sample in samples:
            self._check_shape(sample["vector"])
            if sample["action"] not in self.config.actions:
                raise TinyD1Error(f"Unknown target action: {sample['action']}")
        if "misconception" in self.heads:
            spec = self.heads["misconception"]
            counts: dict[str, int] = {}
            for sample in samples:
                for label in sample.get("misconceptionLabels", []):
                    if label not in spec["labelSpace"]:
                        raise TinyD1Error(f"Label outside the head's label space: {label}")
                    counts[label] = counts.get(label, 0) + 1
            insufficient = [l for l in spec["labelSpace"] if counts.get(l, 0) < spec["minPerClass"]]
            if insufficient:
                raise TinyD1Error(f"Conditional head 'misconception' lacks sufficient labels for: {insufficient}")
        rng = random.Random(self.config.seed)
        order = list(range(len(samples)))
        losses: list[float] = []
        l2_scale = 1.0 / max(1, len(samples))
        for _ in range(epochs):
            rng.shuffle(order)
            epoch_loss = 0.0
            for index in order:
                sample = samples[index]
                allowed = self._allowed(sample.get("allowedActions"))
                if not allowed:
                    continue
                target_index = self.config.actions.index(sample["action"])
                epoch_loss += self._backward(sample["vector"], target_index, allowed, l2_scale)
            losses.append(epoch_loss / max(1, len(order)))
        # Record the observed feature ranges for the OOD gate.
        self._observed_ranges = [
            (min(s["vector"][i] for s in samples if s["vector"][i] != -1.0), max(s["vector"][i] for s in samples if s["vector"][i] != -1.0))
            if any(s["vector"][i] != -1.0 for s in samples) else (-1.0, -1.0)
            for i in range(self.config.input_dim)
        ]
        self._trained = True
        return losses

    def parameter_count(self) -> int:
        return self.config.parameter_count()

    @property
    def trained(self) -> bool:
        return self._trained
