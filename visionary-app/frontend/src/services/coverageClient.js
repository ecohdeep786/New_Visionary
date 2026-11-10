import { createAuthTransport } from '../api/firebase/authTransport.js';

const categories = ['primary', 'secondary', 'higher-secondary', 'competitive', 'vocational', 'higher-education', 'independent-adult', 'professional', 'employer-sponsored'];
const tupleFields = ['category', 'interfaceLocale', 'modality', 'device', 'connectivity', 'sourceId', 'sourceVersion', 'sourceLanguage', 'inputLanguage', 'outputLanguage', 'script', 'speechLanguage', 'board', 'state', 'classLevel', 'exam'];
const reasons = ['account-setup-required', 'verified-guardian-admission-required', 'account-role-unavailable', 'verified-linked-role-required', 'native-client-not-released', 'online-authority-required', 'vocational-mapping-required', 'account-learning-context-changed', 'coverage-not-published', 'exact-source-check-required', 'exact-source-not-qualified', 'source-qualified-access-check-required'];
const unavailable = () => Object.assign(new Error('Learning coverage could not be verified. Your saved selections are unchanged.'), { status: 503 });

export function createCoverageClient({ getAccountId, request = createAuthTransport({ basePath: '/api/account/coverage' }), now = Date.now }) {
  let generation = 0;
  const read = async (path, options) => {
    const uid = getAccountId(), epoch = ++generation;
    const check = () => { if (!uid || getAccountId() !== uid || epoch !== generation) throw Object.assign(new Error('The account or coverage selection changed.'), { status: 409 }); };
    check();
    const result = await request(path, { ...options, accountId: uid, beforeSend: check });
    check();
    const checkedAt = Date.parse(result?.checkedAt), expiresAt = Date.parse(result?.expiresAt);
    if (result?.version !== 1 || result.uid !== uid || !Number.isSafeInteger(result.profileVersion) || result.profileVersion < 0 ||
        !(result.catalogRevision === null || typeof result.catalogRevision === 'string' && /^[a-zA-Z0-9_-]{1,96}$/.test(result.catalogRevision)) ||
        !Number.isFinite(checkedAt) || checkedAt > now() + 5000 || !Number.isFinite(expiresAt) || expiresAt <= now() || expiresAt - checkedAt > 30000 ||
        result.runtimeAuthorization !== false || !['unavailable', 'source-qualified'].includes(result.status) || !reasons.includes(result.reason) ||
        (result.status === 'source-qualified') !== (result.reason === 'source-qualified-access-check-required') ||
        !Array.isArray(result.categories) || result.categories.length !== categories.length || new Set(result.categories.map(row => row.id)).size !== categories.length ||
        result.categories.some(row => !categories.includes(row.id) || !Number.isSafeInteger(row.qualifiedSlices) || row.qualifiedSlices < 0 || row.exactSourceCheckRequired !== true)) throw unavailable();
    if (path === '' && (result.status !== 'unavailable' || result.selection !== undefined)) throw unavailable();
    if (options.body && (result.profileVersion !== options.body.expectedProfileVersion || result.catalogRevision !== options.body.expectedCatalogRevision ||
        !result.selection || Object.keys(result.selection).length !== tupleFields.length || tupleFields.some(key => result.selection[key] !== (options.body[key] || '')))) throw unavailable();
    if (result.status === 'source-qualified' && (!result.catalogRevision || !result.categories.some(row => row.id === result.selection?.category && row.qualifiedSlices > 0))) throw unavailable();
    return result;
  };
  return { snapshot: () => read('', {}), check: selection => read('/check', { method: 'POST', body: selection }), invalidate: () => { ++generation; } };
}
