import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../upstream/backend/package.json', import.meta.url));
require('reflect-metadata');
const { Module, UnauthorizedException } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { NestFactory } = require('@nestjs/core');
const { OverviewController } = require('./dist/src/overview/overview.controller.js');
const { OverviewService } = require('./dist/src/overview/overview.service.js');
const { InMemoryOverviewStore } = require('./dist/src/overview/overview-store.js');
const { FirebaseProductService } = require('./dist/src/auth/firebase-product/firebase-product.service.js');

test('real Nest routing and request authority: missing/changed account, bounds, pages and no-store', async () => {
  const store = new InMemoryOverviewStore();
  store.seedAccount({ uid: 'owner', profile: { displayName: 'Owner', emailHint: null, token: 'private_marker' }, billing: null });
  for (let i = 0; i < 25; i++) store.pushAudit({ id: 'a_' + i, uid: 'owner', operation: 'save', outcome: 'SUCCESS', resourceType: 'project', resourceId: null, createdAt: '2026-11-07T00:00:00Z', userAgent: 'private_marker' });
  // Explicit synthetic identity boundary: tests routing/authority composition,
  // not Firebase SDK/session verification or connected product acceptance.
  const accounts = { async authenticate(cookie) {
    if (cookie !== 'synthetic-owner' && cookie !== 'synthetic-other') throw new UnauthorizedException();
    return { uid: cookie === 'synthetic-owner' ? 'owner' : 'other' };
  } };
  class ReviewModule {}
  Module({ controllers: [OverviewController], providers: [
    { provide: FirebaseProductService, useValue: accounts },
    { provide: ConfigService, useValue: new ConfigService({ AUTH_PUBLIC_ORIGIN: 'http://localhost:5173' }) },
    { provide: OverviewService, useValue: new OverviewService(store) },
  ] })(ReviewModule);
  const app = await NestFactory.create(ReviewModule, { logger: false });
  app.use(require('cookie-parser')()); app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const get = (path, uid = 'owner', cookie = 'synthetic-owner') => fetch(base + path, {
    headers: { 'X-Visionary-Account': uid, Cookie: 'visionary-session=' + cookie },
  });
  try {
    assert.equal((await get('/api/overview', 'owner', 'missing')).status, 401);
    assert.equal((await get('/api/overview', 'other')).status, 409);
    assert.equal((await get('/api/api/overview')).status, 404);
    const response = await get('/api/overview');
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = await response.json();
    assert.equal(JSON.stringify(body).includes('private_marker'), false);
    assert.equal(body.audit.items.length, 20); assert.equal(body.audit.hasMore, true);
    const page = await (await get('/api/overview/audit?limit=20&after=' + body.audit.nextCursor.value)).json();
    assert.equal(page.items.length, 5); assert.equal(page.hasMore, false);
    const other = await (await get('/api/overview', 'other', 'synthetic-other')).json();
    assert.equal(other.profile, null); assert.equal(other.audit.items.length, 0);
    for (const kind of ['workspaces', 'memberships', 'consents', 'history', 'audit']) {
      assert.equal((await get('/api/overview/' + kind + '?limit=51')).status, 400);
      assert.equal((await get('/api/overview/' + kind + '?after=invalid!')).status, 400);
      assert.equal((await get('/api/overview/' + kind)).status, 200);
    }
  } finally { await app.close(); }
});
