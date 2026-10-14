import { getApps, initializeApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, browserPopupRedirectResolver } from 'firebase/auth';
import { firebaseConfigFromEnvironment } from './config.js';

const appName = 'visionary-auth';
let client;

// Installation foundation only. The live account/session adapter will call
// this explicitly after its server contracts and eligibility gates are ready.
export function getFirebaseAuthClient() {
  if (client) return client;
  const config = firebaseConfigFromEnvironment(import.meta.env);
  const existing = getApps().find(app => app.name === appName);
  if (existing && Object.keys(config).some(key => existing.options[key] !== config[key])) {
    throw new Error('The Firebase project configuration changed. Reload before continuing.');
  }
  const app = existing || initializeApp(config, appName);
  client = initializeAuth(app, {
    persistence: inMemoryPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  return client;
}
