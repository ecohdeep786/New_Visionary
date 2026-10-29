// PLAT-07 (KAN-51) — the observability domain's typed state seams.
import type {
  HealthObservation,
  LogRecord,
  Operator,
  RedactionPolicy,
} from './observability-types';

export interface ObservabilityStore {
  savePolicy(policy: RedactionPolicy): Promise<void>;
  policy(policyId: string, version: number): Promise<RedactionPolicy | undefined>;
  /** Append one redaction-cleared record (the sink is append-only). */
  appendLog(record: LogRecord): Promise<void>;
  logs(): Promise<LogRecord[]>;
  logCount(): Promise<number>;
  saveHealth(observation: HealthObservation): Promise<void>;
  health(checkId: string): Promise<HealthObservation | undefined>;
  isOperator(actor: Operator): boolean;
  /** Command dedup ledger: commandKey -> { payloadHash, resultRef }. */
  recordCommand(commandKey: string, payloadHash: string, resultRef?: string): Promise<void>;
  commandPayload(commandKey: string): Promise<string | undefined>;
  commandResult(commandKey: string): Promise<string | undefined>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Contract-true in-memory store; tests drive the full domain without infra. */
export class InMemoryObservabilityStore implements ObservabilityStore {
  private policies = new Map<string, RedactionPolicy>();
  private logStream: LogRecord[] = [];
  private healthMap = new Map<string, HealthObservation>();
  private operators = new Set<string>();
  private commands = new Map<string, { hash: string; resultRef?: string }>();

  seedOperator(uid: string): void {
    this.operators.add(uid);
  }

  async savePolicy(policy: RedactionPolicy): Promise<void> {
    this.policies.set(`${policy.policyId}@${policy.version}`, clone(policy));
  }
  async policy(policyId: string, version: number): Promise<RedactionPolicy | undefined> {
    const found = this.policies.get(`${policyId}@${version}`);
    return found ? clone(found) : undefined;
  }
  async appendLog(record: LogRecord): Promise<void> {
    this.logStream.push(clone(record));
  }
  async logs(): Promise<LogRecord[]> {
    return clone(this.logStream);
  }
  async logCount(): Promise<number> {
    return this.logStream.length;
  }
  async saveHealth(observation: HealthObservation): Promise<void> {
    this.healthMap.set(observation.checkId, clone(observation));
  }
  async health(checkId: string): Promise<HealthObservation | undefined> {
    const found = this.healthMap.get(checkId);
    return found ? clone(found) : undefined;
  }
  isOperator(actor: Operator): boolean {
    return this.operators.has(actor.uid) && actor.role === 'operator';
  }
  async recordCommand(commandKey: string, payloadHash: string, resultRef?: string): Promise<void> {
    const prior = this.commands.get(commandKey);
    this.commands.set(commandKey, { hash: payloadHash, resultRef: resultRef ?? prior?.resultRef });
  }
  async commandPayload(commandKey: string): Promise<string | undefined> {
    return this.commands.get(commandKey)?.hash;
  }
  async commandResult(commandKey: string): Promise<string | undefined> {
    const ref = this.commands.get(commandKey)?.resultRef;
    return ref || undefined;
  }
}
