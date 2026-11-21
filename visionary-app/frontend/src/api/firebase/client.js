import { firebaseConfigFromEnvironment, firebaseEmulatorFromEnvironment } from './config.js';

const appName = 'visionary-auth';
let clientPromise;

// Firebase credentials stay in memory; the server owns the durable session.
// The SDK is loaded on the first identity use, not at import time: the
// landing and other public routes never execute a Firebase call, so the
// ~174KB SDK must not sit in their initial payload. The promise is cached so
// every caller awaits the same initialized client.
export function getFirebaseAuthClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const [{ getApps, initializeApp }, sdk] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
      ]);
      const { initializeAuth, inMemoryPersistence, browserPopupRedirectResolver, connectAuthEmulator } = sdk;
      const config = firebaseConfigFromEnvironment(import.meta.env);
      const emulator = firebaseEmulatorFromEnvironment(import.meta.env, config);
      const existing = getApps().find(app => app.name === appName);
      if (existing && Object.keys(config).some(key => existing.options[key] !== config[key])) {
        throw new Error('The Firebase project configuration changed. Reload before continuing.');
      }
      const app = existing || initializeApp(config, appName);
      const client = initializeAuth(app, {
        persistence: inMemoryPersistence,
        popupRedirectResolver: browserPopupRedirectResolver,
      });
      if (emulator) connectAuthEmulator(client, emulator, { disableWarnings: true });
      return client;
    })();
    // A failed initialization must not poison every later retry: drop the
    // cached promise so the next identity call starts fresh.
    clientPromise.catch(() => { clientPromise = undefined; });
  }
  return clientPromise;
}
