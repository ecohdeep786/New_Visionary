import { ForbiddenException, Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { assertSyntheticUrl, quoteIdentifier } from '../data/migration-identities';
import { FirestorePrivacyStore } from '../privacycore/firestore-privacy-store';
import { PrivacyCoreService } from '../privacycore/privacy-core-service';
import { PostgresInvitationStore } from './invitation-store';
import { InvitationPolicyError } from './invitation-types';
import { assertInstitutionReviewer } from './institution-approval';
import { InvitationService } from './invitation.service';

@Injectable()
export class ProductInvitationService implements OnModuleDestroy {
  private client?: PrismaClient;
  private runtime?: { store: PostgresInvitationStore; invitations: InvitationService; privacy: PrivacyCoreService; reviewers: ReadonlySet<string> };
  constructor(private readonly accounts: FirebaseProductService, private readonly config: ConfigService) {}

  private settings() {
    // KAN-110 must resolve admission consistency before hosted activation.
    if (this.config.get('NODE_ENV') !== 'development' ||
        this.config.get('DATA_WORKSPACE_DATABASE_MODE') !== 'synthetic' ||
        this.config.get('DATA_INSTITUTION_INVITATIONS_ENABLED') !== 'true') {
      throw new ServiceUnavailableException('Institution invitations are unavailable.');
    }
    if (this.runtime) return this.runtime;
    try {
      const raw = this.config.get<string>('DATA_WORKSPACE_RUNTIME_URL') || '';
      const role = this.config.get<string>('DATA_WORKSPACE_RUNTIME_ROLE') || '';
      const schema = this.config.get<string>('DATA_WORKSPACE_SCHEMA') || '';
      quoteIdentifier(role);
      quoteIdentifier(schema);
      const url = assertSyntheticUrl(raw);
      for (const [key, max] of [['connection_limit', 3], ['pool_timeout', 15], ['connect_timeout', 15]] as const) {
        const value = Number(url.searchParams.get(key));
        if (!Number.isInteger(value) || value < 1 || value > max) throw Error('Unbounded SQL pool');
      }
      if (url.hash || decodeURIComponent(url.username) !== role || url.searchParams.get('schema') !== schema) throw Error('SQL target mismatch');
      const reviewers = this.config.get<string>('DATA_INSTITUTION_REVIEWER_UIDS')?.split(',') ?? [];
      const approvers = this.config.get<string>('DATA_PRIVACY_APPROVER_UIDS')?.split(',') ?? [];
      if (reviewers.length > 20 || approvers.length > 20 ||
          [...reviewers, ...approvers].some(uid => !/^[A-Za-z0-9_-]{1,128}$/.test(uid) || /^__.*__$/.test(uid))) throw Error('Invalid authority configuration');
      const privacy = new PrivacyCoreService(new FirestorePrivacyStore(this.accounts.getDatabase(),
        this.config.get<string>('DATA_PRIVACY_CONTROL_NAMESPACE') || ''), { trustedApprovers: approvers });
      this.client = new PrismaClient({ datasources: { db: { url: String(url) } } });
      const reviewerSet = new Set(reviewers);
      const store = new PostgresInvitationStore(this.client, { role, schema, database: url.pathname.slice(1) }, reviewerSet);
      return this.runtime = { store, invitations: new InvitationService(store), privacy, reviewers: reviewerSet };
    } catch {
      throw new ServiceUnavailableException('Institution invitation configuration is unavailable.');
    }
  }

  private async admission(privacy: PrivacyCoreService, uid: string) {
    const admission = await privacy.admission(uid);
    if (!admission.allowed || admission.state !== 'adult_current_boundary') {
      throw new ForbiddenException('Current adult admission is required.');
    }
  }

  async issue(uid: string, workspaceId: string, input: unknown) {
    const { invitations, privacy } = this.settings();
    await this.accounts.rateLimit('institution-invite-issue', uid, 10);
    await this.admission(privacy, uid);
    return invitations.invite(uid, workspaceId, input);
  }

  async accept(uid: string, token: unknown) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new InvitationPolicyError('invalid_command');
    const { invitations, privacy } = this.settings();
    await this.accounts.rateLimit('institution-invite-accept', uid, 10);
    await this.admission(privacy, uid);
    const { verifiedEmail } = await this.accounts.currentVerifiedInvitationRecipient(uid);
    const result = await invitations.accept(uid, token, verifiedEmail);
    return { workspaceId: result.workspaceId, role: result.membershipRole, replay: result.replay };
  }

  async approve(reviewerUid: string, input: { workspaceId: string; administratorUid: string; evidenceRef: string; expiresAt: Date }) {
    const { store, privacy, reviewers } = this.settings();
    assertInstitutionReviewer(reviewerUid, reviewers);
    await this.accounts.rateLimit('institution-approval', reviewerUid, 10);
    await this.admission(privacy, reviewerUid);
    await this.admission(privacy, input.administratorUid);
    return store.approveInstitution({ ...input, reviewerUid });
  }

  async revokeApproval(reviewerUid: string, workspaceId: string, approvalId: string) {
    const { store } = this.settings();
    await this.accounts.rateLimit('institution-approval-revoke', reviewerUid, 10);
    return store.revokeInstitution(reviewerUid, workspaceId, approvalId);
  }

  async onModuleDestroy() { await this.client?.$disconnect(); }
}
