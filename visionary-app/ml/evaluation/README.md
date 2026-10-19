# Retrieval metric qualification

KAN-137 / AI-11 repairs deterministic metric math. The existing `retrieval-binary-v2` implementation and shared fixtures are present in both Python and Go. Passing these tests does not qualify a provider, corpus, model or educational outcome.

## Metric contract

[The shared contract](retrieval-binary-v2.json) defines binary relevance, ordered first-occurrence deduplication before K, unique gold IDs, Recall@K, reciprocal rank and log2-discounted NDCG. Ideal ranking length is the smaller of canonical candidate count and unique gold count. Caller-provided ordering is retained; score ties and graded relevance are outside this contract. Empty inputs return zero; nonpositive K returns zero recall. Python additionally rejects boolean, fractional and missing K. Go's K parameter is statically an integer. Inputs are not mutated.

Thirteen hand-calculated fixtures cover perfect/missing/rank-two/rank-three results, duplicate candidates/gold/irrelevant IDs, deduplication before K, short rankings, empty inputs and zero/negative K. The Python suite also verifies report versioning, invalid Python K and the guarded synthetic CLI.

```text
python ml/evaluation/test_retrieval_contract.py
# From ml/upstream/shared/go:
go test -count=1 -v ./analytics/
```

The synthetic CLI requires `--demo` and labels its output as synthetic. Do not use its dummy retrieval as a provider comparison. The upstream repair remains covered by the recorded [patch provenance](../../integration/upstream-patches.json); this closeout does not change imported implementation bytes.

## Historical reports and comparison acceptance

[historical-report-qualification.json](historical-report-qualification.json) records hashes of the imported evaluation/result reports in `ml/upstream/data/`. They remain **unqualified for product provider/corpus comparison**. This does not assert that a particular historical input contained duplicate IDs or that every historical metric is wrong. The reports are preserved unchanged; their source/data/version provenance has not been established for a corrected product benchmark.

AI-01 / [KAN-83](https://visionary-team.atlassian.net/browse/KAN-83) and AI-13 / [KAN-142](https://visionary-team.atlassian.net/browse/KAN-142) must reject comparison acceptance based on these artifacts alone. A qualified replacement needs:

- Authorized, versioned dataset/corpus/source and gold-label manifests, with hashes, query counts and the approved data purpose.
- Recorded provider/model/retrieval/reranking settings, K values, language/source slices and deterministic execution/evaluation configuration.
- Exact evaluator source/fixture versions, applicable metric contracts and actual reproducible execution evidence; synthetic output is identified separately.
- Reviewer acceptance of the report's provenance and held-out/safety/teaching criteria required by its owning task. A metric unit test or a report containing a model name cannot supply this evidence.

Recompute affected benchmark reports only after those inputs and versions are established. None was recomputed in this repair review. The ledger is qualification/release evidence, not a new model-serving authorization or an installed runtime comparison service. Real benchmark integration and enforcement belong to the open comparison tasks.
