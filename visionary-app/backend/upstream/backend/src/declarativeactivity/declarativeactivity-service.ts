// BUILD-09 (KAN-154) — declarative activity admission and trusted preview.
//
// Core responsibilities (server-owned; validate, never execute):
//   1. registerSchema: the platform records a versioned allowlisted schema
//     (components + approved renderers + bounds). Clients cannot extend it.
//   2. admit: validate the manifest — component/renderer allowlist, bounded
//     depth/size, banned-content scan (scripts, arbitrary HTML/URLs, network
//     actions, hidden answer keys) — THEN bind the activity to the exact
//     proposal base revision. A cancelled run yields no activity.
//   3. preview: serve the FIXED base revision's safe representation with the
//     digest re-verified; the view is pre-validated (text/number/bool/select
//     rows) — raw script/HTML from the manifest is never returned.
//   4. accept: distinct authorized op — appends the validated manifest as a
//     new revision (apply-as-new-revision semantics); idempotent per decision;
//     stale proposals (base moved) and already-decided activities fail closed.
//   5. reject: records the decision; history untouched.
//   6. export: distinct authorized op returning the manifest with a
//     digest-verified base revision; tampered bytes fail closed.
//   Wrong users denied everywhere.
import { createHash } from 'node:crypto';
import type {
  ActivityManifest,
  ActivityOwner,
  ActivityPreviewView,
  ActivitySchema,
  DeclarativeActivity,
} from './declarativeactivity-types';
import { DeclarativeError } from './declarativeactivity-types';
import type { ActivityStore } from './declarativeactivity-lookups';

export class DeclarativeActivityService {
  private activityCounter = 0;
  constructor(private readonly store: ActivityStore) {}

  /** Platform-only: register a versioned allowlisted schema. */
  async registerSchema(schema: ActivitySchema): Promise<ActivitySchema> {
    await this.store.registerSchema(schema);
    return schema;
  }

  /**
   * Admit a declarative activity: fully validate the manifest, then bind it to
   * the exact proposal base revision (never a moving target).
   */
  async admit(input: {
    owner: ActivityOwner;
    projectId: string;
    proposalId: string;
    manifest: ActivityManifest;
  }): Promise<DeclarativeActivity> {
    const project = await this.store.byProjectId(input.projectId);
    if (!project) throw new DeclarativeError('unknown_project');
    this.denyIfNotOwner(project.owner, input.owner);

    const proposal = await this.store.byProposal(input.proposalId);
    if (!proposal) throw new DeclarativeError('unknown_proposal');
    this.denyIfNotOwner(proposal.owner, input.owner);
    if ((await this.store.runStatus(proposal.runId)) === 'cancelled') {
      throw new DeclarativeError('run_cancelled');
    }

    const schema = await this.store.schemaAt(input.manifest.schemaId, input.manifest.schemaVersion);
    if (!schema) throw new DeclarativeError('unknown_schema');
    this.validateManifest(input.manifest, schema);

    const activity: DeclarativeActivity = {
      activityId: `act_${++this.activityCounter}`,
      owner: { ...input.owner },
      projectId: input.projectId,
      proposalId: input.proposalId,
      baseRevision: proposal.baseRevision,
      manifest: structuredClone(input.manifest) as ActivityManifest,
      status: 'pending',
    };
    await this.store.saveActivity(activity);
    return activity;
  }

  /**
   * Trusted accessible preview: serves the FIXED base revision's validated
   * representation with digest re-verified — never raw script/HTML.
   */
  async preview(input: { owner: ActivityOwner; activityId: string }): Promise<ActivityPreviewView> {
    const activity = await this.requireOwnedActivity(input.activityId, input.owner);

    const payload = await this.store.payloadAt(activity.projectId, activity.baseRevision);
    const recorded = await this.store.recordedDigest(activity.projectId, activity.baseRevision);
    if (payload === undefined || recorded === undefined) throw new DeclarativeError('preview_integrity_failed');
    if (DeclarativeActivityService.digest(payload) !== recorded) throw new DeclarativeError('preview_integrity_failed');

    // Bind the representation to the manifest's approved renderer. This module
    // has no renderer implementations — it only ALLOWS the approved renderer's
    // safe representation kind and re-validates the parameters for preview.
    const renderer = await this.approvedRenderer(activity.manifest);
    const view = DeclarativeActivityService.safeView(activity.manifest.params, MAX_PREVIEW_ROWS);
    return {
      activityId: activity.activityId,
      projectId: activity.projectId,
      baseRevision: activity.baseRevision,
      rendererId: renderer.rendererId,
      representation: renderer.representation,
      view,
    };
  }

