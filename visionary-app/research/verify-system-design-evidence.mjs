import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceRoot = path.join(root, 'artifacts/research/system-design');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function within(base, relative) {
  const resolved = path.resolve(base, relative);
  if (!resolved.startsWith(base + path.sep)) throw new Error('Evidence path leaves its owning directory.');
  return resolved;
}
const failureIndex = JSON.parse(fs.readFileSync(new URL('SYSTEM_DESIGN_EVIDENCE_2026_10_15.json', import.meta.url)));
const attempted = new Set();
for (const record of failureIndex.records) {
  const file = within(root, record.evidencePath);
  if (!file.startsWith(evidenceRoot + path.sep)) throw new Error('Unexpected study evidence location.');
  const bytes = fs.readFileSync(file);
  if (digest(bytes) !== record.sha256) throw new Error('Study hash mismatch: ' + record.target);
  const envelope = JSON.parse(bytes);
  if (envelope.error?.code !== record.errorCode || record.complete !== false) throw new Error('Study status disagrees with recorded failure.');
  if (record.kind === 'public-browser-attempt') {
    attempted.add(record.target);
    if (envelope.error.details.partial_observation?.capture?.browser?.cleanup !== record.cleanup) throw new Error('Cleanup status mismatch.');
  }
}
if (['classroom', 'khan-academy', 'youtube'].some(target => !attempted.has(target))) throw new Error('A requested target was not attempted.');

const completeIndex = JSON.parse(fs.readFileSync(new URL('SYSTEM_DESIGN_EVIDENCE_2026_10_16.json', import.meta.url)));
const completed = new Set();
for (const record of completeIndex.records) {
  const file = within(root, record.evidencePath);
  if (!file.startsWith(evidenceRoot + path.sep)) throw new Error('Unexpected study evidence location.');
  const bytes = fs.readFileSync(file);
  if (digest(bytes) !== record.sha256) throw new Error('Complete-capture hash mismatch: ' + record.target);
  const envelope = JSON.parse(bytes);
  const result = envelope.data?.normalized_result;
  const finalArtifacts = result?.steps?.at(-1)?.artifacts;
  if (envelope.ok !== true || record.complete !== true
    || result?.browser?.cleanup !== record.cleanup
    || result?.completeness?.status !== 'complete'
    || !Array.isArray(result?.steps) || result.steps.length === 0
    || !result.steps.every(step => step.completeness?.status === 'complete')
    || ['url', 'dom', 'accessibility'].some(artifact => finalArtifacts?.[artifact]?.state !== 'captured')) {
    throw new Error('Complete capture disagrees with recorded status: ' + record.target);
  }
  completed.add(record.target);
}
if (['classroom', 'khan-academy', 'youtube'].some(target => !completed.has(target))) throw new Error('A requested complete capture is missing.');

const pricing = within(root, failureIndex.pricingEvidenceDirectory);
const manifest = JSON.parse(fs.readFileSync(path.join(pricing, 'manifest.json')));
for (const record of manifest) {
  const html = fs.readFileSync(within(pricing, record.htmlFile));
  if (digest(html) !== record.sha256SavedUtf8Html) throw new Error('Pricing HTML hash mismatch: ' + record.name);
  JSON.parse(fs.readFileSync(within(pricing, record.evidenceFile)));
}
const aws = JSON.parse(fs.readFileSync(path.join(pricing, 'aws-fargate-mumbai.evidence.json')));
if (digest(fs.readFileSync(path.join(pricing, 'aws-fargate-mumbai-price-list.json'))) !== aws.sha256SavedUtf8Json) throw new Error('AWS source hash mismatch.');
const source = JSON.parse(fs.readFileSync(path.join(pricing, 'verified-rates.json')));
const rate = JSON.parse(fs.readFileSync(path.join(root, 'infrastructure/cost/rates-2026-10-15.json')));
for (const [copied, verified] of [
  [rate.run.cpuSecond, source.cloudRunRequestBillingTier1.cpuPerVcpuSecond],
  [rate.run.gibSecond, source.cloudRunRequestBillingTier1.memoryPerGibSecond],
  [rate.run.idleCpuSecond, source.cloudRunRequestBillingTier1.minimumIdleCpuPerVcpuSecond],
  [rate.sql.haCpuHour, source.cloudSqlPostgresEnterpriseGeneralPurposeMumbai.haVcpuPerHour],
  [rate.sql.haGibHour, source.cloudSqlPostgresEnterpriseGeneralPurposeMumbai.haMemoryPerGibHour],
  [rate.sql.haSsdGibMonth, source.cloudSqlPostgresEnterpriseGeneralPurposeMumbai.haSsdPerAllocatedGibMonth],
  [rate.firestore.reads100k, source.firestoreStandardMumbaiOnDemand.documentReadsPer100000],
  [rate.storage.standardGibMonth, source.cloudStorageSingleRegionMumbai.standardPerGibMonth],
]) if (copied !== verified) throw new Error('Tracked rate card disagrees with selected source table.');
console.log(`PASS: ${failureIndex.records.length} failed-attempt digests/statuses plus ${completeIndex.records.length} complete-capture digests/statuses, all three requested targets, ${manifest.length} pricing HTML digests/sidecars, AWS source and selected tracked rates. Complete REA captures:${completeIndex.records.length}.`);
