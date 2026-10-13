import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const staging = process.argv[2];
if (!staging) throw new Error('Provide the staging directory.');
const report = [];
for (const name of ['backend', 'ml', 'reverse-engineering']) {
  const cwd = path.join(staging, name);
  const entries = execFileSync('git', ['ls-tree', '-rz', '--long', 'HEAD'], { cwd }).toString().split('\0').filter(Boolean);
  const item = { name, commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd }).toString().trim(), files: entries.length, bytes: 0, findings: [], submodules: [] };
  for (const entry of entries) {
    const [metadata, filename] = entry.split('\t');
    const [mode, type, oid, size] = metadata.trim().split(/\s+/);
    if (type === 'commit') { item.submodules.push({ path: filename, commit: oid }); continue; }
    item.bytes += Number(size);
    if (/\.(pem|key|p12|pfx)$|(^|\/)\.env($|\.(?!.*example))|service.account.*\.json$/i.test(filename)) {
      item.findings.push({ path: filename, reason: 'credential-file' }); continue;
    }
    if (Number(size) > 4_000_000 || /\.(png|jpg|jpeg|webp|pdf|ttf|woff2?|zip|bin|onnx|safetensors|pt|pth|ico)$/i.test(filename)) continue;
    const blob = fs.readFileSync(path.join(cwd, filename));
    if (blob.includes(0)) continue;
    const text = blob.toString();
    const rules = [
      ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
      ['github-token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|github_pat_[A-Za-z0-9_]{40,}/],
      ['google-api-key', /\bAIza[A-Za-z0-9_-]{35}\b/],
      ['aws-access-key', /\bAKIA[A-Z0-9]{16}\b/],
      ['model-api-key', /\bsk-(?:proj-|ant-api\d+-)?[A-Za-z0-9_-]{40,}\b/],
      ['embedded-database-password', /postgres(?:ql)?:\/\/[^\s:@/]+:([^\s@/]+)@/g],
    ];
    for (const [reason, rule] of rules) {
      const matches = [...text.matchAll(new RegExp(rule.source, 'g'))];
      for (const match of matches) {
        if (reason === 'embedded-database-password' && /^(postgres|password|changeme|test|secret|\[.*\]|\$.*|\{.*\}|your.*|<.*>|ragpass|local.*|dev.*)$/i.test(match[1])) continue;
        item.findings.push({ path: filename, reason, line: text.slice(0, match.index).split('\n').length });
      }
    }
  }
  report.push(item);
}
fs.writeFileSync(path.join(staging, 'inspection.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
