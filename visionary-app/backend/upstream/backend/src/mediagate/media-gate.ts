// CONTENT-07 (KAN-66) — the media delivery authorization gate.
//
// Core responsibilities (server-owned; media labels never establish delivery):
//   1. Preserve official approved embeds where suitable: an `official_embed`
//      media pointer is deliverable only when its owning node is released +
//      eligible (published, public, approved) AND the embed's rights gate is
//      approved. Official embeds are not replaced by owned re-encoding unless a
//      release decision says so — preservation is the default.
//   2. Add owned media processing/delivery only when released content requires
//      it (the node declares owned media) AND rights, privacy and cost gates all
//      pass. A blocked gate is exactly a withdrawal: the item is undeclivered.
//   3. Server-live: every verdict is recomputed from the injected store. A
//      withdrawal, a pointer demotion or source rejection immediately removes
//      the item from delivery — no authoritative cache.
//   4. Evaluate claims: a frontend media label is proved ONLY when this node's
//      released media pointer exists and is deliverable. Otherwise fail closed.
//   5. No invented media: a node with no pointer, or a claim on an unknown
//      node/media, reports honestly.
import type {
  ClaimMediaEvaluation,
  DeliveryBlockReason,
  MediaClaim,
  MediaDeliveryItem,
  MediaDeliveryReport,
  MediaGateState,
  MediaPointer,
  NodeMediaDelivery,
  SourceMediaFacts,
} from './media-gate-types';
import type { MediaLookup } from './media-gate-lookups';

type GateName = 'rights' | 'privacy' | 'cost';

const BLOCKED_GATE_REASON: Record<GateName, DeliveryBlockReason> = {
  rights: 'rights_gate',
  privacy: 'privacy_gate',
  cost: 'cost_gate',
};

/** Which gates must pass before an item of this kind can be delivered. */
function requiredGates(kind: MediaPointer['kind']): readonly GateName[] {
  // Official embed: preserved when rights are approved (an approved official
  // host). Owned media: released content requires it AND rights/privacy/cost.
  return kind === 'official_embed' ? (['rights'] as const) : (['rights', 'privacy', 'cost'] as const);
}

export class MediaDeliveryGate {
  private readonly now: () => string;
  constructor(
    private readonly store: MediaLookup,
    options: { now?: () => Date } = {},
  ) {
    this.now = options.now ? () => options.now().toISOString() : () => new Date().toISOString();
  }

  /** Returns the blocking reason when the node itself is not deliverable. */
  private nodeBlockReason(node: SourceMediaFacts): DeliveryBlockReason | undefined {
    if (!node.eligibleForDelivery) return 'not_published';
    if (node.sourceRelease !== 'released') return 'source_not_released';
    return undefined;
  }

  private itemVerdict(node: SourceMediaFacts, media: MediaPointer): MediaDeliveryItem {
    const reason = this.nodeBlockReason(node);
    if (reason) {
      return { mediaKey: media.mediaKey, kind: media.kind, ref: media.ref, status: 'blocked', reason };
    }
    for (const gate of requiredGates(media.kind)) {
      if (media[gate] !== 'approved' as MediaGateState) {
        return { mediaKey: media.mediaKey, kind: media.kind, ref: media.ref, status: 'blocked', reason: BLOCKED_GATE_REASON[gate] };
      }
    }
    return { mediaKey: media.mediaKey, kind: media.kind, ref: media.ref, status: 'deliverable' };
  }

  /** Authorize delivery for every source node currently in the store. */
  async evaluateAll(): Promise<MediaDeliveryReport> {
    const nodes = await this.store.allNodes();
    const perNode: NodeMediaDelivery[] = nodes.map((node) => {
      const items = node.media.map((m) => this.itemVerdict(node, m));
      return {
        nodeKey: node.nodeKey,
        nodeVersion: node.nodeVersion,
        deliverable: items.filter((i) => i.status === 'deliverable'),
        blocked: items.filter((i) => i.status === 'blocked'),
      };
    });
    perNode.sort((a, b) => a.nodeKey.localeCompare(b.nodeKey));
    return { nodes: perNode, decisionSource: 'server-live', evaluatedAt: this.now() };
  }

  /** Authorize delivery for one source node (unknown node fails closed). */
  async evaluateNode(nodeKey: string): Promise<NodeMediaDelivery | { nodeKey: string; unknown: true }> {
    const node = await this.store.byNode(nodeKey);
    if (!node) return { nodeKey, unknown: true };
    const items = node.media.map((m) => this.itemVerdict(node, m));
    return {
      nodeKey: node.nodeKey,
      nodeVersion: node.nodeVersion,
      deliverable: items.filter((i) => i.status === 'deliverable'),
      blocked: items.filter((i) => i.status === 'blocked'),
    };
  }

  /**
   * Evaluate a frontend media label as a CLAIM: proved only when the exact
   * media pointer on this node exists and passes its required gates.
   */
  async evaluateClaim(claim: MediaClaim): Promise<ClaimMediaEvaluation> {
    const node = await this.store.byNode(claim.nodeKey);
    if (!node) return { nodeKey: claim.nodeKey, mediaKey: claim.mediaKey, proved: false, status: 'unknown_node' };
    const media = node.media.find((m) => m.mediaKey === claim.mediaKey);
    if (!media) return { nodeKey: claim.nodeKey, mediaKey: claim.mediaKey, proved: false, status: 'unknown_media' };
    const verdict = this.itemVerdict(node, media);
    if (verdict.status === 'deliverable') {
      return { nodeKey: claim.nodeKey, mediaKey: claim.mediaKey, proved: true, status: 'deliverable' };
    }
    return { nodeKey: claim.nodeKey, mediaKey: claim.mediaKey, proved: false, status: 'blocked', reason: verdict.reason };
  }
}
