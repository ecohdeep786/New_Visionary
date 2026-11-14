import { previewSignIn } from '../../src/api/appClient.js';
import { bootstrapPerson } from '../../src/services/workspaceService.ts';

/**
 * FAP-93: authentication has no local mode and no credential store. Node tests
 * stand in for the connected server profile through the appClient preview seam
 * (production never imports it) and bootstrap the personal workspace through
 * the workspace service exactly as the connected profile would.
 */
const profiles = new Map();

/** Register a profile so tests can switch identities by person id. */
export function registerPreviewProfile(profile) {
  profiles.set(profile.id, profile);
  return profile;
}

/** Act as a registered account (the old session-token switch). Accepts the
 * person id or the profile object itself. */
export function signInAs(personOrProfile) {
  const id = typeof personOrProfile === 'object' ? personOrProfile?.id : personOrProfile;
  const profile = profiles.get(id);
  if (!profile) throw new Error(`No preview profile is registered for ${String(personOrProfile)}`);
  previewSignIn(profile);
  return profile;
}

/** Sign in a new account and create its personal workspace. The account stays
 * signed in afterwards, matching the old register → session semantics. */
export function previewAccount(profile) {
  bootstrapPerson(profile);
  registerPreviewProfile(profile);
  previewSignIn(profile);
  return profile;
}

/** Sign out the preview session (no local session record exists to clear). */
export function previewSignOut() {
  previewSignIn(null);
}

/** Clear the registry between tests; the entity store is reset separately. */
export function resetPreviewProfiles() {
  profiles.clear();
}
