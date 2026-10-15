import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import puppeteer from '../../frontend/node_modules/puppeteer/lib/puppeteer/puppeteer.js';

// Public, anonymous observations only. REA owns an empty temporary browser profile.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.join(root, 'artifacts/research/payments', runId);
await fs.mkdir(output, { recursive: true });
const executable = await puppeteer.executablePath();
const references = [
  ['google-one-plans', 'https://one.google.com/about/plans'],
  ['google-one-family', 'https://support.google.com/googleone/answer/9004015?hl=en'],
  ['google-one-cancellation', 'https://support.google.com/googleone/answer/9056360?hl=en'],
  ['workspace-billing', 'https://knowledge.workspace.google.com/admin/billing/compare-flexible-and-annual-fixed-term-payment-plans'],
  ['apple-notifications', 'https://developer.apple.com/documentation/appstoreservernotifications/receiving-app-store-server-notifications'],
];
const selected = new Set(process.argv.slice(2));
if ([...selected].some(id => !references.some(([known]) => known === id))) throw new Error('Unknown study reference ID.');

function capture(inputPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/rea.mjs', 'capture-browser-scenario', inputPath, '--format', 'json', '--full-output'], {
      cwd: path.join(root, 'reverse-engineering/upstream'), windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [], stderr = [];
    child.stdout.on('data', data => stdout.push(data));
    child.stderr.on('data', data => stderr.push(data));
    child.once('error', reject);
    child.once('close', code => resolve({ code, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) }));
  });
}

const results = [];
for (const [id, url] of references) {
  if (selected.size && !selected.has(id)) continue;
  const inputPath = path.join(output, `${id}.input.json`);
  const input = {
    browser: { mode: 'launch', executable_path: executable, headless: true },
    start_url: { url },
    actions: [{ step_id: 'public-content', action: 'wait_for_timeout', duration_ms: 250 }],
    capture: { at_end: ['url', 'dom', 'accessibility'], events: [] },
  };
  await fs.writeFile(inputPath, JSON.stringify(input, null, 2) + '\n');
  const result = await capture(inputPath);
  const evidencePath = path.join(output, `${id}.evidence.json`);
  await fs.writeFile(evidencePath, result.stdout);
  await fs.writeFile(path.join(output, `${id}.stderr.log`), result.stderr);
  let parsed;
  try { parsed = JSON.parse(result.stdout.toString('utf8')); } catch { /* Retain invalid output as evidence of failure. */ }
  const observed = parsed?.data?.normalized_result || parsed?.error?.details?.partial_observation?.capture;
  const complete = parsed?.ok === true && observed?.completeness?.status === 'complete' && observed?.steps?.every(step => step.status === 'completed') && observed?.browser?.cleanup === 'terminated-owned-process';
  const row = { id, url, exitCode: result.code, parsed: !!parsed, complete, cleanup: observed?.browser?.cleanup, errorCode: parsed?.error?.code, evidencePath: path.relative(root, evidencePath).replaceAll('\\', '/'), sha256: createHash('sha256').update(result.stdout).digest('hex') };
  results.push(row);
  console.log(JSON.stringify(row));
  // Retain failure evidence and require resource inspection before another launch.
  if (row.cleanup === 'incomplete') break;
}
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify({ runId, browserExecutable: executable, scope: 'Anonymous public documents; no purchase, login, consent button, payment credentials, or private API inspection.', results }, null, 2) + '\n');
console.log(`Evidence: ${output}`);
if (results.some(row => row.exitCode !== 0 || !row.complete)) process.exitCode = 1;
