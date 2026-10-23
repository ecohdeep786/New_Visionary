import { authFlowError } from '../../lib/authErrors.js';
import { popupProviderId } from './signInMethods.js';

// Server identity and profile are authoritative; credentials are never persisted here.
export function createServerAuth({ request, identity, notify = () => {} }) {
  let profile = null, generation = 0, readSequence = 0, signingIn = null, pendingRead = null, pendingLogout = null, pendingLogoutAll = false;
  const check = expected => { if (generation !== expected) throw authFlowError('auth/account-changed'); };
  const save = (value, expected) => {
    check(expected);
    if (!value || typeof value.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value.id) || typeof value.onboarding_complete !== 'boolean') {
      throw Object.assign(authFlowError('auth/profile-unavailable'), { status: 503 });
    }
    profile = value; ++readSequence; return value;
  };
  const transition = async (action, kind = 'identity') => {
    if (signingIn || pendingLogout) throw authFlowError('auth/operation-in-progress');
    const expected = ++generation;
    let rejectCancelled;
    const cancelled = new Promise((_, reject) => { rejectCancelled = reject; });
    const operation = { kind, cancel: rejectCancelled };
    signingIn = operation;
    profile = null;
    try { return await Promise.race([action(expected), cancelled]); }
    finally {
      // A disposed reCAPTCHA may never settle its SDK promise. Cancellation
      // releases only its own operation; a stale finally cannot unlock or sign
      // out a newer identity. Late work still fails the generation checks.
      if (signingIn === operation) {
        if (generation !== expected) await Promise.resolve(identity.logout?.()).catch(() => {});
        signingIn = null;
      }
    }
  };
  const exchange = async (user, expected) => {
    check(expected);
    // Phone identities are verified by SMS inside Firebase; email identities
    // must be verified by email before the server mints a product session.
    const phoneVerified = !!(user?.phoneNumber || user?.providerData?.[0]?.providerId === 'phone');
    if (!user.emailVerified && !phoneVerified) throw authFlowError('auth/email-not-verified');
    const idToken = await user.getIdToken(true);
    check(expected);
    const value = await request('/session', { method: 'POST', body: { idToken }, beforeSend: () => check(expected) });
    if (user.uid && value?.id !== user.uid) throw Object.assign(authFlowError('auth/profile-unavailable'), { status: 503 });
    const saved = save(value, expected); notify(); return saved;
  };
  return {
    source: 'firebase',
    currentProfile: () => profile,
    me({ passive = false } = {}) {
      if (pendingRead?.generation === generation && pendingRead.sequence === readSequence && pendingRead.passive === passive) return pendingRead.promise;
      const expected = generation, sequence = ++readSequence;
      const promise = (async () => {
      try {
        const value = await request(passive ? '/me?passive=1' : '/me'); check(expected);
        if (sequence !== readSequence) throw authFlowError('auth/account-changed');
        return save(value, expected);
      } catch (error) { if (generation === expected && sequence === readSequence && (!passive || error.status === 401)) profile = null; throw error; }
      })();
      pendingRead = { generation, sequence, passive, promise };
      const clear = () => { if (pendingRead?.promise === promise) pendingRead = null; };
      promise.then(clear, clear); return promise;
    },
    loginViaEmailPassword: (email, password) => transition(async expected => exchange(await identity.login(email.trim(), password), expected)),
    register: ({ email, password }) => transition(async expected => {
      await identity.validatePassword?.(password); check(expected);
      const user = await identity.register(email.trim(), password); check(expected);
      try { await identity.sendVerification(user); }
      catch (error) { error.registrationCreated = true; throw error; }
      return { verification: 'email-link' };
    }),
    verifyEmail: () => transition(async expected => {
      const user = await identity.reloadCurrent(); check(expected);
      if (!user) throw authFlowError('auth/no-pending-verification');
      return exchange(user, expected);
    }),
    async resendVerification() {
      const user = await identity.current();
      if (!user) throw authFlowError('auth/no-pending-verification');
      await identity.sendVerification(user);
    },
    async loginWithProvider(provider) {
      // Reject unsupported methods before clearing profile or invoking the SDK.
      popupProviderId(provider);
      return transition(async expected => exchange(await identity.provider(provider), expected));
    },
    // Phone sign-in across two steps: requestPhoneSignIn sends the SMS code and
    // returns the pending confirmation; confirmPhoneSignIn verifies the code and
    // exchanges the SMS-verified identity for a server session. Backend verified
    // claims and availability policy remain authoritative for admission.
    requestPhoneSignIn: (phone, verifierId) => transition(async expected => {
      const confirmation = await identity.beginPhoneSignIn(phone, verifierId);
      check(expected);
      return { verification: 'phone-sms', confirmation };
    }, 'phone'),
    cancelPhoneSignIn() {
      if (signingIn?.kind === 'phone') {
        const operation = signingIn;
        ++generation; profile = null; signingIn = null;
        operation.cancel(authFlowError('auth/account-changed'));
      }
      identity.cancelPhoneSignIn?.();
    },
    confirmPhoneSignIn: (confirmation, code) => transition(async expected => {
      if (!confirmation) throw authFlowError('auth/no-pending-verification');
      const user = await identity.confirmPhoneSignIn(confirmation, code); check(expected);
      try { return await exchange(user, expected); }
      catch (error) {
        if (error?.status === 401 || error?.status === 403) throw authFlowError('auth/phone-sign-in-unavailable');
        throw error;
      }
    }, 'phone'),
    async completeOnboarding(data) {
      const expected = generation, accountId = profile?.id;
      if (!accountId) throw authFlowError('auth/profile-unavailable');
      return save(await request('/onboarding', { method: 'POST', body: data, accountId, beforeSend: () => check(expected) }), expected);
    },
    async updateMe(updates, options = {}) {
      const expected = generation, accountId = profile?.id;
      if (!accountId || options.expectedUserId !== undefined && accountId !== options.expectedUserId) throw authFlowError('auth/account-changed');
      const body = { ...updates };
      for (const key of ['expectedProfileName', 'expectedThemeColor']) if (options[key] !== undefined) body[key] = options[key];
      return save(await request('/profile', { method: 'PATCH', body, accountId, beforeSend: () => check(expected) }), expected);
    },
    async completeIntroduction() {
      const expected = generation, accountId = profile?.id;
      if (!accountId) throw authFlowError('auth/profile-unavailable');
      return save(await request('/onboarding/introduction', { method: 'POST', body: {}, accountId, beforeSend: () => check(expected) }), expected);
    },
    resetPasswordRequest: email => identity.resetRequest(email.trim()),
    verifyResetLink: code => identity.resetInfo(code),
    applyEmailVerification: code => identity.applyVerification(code),
    async resetPassword({ resetToken, newPassword }) {
      await identity.validatePassword?.(newPassword);
      await identity.reset(resetToken, newPassword);
      // Reset does not sign the person in or erase profile data.
      try { await request('/logout', { method: 'POST', accountId: profile?.id }); }
      catch (error) { error.resetCompleted = true; throw error; }
      ++generation; profile = null;
      await identity.logout?.(); notify();
    },
    logout({ allDevices = false } = {}) {
      if (pendingLogout) return pendingLogoutAll === allDevices ? pendingLogout : Promise.reject(authFlowError('auth/operation-in-progress'));
      const previous = profile, expected = ++generation;
      profile = null;
      const promise = (async () => {
      try { await request(allDevices ? '/logout-all' : '/logout', { method: 'POST', accountId: previous?.id, beforeSend: () => check(expected) }); }
      catch (error) { if (generation === expected) profile = previous; throw error; }
      ++generation; profile = null; notify();
      // Server revocation has succeeded. SDK cleanup cannot restore that session.
      await Promise.resolve(identity.logout()).catch(() => {});
      })();
      pendingLogout = promise; pendingLogoutAll = allDevices;
      const clear = () => { if (pendingLogout === promise) pendingLogout = null; };
      promise.then(clear, clear); return promise;
    },
  };
}
