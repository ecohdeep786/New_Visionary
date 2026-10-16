import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Native vector layout for the review map. Mermaid companions describe logical
// dependencies; this fixed grid keeps deployment labels and routes readable.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const groups = [], edges = [], nodes = [], labels = [];
const text = (x, y, lines, options = {}) => `<text x="${x}" y="${y}" text-anchor="${options.anchor || 'middle'}" font-size="${options.size || 16}" font-weight="${options.weight || 400}" fill="#203047"${options.halo ? ' paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round"' : ''}>${lines.map((line, index) => `<tspan x="${x}" dy="${index ? options.leading || 22 : 0}">${escape(line)}</tspan>`).join('')}</text>`;
function group(x, y, w, h, title, dashed = false) {
  groups.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#fafbfd" stroke="#b8c4d2" stroke-width="1.4"${dashed ? ' stroke-dasharray="7 5"' : ''}/>`);
  groups.push(text(x + 18, y + 25, [title], { anchor: 'start', size: 15, weight: 500 }));
}
function box(id, x, y, w, h, title, body = [], status = 'T', database = false) {
  const color = status === 'C' ? ['#eaf4ee', '#578369'] : status === 'L' ? ['#fff4e5', '#b18a51'] : ['#eef3fa', '#7187a6'];
  const shape = database
    ? `<path d="M ${x} ${y + 13} C ${x} ${y - 5} ${x + w} ${y - 5} ${x + w} ${y + 13} L ${x + w} ${y + h - 13} C ${x + w} ${y + h + 5} ${x} ${y + h + 5} ${x} ${y + h - 13} Z"/><ellipse cx="${x + w / 2}" cy="${y + 13}" rx="${w / 2}" ry="13"/>`
    : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>`;
  nodes.push(`<g data-node="${id}" fill="${color[0]}" stroke="${color[1]}" stroke-width="1.4">${shape}</g>`);
  nodes.push(text(x + w / 2, y + (database ? 42 : 25), [title], { weight: 500, size: 17 }));
  if (body.length) nodes.push(text(x + w / 2, y + (database ? 64 : 49), body, { size: 15, leading: 20 }));
}
function edge(d, label, x, y, asynchronous = false) {
  edges.push(`<path d="${d}" fill="none" stroke="#63748a" stroke-width="1.6" marker-end="url(#arrow)"${asynchronous ? ' stroke-dasharray="6 5"' : ''}/>`);
  if (label) labels.push(text(x, y, [label], { halo: true, size: 14 }));
}

group(240, 105, 1140, 810, 'PRIMARY CLOUD · GCP — TARGET HOSTING', true);
group(500, 155, 660, 230, 'TRUSTED PRODUCT API · NestJS / Cloud Run · modules together');
group(500, 420, 660, 150, 'DATA');
group(500, 630, 660, 130, 'JOBS');
group(1400, 120, 200, 490, 'MANAGED PROVIDERS');
group(240, 950, 1140, 85, 'OPERATIONS · reviewed controls across serving and data');

box('client', 30, 200, 180, 80, 'Web / future mobile', ['One verified UID', 'Device-scoped sessions']);
box('edge', 270, 200, 190, 80, 'HTTPS entry · T', ['Load balancer', 'Cloud Armor / routing']);
box('gate', 520, 200, 620, 50, 'Session / workspace / consent / source / usage policy', [], 'T');
box('account', 520, 280, 180, 70, 'Account + billing · C', ['Setup / Free / test plans'], 'C');
box('learn', 725, 280, 180, 70, 'Learn + Teach · T', ['Sources / evidence / class']);
box('build', 930, 280, 180, 70, 'Build · T', ['Projects / revisions']);
box('firestore', 520, 450, 180, 100, 'Firestore · C', ['UID / sessions', 'Test billing / invoices'], 'C', true);
box('postgres', 725, 450, 180, 100, 'HA PostgreSQL · T', ['Membership / sources', 'Evidence / projects'], 'T', true);
box('objects', 930, 450, 180, 100, 'Private GCS · T', ['Versioned content', 'Artifacts / exports'], 'T', true);
box('cdn', 270, 440, 190, 75, 'Cloud CDN · T', ['Public app assets only']);
box('origin', 270, 555, 190, 55, 'Public asset origin', ['Reviewed static release']);
box('tasks', 520, 670, 285, 65, 'Outboxes → Cloud Tasks', ['Dispatch / duplicate-safe retries']);
box('workers', 855, 670, 285, 65, 'Private workers', ['Reconcile / scan / export / Build']);
box('ai', 1190, 460, 170, 90, 'Private AI · T', ['Permitted retrieval', 'Bounded generation']);
box('firebase', 1420, 160, 160, 80, 'Firebase Auth · C', ['Verified identity'], 'C');
box('razorpay', 1420, 280, 160, 75, 'Razorpay · C', ['TEST billing'], 'C');
box('model', 1420, 460, 160, 90, 'Model API · T', ['Evaluated provider', 'Pinned version / budget']);
box('execution', 500, 805, 860, 80, 'LATER · isolated code execution · separate GCP project / IAM / network', ['No account or payment secrets · no database access · qualification required'], 'L');

edge('M210 240 H270', 'HTTPS', 240, 230);
edge('M460 240 H490 V225 H520', '/api', 490, 209);
edge('M365 280 V440', 'App assets', 365, 365);
edge('M365 515 V555', '', 0, 0);
edge('M830 250 V265 H610 V280', '', 0, 0);
edge('M830 265 H815 V280', '', 0, 0);
edge('M830 265 H1020 V280', '', 0, 0);
edge('M610 350 V450', '', 0, 0);
edge('M815 350 V450', '', 0, 0);
edge('M1020 350 V450', '', 0, 0);
edge('M970 350 V393 H865 V450', 'Project metadata', 920, 407);
edge('M1160 200 H1420', 'Identity verification', 1290, 188);
edge('M1160 317 H1420', 'TEST provider calls', 1290, 304);
edge('M1160 355 H1275 V460', 'Ask / Guide', 1280, 402);
edge('M1360 505 H1420', '', 0, 0);
edge('M1190 520 H1175 V585 H850 V550', 'Authorized retrieval', 1015, 601);
edge('M610 550 V670', 'Outbox', 610, 617, true);
edge('M815 550 V615 H740 V670', 'Outbox', 802, 638, true);
edge('M805 702 H855', '', 0, 0, true);
edge('M1100 670 V620 H1275 V550', 'Build generation', 1260, 642);
edge('M1005 735 V805', 'After execution release gates', 1160, 785, true);

labels.push(text(430, 1006, ['Observe latency / lag / spend'], { size: 16 }));
labels.push(text(810, 1006, ['Canary / rollback / audit'], { size: 16 }));
labels.push(text(1190, 1006, ['Backup / PITR / restore drills'], { size: 16 }));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1640" height="1120" viewBox="0 0 1640 1120" role="img" aria-labelledby="title description" font-family="Arial, sans-serif">
<title id="title">Visionary platform architecture</title><desc id="description">Target GCP architecture with a trusted modular API, separate data authorities, private AI, durable workers and later isolated execution. C means connected product integration; T means target. Solid lines are dependencies; dashed lines are durable work.</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#63748a"/></marker></defs>
<rect width="1640" height="1120" fill="#fff"/>
${text(30, 39, ['VISIONARY · Platform architecture'], { anchor: 'start', size: 28, weight: 500 })}
${text(30, 70, ['100,000 MAU planning target · C = connected product integration · T = proposed component'], { anchor: 'start', size: 16 })}
${text(1600, 39, ['D-079 · 16 October 2026'], { anchor: 'end', size: 16 })}
${groups.join('\n')}${edges.join('\n')}${nodes.join('\n')}${labels.join('\n')}
<path d="M250 1070 H310" stroke="#63748a" stroke-width="1.6" marker-end="url(#arrow)"/>
${text(325, 1075, ['Request / data dependency'], { anchor: 'start', size: 15 })}
<path d="M650 1070 H710" stroke="#63748a" stroke-width="1.6" stroke-dasharray="6 5" marker-end="url(#arrow)"/>
${text(725, 1075, ['Durable asynchronous work'], { anchor: 'start', size: 15 })}
${text(1380, 1075, ['Target design — not deployed or capacity-tested'], { anchor: 'end', size: 15 })}
</svg>`;
const directory = path.join(root, 'docs/architecture/diagrams/source');
await fs.mkdir(directory, { recursive: true });
await fs.writeFile(path.join(directory, 'platform_architecture.svg'), svg + '\n');
console.log('Wrote native platform layout.');

groups.length = 0; edges.length = 0; nodes.length = 0; labels.length = 0;
group(60, 360, 1520, 220, 'SERVING');
group(60, 640, 1040, 190, 'STATE');
group(60, 950, 1520, 100, 'OPERATIONS · measured release and recovery gates');
box('load', 620, 110, 400, 80, '100,000 MAU planning population', ['Measure peak requests and run duration']);
box('edge', 620, 240, 400, 75, 'Edge admission controls', ['TLS / WAF / rate limits / public CDN']);
box('core', 100, 420, 400, 120, 'Account + payment paths', ['Independent of model / learning-SQL availability', 'Shared-process saturation still needs controls']);
box('domain', 620, 420, 400, 120, 'Learning + project APIs', ['Conditional writes / tenant-scoped queries', 'Instance caps × bounded SQL connection pools']);
box('ai', 1140, 420, 400, 120, 'Private AI / Build coordinator', ['Separate deployment / provider quotas', 'Token ceilings / deadline / cancellation']);
box('firestore', 100, 680, 270, 110, 'Firestore', ['Account / test billing', 'Authority and reconciliation'], 'T', true);
box('sql', 430, 680, 270, 110, 'Regional HA PostgreSQL', ['Learning / projects / outbox', 'HA is not cross-region recovery'], 'T', true);
box('objects', 760, 680, 270, 110, 'Private object storage', ['Version / digest / retention', 'Protected data delivery'], 'T', true);
box('tasks', 1140, 680, 400, 110, 'Outboxes → Tasks → private workers', ['Queue caps / leases / attempt fences', 'Idempotent completion / recovery sweeper']);
edge('M820 190 V240', '', 0, 0);
edge('M820 315 V393 H300 V420', '', 0, 0);
edge('M820 393 V420', '', 0, 0);
edge('M1020 480 H1140', 'bounded', 1080, 467);
edge('M300 540 V620 H235 V680', '', 0, 0);
edge('M820 540 V610 H565 V680', '', 0, 0);
edge('M820 610 H895 V680', '', 0, 0);
edge('M565 790 V855 H1340 V790', 'Committed outbox, duplicate-safe delivery', 1000, 878, true);
edge('M1340 680 V540', 'Async work', 1395, 620, true);
labels.push(text(320, 1004, ['Redacted metrics / queue lag / spend caps', 'Alerts are not enforced admission limits'], { size: 16 }));
labels.push(text(820, 1004, ['Canary / rollback / immutable releases', 'Measure pools, quotas and saturation'], { size: 16 }));
labels.push(text(1320, 1004, ['Backup / PITR / restore and deletion drills', 'Reconcile revoked grants before serving'], { size: 16 }));
const scaleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1640" height="1120" viewBox="0 0 1640 1120" role="img" aria-labelledby="title description" font-family="Arial, sans-serif">
<title id="title">Visionary resilience and scaling</title><desc id="description">A target plan with bounded serving capacity, independent AI and workers, separate data authorities and reviewed operational controls. It is not a deployed or benchmarked system.</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#63748a"/></marker></defs>
<rect width="1640" height="1120" fill="#fff"/>
${text(30, 39, ['VISIONARY · Resilience and scale'], { anchor: 'start', size: 28, weight: 500 })}
${text(30, 70, ['Target controls · MAU is not concurrency · capacity and recovery require measured release evidence'], { anchor: 'start', size: 16 })}
${text(1600, 39, ['D-079 · 16 October 2026'], { anchor: 'end', size: 16 })}
${groups.join('\n')}${edges.join('\n')}${nodes.join('\n')}${labels.join('\n')}
${text(820, 1092, ['Solid = request/data dependency · Dashed = durable work · All hosted controls remain targets'], { size: 16 })}
</svg>`;
await fs.writeFile(path.join(directory, 'resilience_and_scale.svg'), scaleSvg + '\n');
console.log('Wrote native resilience layout.');
