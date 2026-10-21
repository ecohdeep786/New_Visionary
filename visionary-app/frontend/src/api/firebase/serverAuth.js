import { authFlowError } from '../../lib/authErrors.js';
import { popupProviderId } from './signInMethods.js';

// Server identity and profile are authoritative; credentials are never persisted here.
export function createServerAuth({ request, identity, notify = () => {} }) {
  let profile = null, generation = 0, readSequence = 0, signingIn = false, pendingRead = null;
  const check = expected => { if (generation !== expected) throw authFlowError('auth/account-changed'); };
  const save = (value, expected) => {
    check(expected);
    if (!value || typeof value.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value.id) || typeof value.onboarding_complete !== 'boolean') {
      throw Object.assign(authFlowError('auth/profile-unavailable'), { status: 503 });
    }
    profile = value; ++readSequence; return value;
  };
  const transition = async action => {
    if (signingIn) throw authFlowError('auth/operation-in-progress');
    signingIn = true;
    const expected = ++generation;
    profile = null;
    try { return await action(expected); }
    finally {
      if (generation !== expected) await Promise.resolve(identity.logout?.()).catch(() => {});
      signingIn = false;
    }
  };
  const exchange = async (user, expected) => {
    check(expected);
    if (!user.emailVerified) throw authFlowError('auth/email-not-verified');
    const idToken = await user.getIdToken(true);
    check(expected);
    const value = await request('/session', { method: 'POST', body: { idToken }, beforeSend: () => check(expected) });
    if (user.uid && value?.id !== user.uid) throw Object.assign(authFlowError('auth/profile-unavailable'), { status: 503 });
    const saved = save(value, expected); notify(); return saved;
  };
  return {
    source: 'firebase',
    currentProfile: () => profile,
    me() {
      if (pendingRead?.generation === generation && pendingRead.sequence === readSequence) return pendingRead.promise;
      const expected = generation, sequence = ++readSequence;
      const promise = (async () => {
      try {
        const value = await request('/me'); check(expected);
        if (sequence !== readSequence) throw authFlowError('auth/account-changed');
        return save(value, expected);
      } catch (error) { if (generation === expected && sequence === readSequence) profile = null; throw error; }
      })();
      pendingRead = { generation, sequence, promise };
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
    async logout() {
      const previous = profile, expected = ++generation;
      profile = null;
      try { await request('/logout', { method: 'POST', accountId: previous?.id, beforeSend: () => check(expected) }); }
      catch (error) { if (generation === expected) profile = previous; throw error; }
      ++generation; profile = null; notify();
      await identity.logout();
    },
  };
}
