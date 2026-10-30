# VMM-07 (KAN-175) — Visionary-Tiny-D1 frozen architecture & candidate-size comparison

**Status:** architecture candidate (Testing). **Decision:** FROZEN for the R3 chain.
**Contract:** `vmm-tinyd1.v1`, `architectureVersion: 1`.

## 1. Chosen architecture

```
input(VMM-06 feature dim = 7) -> dense(8, tanh) -> dense(action logits) -> masked softmax
```

- **Task:** action RANKING over the VATS pedagogical action set (ACT-001…ACT-005,
  `ml/vats/pedagogy.py` strategies), given a learner's VMM-06 feature vector.
- **Frozen hyperparameters:** hidden 8, seed 7, `abstain_below 0.5`,
  `max_missing_fraction 0.5`, L2 1e-4, lr 0.05 (all in `TinyD1Config`; changing any
  of these is an architecture-version bump).
- **Loss:** masked cross-entropy + L2 (1e-4); SGD, deterministic under the seed.
- **Masked outputs:** only the caller's ALLOWED actions compete; masked logits are
  -inf, so masked probabilities are exactly 0 and a masked action is never ranked.
- **All-actions-forbidden** is a DEFINED output: `{"abstained": true,
  "reason": "all_actions_forbidden"}` — never a crash, never a forced pick.
- **Calibration + abstention:** softmax probabilities; confidence below the floor
  abstains; OOD inputs (missingness above the training bound, features outside the
  observed range by a margin) abstain with an explicit reason.
- **Conditional heads:** a misconception head may be enabled ONLY with sufficient
  labels per class (`minPerClass`); enabling it without enough labels is refused.

## 2. Candidate-size comparison (frozen decision record)

| Candidate | Params (this config) | Deterministic | Mask/abstain/OOD | Notes |
|---|---|---|---|---|
| Heuristic policy teacher (VMM-05 reproduction) | 0 | yes | rule-based | The teacher Tiny-D1 imitates; not a learned ranker |
| BKT/SCM (VMM-05) | 4 | yes | n/a (estimator, not ranker) | Knowledge estimate only |
| Naive Bayes (VMM-05) | O(vocab x classes) | yes | abstain only | Text-based, wrong modality for feature vectors |
| **Tiny-D1 (chosen)** | **7x8+8 + 5x8+5 = 109** (heads add per labelSpace) | yes (seeded) | full contract | Smallest learnable ranker matching the frozen contract |

Tiny-D1 was chosen as the smallest learnable architecture that satisfies the full
masked/abstain/OOD output contract; bigger candidates are unjustified at this data
scale and are deferred until real (not synthetic) evidence volume exists.

## 3. Sanity training target

The chain's sanity task is policy imitation: features from synthetic evidence
snapshots, labels from the VMM-05 reproduction of the reference pedagogy. Tiny-D1
reaching high agreement with the teacher on held-out synthetic snapshots validates
the training loop, NOT educational quality — benchmark success goes through the
VMM-04 registry and `educationalGainsEstablished` remains False.

## 4. Non-goals

No real learner data, no cloud training, no model deployment, no claim that
engineering benchmark success establishes educational gains.
