import test from 'node:test';
import assert from 'node:assert/strict';
import { createConnectedWorkspaceContext } from '../src/services/connectedWorkspaceContext.js';

const personal = { id: 'ws-personal-1', name: 'Personal', isPersonal: true, role: 'OWNER' };
const org = { id: 'ws-org-9', name: 'Northfield High', isPersonal: false, role: 'ADMIN' };

function mockWorkspaces(overrides = {}) {
	const calls = { list: [], provision: [], find: [] };
	return {
		calls,
		async list(accountId, after) {
			calls.list.push({ accountId, after });
			if (overrides.list) return overrides.list(calls.list.length, after);
			return { next: null, items: [personal, org] };
		},
		async find(accountId, id, options) {
			calls.find.push({ accountId, id, options });
			if (overrides.find) return overrides.find(id, options);
			return id === personal.id ? personal : null;
		},
		async provision(accountId, commandId) {
			calls.provision.push({ accountId, commandId });
			if (overrides.provision) return overrides.provision(commandId);
			return personal.id;
		},
	};
}

test('a signed-out session cannot load a workspace context', async () => {
	const context = createConnectedWorkspaceContext({ getAccountId: () => null, workspaces: mockWorkspaces() });
	await assert.rejects(context.load(), error => error.status === 401 && /session has ended/.test(error.message));
});

test('the personal workspace comes from the server list without provisioning', async () => {
	const workspaces = mockWorkspaces();
	const context = createConnectedWorkspaceContext({ getAccountId: () => 'account-1', workspaces });
	const result = await context.load();
	assert.deepEqual(result.personal, personal);
	assert.deepEqual(result.workspaces, [personal, org]);
	assert.equal(workspaces.calls.provision.length, 0);
	for (const call of workspaces.calls.list) assert.equal(call.accountId, 'account-1');
});

test('a new account provisions once with a stable command id and confirms by readback', async () => {
	const workspaces = mockWorkspaces({
		list: (call) => call === 1 ? { next: null, items: [org] } : { next: null, items: [personal, org] },
		provision: commandId => {
			assert.match(commandId, /^[a-f0-9-]{36}$/, 'the provision command is an idempotency id');
			return personal.id;
		},
	});
	const context = createConnectedWorkspaceContext({ getAccountId: () => 'account-1', workspaces });
	const result = await context.load();
	assert.equal(workspaces.calls.provision.length, 1);
	assert.equal(workspaces.calls.find.length, 1);
	assert.deepEqual(workspaces.calls.find[0].options, { personal: true }, 'the readback demands the personal owner row');
	assert.equal(result.personal.id, personal.id);
	assert.ok(result.workspaces.some(row => row.id === personal.id), 'the confirmed workspace joins the presented list');
});

test('an uncertain provision keeps its command id across retries until a readback confirms it', async () => {
	let attempts = 0;
	const commandIds = [];
	const workspaces = mockWorkspaces({
		list: () => ({ next: null, items: [org] }),
		find: () => attempts >= 2 ? personal : null,
		provision: commandId => {
			attempts += 1;
			commandIds.push(commandId);
			if (attempts === 1) throw Object.assign(new Error('Workspace setup is unavailable right now. Try again later.'), { status: 503 });
			return personal.id;
		},
	});
	const context = createConnectedWorkspaceContext({ getAccountId: () => 'account-1', workspaces });
	await assert.rejects(context.load(), error => error.status === 503);
	await context.load();
	assert.equal(attempts, 2);
	assert.equal(commandIds[0], commandIds[1], 'the same replay-safe command id covers both attempts');
});

test('a refused overview for a new account goes straight to provisioning', async () => {
	const workspaces = mockWorkspaces({
		list: (call) => {
			if (call === 1) throw Object.assign(new Error('Account records are unavailable for this identity.'), { status: 403 });
			return { next: null, items: [personal, org] };
		},
	});
	const context = createConnectedWorkspaceContext({ getAccountId: () => 'account-1', workspaces });
	const result = await context.load();
	assert.equal(workspaces.calls.provision.length, 1, 'provisioning decided the new account may be set up');
	assert.equal(result.personal.id, personal.id);
});

test('an account change mid-flight aborts the load with 401', async () => {
	let account = 'account-1';
	const workspaces = mockWorkspaces({
		provision: () => {
			account = 'account-2';
			return personal.id;
		},
		list: () => ({ next: null, items: [org] }),
	});
	const context = createConnectedWorkspaceContext({ getAccountId: () => account, workspaces });
	await assert.rejects(context.load(), error => error.status === 401 && /changed/.test(error.message));
	assert.equal(workspaces.calls.find.length, 0, 'no readback runs for another account');
});

test('selection is validated against the server list, never trusted', () => {
	const context = createConnectedWorkspaceContext({ getAccountId: () => 'account-1' });
	assert.equal(context.select(org.id, { workspaces: [personal, org] }), org.id);
	assert.throws(() => context.select('ws-gone', { workspaces: [personal, org] }), /not currently part of your account/);
	assert.throws(() => context.select(personal.id, null), /not currently part of your account/);
});

test('a workspace the server has not confirmed yet reports an honest preparation state', async () => {
	const workspaces = mockWorkspaces({
		list: () => ({ next: null, items: [org] }),
		find: () => null,
	});
	const context = createConnectedWorkspaceContext({ getAccountId: () => 'account-1', workspaces });
	await assert.rejects(context.load(), error => error.status === 503 && /being prepared/.test(error.message));
});
