import test from 'node:test';
import assert from 'node:assert/strict';
import {blockedReleasePath} from '../lib/release-paths.mjs';

test('release upload refuses environment suffixes and credential files within allowed source/public folders',()=>{
  for(const file of ['frontend/src/.env','frontend/src/.env.local','frontend/public/.env.production','frontend/public/.ENV.production.local','frontend/src/settings/.env.staging','frontend/src/credentials/test.json','backend/upstream/backend/src/admin-service-account.json','frontend/public/key.pem','frontend/public/key.p12','frontend/public/key.pfx','frontend/src/node_modules/file.js','frontend/public/artifacts/capture.json']) assert.equal(blockedReleasePath(`visionary-app/${file}`),true,file);
  for(const file of ['frontend/src/environment.ts','frontend/src/lib/authErrors.js','frontend/public/manifest.json','infrastructure/gcp/budget-profile.json','backend/upstream/backend/tsconfig.product.json']) assert.equal(blockedReleasePath(`visionary-app/${file}`),false,file);
});
