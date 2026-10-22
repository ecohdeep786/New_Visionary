import { Injectable, OnModuleDestroy, UnauthorizedException, ServiceUnavailableException, BadRequestException, HttpException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { onboardingProfile, publicProfile } from './profile';
import { freeBillingAccount } from '../../billing/billing-account';
import { ACCOUNT_STORAGE_VERSION, LEGACY_BILLING_ACCOUNTS, billingDocument, deviceDocument, deviceRecord, eventDocument, identitySnapshot } from './account-storage';
import { accountDirectory, directoryDocument, directoryNeedsUpdate } from './account-directory';
import { SESSION_ABSOLUTE_MS as ABSOLUTE_MS, accountSessionPolicy, sessionVersion, sessionIsLive, globalLogoutEnabled } from './session-policy';

// Durable device sign-in, bounded by Firebase's maximum session-cookie lifetime.
// Passwords/SDK refresh tokens are never used as a browser-side login cache.
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const invalidAuth = new Set(['auth/argument-error', 'auth/invalid-argument', 'auth/invalid-id-token', 'auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-session-cookie', 'auth/session-cookie-expired', 'auth/session-cookie-revoked', 'auth/user-disabled', 'auth/user-not-found']);
const assertAccountUid = (uid: unknown) => {
  if (typeof uid !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(uid) || /^__.*__$/.test(uid)) throw new UnauthorizedException('This identity needs a supported account identifier.');
};

@Injectable()
export class FirebaseProductService implements OnModuleDestroy {
  private firestore?: Firestore;
  constructor(private readonly admin: FirebaseAdminService, private readonly config: ConfigService) {}
  private profile(uid: string, data: Record<string, any>) {
    return { ...publicProfile(uid, data), auth_features: { global_sign_out: globalLogoutEnabled(this.config.get('AUTH_GLOBAL_LOGOUT_ENABLED')) } };
  }
  private db() {
    const kind = this.config.get('FIREBASE_PROJECT_KIND') || 'production';
    const emulator = process.env.FIRESTORE_EMULATOR_HOST;
    if (emulator && kind !== 'emulator') throw new ServiceUnavailableException('Live authentication cannot use a Firestore emulator.');
    if (kind === 'emulator') {
      const match = /^(?:localhost|127\.0\.0\.1|\[::1\]):(\d{1,5})$/.exec(emulator || '');
      if (!match || Number(match[1]) < 1 || Number(match[1]) > 65535) throw new ServiceUnavailableException('Firestore emulator mode requires an explicit loopback host; live fallback is prohibited.');
    }
    return this.firestore ||= getFirestore(this.admin.getAuth().app, this.config.get<string>('FIRESTORE_DATABASE_ID') || '(default)');
  }
  private async database<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); }
    catch (error) { if (error instanceof HttpException) throw error; throw new ServiceUnavailableException('Account storage is unavailable. Retry without changing your setup.'); }
  }
  getDatabase() { return this.db(); }
  private async verified(operation: () => Promise<any>) {
    try { return await operation(); }
    catch (error) { if (invalidAuth.has(error?.code)) throw new UnauthorizedException('Sign in again.'); throw new ServiceUnavailableException('Identity verification is unavailable. Please retry.'); }
  }
  async rateLimit(scope: string, subject: string, limit: number) {
    const secret = this.config.get<string>('AUTH_RATE_LIMIT_KEY');
    if (!secret || secret.length < 32) throw new ServiceUnavailableException('Authentication rate limiting is not configured.');
    const now = Date.now(), minute = Math.floor(now / 60000);
    const key = createHmac('sha256', secret).update(`${scope}:${subject}:${minute}`).digest('hex');
    await this.database(async () => {
      const ref = this.db().collection('visionary_auth_limits').doc(key);
      await this.db().runTransaction(async tx => {
        const current = await tx.get(ref), count = current.data()?.count || 0;
        if (count >= limit) throw new HttpException('Too many authentication requests. Wait a minute and retry.', 429);
        tx.set(ref, { count: count + 1, expiresAt: Timestamp.fromMillis((minute + 2) * 60000) });
      });
    });
  }
  async signIn(idToken: unknown, metadata: { ip: string; userAgent: string }, previous?: { cookie: string; device: string }) {
    if (typeof idToken !== 'string' || idToken.length > 12000) throw new BadRequestException('An identity token is required.');
    const identity = await this.verified(() => this.admin.getAuth().verifyIdToken(idToken, true));
    assertAccountUid(identity.uid);
    const now = Date.now();
    if (!Number.isSafeInteger(identity.auth_time) || identity.auth_time < 1 || now / 1000 - identity.auth_time > 300 || identity.auth_time > Math.floor(now / 1000)) throw new UnauthorizedException('Wait a moment, then sign in again before starting a session.');
    // Unverified identities cannot create a product profile or a product session.
    if (!identity.email || !identity.email_verified) throw new UnauthorizedException('Verify your email before continuing.');
    // Old signed tokens must not consume a newly authenticated device's budget.
    // The commit transaction repeats this check to close concurrent sign-out.
    const admissionPolicy = await this.database(async () => accountSessionPolicy((await this.db().collection('visionary_accounts').doc(identity.uid).get()).data()));
    if (admissionPolicy.cutoff && identity.auth_time <= admissionPolicy.cutoff) throw new UnauthorizedException('Your devices were signed out. Wait a moment, then sign in again.');
    await this.rateLimit('session-uid', identity.uid, 10);
    const cookie = await this.verified(() => this.admin.getAuth().createSessionCookie(idToken, { expiresIn: ABSOLUTE_MS }));
    const device = randomBytes(32).toString('hex'), sessionId = digest(device);
    const profile = await this.database(async () => {
      const db = this.db(), account = db.collection('visionary_accounts').doc(identity.uid), session = db.collection('visionary_auth_sessions').doc(sessionId);
      return db.runTransaction(async tx => {
        const snapshot = await tx.get(account);
        const directoryRef = directoryDocument(db, identity.uid), directory = await tx.get(directoryRef);
        let updateDirectory: boolean;
        try { updateDirectory = directoryNeedsUpdate(identity.uid, directory.data()); }
        catch { throw new ConflictException('Your account structure needs recovery. Your saved records are retained.'); }
        if (snapshot.data()?.uid && snapshot.data().uid !== identity.uid) throw new ConflictException('Your account identity needs recovery.');
        const billingRef = billingDocument(db, identity.uid), billing = await tx.get(billingRef);
        const legacy = !billing.exists ? await tx.get(db.collection(LEGACY_BILLING_ACCOUNTS).doc(identity.uid)) : null;
        const oldRef = previous && /^[a-f0-9]{64}$/.test(previous.device || '') ? db.collection('visionary_auth_sessions').doc(digest(previous.device)) : null;
        const old = oldRef ? (await tx.get(oldRef)).data() : null;
        const oldDevice = old?.uid === identity.uid ? (await tx.get(deviceDocument(db, identity.uid, digest(previous.device)))).data() : null;
        if (legacy?.exists || snapshot.data()?.storageMigration?.status === 'copying') throw new ServiceUnavailableException('Your account storage upgrade must finish before sign-in. Your saved details are retained.');
        const data = snapshot.exists ? snapshot.data() : { email: identity.email, full_name: identity.name || '', onboarding: { status: 'pending' }, version: 0, createdAt: Timestamp.fromMillis(now) };
        const policy = accountSessionPolicy(data);
        // Firebase auth_time has second precision. A sign-in in the same second
        // must be repeated after that second; refreshing an old token is not login.
        if (policy.cutoff && identity.auth_time <= policy.cutoff) throw new UnauthorizedException('Your devices were signed out. Wait a moment, then sign in again.');
        const refreshed = { ...data, uid: identity.uid, storageVersion: ACCOUNT_STORAGE_VERSION, identity: { ...data.identity, ...identitySnapshot(identity.uid, identity, now) }, email: identity.email, lastSignInAt: Timestamp.fromMillis(now) };
        if (billing.data()?.uid && billing.data().uid !== identity.uid) throw new ConflictException('Your billing identity needs recovery. No account changes were saved.');
        if (!billing.exists) tx.create(billingRef, freeBillingAccount(identity.uid, now));
        else if (!billing.data().uid || !billing.data().basePlan) tx.set(billingRef, { ...billing.data(), uid: identity.uid, basePlan: 'start', schemaVersion: 1 });
        tx.set(account, refreshed);
        if (updateDirectory) tx.set(directoryRef, accountDirectory(identity.uid));
        if (old && old.uid === identity.uid && old.cookieHash === digest(previous.cookie || '') && !old.revokedAt) {
          const revoked = { ...old, revokedAt: Timestamp.fromMillis(now) };
          tx.update(oldRef, { revokedAt: revoked.revokedAt });
          tx.set(deviceDocument(db, identity.uid, digest(previous.device)), deviceRecord(identity.uid, digest(previous.device), revoked, oldDevice));
        }
        const sessionData = { uid: identity.uid, authSessionVersion: policy.version, cookieHash: digest(cookie), lastSeen: now, createdAt: Timestamp.fromMillis(now), expires: now + ABSOLUTE_MS, expiresAt: Timestamp.fromMillis(now + ABSOLUTE_MS), provider: identity.firebase?.sign_in_provider || 'unknown', ip: metadata.ip.slice(0, 64), userAgent: metadata.userAgent.slice(0, 512) };
        tx.create(session, sessionData);
        tx.create(deviceDocument(db, identity.uid, sessionId), deviceRecord(identity.uid, sessionId, sessionData));
        const event = db.collection('visionary_auth_events').doc();
        const eventData = { uid: identity.uid, sessionId, type: 'sign_in', firstAccountSignIn: !snapshot.exists, provider: identity.firebase?.sign_in_provider || 'unknown',
          ip: metadata.ip.slice(0, 64), userAgent: metadata.userAgent.slice(0, 512), createdAt: Timestamp.fromMillis(now) };
        tx.create(event, eventData);
        tx.create(eventDocument(db, identity.uid, event.id.split('/').at(-1)), eventData);
        return this.profile(identity.uid, refreshed);
      });
    });
    return { cookie, device, profile, expiresIn: ABSOLUTE_MS };
  }
  async authenticate(cookie: string, device: string, touch = true) {
    if (!cookie || !/^[a-f0-9]{64}$/.test(device || '')) throw new UnauthorizedException('Sign in to continue.');
    const identity = await this.verified(() => this.admin.getAuth().verifySessionCookie(cookie, true));
    assertAccountUid(identity.uid);
    const sessionId = digest(device), now = Date.now();
    const authSessionVersion = await this.database(async () => {
      const ref = this.db().collection('visionary_auth_sessions').doc(sessionId);
      return this.db().runTransaction(async tx => {
        const snapshot = await tx.get(ref), data = snapshot.data();
        const account = await tx.get(this.db().collection('visionary_accounts').doc(identity.uid));
        const deviceRef = deviceDocument(this.db(), identity.uid, sessionId), savedDevice = touch ? (await tx.get(deviceRef)).data() : null;
        if (account.data()?.storageMigration?.status === 'copying') throw new ServiceUnavailableException('Your account storage upgrade is in progress.');
        const policy = accountSessionPolicy(account.data());
        if (!account.exists || !sessionIsLive(data, now) || data.uid !== identity.uid || data.cookieHash !== digest(cookie) || sessionVersion(data) !== policy.version) throw new UnauthorizedException('Your session ended. Sign in again.');
        if (touch) {
          tx.update(ref, { lastSeen: now });
          tx.set(deviceRef, deviceRecord(identity.uid, sessionId, { ...data, lastSeen: now }, savedDevice));
        }
        return policy.version;
      });
    });
    return { uid: identity.uid, sessionId, authSessionVersion };
  }
  async me(uid: string) {
    return this.database(async () => {
      const account = await this.db().collection('visionary_accounts').doc(uid).get();
      if (!account.exists) throw new ConflictException('Your account profile is missing. Sign in again to recover it.');
      return this.profile(uid, account.data());
    });
  }
  async accountDetails(uid: string) {
    return this.database(async () => {
      const snapshot = await this.db().collection('visionary_accounts').doc(uid).get();
      if (!snapshot.exists) throw new ConflictException('Your account profile is missing.');
      const data = snapshot.data(), identity = data.identity || {}, onboarding = data.onboarding || {};
      if (data.uid && data.uid !== uid) throw new ConflictException('Your account identity needs recovery.');
      const iso = (value: any) => value?.toDate?.().toISOString() || null;
      return { profile: this.profile(uid, data),
        identity: { uid, email: data.email || '', emailVerified: typeof identity.emailVerified === 'boolean' ? identity.emailVerified : null,
          displayName: identity.displayName || null, phoneNumber: identity.phoneNumber || null, photoURL: identity.photoURL || null,
          provider: identity.provider || null, providerIds: identity.providerIds || [], createdAt: iso(data.createdAt), lastSignInAt: iso(data.lastSignInAt), lastVerifiedAt: iso(identity.lastVerifiedAt) },
        onboarding: { status: onboarding.status || 'pending', version: onboarding.version || null, completedAt: iso(onboarding.completedAt),
          introduction: { status: onboarding.introduction?.status || 'pending', completedAt: iso(onboarding.introduction?.completedAt) } } };
    });
  }
  async completeOnboarding(uid: string, input: unknown, expectedSessionVersion?: number) {
    const profile = onboardingProfile(input);
    return this.database(async () => {
      const ref = this.db().collection('visionary_accounts').doc(uid);
      return this.db().runTransaction(async tx => {
        const snapshot = await tx.get(ref), current = snapshot.data();
        if (expectedSessionVersion !== undefined && accountSessionPolicy(current).version !== expectedSessionVersion) throw new UnauthorizedException('Your session ended. Sign in again.');
        if (!current) throw new ConflictException('Your account profile is missing. Sign in again.');
        // Repeated completion / another device cannot reset the first completed profile.
        if (current.onboarding?.status === 'complete') return this.profile(uid, current);
        const updated = { ...current, profile, full_name: profile.full_name, version: (current.version || 0) + 1,
          onboarding: { status: 'complete', completedAt: Timestamp.now(), version: 2, introduction: { status: 'pending' } } };
        tx.set(ref, updated);
        return this.profile(uid, updated);
      });
    });
  }
  async updateProfile(uid: string, input: any, expectedSessionVersion?: number) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !['full_name', 'preferences', 'expectedProfileName', 'expectedThemeColor'].includes(k))) throw new BadRequestException('Only display name and account accent may be edited here.');
    if (input.full_name !== undefined && (typeof input.full_name !== 'string' || !input.full_name.trim() || input.full_name.trim().length > 80)) throw new BadRequestException('Enter a name of 1 to 80 characters.');
    const theme = input.preferences?.theme_color;
    if (input.preferences !== undefined && (!input.preferences || Object.keys(input.preferences).some(k => k !== 'theme_color') || !['blue', 'green', 'amber', 'red', 'purple', 'teal'].includes(theme))) throw new BadRequestException('Choose a supported account accent.');
    return this.database(async () => {
      const ref = this.db().collection('visionary_accounts').doc(uid);
      return this.db().runTransaction(async tx => {
        const snapshot = await tx.get(ref), current = snapshot.data();
        if (expectedSessionVersion !== undefined && accountSessionPolicy(current).version !== expectedSessionVersion) throw new UnauthorizedException('Your session ended. Sign in again.');
        if (!current) throw new ConflictException('Your account profile is missing.');
        if (input.expectedProfileName !== undefined && (current.full_name || '') !== input.expectedProfileName) throw new ConflictException('Your display name changed. Load the saved name and retry.');
        if (input.expectedThemeColor !== undefined && (current.preferences?.theme_color || 'blue') !== input.expectedThemeColor) throw new ConflictException('Your account accent changed. Load the saved color and retry.');
        const updated: Record<string, any> = { ...current, version: (current.version || 0) + 1 };
        if (input.full_name !== undefined) { updated.full_name = input.full_name.trim(); updated.profile = { ...current.profile, full_name: updated.full_name }; }
        if (theme) updated.preferences = { ...current.preferences, theme_color: theme };
        tx.set(ref, updated); return this.profile(uid, updated);
      });
    });
  }
  async completeIntroduction(uid: string, input: unknown, expectedSessionVersion?: number) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new BadRequestException('Send an empty introduction acknowledgement.');
    return this.database(async () => {
      const ref = this.db().collection('visionary_accounts').doc(uid);
      return this.db().runTransaction(async tx => {
        const snapshot = await tx.get(ref), current = snapshot.data();
        if (expectedSessionVersion !== undefined && accountSessionPolicy(current).version !== expectedSessionVersion) throw new UnauthorizedException('Your session ended. Sign in again.');
        if (!current || current.onboarding?.status !== 'complete') throw new ConflictException('Finish account setup before acknowledging the introduction.');
        if (current.onboarding?.introduction?.status !== 'pending') return this.profile(uid, current);
        const updated = { ...current, version: (current.version || 0) + 1,
          onboarding: { ...current.onboarding, introduction: { status: 'complete', completedAt: Timestamp.now() } } };
        tx.set(ref, updated); return this.profile(uid, updated);
      });
    });
  }
  async logoutAll(cookie: string, device: string, expectedUid: string, metadata: { ip: string; userAgent: string }) {
    // Roll out admission compatibility before permitting durable revocations.
    // Disabling the action never disables epoch/cutoff enforcement.
    if (!globalLogoutEnabled(this.config.get('AUTH_GLOBAL_LOGOUT_ENABLED'))) throw new ServiceUnavailableException('Sign out on all devices is temporarily unavailable. Please try again later.');
    if (!cookie || !/^[a-f0-9]{64}$/.test(device || '')) throw new UnauthorizedException('Sign in to continue.');
    const identity = await this.verified(() => this.admin.getAuth().verifySessionCookie(cookie, true));
    assertAccountUid(identity.uid);
    if (expectedUid !== identity.uid) throw new ConflictException('The signed-in account changed. Reload before signing out.');
    await this.database(async () => {
      const saved = (await this.db().collection('visionary_auth_sessions').doc(digest(device)).get()).data();
      if (!saved || saved.uid !== identity.uid || saved.cookieHash !== digest(cookie)) throw new UnauthorizedException('Sign in again.');
    });
    // Retired devices cannot exhaust a fresh device's sign-out budget.
    await this.rateLimit('logout-all-session', `${identity.uid}:${digest(device)}`, 5);
    await this.database(async () => {
      const db = this.db(), id = digest(device), accountRef = db.collection('visionary_accounts').doc(identity.uid);
      const sessionRef = db.collection('visionary_auth_sessions').doc(id), deviceRef = deviceDocument(db, identity.uid, id);
      await db.runTransaction(async tx => {
        const account = await tx.get(accountRef), session = (await tx.get(sessionRef)).data(), savedDevice = (await tx.get(deviceRef)).data();
        const policy = accountSessionPolicy(account.data()), now = Date.now();
        if (!account.exists || !session || session.uid !== identity.uid || session.cookieHash !== digest(cookie)) throw new UnauthorizedException('Sign in again.');
        // Lost-response retries only acknowledge this session's prior operation.
        // They must never revoke a later sign-in with a newer epoch.
        if (session.revokedAt && Number.isSafeInteger(session.globalSignOutVersion) && session.globalSignOutVersion > 0 && session.globalSignOutVersion <= policy.version) return;
        if (!sessionIsLive(session, now) || sessionVersion(session) !== policy.version || policy.version >= Number.MAX_SAFE_INTEGER) throw new UnauthorizedException('Your session ended. Sign in again.');
        const nextVersion = policy.version + 1, revokedAt = Timestamp.fromMillis(now);
        tx.update(accountRef, { authSessionVersion: nextVersion, lastGlobalSignOutSecond: Math.max(policy.cutoff, Math.floor(now / 1000)) });
        const revoked = { ...session, revokedAt, globalSignOutVersion: nextVersion };
        tx.update(sessionRef, { revokedAt, globalSignOutVersion: nextVersion });
        tx.set(deviceRef, deviceRecord(identity.uid, id, revoked, savedDevice));
        const event = db.collection('visionary_auth_events').doc();
        const data = { uid: identity.uid, sessionId: id, type: 'sign_out_all', ip: metadata.ip.slice(0, 64), userAgent: metadata.userAgent.slice(0, 512), createdAt: revokedAt };
        tx.create(event, data); tx.create(eventDocument(db, identity.uid, event.id.split('/').at(-1)), data);
      });
    });
  }
  async logout(device: string, expectedUid?: string, cookie?: string, metadata?: { ip: string; userAgent: string }) {
    if (!/^[a-f0-9]{64}$/.test(device || '')) return;
    await this.database(async () => {
      const ref = this.db().collection('visionary_auth_sessions').doc(digest(device));
      await this.db().runTransaction(async tx => {
        const snapshot = await tx.get(ref);
        if (snapshot.exists && (expectedUid ? snapshot.data().uid !== expectedUid : !cookie || snapshot.data().cookieHash !== digest(cookie))) throw new ConflictException('The signed-in account changed. Reload before signing out.');
        if (snapshot.exists && !snapshot.data().revokedAt) {
          const savedDevice = (await tx.get(deviceDocument(this.db(), snapshot.data().uid, digest(device)))).data();
          const revoked: any = { ...snapshot.data(), revokedAt: Timestamp.now() };
          tx.update(ref, { revokedAt: revoked.revokedAt });
          tx.set(deviceDocument(this.db(), revoked.uid, digest(device)), deviceRecord(revoked.uid, digest(device), revoked, savedDevice));
          if (metadata) {
            const event = this.db().collection('visionary_auth_events').doc();
            const data = { uid: revoked.uid, sessionId: digest(device), type: 'sign_out', ip: metadata.ip.slice(0, 64), userAgent: metadata.userAgent.slice(0, 512), createdAt: revoked.revokedAt };
            tx.create(event, data); tx.create(eventDocument(this.db(), revoked.uid, event.id.split('/').at(-1)), data);
          }
        }
      });
    });
  }
  async onModuleDestroy() { if (this.firestore) await this.firestore.terminate(); }
}
