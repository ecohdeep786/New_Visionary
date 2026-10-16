import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceRoot = path.join(root, 'artifacts/research/build');
const index = JSON.parse(fs.readFileSync(new URL('BUILD_REFERENCE_EVIDENCE_2026_10_16.json', import.meta.url)));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const attempted = new Set();
let completeCount = 0;
for (const record of index.records) {
  const file = path.resolve(root, record.evidencePath);
  if (!file.startsWith(evidenceRoot + path.sep)) throw new Error('Unexpected evidence boundary.');
  const bytes = fs.readFileSync(file);
  if (digest(bytes) !== record.sha256) throw new Error('Evidence digest mismatch: ' + record.target);
  const envelope = JSON.parse(bytes);
  if ((envelope.error?.code ?? null) !== record.errorCode) throw new Error('Error mismatch: ' + record.target);
  if (record.errorCode === 'invalid_request') {
    if (record.complete || envelope.ok || !envelope.error.details.issues.some(issue => issue.path.join('.') === 'browser.executable_path')) throw new Error('Input diagnostic mismatch.');
    continue;
  }
  attempted.add(record.target);
  const result = envelope.data?.normalized_result || envelope.error?.details?.partial_observation?.capture;
  if (result?.browser?.cleanup !== record.cleanup) throw new Error('Cleanup mismatch.');
  const artifacts = result?.steps?.at(-1)?.artifacts;
  if (!result?.steps?.length || !result.steps.every(step => step.status === 'completed' && step.completeness?.status === 'complete')) throw new Error('Incomplete documented steps.');
  for (const kind of ['url', 'dom', 'accessibility']) if (artifacts?.[kind]?.state !== 'captured') throw new Error('Missing final artifact: ' + kind);
  const finalUrl = new URL(artifacts.url.value.url);
  if (finalUrl.origin !== new URL(record.url).origin) throw new Error('Capture left selected official origin.');
  for (const kind of ['dom', 'accessibility']) {
    const value = artifacts[kind].value;
    if (digest(Buffer.from(value.text)) !== value.sha256 || Buffer.byteLength(value.text) !== value.bytes) throw new Error('Artifact content digest/size mismatch.');
  }
  if (!artifacts.dom.value.text.includes(record.documentMarker)) throw new Error('Selected document marker missing.');
  const complete = envelope.ok === true && result.completeness?.status === 'complete' && record.cleanup === 'terminated-owned-process';
  if (complete !== record.complete) throw new Error('Do not promote partial evidence to complete.');
  if (complete) completeCount++;
}
if (['claude', 'chatgpt', 'gemini'].some(target => !attempted.has(target))) throw new Error('A requested target is missing.');
console.log(`PASS: ${index.records.length} exact evidence digests; all three targets; ${completeCount} complete and ${attempted.size - completeCount} partial browser captures; artifact hashes, cleanup and input diagnostic preserved.`);
