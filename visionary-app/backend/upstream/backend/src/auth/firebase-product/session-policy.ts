import { UnauthorizedException } from '@nestjs/common';

export const SESSION_ABSOLUTE_MS = 14 * 24 * 60 * 60 * 1000;
export const SESSION_IDLE_MS = 7 * 24 * 60 * 60 * 1000;
// This constant attests admission behavior compiled into this image. An
// environment variable cannot turn a legacy image into a safe rollback target.
export const AUTH_SESSION_POLICY_VERSION = 1;
export const globalLogoutEnabled = (value: unknown) => value === 'true';

// Missing fields are the pre-revocation schema. Malformed security state must
// never silently turn a revoked account back into that legacy schema.
export function accountSessionPolicy(account: any) {
  const version = account?.authSessionVersion;
  const cutoff = account?.lastGlobalSignOutSecond;
  if (version === undefined && cutoff === undefined) return { version: 0, cutoff: 0 };
  if (!Number.isSafeInteger(version) || version < 1 || !Number.isSafeInteger(cutoff) || cutoff < 1) {
    throw new UnauthorizedException('Your account session state needs recovery. Sign in again.');
  }
  return { version, cutoff };
}

export function sessionVersion(session: any): number {
  if (session?.authSessionVersion === undefined) return 0;
  if (!Number.isSafeInteger(session.authSessionVersion) || session.authSessionVersion < 0) return -1;
  return session.authSessionVersion;
}

export function sessionIsLive(session: any, now: number) {
  return Boolean(session && !session.revokedAt && Number.isFinite(session.expires) && session.expires > now &&
    Number.isFinite(session.lastSeen) && session.lastSeen <= now + 60000 && now - session.lastSeen < SESSION_IDLE_MS);
}
