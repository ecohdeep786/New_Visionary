import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import puppeteer from '../frontend/node_modules/puppeteer/lib/puppeteer/puppeteer.js';

// Anonymous official documentation, not authenticated provider applications.
const references = [
  ['claude', 'https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them'],
  ['chatgpt', 'https://learn.chatgpt.com/docs/artifacts-viewer'],
  ['gemini', 'https://support.google.com/gemini/answer/16047321?hl=en'],
];
const selected = new Set(process.argv.slice(2));
if ([...selected].some(id => !references.some(([known]) => known === id))) throw new Error('Select claude, chatgpt or gemini.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.join(root, 'artifacts/research/build', runId);
await fs.mkdir(output, { recursive: true });
const executable = await puppeteer.executablePath();
if (typeof executable !== 'string' || !executable) throw new Error('An installed browser executable is required.');
const results = [];
const scope = 'Anonymous official documentation in temporary profiles. No login, provider application interaction, account changes, private API inspection or generated-code execution. This evidence cannot establish private provider topology.';
const saveManifest = () => fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify({ runId, scope, browserExecutable: executable, results }, null, 2) + '\n');
function capture(inputPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/rea.mjs', 'capture-browser-scenario', inputPath, '--format', 'json', '--full-output'], {
      cwd: path.join(root, 'reverse-engineering/upstream'), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [], stderr = [];
    child.stdout.on('data', data => stdout.push(data));
    child.stderr.on('data', data => stderr.push(data));
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) }));
  });
}

await saveManifest();
for (const [id, url] of references) {
  if (selected.size && !selected.has(id)) continue;
  const inputPath = path.join(output, `${id}.input.json`);
  await fs.writeFile(inputPath, JSON.stringify({
    browser: { mode: 'launch', executable_path: executable, headless: true },
    start_url: { url },
    actions: [{ step_id: 'official-document', action: 'wait_for_timeout', duration_ms: 500 }],
    capture: { at_end: ['url', 'dom', 'accessibility'], events: [] },
  }, null, 2) + '\n');
  console.log(`REA Build reference: ${id}`);
  const started = performance.now();
  const result = await capture(inputPath);
  const evidencePath = path.join(output, `${id}.evidence.json`);
  await fs.writeFile(evidencePath, result.stdout);
  await fs.writeFile(path.join(output, `${id}.stderr.log`), result.stderr);
  let parsed;
  try { parsed = JSON.parse(result.stdout.toString('utf8')); } catch { /* Retain invalid output as failed evidence. */ }
  const observed = parsed?.data?.normalized_result || parsed?.error?.details?.partial_observation?.capture;
  const cleanup = observed?.browser?.cleanup;
  const steps = observed?.steps;
  const final = steps?.at(-1)?.artifacts;
  const complete = result.code === 0 && parsed?.ok === true && observed?.completeness?.status === 'complete'
    && Array.isArray(steps) && steps.length > 0
    && steps.every(step => step.status === 'completed' && step.completeness?.status === 'complete')
    && ['url', 'dom', 'accessibility'].every(kind => final?.[kind]?.state === 'captured')
    && cleanup === 'terminated-owned-process';
  const row = {
    target: id, url, exitCode: result.code, signal: result.signal, durationMs: Math.round(performance.now() - started),
    complete, cleanup: cleanup ?? 'unknown', errorCode: parsed?.error?.code ?? null,
    evidencePath: path.relative(root, evidencePath).replaceAll('\\', '/'),
    sha256: createHash('sha256').update(result.stdout).digest('hex'),
  };
  results.push(row);
  await saveManifest();
  console.log(JSON.stringify(row));
  if (cleanup !== 'terminated-owned-process') {
    console.log('Stopped: inspect retained cleanup evidence before another browser launch.');
    break;
  }
}
console.log(`Evidence: ${output}`);
if (results.length !== (selected.size || references.length) || results.some(row => !row.complete)) process.exitCode = 1;
