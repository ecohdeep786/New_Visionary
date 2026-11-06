import { BadRequestException, HttpException, Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { assertCloudSqlUrl, assertSyntheticUrl, quoteIdentifier } from '../data/migration-identities';
import { WorkspaceRepository } from '../workspaces/workspace.repository';
import { canonicalProvisionTarget } from '../workspaces/provision-types';
import { firebaseAdminSettings } from '../auth/firebase/firebase-admin.service';

/** Self-service reads/revocation only. This installs no consent grant, policy
 * publication, institution admission, job worker or download permission. */
@Injectable()
export class ProductConsentService implements OnModuleDestroy {
  private client?: PrismaClient;
  private repository?: WorkspaceRepository;
  private binding?: string;
  constructor(private readonly accounts: FirebaseProductService, private readonly config: ConfigService) {}
  private enabled() { return this.config.get('DATA_CONSENT_ENABLED') === 'true'; }
  private key() {
    const key = this.config.get<string>('AUTH_RATE_LIMIT_KEY') || '';
    if (key.length < 32) throw new ServiceUnavailableException('Consent controls are unavailable.');
    return key;
  }
  private signature(payload: string) { return createHmac('sha256', this.key()).update('consent-page:' + payload).digest('hex'); }
  private cursor(uid: string, after: string) {
    const payload = Buffer.from(JSON.stringify({ u: uid, a: after, e: Date.now() + 15 * 60_000 })).toString('base64url');
    return payload + '.' + this.signature(payload);
  }
  private after(uid: string, cursor?: string) {
    if (cursor === undefined) return undefined;
    try {
      if (typeof cursor !== 'string' || cursor.length > 512) throw Error();
      const parts = cursor.split('.');
      if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[a-f0-9]{64}$/.test(parts[1]) ||
          !timingSafeEqual(Buffer.from(parts[1]), Buffer.from(this.signature(parts[0])))) throw Error();
      const value = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      if (Object.keys(value).sort().join(',') !== 'a,e,u' || value.u !== uid || typeof value.a !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value.a) ||
          !Number.isSafeInteger(value.e) || value.e <= Date.now() || value.e > Date.now() + 15 * 60_000) throw Error();
      return value.a as string;
    } catch { throw new BadRequestException('Reload your consent controls to continue.'); }
  }
  private store() {
    if (!this.enabled()) throw new ServiceUnavailableException('Consent controls are unavailable.');
    try {
      this.key();
      // Consent rows currently use bare UIDs. Accept only the current product's
      // live identity realm; an emulator/foreign realm must never reuse them.
      const firebase = firebaseAdminSettings(this.config);
      // FirebaseProductService passes this name literally to getFirestore.
      // The current account store is the named "default" database; "(default)"
      // is a different realm and must not be treated as an alias here.
      const firebaseDatabase = this.config.get<string>('FIRESTORE_DATABASE_ID') || '(default)';
      if (firebase.kind === 'emulator' || firebase.projectId !== 'visionary-research' || firebaseDatabase !== 'default') throw Error();
      const nodeEnvironment = this.config.get('NODE_ENV');
      if (!['development', 'test', 'production'].includes(nodeEnvironment)) throw Error();
      const mode = this.config.get('DATA_WORKSPACE_DATABASE_MODE');
      if (!['synthetic', 'cloud-sql'].includes(mode)) throw Error();
      const raw = this.config.get<string>('DATA_WORKSPACE_RUNTIME_URL') || '';
      const role = this.config.get<string>('DATA_WORKSPACE_RUNTIME_ROLE') || '';
      const schema = this.config.get<string>('DATA_WORKSPACE_SCHEMA') || '';
      quoteIdentifier(role); quoteIdentifier(schema);
      const cloud = mode === 'cloud-sql';
      if (!cloud && this.config.get('NODE_ENV') === 'production') throw Error();
      const url = cloud ? assertCloudSqlUrl(raw, { environment: this.config.get('NODE_ENV') === 'production' ? 'production' : 'staging',
        project: 'visionary-research', region: 'asia-south1', instance: this.config.get<string>('DATA_WORKSPACE_SQL_INSTANCE') || '',
        database: this.config.get<string>('DATA_WORKSPACE_DATABASE_NAME') || '' }) : assertSyntheticUrl(raw);
      for (const [key, maximum] of [['connection_limit', 3], ['pool_timeout', 15], ['connect_timeout', 15]] as const) {
        const n = Number(url.searchParams.get(key)); if (!Number.isInteger(n) || n < 1 || n > maximum) throw Error();
      }
      if (url.hash || decodeURIComponent(url.username) !== role || url.searchParams.get('schema') !== schema) throw Error();
      const environment = nodeEnvironment === 'production' ? 'production' : cloud ? 'staging' : 'local';
      const target = canonicalProvisionTarget({ environment,
        environmentId: environment === 'production' ? 'production' : this.config.get<string>('DATA_WORKSPACE_ENVIRONMENT_ID') || '',
        firebaseProject: firebase.projectId, firebaseDatabase, firestoreMode: 'live', sqlProject: cloud ? 'visionary-research' : 'local',
        region: cloud ? 'asia-south1' : 'local', instance: cloud ? this.config.get<string>('DATA_WORKSPACE_SQL_INSTANCE') || '' : 'loopback-' + (url.port || '5432'),
        database: url.pathname.slice(1), schema });
      const binding = createHash('sha256').update(JSON.stringify([target, firebase.kind, role, String(url)])).digest('hex');
      if (this.repository) {
        if (this.binding !== binding) throw Error();
        return this.repository;
      }
      this.client = new PrismaClient({ datasources: { db: { url: String(url) } } });
      // The service owns this bounded client; no legacy global Prisma pool is used.
      this.binding = binding;
      return this.repository = WorkspaceRepository.forConsentRuntime(this.client, { role, schema, database: target.database });
    } catch { throw new ServiceUnavailableException('Consent controls are unavailable.'); }
  }
  async list(uid: string, cursor?: string) {
    if (!this.enabled()) return { version: 1, uid, available: false, grants: [], nextCursor: null };
    const after = this.after(uid, cursor);
    return this.safely(async () => {
      await this.accounts.rateLimit('consent-list', uid, 30);
      const result = await this.store().listAccountConsents(uid, after);
      if (result.grants.some(row => [row.id, row.purpose, row.consentVersion].some(v => typeof v !== 'string' || !v || v.length > 128) ||
          row.resourceId !== null && (typeof row.resourceId !== 'string' || !row.resourceId || row.resourceId.length > 128))) {
        throw new ServiceUnavailableException('Consent records could not be displayed.');
      }
      return { version: 1, uid, available: true, grants: result.grants, nextCursor: result.next ? this.cursor(uid, result.next) : null };
    });
  }
  async revoke(uid: string, grantId: string) {
    return this.safely(async () => {
      await this.accounts.rateLimit('consent-revoke', uid, 10);
      return { version: 1, uid, ...await this.store().revokeConsent(uid, grantId) };
    });
  }
  private async safely<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); }
    catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('Consent controls are temporarily unavailable.');
    }
  }
  async onModuleDestroy() { await this.client?.$disconnect(); }
}
