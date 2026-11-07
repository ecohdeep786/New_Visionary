import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { BillingService } from '../billing/billing.service';
import { firebaseAdminSettings } from '../auth/firebase/firebase-admin.service';
import { assertCloudSqlUrl, assertSyntheticUrl, quoteIdentifier } from '../data/migration-identities';
import type { OverviewStore } from './overview-store';
import { PostgresOverviewStore } from './postgres-overview.store';

/** Lazy opt-in: disabled overview opens no SQL pool. The published runtime
 * never substitutes an in-memory store for unavailable authoritative records. */
@Injectable()
export class ProductOverviewStore implements OverviewStore, OnModuleDestroy {
  private client?: PrismaClient;
  private adapter?: PostgresOverviewStore;
  private binding?: string;
  constructor(private readonly accounts: FirebaseProductService, private readonly billing: BillingService, private readonly config: ConfigService) {}
  private store() {
    try {
      if (this.config.get('DATA_OVERVIEW_ENABLED') !== 'true') throw Error();
      const firebase = firebaseAdminSettings(this.config), environment = this.config.get('NODE_ENV');
      const firestore = this.config.get<string>('FIRESTORE_DATABASE_ID') || '(default)';
      const synthetic = this.config.get('DATA_WORKSPACE_DATABASE_MODE') === 'synthetic';
      const test = this.config.get('DATA_OVERVIEW_TEST_ENABLED') === 'true';
      const schema = this.config.get<string>('DATA_WORKSPACE_SCHEMA') || '';
      const role = this.config.get<string>('DATA_WORKSPACE_RUNTIME_ROLE') || '';
      quoteIdentifier(schema); quoteIdentifier(role);
      if (!['test', 'development', 'production'].includes(environment)) throw Error();
      if (test) {
        // No emulator realm may reuse the live bare-UID schema. This exception
        // is fenced to this task's disposable database + generated test schema.
        if (environment !== 'test' || !synthetic || firebase.kind !== 'emulator' || firebase.projectId !== 'demo-visionary-kan42' ||
            firestore !== '(default)' || !/^data02_[a-f0-9]{32}$/.test(schema) ||
            !/^127\.0\.0\.1:[0-9]{1,5}$/.test(process.env.FIRESTORE_EMULATOR_HOST || '')) throw Error();
      } else if (firebase.kind === 'emulator' || firebase.projectId !== 'visionary-research' || firestore !== 'default' ||
          process.env.FIRESTORE_EMULATOR_HOST) throw Error();
      const mode = this.config.get('DATA_WORKSPACE_DATABASE_MODE');
      if (!['synthetic', 'cloud-sql'].includes(mode) || synthetic && environment === 'production') throw Error();
      if (!this.config.get<string>('DATA_WORKSPACE_ENVIRONMENT_ID') && environment !== 'production') throw Error();
      const raw = this.config.get<string>('DATA_WORKSPACE_RUNTIME_URL') || '';
      const url = synthetic ? assertSyntheticUrl(raw) : assertCloudSqlUrl(raw, {
        environment: environment === 'production' ? 'production' : 'staging', project: 'visionary-research', region: 'asia-south1',
        instance: this.config.get<string>('DATA_WORKSPACE_SQL_INSTANCE') || '', database: this.config.get<string>('DATA_WORKSPACE_DATABASE_NAME') || '',
      });
      if (test && url.pathname !== '/visionary_data_test_kan42') throw Error();
      for (const [key, maximum] of [['connection_limit', 3], ['pool_timeout', 15], ['connect_timeout', 15]] as const) {
        const value = Number(url.searchParams.get(key)); if (!Number.isInteger(value) || value < 1 || value > maximum) throw Error();
      }
      if (url.hash || decodeURIComponent(url.username) !== role || url.searchParams.get('schema') !== schema) throw Error();
      const binding = createHash('sha256').update(JSON.stringify([firebase.kind, firebase.projectId, firestore, environment,
        this.config.get('DATA_WORKSPACE_ENVIRONMENT_ID'), mode, test, schema, role, String(url)])).digest('hex');
      if (this.adapter) {
        if (this.binding !== binding) throw Error();
        return this.adapter;
      }
      this.client = new PrismaClient({ datasources: { db: { url: String(url) } } });
      this.binding = binding;
      return this.adapter = new PostgresOverviewStore(this.client, { role, schema, database: url.pathname.slice(1) }, async uid => {
        const [details, billing] = await Promise.all([this.accounts.accountDetails(uid), this.billing.account(uid)]);
        const name = details.identity.displayName ?? details.profile?.name ?? null;
        const email = details.identity.email;
        return { profile: { displayName: name, emailHint: email ? email.slice(0, 1) + '***@' + email.split('@')[1] : null },
          billing: { plan: billing.plan ?? null, currency: 'INR', status: billing.subscription?.status ?? null }, redacted: [] };
      });
    } catch { throw new ServiceUnavailableException('Account overview is unavailable. Your saved records are retained.'); }
  }
  accountOverview(uid: string) { return this.store().accountOverview(uid); }
  workspaceRows(uid: string, after: string | null, size: number) { return this.store().workspaceRows(uid, after, size); }
  membershipRows(uid: string, after: string | null, size: number) { return this.store().membershipRows(uid, after, size); }
  consentRows(uid: string, after: string | null, size: number) { return this.store().consentRows(uid, after, size); }
  commandHistory(uid: string, after: string | null, size: number) { return this.store().commandHistory(uid, after, size); }
  auditRows(uid: string, after: string | null, size: number) { return this.store().auditRows(uid, after, size); }
  workspaceRole(uid: string, id: string) { return this.store().workspaceRole(uid, id); }
  async onModuleDestroy() { await this.client?.$disconnect(); }
}
