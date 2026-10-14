import { getApps, initializeApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, browserPopupRedirectResolver, connectAuthEmulator } from 'firebase/auth';
import { firebaseConfigFromEnvironment, firebaseEmulatorFromEnvironment } from './config.js';

const appName = 'visionary-auth';
let client;

// Firebase credentials stay in memory; the server owns the durable session.
export function getFirebaseAuthClient() {
  if (client) return client;
  const config = firebaseConfigFromEnvironment(import.meta.env);
  const emulator = firebaseEmulatorFromEnvironment(import.meta.env, config);
  const existing = getApps().find(app => app.name === appName);
  if (existing && Object.keys(config).some(key => existing.options[key] !== config[key])) {
    throw new Error('The Firebase project configuration changed. Reload before continuing.');
  }
  const app = existing || initializeApp(config, appName);
  client = initializeAuth(app, {
    persistence: inMemoryPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  if (emulator) connectAuthEmulator(client, emulator, { disableWarnings: true });
  return client;
}
