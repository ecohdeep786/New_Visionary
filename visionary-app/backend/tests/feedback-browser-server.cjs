// Loopback-only UI fixture: real feedback controller/service, fictional identity,
// transactional memory. No .env, Firebase SDK initialization or provider calls.
const path = require('node:path'), { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
req('reflect-metadata');
const { Module, UnauthorizedException, ServiceUnavailableException } = req('@nestjs/common');
const { ConfigService } = req('@nestjs/config'), { NestFactory } = req('@nestjs/core');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { FeedbackController } = req('./dist/src/feedback/feedback.controller.js'), { FeedbackService } = req('./dist/src/feedback/feedback.service.js');
const { billingMemory } = require('./fixtures/billing-memory.cjs');
const memory = billingMemory(), token = 'b'.repeat(64);
const auth = { getDatabase: () => memory.db, authenticate: async cookie => { if (cookie !== 'feedback-fixture') throw new UnauthorizedException(); return { uid: 'feedback-fixture' }; } };
const feedback = new FeedbackService(auth), save = feedback.submit.bind(feedback); let loseNextReceipt = true;
feedback.submit = async (...args) => { const receipt = await save(...args); if (loseNextReceipt) { loseNextReceipt = false; throw new ServiceUnavailableException('Fixture lost the first receipt after committing.'); } return receipt; };
class FixtureModule {}
Module({ controllers: [FeedbackController], providers: [{ provide: FeedbackService, useValue: feedback }, { provide: FirebaseProductService, useValue: auth }, { provide: ConfigService, useValue: new ConfigService({ AUTH_PUBLIC_ORIGIN: 'http://127.0.0.1:5176' }) }] })(FixtureModule);
(async () => {
  const app = await NestFactory.create(FixtureModule, { logger: false }); app.use(req('cookie-parser')()); app.setGlobalPrefix('api');
  app.use('/api/auth/csrf', (_request, response) => {
    response.cookie('visionary-session', 'feedback-fixture', { httpOnly: true, sameSite: 'strict' });
    response.cookie('visionary-device', 'feedback-device', { httpOnly: true, sameSite: 'strict' });
    response.cookie('visionary-csrf', token, { httpOnly: true, sameSite: 'strict' }); response.json({ token });
  });
  app.use('/__test/status', (_request, response) => response.json({ submissions: [...memory.rows.keys()].filter(key => key.includes('/feedback/')).length }));
  app.enableShutdownHooks(); await app.listen(3036, '127.0.0.1'); console.log('Feedback UI fixture ready on loopback3036; first committed receipt intentionally lost.');
})().catch(() => { console.error('Feedback UI fixture failed.'); process.exitCode = 1; });
