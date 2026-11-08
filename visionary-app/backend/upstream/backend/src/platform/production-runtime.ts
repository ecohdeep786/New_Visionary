import { isAbsolute } from 'node:path';
import type { Server } from 'node:http';

type Settings = { get(key: string): unknown };
/** Validate the compiled product realm without loading a credential or SDK.
 * New-project staging requires its separately reviewed runtime/client binding. */
export function productionRuntimeSettings(config: Settings) {
  const key = config.get('AUTH_RATE_LIMIT_KEY'), port = config.get('PORT') ?? '8080';
  const credential = config.get('GOOGLE_APPLICATION_CREDENTIALS');
  if (config.get('NODE_ENV') !== 'production' || typeof key !== 'string' || key.length < 32 ||
      config.get('FIREBASE_PROJECT_ID') !== 'visionary-research' || (config.get('FIREBASE_PROJECT_KIND') ?? 'production') !== 'production' ||
      config.get('FIRESTORE_DATABASE_ID') !== 'default' || config.get('FIREBASE_AUTH_DOMAIN') !== 'visionary-research.firebaseapp.com' ||
      config.get('AUTH_PUBLIC_ORIGIN') !== 'https://visionary.org.in' ||
      typeof port !== 'string' || !/^[1-9]\d{0,4}$/.test(port) || Number(port) > 65535 ||
      !['1', '2'].includes(String(config.get('AUTH_TRUST_PROXY_HOPS'))) ||
      (credential && (typeof credential !== 'string' || !isAbsolute(credential))) ||
      config.get('DATA_OVERVIEW_TEST_ENABLED') === 'true') throw Error('Production account configuration is incomplete.');
  for (const name of ['FIREBASE_AUTH_EMULATOR_HOST', 'FIRESTORE_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST', 'STORAGE_EMULATOR_HOST', 'PUBSUB_EMULATOR_HOST']) {
    if (config.get(name) || process.env[name]) throw Error('Production cannot use an emulator.');
  }
  return { port: Number(port) };
}

export function boundProductionHttp(server: Server) {
  server.headersTimeout = 15000;
  server.requestTimeout = 30000;
  server.keepAliveTimeout = 5000;
  server.maxRequestsPerSocket = 100;
  server.setTimeout(30000, socket => socket.destroy());
}
