import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { deliveryDependencies } from './launch-delivery-data.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const all = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];
const specific = {
  'AI-01': ['L4','L7'], 'AI-02': ['L4','L6','L7'], 'AI-03': all,
  'AI-04': ['L6'], 'AI-05': ['L4','L6'], 'AI-06': ['L4'], 'AI-07': ['L4','L7'],
  'AI-08': ['L1','L4','L5','L6'], 'AI-09': ['L4','L6','L7'], 'AI-10': ['L1','L5'],
  'AI-11': ['L4','L7'], 'AI-12': ['L7'], 'AI-13': all, 'AI-14': all,
  'AI-15': ['L3','L4','L6'], 'AI-16': ['L5'],
  'AI-17': ['L1','L3','L4','L5','L6','L7'], 'AI-18': ['L1','L3','L4','L5','L7'],
  'LEARN-01': ['L2','L3','L6'], 'LEARN-02': ['L2','L3','L7'], 'LEARN-03': ['L2','L6','L7'],
  'LEARN-04': ['L2','L3','L6'], 'LEARN-05': ['L1','L3','L4','L6'], 'LEARN-06': ['L2','L3','L6'],
  'LEARN-07': all, 'LEARN-08': ['L2','L3','L7'], 'LEARN-09': ['L2'],
  'LEARN-10': ['L2','L3','L4','L6'], 'LEARN-11': ['L2','L6'], 'LEARN-12': ['L2','L3','L6','L7'],
  'LEARN-13': ['L1','L2','L3','L5','L6'],
  'LEARN-14': ['L2','L3','L6','L7'],
  'ROLE-01': ['L2','L3','L6'], 'ROLE-02': ['L2','L3','L4','L5'], 'ROLE-03': ['L2','L3','L6','L7'],
  'ROLE-04': ['L2','L6'], 'ROLE-05': ['L2','L3','L4','L6'], 'ROLE-06': all,
  'ROLE-07': ['L2','L6','L7'], 'ROLE-08': all, 'ROLE-09': ['L4','L6'],
  'ROLE-10': ['L2','L3','L4','L5','L6','L7'],
  'LATER-01': ['L3','L4'], 'LATER-02': ['L4','L5'], 'LATER-03': ['L3','L4','L5','L6'],
  'LATER-04': ['L4','L7'], 'LATER-05': ['L2','L4','L6','L7'], 'LATER-06': ['L3','L7'],
};
const sharedPrefixes = new Set(['DONE','SCOPE','DATA','PLAT','JOB','SYNC','CACHE','CONTENT','BUILD','BILL','PRIV','SAFE','ACCEPT','RELEASE']);
export function vatsDelivery(backlog, map, registry) {
  if (registry.layers.map(l => l.id).join() !== all.join()) throw Error('VATS must retain exactly the seven Doc03 layers');
  const known = new Set(backlog.issues.map(i => i.sourceId));
  for (const layer of registry.layers) for (const id of layer.tickets) if (!known.has(id)) throw Error('Unknown layer requirement ' + id);
  const nodes = new Map(backlog.issues.map(i => [i.sourceId, { issue: i, incoming: [], outgoing: [] }]));
  for (const e of deliveryDependencies) { nodes.get(e.blocks).outgoing.push(e.blocked); nodes.get(e.blocked).incoming.push(e.blocks); }
  const remaining = new Map([...nodes].map(([id, n]) => [id, n.incoming.length]));
  const ready = [...nodes.keys()].filter(id => remaining.get(id) === 0), order = [], depth = new Map();
  const phase = id => backlog.phases.findIndex(p => p.id === nodes.get(id).issue.phase);
  const weight = id => { const i = nodes.get(id).issue; return i.localComplete ? 0 : i.phase === 'LATER' ? 3 : 1; };
  while (ready.length) {
    ready.sort((a,b) => weight(a)-weight(b) || phase(a)-phase(b) || a.localeCompare(b));
    const id = ready.shift(), n = nodes.get(id); order.push(id);
    depth.set(id, n.incoming.length ? Math.max(...n.incoming.map(p => depth.get(p))) + 1 : 0);
    for (const next of n.outgoing) { remaining.set(next, remaining.get(next)-1); if (!remaining.get(next)) ready.push(next); }
  }
  if (order.length !== nodes.size) throw Error('VATS task dependency cycle');
  const tasks = order.map((id, index) => {
    const n = nodes.get(id), issue = n.issue, prefix = id.split('-')[0];
    const layers = specific[id] || (prefix === 'FILE' ? ['L1','L4','L5','L6','L7'] : sharedPrefixes.has(prefix) ? all : null);
    if (!layers) throw Error('Unmapped VATS task ' + id);
    const kind = issue.localComplete ? 'historical-local' : issue.phase === 'LATER' ? 'later' : ['SCOPE','DATA','PLAT','JOB','SYNC','CACHE','BILL','PRIV','SAFE','FILE'].includes(prefix) ? 'shared-enabler' : ['ACCEPT','RELEASE'].includes(prefix) ? 'release-gate' : 'capability';
    return { sourceId: id, jiraKey: map.issues[id]?.key || null, phase: issue.phase, queue: issue.queue, kind, layers, planningOrder: index+1, dependencyDepth: depth.get(id), blockedBy: n.incoming, blocks: n.outgoing, closure: issue.localComplete ? 'Historical local scope only; does not certify a complete VATS layer.' : 'Complete this scoped feature/enabler with the existing 11-layer delivery acceptance, current source/criteria/policy and linked layer exits. A model output is not a committed outcome.' };
  });
  return { schemaVersion: 1, decision: 'D-090', launchPlan: 'docs/architecture/EDUCATION_LAUNCH_PLAN.md', sourceSha256: backlog.sourceSha256, registry: 'ml/vats/layers.json', registrySha256: createHash('sha256').update(JSON.stringify(registry)).digest('hex'), interpretation: 'L1–L7 are product capability boundaries, not mandatory deployment units or proof of AGI. Layers on a shared enabler mean applicability, not implemented ML functionality.', orderMeaning: 'A prerequisite-compatible planning order, not dates, an assignment, a queue reorder or permission to bypass phase/shared release gates. Work can be prepared while blockers are open. Later capabilities retain separate approval.', layers: registry.layers, tasks };
}
export function vatsTrace(task, manifest, map) {
  const links = ids => ids.map(id => `[${id} / ${map.issues[id].key}](${map.site}/browse/${map.issues[id].key})`).join(', ');
  return `## D-090 — Current seven-layer delivery\n\nLayer applicability: **${task.layers.join(', ')}**; scope: ${task.kind}. Current prerequisites and planning order: docs/architecture/tracking/vats-delivery.json (${task.sourceId}). This manifest is authoritative for order; historical Jira ranks retain their dated scope. Preserve original requirements, current journeys and all UID/role/source/privacy/entitlement boundaries.\n\n${task.closure}\n\nBefore acceptance: frontend/API schema → current backend authority → owning-store receipt/revision/outbox → permitted ML proposal and output checks → scoped cache/observation → actual committed two-device outcome, as applicable. No direct cross-domain ML database access, posterior-only mastery, raw scene execution or automatic raw-chat training.\n\nPrerequisites: ${task.blockedBy.length ? links(task.blockedBy) : 'parent phase and shared contract/data/permission gates still apply'}. Unblocks: ${task.blocks.length ? links(task.blocks) : 'mapped feature/phase release acceptance'}.\n\nCurrent research, Build/voice/offline scope and execution handoff: docs/architecture/EDUCATION_LAUNCH_PLAN.md. Layer ownership, current evidence and exact exits: docs/architecture/VATS_IMPLEMENTATION.md; ml/vats/layers.json; docs/architecture/tracking/vats-delivery.json. L7 reviewed outcome/feedback/evaluation is launch work; own-model training and online experiments remain separately gated. Broad AGI capability needs independent held-out/generalization evidence.\n`;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const read = p => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  const b=read('docs/architecture/tracking/jira-backlog.json'), map=read('docs/architecture/tracking/jira-issue-map.json'), registry=read('ml/vats/layers.json');
  for (const layer of registry.layers) for (const anchor of layer.evidence) if (!fs.existsSync(path.join(root,anchor))) throw Error('Missing layer anchor ' + anchor);
  const m=vatsDelivery(b,map,registry);
  if (m.tasks.some(t=>!t.jiraKey)) throw Error('Missing VATS Jira key');
  if (process.argv.includes('--write')) fs.writeFileSync(path.join(root,'docs/architecture/tracking/vats-delivery.json'),JSON.stringify(m,null,2)+'\n');
  if (process.argv.includes('--prepare-jira')) throw Error('The D-087 snapshot preparer is historical. Use research/scripts/prepare-education-launch.mjs with its verified D-088 snapshots; never append traces blindly.');
  console.log(JSON.stringify({tasks:m.tasks.length,layers:m.layers.length,missingKeys:0,taskDependencies:deliveryDependencies.length,firstOpen:m.tasks.filter(t=>t.kind!=='historical-local').slice(0,10).map(t=>t.sourceId)}));
}
