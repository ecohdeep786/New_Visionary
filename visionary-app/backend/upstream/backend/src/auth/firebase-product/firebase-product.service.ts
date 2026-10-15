import { Injectable, OnModuleDestroy, UnauthorizedException, ServiceUnavailableException, BadRequestException, HttpException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { onboardingProfile, publicProfile } from './profile';
import { BILLING_ACCOUNTS, freeBillingAccount } from '../../billing/billing-account';

const ABSOLUTE_MS = 8 * 60 * 60 * 1000;
const IDLE_MS = 30 * 60 * 1000;
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const invalidAuth = new Set(['auth/argument-error', 'auth/invalid-argument', 'auth/invalid-id-token', 'auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-session-cookie', 'auth/session-cookie-expired', 'auth/session-cookie-revoked', 'auth/user-disabled', 'auth/user-not-found']);
const assertAccountUid = (uid: unknown) => {
  if (typeof uid !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(uid) || /^__.*__$/.test(uid)) throw new UnauthorizedException('This identity needs a supported account identifier.');
};

@Injectable()
export class FirebaseProductService implements OnModuleDestroy {
  private firestore?: Firestore;
  constructor(private readonly admin: FirebaseAdminService, private readonly config: ConfigService) {}
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
    if (!identity.auth_time || now / 1000 - identity.auth_time > 300 || identity.auth_time > now / 1000 + 60) throw new UnauthorizedException('Sign in again before starting a session.');
    // Unverified identities cannot create a product profile or a product session.
    if (!identity.email || !identity.email_verified) throw new UnauthorizedException('Verify your email before continuing.');
    await this.rateLimit('session-uid', identity.uid, 10);
    const cookie = await this.verified(() => this.admin.getAuth().createSessionCookie(idToken, { expiresIn: ABSOLUTE_MS }));
    const device = randomBytes(32).toString('hex'), sessionId = digest(device);
    const profile = await this.database(async () => {
      const db = this.db(), account = db.collection('visionary_accounts').doc(identity.uid), session = db.collection('visionary_auth_sessions').doc(sessionId);
      return db.runTransaction(async tx => {
        const snapshot = await tx.get(account);
        const billingRef = db.collection(BILLING_ACCOUNTS).doc(identity.uid), billing = await tx.get(billingRef);
        const oldRef = previous && /^[a-f0-9]{64}$/.test(previous.device || '') ? db.collection('visionary_auth_sessions').doc(digest(previous.device)) : null;
        const old = oldRef ? (await tx.get(oldRef)).data() : null;
        const data = snapshot.exists ? snapshot.data() : { email: identity.email, full_name: identity.name || '', onboarding: { status: 'pending' }, version: 0, createdAt: Timestamp.fromMillis(now) };
        const refreshed = { ...data, email: identity.email, lastSignInAt: Timestamp.fromMillis(now) };
        if (billing.data()?.uid && billing.data().uid !== identity.uid) throw new ConflictException('Your billing identity needs recovery. No account changes were saved.');
        if (!billing.exists) tx.create(billingRef, freeBillingAccount(identity.uid, now));
        else if (!billing.data().uid || !billing.data().basePlan) tx.set(billingRef, { ...billing.data(), uid: identity.uid, basePlan: 'start', schemaVersion: 1 });
        tx.set(account, refreshed);
        if (old && old.uid === identity.uid && old.cookieHash === digest(previous.cookie || '') && !old.revokedAt) tx.update(oldRef, { revokedAt: Timestamp.fromMillis(now) });
        tx.create(session, { uid: identity.uid, cookieHash: digest(cookie), lastSeen: now, expires: now + ABSOLUTE_MS, expiresAt: Timestamp.fromMillis(now + ABSOLUTE_MS) });
        const event = db.collection('visionary_auth_events').doc();
        tx.create(event, { uid: identity.uid, sessionId, type: 'sign_in', firstAccountSignIn: !snapshot.exists, provider: identity.firebase?.sign_in_provider || 'unknown',
          ip: metadata.ip.slice(0, 64), userAgent: metadata.userAgent.slice(0, 512), createdAt: Timestamp.fromMillis(now) });
        return publicProfile(identity.uid, refreshed);
      });
    });
    return { cookie, device, profile, expiresIn: ABSOLUTE_MS };
  }
  async authenticate(cookie: string, device: string, touch = true) {
    if (!cookie || !/^[a-f0-9]{64}$/.test(device || '')) throw new UnauthorizedException('Sign in to continue.');
    const identity = await this.verified(() => this.admin.getAuth().verifySessionCookie(cookie, true));
    assertAccountUid(identity.uid);
    const sessionId = digest(device), now = Date.now();
    await this.database(async () => {
      const ref = this.db().collection('visionary_auth_sessions').doc(sessionId);
      await this.db().runTransaction(async tx => {
        const snapshot = await tx.get(ref), data = snapshot.data();
        if (!data || data.revokedAt || data.uid !== identity.uid || data.cookieHash !== digest(cookie) || data.expires <= now || !Number.isFinite(data.lastSeen) || now - data.lastSeen >= IDLE_MS) throw new UnauthorizedException('Your session ended. Sign in again.');
        if (touch) tx.update(ref, { lastSeen: now });
      });
    });
    return { uid: identity.uid, sessionId };
  }
  async me(uid: string) {
    return this.database(async () => {
      const account = await this.db().collection('visionary_accounts').doc(uid).get();
      if (!account.exists) throw new ConflictException('Your account profile is missing. Sign in again to recover it.');
      return publicProfile(uid, account.data());
    });
  }
  async completeOnboarding(uid: string, input: unknown) {
    const profile = onboardingProfile(input);
    return this.database(async () => {
      const ref = this.db().collection('visionary_accounts').doc(uid);
      return this.db().runTransaction(async tx => {
        const snapshot = await tx.get(ref), current = snapshot.data();
        if (!current) throw new ConflictException('Your account profile is missing. Sign in again.');
        // Repeated completion / another device cannot reset the first completed profile.
        if (current.onboarding?.status === 'complete') return publicProfile(uid, current);
        const updated = { ...current, profile, full_name: profile.full_name, version: (current.version || 0) + 1,
          onboarding: { status: 'complete', completedAt: Timestamp.now(), version: 2, introduction: { status: 'pending' } } };
        tx.set(ref, updated);
        return publicProfile(uid, updated);
      });
    });
  }
  async updateProfile(uid: string, input: any) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !['full_name', 'preferences', 'expectedProfileName', 'expectedThemeColor'].includes(k))) throw new BadRequestException('Only display name and account accent may be edited here.');
    if (input.full_name !== undefined && (typeof input.full_name !== 'string' || !input.full_name.trim() || input.full_name.trim().length > 80)) throw new BadRequestException('Enter a name of 1 to 80 characters.');
    const theme = input.preferences?.theme_color;
    if (input.preferences !== undefined && (!input.preferences || Object.keys(input.preferences).some(k => k !== 'theme_color') || !['blue', 'green', 'amber', 'red', 'purple', 'teal'].includes(theme))) throw new BadRequestException('Choose a supported account accent.');
    return this.database(async () => {
      const ref = this.db().collection('visionary_accounts').doc(uid);
      return this.db().runTransaction(async tx => {
        const snapshot = await tx.get(ref), current = snapshot.data();
        if (!current) throw new ConflictException('Your account profile is missing.');
        if (input.expectedProfileName !== undefined && (current.full_name || '') !== input.expectedProfileName) throw new ConflictException('Your display name changed. Load the saved name and retry.');
        if (input.expectedThemeColor !== undefined && (current.preferences?.theme_color || 'blue') !== input.expectedThemeColor) throw new ConflictException('Your account accent changed. Load the saved color and retry.');
        const updated: Record<string, any> = { ...current, version: (current.version || 0) + 1 };
        if (input.full_name !== undefined) { updated.full_name = input.full_name.trim(); updated.profile = { ...current.profile, full_name: updated.full_name }; }
        if (theme) updated.preferences = { ...current.preferences, theme_color: theme };
        tx.set(ref, updated); return publicProfile(uid, updated);
      });
    });
  }
  async completeIntroduction(uid: string, input: unknown) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new BadRequestException('Send an empty introduction acknowledgement.');
    return this.database(async () => {
      const ref = this.db().collection('visionary_accounts').doc(uid);
      return this.db().runTransaction(async tx => {
        const snapshot = await tx.get(ref), current = snapshot.data();
        if (!current || current.onboarding?.status !== 'complete') throw new ConflictException('Finish account setup before acknowledging the introduction.');
        if (current.onboarding?.introduction?.status !== 'pending') return publicProfile(uid, current);
        const updated = { ...current, version: (current.version || 0) + 1,
          onboarding: { ...current.onboarding, introduction: { status: 'complete', completedAt: Timestamp.now() } } };
        tx.set(ref, updated); return publicProfile(uid, updated);
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
          tx.update(ref, { revokedAt: Timestamp.now() });
          if (metadata) tx.create(this.db().collection('visionary_auth_events').doc(), { uid: snapshot.data().uid, sessionId: digest(device), type: 'sign_out', ip: metadata.ip.slice(0, 64), userAgent: metadata.userAgent.slice(0, 512), createdAt: Timestamp.now() });
        }
      });
    });
  }
  async onModuleDestroy() { if (this.firestore) await this.firestore.terminate(); }
}
