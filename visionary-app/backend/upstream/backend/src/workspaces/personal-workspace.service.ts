import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { assertCloudSqlUrl, assertSyntheticUrl, quoteIdentifier } from '../data/migration-identities';
import { FirestoreProvisionLinks } from './firestore-provision-links';
import { PostgresProvisionStore } from './provision-store';
import { WorkspaceProvisioner } from './workspace-provisioner';
import { canonicalProvisionTarget } from './provision-types';

/** Explicit opt-in. Disabled installation starts no SQL pool and performs no
 * provisioning; connection strings are separate runtime-only configuration. */
@Injectable()
export class PersonalWorkspaceService implements OnModuleDestroy {
  private client?: PrismaClient;
  private provisioner?: WorkspaceProvisioner;
  constructor(private readonly accounts: FirebaseProductService, private readonly config: ConfigService) {}
  async provision(uid: string, input: unknown) {
    if (this.config.get('DATA_WORKSPACE_PROVISIONING_ENABLED') !== 'true') throw new ServiceUnavailableException('Personal workspace provisioning is not enabled.');
    if (!this.provisioner) {
      try {
        const raw = this.config.get<string>('DATA_WORKSPACE_RUNTIME_URL') || '';
        const role = this.config.get<string>('DATA_WORKSPACE_RUNTIME_ROLE') || '';
        const schema = this.config.get<string>('DATA_WORKSPACE_SCHEMA') || '';
        quoteIdentifier(role); quoteIdentifier(schema);
        let url: URL;
        if (this.config.get('DATA_WORKSPACE_DATABASE_MODE') === 'cloud-sql') {
          url = assertCloudSqlUrl(raw, { environment: this.config.get('NODE_ENV') === 'production' ? 'production' : 'staging', project: 'visionary-research', region: 'asia-south1',
            instance: this.config.get<string>('DATA_WORKSPACE_SQL_INSTANCE') || '', database: this.config.get<string>('DATA_WORKSPACE_DATABASE_NAME') || '' });
        } else {
          if (this.config.get('NODE_ENV') === 'production') throw Error('Production cannot use synthetic SQL');
          url = assertSyntheticUrl(raw);
          for (const [key, maximum] of [['connection_limit', 3], ['pool_timeout', 15], ['connect_timeout', 15]] as const) {
            const n = Number(url.searchParams.get(key)); if (!Number.isInteger(n) || n < 1 || n > maximum) throw Error('Unbounded runtime connection');
          }
        }
        if (url.hash || decodeURIComponent(url.username) !== role || url.searchParams.get('schema') !== schema) throw Error('Runtime target mismatch');
        const cloud = this.config.get('DATA_WORKSPACE_DATABASE_MODE') === 'cloud-sql';
        const environment = this.config.get('NODE_ENV') === 'production' ? 'production' : cloud ? 'staging' : 'local';
        const target = canonicalProvisionTarget({ environment, environmentId: environment === 'production' ? 'production' : this.config.get<string>('DATA_WORKSPACE_ENVIRONMENT_ID') || '',
          firebaseProject: this.config.get<string>('FIREBASE_PROJECT_ID') || '', firebaseDatabase: this.config.get<string>('FIRESTORE_DATABASE_ID') || '(default)',
          firestoreMode: this.config.get('FIREBASE_PROJECT_KIND') === 'emulator' ? 'emulator' : 'live', sqlProject: cloud ? 'visionary-research' : 'local', region: cloud ? 'asia-south1' : 'local',
          instance: cloud ? this.config.get<string>('DATA_WORKSPACE_SQL_INSTANCE') || '' : 'loopback-' + (url.port || '5432'), database: url.pathname.slice(1), schema });
        const links = new FirestoreProvisionLinks(this.accounts.getDatabase(), target.firebaseProject);
        this.client = new PrismaClient({ datasources: { db: { url: String(url) } } });
        this.provisioner = new WorkspaceProvisioner(new PostgresProvisionStore(this.client, { role, schema }), links, target);
      } catch { throw new ServiceUnavailableException('Personal workspace configuration is unavailable.'); }
    }
    return this.provisioner.provision(uid, input);
  }
  async onModuleDestroy() { await this.client?.$disconnect(); }
}
