// Review evidence only. Executes the submitted TypeScript, replacing external
// Nest/Prisma dependencies with inert adapters. No database/network access.
// Usage: node this-file.cjs <backend-source-root> <typescript-module-path>
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require(process.argv[3]);
const source = path.join(process.argv[2], 'src/workspaces/workspace.repository.ts');
const output = ts.transpileModule(fs.readFileSync(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021,
    experimentalDecorators: true },
}).outputText;
const mod = { exports: {} };
const dependencies = {
  '@nestjs/common': { Injectable: () => (klass) => klass,
    ConflictException: class ConflictException extends Error {},
    NotFoundException: class NotFoundException extends Error {},
    ForbiddenException: class ForbiddenException extends Error {},
    BadRequestException: class BadRequestException extends Error {} },
  '../prisma/prisma.service': { PrismaService: class {} },
  'node:crypto': require('node:crypto'),
};
vm.runInNewContext(output, { exports: mod.exports, module: mod,
  require: (name) => { if (!(name in dependencies)) throw Error(name); return dependencies[name]; },
  Date, console }, { filename: source });
const { WorkspaceRepository } = mod.exports;
let failures = 0;
async function check(name, body) {
  try { await body(); console.log('PASS:', name); }
  catch (error) { failures++; console.log('FAIL:', name, '-', error.message); }
}
(async () => {
  await check('control: wrong owner is denied by actual implementation', async () => {
    const repo = new WorkspaceRepository({ workspace: { findUnique: async () => ({ uid: 'owner' }) } });
    await assert.rejects(repo.assertOwnership('ws', 'other'), /permission/);
  });
  await check('changed workspace fields with same command must conflict', async () => {
    const committed = { uid: 'owner', kind: 'workspace:create',
      payloadDigest: require('node:crypto').createHash('sha256').update('{}').digest('hex') };
    const repo = new WorkspaceRepository({ person: { upsert: async () => {} },
      commandResult: { findUnique: async () => committed },
      workspace: { findUnique: async () => ({ uid: 'owner', name: 'Original', slug: 'sample' }) } });
    await assert.rejects(repo.createWorkspace('owner', { commandId: 'cmd', slug: 'sample', name: 'Changed' }), /changed payload/);
  });
  await check('unknown stored membership role must fail closed', async () => {
    const repo = new WorkspaceRepository({ workspace: { findUnique: async () => ({ uid: 'owner' }) },
      workspaceMembership: { findFirst: async () => ({ role: 'UNRECOGNIZED' }) } });
    await assert.rejects(repo.assertMembership('ws', 'other', 'ADMIN'), /role|permission|member/i);
  });
  await check('one invitation must not admit two concurrent accounts', async () => {
    const accepted = [];
    const invitation = { id: 'invite', workspaceId: 'ws', role: 'MEMBER', status: 'ISSUED',
      revokedAt: null, expiresAt: new Date(Date.now() + 60000) };
    const tx = { invitation: { update: async () => {} },
      workspaceMembership: { create: async ({ data }) => { accepted.push(data.uid); } },
      auditEvent: { create: async () => {} }, outboxEvent: { create: async () => {} } };
    const repo = new WorkspaceRepository({ person: { upsert: async () => {} },
      invitation: { findFirst: async () => ({ ...invitation }) }, $transaction: async (fn) => fn(tx) });
    await Promise.allSettled([repo.acceptInvitation('first', 'synthetic-token-123456'),
      repo.acceptInvitation('second', 'synthetic-token-123456')]);
    assert.equal(accepted.length, 1, `accepted accounts: ${accepted.join(', ')}`);
  });
  console.log(JSON.stringify({ cases: 4, passed: 4 - failures, failed: failures }));
  process.exitCode = failures ? 1 : 0;
})();
