# ML and retrieval

Complete tracked RAG pipeline source imported from `visionaryorg/ragpipeline-master`, commit `f7fffc39b7894e3b6e82e3a3015b8140b1f2a363`, under `upstream/`. Known embedded credentials in scripts/reports were redacted; the original model/service source and Go module boundaries are retained.

From the product root use `npm run ml:install`, `npm run ml:build`, and `npm run ml:test`. The test task selects local library modules; cloud/database/LLM evaluations remain separate. Go module dependencies are installed independently from Node. Python ingestion/reranking need their own environment; the GPU requirements are not portable to Windows unchanged.

This repository supplies retrieval, generation integration and evaluation infrastructure. Model quality, curriculum coverage, throughput and AGI capability require fresh evaluation. The product backend will authorize and dispatch model requests. See [the integration handoff](../integration/README.md) for the contract gaps and local infrastructure.

D-075 keeps the imported gateway disconnected: its HMAC identity, session ownership, private-response cache scope and deadlines do not meet the product contract. Read [the audit](../docs/architecture/discussions/backend-ml-audit.md) before reuse. The [model strategy](../docs/architecture/discussions/ml-strategy.md) selects managed APIs for launch behind product-owned policy/retrieval/evaluation; specific models require benchmarks. Imported Terraform, frontend and global response caches are reference material, not launch infrastructure. No model/provider integration or own-model training is claimed by the design.
