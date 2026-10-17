// Isolated HTTP harness: real Auth Emulator token checks plus in-memory Firestore.
// It cannot load the product .env, a live credential, or a production database.
const path = require('node:path'), { createRequire } = require('node:module');
const requireBackend = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
requireBackend('reflect-metadata');
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
const { ConfigService } = requireBackend('@nestjs/config'), { Module } = requireBackend('@nestjs/common'), { NestFactory } = requireBackend('@nestjs/core');
const { FirebaseAdminService } = requireBackend('./dist/src/auth/firebase/firebase-admin.service.js');
const { FirebaseProductController } = requireBackend('./dist/src/auth/firebase-product/firebase-product.controller.js');
const { FirebaseProductService } = requireBackend('./dist/src/auth/firebase-product/firebase-product.service.js');
const { memoryFirestore } = require('./fixtures/firestore-memory.cjs');
const config = new ConfigService({ FIREBASE_PROJECT_ID: 'demo-visionary-auth', FIREBASE_PROJECT_KIND: 'emulator', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', AUTH_PUBLIC_ORIGIN: 'http://127.0.0.1:5175', AUTH_RATE_LIMIT_KEY: 'fixture-only-auth-limit-secret-not-for-production' });
const admin = new FirebaseAdminService(config), service = new FirebaseProductService(admin, config), memory = memoryFirestore();
service.db = () => memory.db;
class FixtureModule {}
Module({ controllers: [FirebaseProductController], providers: [{ provide: FirebaseProductService, useValue: service }, { provide: ConfigService, useValue: config }, { provide: FirebaseAdminService, useValue: admin }] })(FixtureModule);
(async () => {
  const app = await NestFactory.create(FixtureModule, { logger: false }); app.use(requireBackend('cookie-parser')()); app.setGlobalPrefix('api');
  app.use('/__test/status', (_req, res) => {
    const records = [...memory.rows];
    res.json({ accounts: records.filter(([key]) => /^visionary_accounts\/[^/]+$/.test(key)).length,
      events: records.filter(([key]) => key.startsWith('visionary_auth_events/')).map(([, value]) => ({ type: value.type, hasIp: !!value.ip, hasBrowser: !!value.userAgent })),
      sessions: records.filter(([key]) => key.startsWith('visionary_auth_sessions/')).map(([, value]) => ({ revoked: !!value.revokedAt })) });
  });
  app.enableShutdownHooks(); await app.listen(3035, '127.0.0.1'); console.log('Auth browser harness ready; demo Auth emulator and memory store only.');
})().catch(() => { console.error('Isolated auth harness could not start.'); process.exitCode = 1; });
