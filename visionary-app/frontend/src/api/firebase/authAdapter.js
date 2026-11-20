import { getFirebaseAuthClient } from './client.js';
import { createServerAuth } from './serverAuth.js';
import { authFlowError, passwordRequirements } from '../../lib/authErrors.js';
import { createAuthTransport } from './authTransport.js';
import { popupProviderId } from './signInMethods.js';

import { notifySessionChange } from './sessionSignal.js';

const pendingVerificationTimes = new Map();
let phoneVerifier = null;
const request = createAuthTransport();
/* The Firebase SDK loads with the first identity call (see client.js): every
 * method pulls the functions it needs from the same cached dynamic import. */
const identity = {
  login: async (email, password) => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    return (await signInWithEmailAndPassword(await getFirebaseAuthClient(), email, password)).user;
  },
  register: async (email, password) => {
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    return (await createUserWithEmailAndPassword(await getFirebaseAuthClient(), email, password)).user;
  },
  async reloadUser(user) {
    const { reload } = await import('firebase/auth');
    await reload(user);
    return user;
  },
  async sendVerification(user) {
    if (Date.now() - (pendingVerificationTimes.get(user.uid) || 0) < 60000) throw authFlowError('auth/verification-cooldown');
    const { sendEmailVerification } = await import('firebase/auth');
    await sendEmailVerification(user, { url: `${window.location.origin}/login`, handleCodeInApp: false });
    pendingVerificationTimes.set(user.uid, Date.now());
  },
  async provider(name) {
    popupProviderId(name);
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    return (await signInWithPopup(await getFirebaseAuthClient(), provider)).user;
  },
  // Phone sign-in starts a two-step exchange: send the SMS code, confirm it, and
  // rely on the server session exchange. The invisible verifier is skipped by the
  // Auth Emulator and kept on the client otherwise.
  async beginPhoneSignIn(phoneE164, reCAPTCHAContainerId) {
    const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
    const auth = await getFirebaseAuthClient();
    if (auth.emulatorConfig) auth.settings.appVerificationDisabledForTesting = true;
    if (phoneVerifier) { try { phoneVerifier.clear(); } catch { /* a verifier on another page can be rebuilt */ } phoneVerifier = null; }
    phoneVerifier = new RecaptchaVerifier(auth, reCAPTCHAContainerId, { size: 'invisible' });
    return (await signInWithPhoneNumber(auth, phoneE164, phoneVerifier));
  },
  cancelPhoneSignIn() { if (phoneVerifier) { try { phoneVerifier.clear(); } catch { /* Already disposed. */ } phoneVerifier = null; } },
  confirmPhoneSignIn: async (confirmation, code) => (await confirmation.confirm(code)).user,
  resetRequest: async email => {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    return sendPasswordResetEmail(await getFirebaseAuthClient(), email, { url: `${window.location.origin}/login` });
  },
  reset: async (code, password) => {
    const { confirmPasswordReset } = await import('firebase/auth');
    return confirmPasswordReset(await getFirebaseAuthClient(), code, password);
  },
  resetInfo: async code => {
    const { verifyPasswordResetCode } = await import('firebase/auth');
    return verifyPasswordResetCode(await getFirebaseAuthClient(), code);
  },
  applyVerification: async code => {
    const { applyActionCode } = await import('firebase/auth');
    return applyActionCode(await getFirebaseAuthClient(), code);
  },
  async validatePassword(password) {
    const auth = await getFirebaseAuthClient();
    // Auth Emulator does not implement getPasswordPolicy. Its native password
    // admission still enforces the default minimum; never bypass live policy.
    if (auth.emulatorConfig) { if (password.length < 6) throw authFlowError('auth/weak-password'); return; }
    const { validatePassword } = await import('firebase/auth');
    const policy = await validatePassword(auth, password);
    if (!policy.isValid) { const error = authFlowError('auth/password-does-not-meet-requirements'); error.requirements = passwordRequirements(policy); throw error; }
  },
  logout: async () => {
    const { signOut } = await import('firebase/auth');
    return signOut(await getFirebaseAuthClient());
  },
};
export const firebaseAuth = createServerAuth({ request, identity, notify: notifySessionChange });
