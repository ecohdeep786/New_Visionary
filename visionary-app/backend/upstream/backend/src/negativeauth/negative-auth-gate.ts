// PRIV-06 (KAN-115) — negative authorization across the privacy surfaces.
//
// Core responsibilities (fail closed; uniform denials):
//   1. resolveLink: a signed link serves only its OWNER within its window —
//      expiry (`link_expired`) and foreign links (`link_not_owned`) refuse.
//      The SAME rule covers exports and private object URLs.
//   2. search: only hits the caller MAY see return; a private hit owned by
//      someone else never appears (search-leak negative test).
//   3. uniformDenial: the error text for a wrong-user denial is byte-equal to
//      an unknown-id denial (no existence leak through error messages).
//   4. telemetryCheck: telemetry records are redacted-only — any raw private
//      string present refuses (`telemetry_leak`).
//   5. procedures: the log-retention / backup-hold / access-review /
//      secret-rotation records validate (positive cadence + concrete steps) —
//      invalid procedures refuse (`procedure_invalid`).
import type {
  NegativeAuthError as NegativeAuthErrorType,
  PrivacyActor,
  SignedLink,
} from './negative-auth-types';
import { NegativeAuthError } from './negative-auth-types';
import type { NegativeAuthStore } from './negative-auth-lookups';

export class NegativeAuthorizationGate {
  constructor(private readonly store: NegativeAuthStore) {}

  /** Resolve a signed link (export/object URL): owner + window enforced. */
  async resolveLink(token: string, actor: PrivacyActor, now: number): Promise<{ resourceRef: string }> {
    const link = await this.store.signedLink(token);
    if (!link) throw new NegativeAuthError('link_not_owned');
    if (now >= link.expiresAt) throw new NegativeAuthError('link_expired');
    if (link.ownerUid !== actor.uid) throw new NegativeAuthError('link_not_owned');
    return { resourceRef: link.resourceRef };
  }

  /** Search with server-side visibility filtering — no leakage through search. */
  async search(actor: PrivacyActor, query: string): Promise<{ results: readonly { resultId: string; snippet: string }[] }> {
    const hits = await this.store.searchHits();
    const results: { resultId: string; snippet: string }[] = [];
    for (const hit of hits) {
      if (!hit.snippet.toLowerCase().includes(query.toLowerCase())) continue;
      if (!(await this.store.maySee(actor, hit))) continue; // private hit of another user: never shown
      results.push({ resultId: hit.resultId, snippet: hit.snippet });
    }
    return { results };
  }

  /** Error-message uniformity: wrong-user and unknown-id denials are byte-equal. */
  static uniformDenialText(): string {
    // ONE canonical denial for both cases — no existence leak.
    return 'The requested record is unavailable.';
  }

  /** Telemetry leak check: any raw private string present refuses. */
  static telemetryCheck(record: Record<string, unknown>, rawPrivateText: readonly string[]): void {
    const serialized = JSON.stringify(record);
    if (rawPrivateText.some((t) => t.length > 0 && serialized.includes(t))) {
      throw new NegativeAuthError('telemetry_leak');
    }
  }

  /** Validate the operating procedures (log/backup/access-review/rotation). */
  async validateProcedures(): Promise<void> {
    const procedures = await this.store.procedures();
    const kinds = new Set<string>();
    for (const p of procedures) {
      if (p.cadenceDays <= 0) throw new NegativeAuthError('procedure_invalid');
      if (!p.steps || p.steps.length === 0) throw new NegativeAuthError('procedure_invalid');
      kinds.add(p.kind);
    }
    for (const required of ['log_retention', 'backup_hold', 'access_review', 'secret_rotation']) {
      if (!kinds.has(required)) throw new NegativeAuthError('procedure_invalid');
    }
  }
}

export type { NegativeAuthErrorType };
export type { SignedLink };
