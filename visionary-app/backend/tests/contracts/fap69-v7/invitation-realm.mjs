// Institution invitation realm: the SAME registered FirebaseProductModule in
// its own process. Institution invitations require NODE_ENV=development and
// their own public origin, while the overview store's emulator test fence
// requires NODE_ENV=test — one process cannot serve both realms because
// ConfigService.set persists realm settings into process.env for the whole
// process. This child shares the gate's emulators and disposable synthetic
// SQL (injected through the environment); no realm fakes either boundary.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.INVITATION_REALM_PORT || 3002);
const publicOrigin = process.env.INVITATION_REALM_ORIGIN || 'http://127.0.0.1:5177';

// Realm environment is assigned BEFORE any module import reads it.
Object.assign(process.env, {
  NODE_ENV: 'development',
  AUTH_PUBLIC_ORIGIN: publicOrigin,
  DATA_INSTITUTION_INVITATIONS_ENABLED: 'true',
  DATA_PRIVACY_APPROVER_UIDS: 'fap69-v7-policy-approver',
  DATA_PRIVACY_CONTROL_NAMESPACE: 'fap69-v7-journey',
});

const req = createRequire(resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend/package.json'));
req('reflect-metadata');
const { NestFactory } = req('@nestjs/core');
const { FirebaseProductModule } = req('./dist/src/auth/firebase-product/firebase-product.module.js');

const app = await NestFactory.create(FirebaseProductModule, { logger: false });
app.use(req('cookie-parser')());
app.setGlobalPrefix('api');
await app.listen(port, '127.0.0.1');
console.log(`invitation-realm ready on 127.0.0.1:${port} (${publicOrigin}) NODE_ENV=development`);

const close = async () => { try { await app.close(); } catch {} process.exit(0); };
process.on('SIGTERM', close);
process.on('SIGINT', close);
