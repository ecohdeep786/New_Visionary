import { authFlowError } from '../../lib/authErrors.js';

// Client implementation inventory, not provider configuration or release approval.
// Firebase verifies identity; the backend still owns every product session.
export const signInMethods = Object.freeze({
  email: true,
  google: true,
  apple: false,
  microsoft: false,
  mobile: true, // UI availability also requires server flag and supported origin.
  organization: false,
});

const popupProviders = Object.freeze({ google: 'google.com' });

export function popupProviderId(name) {
  if (typeof name !== 'string' || !Object.hasOwn(popupProviders, name)) {
    throw authFlowError('auth/operation-not-allowed');
  }
  return popupProviders[name];
}
