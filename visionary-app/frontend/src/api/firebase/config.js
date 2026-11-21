const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
const variableNames = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  appId: 'VITE_FIREBASE_APP_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
};

export function firebaseConfigFromEnvironment(environment = {}) {
  const config = {};
  for (const [field, name] of Object.entries(variableNames)) {
    const value = environment[name];
    if (typeof value === 'string' && value.trim()) config[field] = value.trim();
  }
  const missing = requiredFields.filter(field => !config[field]);
  if (missing.length) {
    const error = new Error(`Firebase configuration is incomplete: ${missing.map(field => variableNames[field]).join(', ')}`);
    error.name = 'FirebaseConfigurationError';
    throw error;
  }
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(config.projectId)) throw new Error('Firebase project ID is invalid.');
  if (!/^[a-z0-9.-]+$/i.test(config.authDomain) || config.authDomain.includes('..')) throw new Error('Firebase authDomain must be a hostname without a URL scheme or path.');
  return Object.freeze(config);
}

export function firebaseEmulatorFromEnvironment(environment, config) {
  const value = environment.VITE_FIREBASE_AUTH_EMULATOR_URL;
  if (!value && !config.projectId.startsWith('demo-')) return null;
  // A production build never binds a demo project to the Auth Emulator, except
  // through the explicit local test realm below (VITE_FIREBASE_EMULATOR_TEST_ENABLED),
  // the frontend mirror of the backend's fenced DATA_OVERVIEW_TEST_ENABLED realm:
  // a controlled verification run of the production shell against the real Auth
  // protocol and the registered server contracts. The published image pins neither
  // flag, so hosted behavior is unchanged.
  const testRealm = environment.VITE_FIREBASE_EMULATOR_TEST_ENABLED === 'true';
  if (!value || (environment.DEV !== true && !testRealm) || !config.projectId.startsWith('demo-')) throw new Error('Firebase Auth emulator requires an explicit development demo project.');
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !url.port || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Firebase Auth emulator requires an explicit loopback HTTP origin.');
  return url.origin;
}