  /** Distinct authorized op: accept = append validated manifest as new revision. */
  async accept(input: { owner: ActivityOwner; activityId: string; decisionId: string }): Promise<{ outcome: 'committed' | 'duplicate'; newRevisionNo: number | null }> {
    if (await this.store.decisionExists(input.decisionId)) {
      return { outcome: 'duplicate', newRevisionNo: null };
    }
    const activity = await this.requireOwnedActivity(input.activityId, input.owner);
    if (activity.status !== 'pending') throw new DeclarativeError('activity_decided');

    const current = await this.store.currentRevision(activity.projectId);
    if (current !== activity.baseRevision) throw new DeclarativeError('base_revision_moved');

    const newRevisionNo = await this.store.appendRevision(activity.projectId, { kind: 'declarative-activity', manifest: structuredClone(activity.manifest) });
    await this.store.recordDecision(activity.activityId, input.decisionId, 'accepted');
    return { outcome: 'committed', newRevisionNo };
  }

  /** Distinct authorized op: record the decision; history untouched. */
  async reject(input: { owner: ActivityOwner; activityId: string; decisionId: string; reason: string }): Promise<{ outcome: 'committed' | 'duplicate' }> {
    if (await this.store.decisionExists(input.decisionId)) return { outcome: 'duplicate' };
    const activity = await this.requireOwnedActivity(input.activityId, input.owner);
    if (activity.status !== 'pending') throw new DeclarativeError('activity_decided');
    await this.store.recordDecision(activity.activityId, input.decisionId, 'rejected');
    return { outcome: 'committed' };
  }

  /** Distinct authorized op: export with the base revision re-verified (fail closed on tamper). */
  async export(input: { owner: ActivityOwner; activityId: string }): Promise<{ activityId: string; baseRevision: number; contentDigest: string; manifest: ActivityManifest }> {
    const activity = await this.requireOwnedActivity(input.activityId, input.owner);
    const payload = await this.store.payloadAt(activity.projectId, activity.baseRevision);
    const recorded = await this.store.recordedDigest(activity.projectId, activity.baseRevision);
    if (payload === undefined || recorded === undefined) throw new DeclarativeError('preview_integrity_failed');
    if (DeclarativeActivityService.digest(payload) !== recorded) throw new DeclarativeError('preview_integrity_failed');
    return { activityId: activity.activityId, baseRevision: activity.baseRevision, contentDigest: recorded, manifest: structuredClone(activity.manifest) };
  }

  // ---- validation ---------------------------------------------------------

  private async approvedRenderer(manifest: ActivityManifest): Promise<{ rendererId: string; representation: string }> {
    // component.renderer allowlist is re-checked here so a preview can only be
    // served by an approved renderer even if admission was previously bypassed.
    const schema = await this.store.schemaAt(manifest.schemaId, manifest.schemaVersion);
    if (!schema) throw new DeclarativeError('schema_tampered');
    const renderer = schema.renderers.find((r) => r.component === manifest.component && r.rendererId === manifest.rendererId);
    if (!renderer) throw new DeclarativeError('unapproved_renderer');
    return renderer;
  }

  private validateManifest(manifest: ActivityManifest, schema: ActivitySchema): void {
    if (manifest.kind !== 'activity') throw new DeclarativeError('unknown_component');
    if (!schema.allowedComponents.includes(manifest.component)) throw new DeclarativeError('unknown_component');
    const renderer = schema.renderers.find((r) => r.component === manifest.component && r.rendererId === manifest.rendererId);
    if (!renderer) throw new DeclarativeError('unapproved_renderer');

    const bytes = Buffer.byteLength(JSON.stringify(manifest));
    if (bytes > schema.maxManifestBytes) throw new DeclarativeError('manifest_too_large');

    this.walkParams(manifest.params, 1, schema, new Set());
  }

