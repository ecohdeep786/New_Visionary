// Product-owned entrypoints. Imported package defaults belong to the legacy app.
export function backendRuntimeArgs(action) {
  if (action === 'dev' || action === 'auth-dev') {
    return ['--watch', '-r', 'ts-node/register', 'src/main-auth.ts'];
  }
  if (action === 'start') return ['dist/src/main-auth.js'];
  return null;
}
