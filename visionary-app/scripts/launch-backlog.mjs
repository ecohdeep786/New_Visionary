import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { deliveryDependencies } from './launch-delivery-data.mjs';

const dependencies = { P00: [], P01: ['P00'], P02: ['P00'], P03: ['P01', 'P02'], P04: ['P01', 'P03'], P05: ['P01', 'P04'], P06: ['P01', 'P03', 'P05'], P07: ['P01', 'P03', 'P04'], P08: ['P01'], P09: ['P02', 'P03'], P10: ['P00'], P11: ['P00', 'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10'], P12: ['P11'] };
const now = new Set(['SCOPE-01', 'SCOPE-03', 'SCOPE-04', 'SCOPE-06', 'DATA-01', 'DATA-02', 'PLAT-01']);

export function launchIssueType(sourceId, description) {
  if (sourceId === 'AI-17') return 'Story';
  if (/^(LEARN|BUILD|ROLE)-/.test(sourceId) && !/^(?:Verify|Prove|Test)/.test(description)) return 'Story';
  if (['AI-04', 'AI-05', 'AI-09', 'AI-11', 'AI-12'].includes(sourceId)) return 'Bug';
  return 'Task';
}

export function launchBacklog(markdown) {
  const groups = new Map(), issues = [], ids = new Set();
  let phase;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^## (.+)$/.exec(line);
    if (heading) {
      const match = /^(P\d{2}) — (.+)$/.exec(heading[1]);
      phase = match ? match[1] : heading[1].startsWith('What is already done') ? 'FOUNDATION' : heading[1].startsWith('Later capabilities') ? 'LATER' : null;
      if (phase) groups.set(phase, { id: phase, summary: heading[1], dependencies: dependencies[phase] || [], issueType: 'Epic', label: `visionary-phase-${phase.toLowerCase()}` });
    }
    const task = /^- \[([ x])\] \*\*([A-Z]+-\d+)\*\* — (.+)$/.exec(line);
    if (!task) continue;
    if (!phase || ids.has(task[2])) throw new Error(`Unscoped or duplicate launch task: ${task[2]}`);
    ids.add(task[2]);
    const complete = task[1] === 'x';
    issues.push({ sourceId: task[2], phase, issueType: launchIssueType(task[2], task[3]), summary: `[${task[2]}] ${task[3].slice(0, 175)}`,
      description: task[3], localComplete: complete, suggestedStatus: complete ? 'Done' : 'To Do',
      queue: complete ? 'Recorded foundation' : phase === 'LATER' ? 'Later' : now.has(task[2]) ? 'Now' : 'Next',
      labels: ['visionary-launch', `visionary-id-${task[2].toLowerCase()}`, `visionary-phase-${phase.toLowerCase()}`],
      completionRule: complete ? 'Scoped local evidence only; hosted/provider/load acceptance is separate.' : 'Close only against source-checklist exit criteria and retained test/environment evidence.' });
  }
  for (const phase of Object.keys(dependencies)) if (!groups.has(phase)) throw new Error(`Missing launch phase ${phase}`);
  if (!issues.length) throw new Error('No launch tasks found.');
  return { schemaVersion: 1, source: 'docs/architecture/BACKEND_LAUNCH_CHECKLIST.md', sourceSha256: createHash('sha256').update(markdown).digest('hex'),
    targetProject: { name: 'Team AGI', key: 'KAN', site: 'https://visionary-team.atlassian.net', note: 'Founder supplied the existing KAN project URL; use its verified project instead of creating a duplicate project.' },
    schedule: { mode: 'Dependency-ordered solo-founder queue', workInProgressLimit: 2, datesCommitted: false,
      note: 'Now identifies the first queue, not simultaneous assignments or promised delivery dates. Re-estimate after the first durable slice. Track blockers separately from completion.' },
    syncPolicy: 'Search each stable sourceId label before creating; retain issue keys after every successful write. On an ambiguous create, search before retry. Never recreate an issue solely because scheduling failed.',
    totals: { issues: issues.length, locallyComplete: issues.filter(item => item.localComplete).length, openLaunch: issues.filter(item => !item.localComplete && item.phase !== 'LATER').length, later: issues.filter(item => item.phase === 'LATER').length },
    phases: [...groups.values()], taskDependencies: deliveryDependencies, issues };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const backlog = launchBacklog(fs.readFileSync(path.join(root, 'docs/architecture/BACKEND_LAUNCH_CHECKLIST.md'), 'utf8'));
  if (process.argv.includes('--write')) {
    const target = path.join(root, 'docs/architecture/tracking/jira-backlog.json');
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, JSON.stringify(backlog, null, 2) + '\n');
  }
  console.log(JSON.stringify(backlog.totals));
}