  /** Bounded recursive banned-content scan over params (objects and arrays). */
  private walkParams(params: unknown, depth: number, schema: ActivitySchema, seen: Set<string>): void {
    if (params === null || params === undefined) return;
    if (Array.isArray(params)) {
      if (depth > schema.maxManifestDepth) throw new DeclarativeError('manifest_too_deep');
      for (const item of params) this.walkParams(item, depth + 1, schema, seen);
      return;
    }
    if (typeof params !== 'object') {
      if (typeof params === 'string') this.scanString(params, schema);
      return;
    }
    if (depth > schema.maxManifestDepth) throw new DeclarativeError('manifest_too_deep');
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
      const k = key.toLowerCase();
      if (schema.bannedKeys.includes(key.toLowerCase())) {
        // An answer key is never admitted: it must stay server-protected (KAN-74).
        throw new DeclarativeError('hidden_answer_key');
      }
      if (k === 'script' || k === 'onclick' || k === 'onload' || k === 'onerror' || k === 'html' || k === 'src' || k === 'href') {
        throw new DeclarativeError('script_execution_banned');
      }
      if (typeof value === 'string') {
        this.scanString(value, schema);
      } else if (value && typeof value === 'object') {
        if (!seen.has(key)) {
          seen.add(key);
          this.walkParams(value, depth + 1, schema, seen);
        }
      }
    }
  }

  private scanString(value: string, schema: ActivitySchema): void {
    const s = value.toLowerCase();
    if (s.includes('<script') || s.includes('javascript:') || s.includes('onerror=') || s.includes('onload=') || s.includes('onclick=')) {
      throw new DeclarativeError('script_execution_banned');
    }
    if (s.includes('http://') || s.includes('https://') || s.includes('data:')) {
      throw new DeclarativeError('unsafe_url');
    }
    if (s.includes('fetch(') || s.includes('xmlhttprequest') || s.includes('websocket')) {
      throw new DeclarativeError('network_action_banned');
    }
  }

  private denyIfNotOwner(expected: ActivityOwner, actor: ActivityOwner): void {
    if (expected.uid !== actor.uid || expected.workspaceId !== actor.workspaceId) throw new DeclarativeError('not_owner');
  }

  private async requireOwnedActivity(activityId: string, owner: ActivityOwner): Promise<DeclarativeActivity> {
    const activity = await this.store.byActivityId(activityId);
    if (!activity) throw new DeclarativeError('unknown_activity');
    this.denyIfNotOwner(activity.owner, owner);
    return activity;
  }

  static digest(payload: unknown): string {
    // Matches the ledger's manifest digest so preview integrity is re-verified
    // against the SAME digest the append-time manifest recorded.
    return createHash('sha256').update(Buffer.from(JSON.stringify(payload ?? null), 'utf8')).digest('hex');
  }

  /** Build the SAFE preview rows (text/number/bool/select), never raw HTML. */
  static safeView(params: Record<string, unknown>, maxRows: number): ActivityPreviewView['view'] {
    const rows: { key: string; kind: 'text' | 'number' | 'bool' | 'select'; value: string }[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (rows.length >= maxRows) break;
      if (value === null || value === undefined) continue;
      if (typeof value === 'string') {
        rows.push({ key, kind: 'text', value: String(value).slice(0, 512) });
      } else if (typeof value === 'number') {
        rows.push({ key, kind: 'number', value: String(value) });
      } else if (typeof value === 'boolean') {
        rows.push({ key, kind: 'bool', value: String(value) });
      } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
        rows.push({ key, kind: 'select', value: value.slice(0, 8).join(', ') });
      }
    }
    return rows;
  }
}

const MAX_PREVIEW_ROWS = 64;

export type {};
