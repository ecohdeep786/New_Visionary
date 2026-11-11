import { createAuthTransport } from '../api/firebase/authTransport.js';
const classes = ['auth_device', 'learning_text', 'source_files', 'billing_audit', 'model_artifacts', 'admission_proof', 'voice_transcript', 'offline_pack', 'pilot_feedback'];
export function createPrivacyPolicyClient({ getAccountId, request = createAuthTransport({ basePath: '/api/account/privacy' }) }) {
  return { async read() {
    const uid = getAccountId();
    const check = () => { if (!uid || getAccountId() !== uid) throw Object.assign(new Error('The signed-in account changed. Reload Privacy.'), { status: 409 }); };
    check();
    const value = await request('/policy', { accountId: uid, beforeSend: check }); check();
    const text = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
    if (value?.version !== 1 || value.uid !== uid || value.approvalState !== 'approved' || !text(value.policyVersion, 64) || !/^[a-f0-9]{64}$/.test(value.policyDigest) || !text(value.approvedBy?.name, 120) || !text(value.approvedBy?.role, 80) || value.preservation?.automaticPurge !== false || value.preservation.defaultTraining !== false || value.preservation.under18Activation !== 'blocked' || value.capabilities?.policyReference !== true || value.capabilities.cloudErasure !== false || value.capabilities.guardianVerification !== false || value.capabilities.automaticTraining !== false || !Array.isArray(value.dataClasses) || value.dataClasses.length !== classes.length || new Set(value.dataClasses.map(c => c?.dataClass)).size !== classes.length || value.dataClasses.some(c => !classes.includes(c?.dataClass) || !text(c.purpose, 1000) || c.retention !== 'owner_controlled' || !Array.isArray(c.permittedFields) || !c.permittedFields.length || c.permittedFields.length > 40 || c.permittedFields.some(f => !text(f, 64)))) throw Object.assign(new Error('The approved privacy reference could not be verified. Your records are preserved.'), { status: 503 });
    return value;
  } };
}
