import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode, applyActionCode, validatePassword, reload, signOut, signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier, GoogleAuthProvider } from 'firebase/auth';
import { getFirebaseAuthClient } from './client.js';
import { createServerAuth } from './serverAuth.js';
import { authFlowError, passwordRequirements } from '../../lib/authErrors.js';
import { createAuthTransport } from './authTransport.js';
import { popupProviderId } from './signInMethods.js';

export const firebaseAuthEnabled = import.meta.env?.VITE_AUTH_MODE === 'firebase';
const pendingVerificationTimes = new Map();
let phoneVerifier = null;
const request = createAuthTransport();
const identity = {
  login: async (email, password) => (await signInWithEmailAndPassword(getFirebaseAuthClient(), email, password)).user,
  register: async (email, password) => (await createUserWithEmailAndPassword(getFirebaseAuthClient(), email, password)).user,
  current: async () => getFirebaseAuthClient().currentUser,
  async reloadCurrent() { const user = getFirebaseAuthClient().currentUser; if (user) await reload(user); return user; },
  async sendVerification(user) {
    if (Date.now() - (pendingVerificationTimes.get(user.uid) || 0) < 60000) throw authFlowError('auth/verification-cooldown');
    await sendEmailVerification(user, { url: `${window.location.origin}/login`, handleCodeInApp: false });
    pendingVerificationTimes.set(user.uid, Date.now());
  },
  async provider(name) {
    popupProviderId(name);
    const provider = new GoogleAuthProvider();
    return (await signInWithPopup(getFirebaseAuthClient(), provider)).user;
  },
  // Phone sign-in starts a two-step exchange: send the SMS code, confirm it, and
  // rely on the server session exchange. The invisible verifier is skipped by the
  // Auth Emulator and kept on the client otherwise.
  async beginPhoneSignIn(phoneE164, reCAPTCHAContainerId) {
    const auth = getFirebaseAuthClient();
    if (phoneVerifier) { try { phoneVerifier.clear(); } catch { /* a verifier on another page can be rebuilt */ } phoneVerifier = null; }
    phoneVerifier = new RecaptchaVerifier(auth, reCAPTCHAContainerId, { size: 'invisible' });
    return (await signInWithPhoneNumber(auth, phoneE164, phoneVerifier));
  },
  confirmPhoneSignIn: async (confirmation, code) => (await confirmation.confirm(code)).user,
  resetRequest: email => sendPasswordResetEmail(getFirebaseAuthClient(), email, { url: `${window.location.origin}/login` }),
  reset: (code, password) => confirmPasswordReset(getFirebaseAuthClient(), code, password),
  resetInfo: code => verifyPasswordResetCode(getFirebaseAuthClient(), code),
  applyVerification: code => applyActionCode(getFirebaseAuthClient(), code),
  async validatePassword(password) {
    const auth = getFirebaseAuthClient();
    // Auth Emulator does not implement getPasswordPolicy. Its native password
    // admission still enforces the default minimum; never bypass live policy.
    if (auth.emulatorConfig) { if (password.length < 6) throw authFlowError('auth/weak-password'); return; }
    const policy = await validatePassword(auth, password);
    if (!policy.isValid) { const error = authFlowError('auth/password-does-not-meet-requirements'); error.requirements = passwordRequirements(policy); throw error; }
  },
  logout: () => signOut(getFirebaseAuthClient()),
};
export const firebaseAuth = createServerAuth({ request, identity, notify: () => {
  try { localStorage.setItem('visionary_auth_epoch', crypto.randomUUID()); } catch { /* Cookies remain authoritative when browser storage is unavailable. */ }
} });
