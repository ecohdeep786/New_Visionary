// AI-06 (KAN-88) — permission-filtered retrieval + pinned versions + output
// validation.
//
// Core responsibilities (server-owned; fail closed):
//   1. filterRetrieval: only ELIGIBLE sources the caller MAY retrieve enter the
//      model context — filtered server-side, before any model call; the
//      filtered-out set is recorded for the audit trail.
//   2. validateOutput: a model output is accepted ONLY when it was generated
//      against the SAME pinned context/prompt/tool versions, its schema is
//      valid (all required fields present), every citation resolves to the
//      permitted (filtered) source set, the locale matches the request, and
//      every action is on the allowed-action list. Any violation refuses.
//   3. The accepted output carries the pinned versions and citations — the
//      audit trail of exactly what was permitted and used.
import type {
  FilteredRetrieval,
  MlCaller,
  MlGateError as MlGateErrorType,
  MlSourceFact,
  ModelOutput,
  PinnedVersions,
  ValidatedOutput,
} from './ml-gate-types';
import { MlGateError } from './ml-gate-types';
import type { MlSourceLookup } from './ml-gate-lookups';

export class MlOutputGate {
  constructor(
    private readonly store: MlSourceLookup,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Permission-filter retrieval server-side; only permitted sources go out. */
  async filterRetrieval(caller: MlCaller, locale: string, pinned: PinnedVersions): Promise<FilteredRetrieval> {
    const candidates = await this.store.candidateSources(locale);
    const permitted: string[] = [];
    const filteredOut: string[] = [];
    for (const source of candidates) {
      if (source.eligible && (await this.store.mayRetrieve(caller, source.sourceId))) {
        permitted.push(source.sourceId);
      } else {
        filteredOut.push(source.sourceId);
      }
    }
    return { sourceIds: permitted.sort(), pinned: { ...pinned }, locale, filteredOut: filteredOut.sort() };
  }

  /**
   * Validate a model output against the pinned request and permitted set.
   * Accepts or throws with the FIRST failing check (fail closed).
   */
  async validateOutput(input: {
    caller: MlCaller;
    request: { pinned: PinnedVersions; locale: string; retrieval: FilteredRetrieval; allowedActions: readonly string[] };
    output: ModelOutput;
  }): Promise<ValidatedOutput> {
    const { request, output } = input;
    // 1. Pinned versions must match exactly (no version drift).
    if (
      output.pinned.contextVersion !== request.pinned.contextVersion ||
      output.pinned.promptVersion !== request.pinned.promptVersion ||
      output.pinned.toolVersion !== request.pinned.toolVersion
    ) {
      throw new MlGateError('version_mismatch');
    }
    // 2. Schema: all required fields present on the body.
    const body = output.body as Record<string, unknown> | null;
    if (!body || typeof body !== 'object' || output.requiredFields.some((f) => !(f in body))) {
      throw new MlGateError('schema_invalid');
    }
    // 3. Citations must resolve to the PERMITTED (filtered) set only.
    for (const citation of output.citations) {
      if (!request.retrieval.sourceIds.includes(citation)) throw new MlGateError('citation_not_permitted');
    }
    // 4. Locale must match the requested interface locale.
    if (output.locale !== request.locale) throw new MlGateError('locale_mismatch');
    // 5. Every action must be on the allowed-action list.
    for (const action of output.actions) {
      if (!request.allowedActions.includes(action)) throw new MlGateError('action_not_allowed');
    }
    return {
      accepted: true,
      pinned: { ...output.pinned },
      citations: [...output.citations],
      actions: [...output.actions],
      validatedAt: this.now().toISOString(),
    };
  }
}

export type { MlGateErrorType };
export type { MlSourceFact };
