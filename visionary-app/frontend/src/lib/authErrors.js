const messages = {
  'auth/invalid-credential': 'The email or password is incorrect. Try again or reset your password.',
  'auth/invalid-login-credentials': 'The email or password is incorrect. Try again or reset your password.',
  'auth/wrong-password': 'The email or password is incorrect. Try again or reset your password.',
  'auth/user-not-found': 'The email or password is incorrect. Try again or reset your password.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/email-already-in-use': 'An account already uses this email. Sign in or reset your password.',
  'auth/account-exists-with-different-credential': 'Use the sign-in method you previously used for this email. Your existing account is safe.',
  'auth/credential-already-in-use': 'This sign-in method belongs to an existing account. Sign in to that account to continue.',
  'auth/weak-password': 'Choose a stronger password that meets the requirements below.',
  'auth/password-does-not-meet-requirements': 'Choose a password that meets all the requirements below.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes before trying again.',
  'auth/network-request-failed': 'Check your internet connection and try again.',
  'auth/popup-blocked': 'Allow the sign-in pop-up in your browser, then try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled. You can try again when you are ready.',
  'auth/cancelled-popup-request': 'Another sign-in is already open. Finish it before trying again.',
  'auth/operation-not-allowed': 'This sign-in method is not available yet. Choose another method.',
  'auth/unauthorized-domain': 'Sign-in is not available for this website yet. Choose another method or try again later.',
  'auth/user-disabled': 'This account is unavailable. Contact support for help.',
  'auth/invalid-action-code': 'This link is invalid or has already been used. Request a new email.',
  'auth/expired-action-code': 'This link has expired. Request a new email.',
  'auth/requires-recent-login': 'Sign in again to continue securely.',
  'auth/email-not-verified': 'Open your email verification link, then return here to continue.',
  'auth/operation-in-progress': 'Please wait for the current request to finish.',
  'auth/account-changed': 'Your signed-in account changed. Reload the page before continuing.',
  'auth/verification-cooldown': 'Wait a minute before requesting another verification email.',
  'auth/invalid-verification-code': 'That code is not correct. Check the SMS and try again.',
  'auth/code-expired': 'That code expired. Send a new code and try again.',
  'auth/invalid-phone-number': 'Enter a valid mobile number, including the country code.',
  'auth/missing-verification-code': 'Enter the code from the SMS.',
  'auth/phone-sign-in-unavailable': 'Mobile sign-in is not available yet. Use email or another method for now.',
  'auth/no-pending-verification': 'Sign in again to continue verifying your email.',
  'auth/profile-unavailable': 'Your saved account could not be loaded. Try again; your setup is still saved.',
  'auth/guardian-required': 'A verified guardian setup is required before an under-18 workspace can be activated.',
  'auth/age-required': 'Choose your age range before continuing.',
};

// This is an allowlist: vendor messages, API bodies, tokens and stack traces never become UI copy.
export function authErrorMessage(error, fallback = 'We could not finish that request. Please try again.') {
  if (messages[error?.code]) return messages[error.code];
  if (error?.name === 'TypeError' || ['TimeoutError', 'AbortError'].includes(error?.name)) return 'Check your internet connection and try again.';
  if (error?.status === 429) return messages['auth/too-many-requests'];
  if (error?.status === 401) return 'Your session has ended. Sign in again to continue.';
  if (error?.status === 409) return messages['auth/account-changed'];
  if (error?.status === 403) return 'We could not confirm this request. Reload the page and try again.';
  if (error?.status >= 500 || error?.name === 'FirebaseConfigurationError') return 'Sign-in is temporarily unavailable. Please try again shortly.';
  return fallback;
}

export const isCredentialError = error => ['auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/wrong-password', 'auth/user-not-found'].includes(error?.code);
export const invalidEmailAction = error => ['auth/invalid-action-code', 'auth/expired-action-code'].includes(error?.code);
export const authFlowError = code => Object.assign(new Error(messages[code] || 'Please try again.'), { code });

export function passwordRequirements(policy) {
  if (!policy) return ['Use at least 6 characters.'];
  const rules = [];
  if (policy.meetsMinPasswordLength === false) rules.push(`Use at least ${policy.passwordPolicy?.customStrengthOptions?.minPasswordLength || 6} characters.`);
  if (policy.meetsMaxPasswordLength === false) rules.push(`Use at most ${policy.passwordPolicy?.customStrengthOptions?.maxPasswordLength || 4096} characters.`);
  if (policy.containsLowercaseLetter === false) rules.push('Include a lowercase letter.');
  if (policy.containsUppercaseLetter === false) rules.push('Include an uppercase letter.');
  if (policy.containsNumericCharacter === false) rules.push('Include a number.');
  if (policy.containsNonAlphanumericCharacter === false) rules.push('Include a symbol.');
  return rules;
}
