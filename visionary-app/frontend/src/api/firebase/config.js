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
