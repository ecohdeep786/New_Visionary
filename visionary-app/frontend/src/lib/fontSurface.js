// Product entry/loading/error surfaces use the same font as the workspace.
// New product screens should also declare data-font-surface="product".
const productEntryPaths = new Set([
  '/signin', '/login', '/register', '/forgot-password',
  '/forgot-user-id', '/reset-password', '/onboarding',
]);

export function fontSurfaceForPath(pathname) {
  return /^\/dashboard(?:\/|$)/.test(pathname) || productEntryPaths.has(pathname)
    ? 'product'
    : undefined;
}
