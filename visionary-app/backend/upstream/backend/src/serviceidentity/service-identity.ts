// AI-03 (KAN-85) — private service identity: server-issued grants bound to
// audience/expiry/run; browser claims are never authority.
//
// Core responsibilities (server-owned; fail closed):
//   1. issueGrant: mint a private service grant server-side — subject, audience,
//      optional run binding, explicit scopes, absolute expiry. No HMAC is
//      handed to any client; the grant lives in the owning store.
//   2. authorizeWithGrant: validate the three bindings (audience, expiry, run)
//      plus the required scope; return an AuthorizedContext that carries NO
//      secret material.
//   3. authorizeClaim: a browser-supplied claim is REJECTED explicitly — the
//      browser is never the authority (imported HMAC/browser-claim trust is
//      replaced by server-issued identity).
//   4. revokeGrant: immediate revocation; the grant fails closed from that
//      moment; only the owning actor may revoke.
import type {
  AuthorizedContext,
  BrowserClaim,
  IdentityError as IdentityErrorType,
  IdentityOwner,
  ServiceGrant,
} from './service-identity-types';
import { IdentityError } from './service-identity-types';
import type { ServiceIdentityStore } from './service-identity-lookups';

export class ServiceIdentityService {
  private grantCounter = 0;
  constructor(
    private readonly store: ServiceIdentityStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Issue a private service grant (server-side; bound to audience/expiry/run). */
  async issueGrant(input: {
    owner: IdentityOwner;
    subject: string;
    audience: string;
    runId: string | null;
    scopes: readonly string[];
    ttlSeconds: number;
  }): Promise<ServiceGrant> {
    if (input.ttlSeconds <= 0) throw new IdentityError('grant_expired');
    const grant: ServiceGrant = {
      grantId: `gnt_${++this.grantCounter}`,
      owner: { ...input.owner },
      subject: input.subject,
      audience: input.audience,
      runId: input.runId,
      scopes: [...input.scopes],
      issuedAt: this.now().toISOString(),
      expiresAt: new Date(this.now().getTime() + input.ttlSeconds * 1000).toISOString(),
    };
    await this.store.saveGrant(grant);
    return grant;
  }

  /** Authorize with a SERVER-ISSUED grant; validates audience/expiry/run/scope. */
  async authorizeWithGrant(input: {
    grantId: string;
    audience: string;
    runId?: string;
    requiredScope: string;
  }): Promise<AuthorizedContext> {
    const grant = await this.store.byGrantId(input.grantId);
    if (!grant) throw new IdentityError('unknown_grant');
    if ((this.store as { isRevoked?: (id: string) => boolean }).isRevoked?.(input.grantId)) {
      throw new IdentityError('grant_revoked');
    }
    if (this.now().getTime() >= Date.parse(grant.expiresAt)) throw new IdentityError('grant_expired');
    if (grant.audience !== input.audience) throw new IdentityError('audience_mismatch');
    if (grant.runId !== null && input.runId !== undefined && grant.runId !== input.runId) {
      throw new IdentityError('run_mismatch');
    }
    if (!grant.scopes.includes(input.requiredScope)) throw new IdentityError('scope_missing');

    return {
      grantId: grant.grantId,
      subject: grant.subject,
      audience: grant.audience,
      runId: grant.runId,
      scopes: [...grant.scopes],
      validatedAt: this.now().toISOString(),
    };
  }

  /** A browser-supplied claim is NEVER authority — always rejected. */
  async authorizeClaim(_claim: BrowserClaim): Promise<never> {
    throw new IdentityError('browser_claim_rejected');
  }

  /** Revoke immediately (owner-only); the grant fails closed from now on. */
  async revokeGrant(grantId: string, owner: IdentityOwner): Promise<void> {
    const grant = await this.store.byGrantId(grantId);
    if (!grant) throw new IdentityError('unknown_grant');
    if (grant.owner.uid !== owner.uid || grant.owner.workspaceId !== owner.workspaceId) {
      throw new IdentityError('not_owner');
    }
    await this.store.revokeGrant(grantId);
  }
}

export type { IdentityErrorType };
