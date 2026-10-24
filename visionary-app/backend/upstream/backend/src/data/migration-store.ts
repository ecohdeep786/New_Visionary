// DATA-02 — durable migration ledger / store contract.
//
// The store is the bridge to Cloud SQL PostgreSQL (runtime + migration roles).
// In this enabler it is an in-memory synthetic store that emulates the ledger
// table, domain tables and statement execution, exactly as the repo's other
// contract tests use in-memory Firestore fixtures. The real adapter (Prisma/
// pg driver with a separate migration connection) is wired behind this same
// interface during integration; nothing here touches a live database.
import type { MigrationReceipt } from './migration-types';

export interface MigrationStore {
  ensureLedger(): Promise<void>;
  appliedReceipts(): Promise<MigrationReceipt[]>;
  recordReceipt(receipt: MigrationReceipt): Promise<void>;
  /** Highest applied version (0 when the ledger is empty). */
  schemaVersion(): Promise<number>;
  /** True only when every tracked domain table has zero rows. Used to enforce
   *  the "empty synthetic staging before touching existing records" rule. */
  isDomainEmpty(): Promise<boolean>;
  /** Execute one DDL/DML statement under the caller's identity. */
  exec(statement: string): Promise<void>;
}

function tableNameOf(statement: string): string | null {
  const m = /CREATE TABLE(?:\s+IF NOT EXISTS)?(?:\s+"?([A-Za-z_][A-Za-z0-9_]*)"?)/.exec(statement);
  return m ? m[1].toLowerCase() : null;
}

/** Synthetic in-memory store. `failOn` lets a test inject an outage mid-run to
 *  prove bounded resume behaviour (never loses work, never double-applies). */
export class InMemoryMigrationStore implements MigrationStore {
  /** Current applied state per version (maps receive replaced markers on
   *  re-apply; the append-only record of every outcome lives in `history`). */
  readonly ledger = new Map<number, MigrationReceipt>();
  /** Append-only record of every outcome (applied/rejected/rolled_back). */
  readonly history: MigrationReceipt[] = [];
  readonly tables = new Map<string, Array<Record<string, unknown>>>();
  readonly executed: string[] = [];
  failOn: string | null = null;

  constructor(trackedTables: readonly string[] = ['persons', 'workspaces']) {
    for (const t of trackedTables) this.tables.set(t.toLowerCase(), []);
  }

  async ensureLedger(): Promise<void> {
    if (!this.tables.has('schema_migrations')) this.tables.set('schema_migrations', []);
  }

  async appliedReceipts(): Promise<MigrationReceipt[]> {
    return [...this.ledger.values()]
      .filter((r) => r.status === 'applied')
      .sort((a, b) => a.version - b.version);
  }

  async recordReceipt(receipt: MigrationReceipt): Promise<void> {
    this.history.push(receipt);
    this.ledger.set(receipt.version, receipt);
  }

  async schemaVersion(): Promise<number> {
    const applied = [...this.ledger.values()].filter((r) => r.status === 'applied').map((r) => r.version);
    return applied.length ? Math.max(...applied) : 0;
  }

  async isDomainEmpty(): Promise<boolean> {
    for (const [name, rows] of this.tables) {
      if (name === 'schema_migrations') continue;
      if (rows.length > 0) return false;
    }
    return true;
  }

  async exec(statement: string): Promise<void> {
    if (this.failOn && statement.includes(this.failOn)) {
      this.failOn = null; // inject once, then restore healthy behaviour
      throw new Error('SIMULATED_OUTAGE: statement did not complete.');
    }
    this.executed.push(statement);
    const table = tableNameOf(statement);
    if (table && !this.tables.has(table)) this.tables.set(table, []);
  }
}
