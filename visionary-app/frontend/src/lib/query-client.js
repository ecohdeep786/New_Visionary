/* Lazy query-layer owner. The query engine is not on the front-door critical
 * path: no public or auth surface uses react-query (verified 2026-11-16 —
 * only the dashboard subtree does), so the client is created from the lazy
 * dashboard chunk, keeping @tanstack out of the entry graph. AuthContext
 * clears the cache through resetQueryCache(), which awaits the same shared
 * instance — there is exactly one client per page load. */

let instance = null;

export function setQueryClient(client) {
  instance = client;
}

export function getQueryClient() {
  if (instance) return Promise.resolve(instance);
  return import('./queryClientSetup.js').then((m) => m.queryClientInstance);
}

export async function resetQueryCache() {
  const client = await getQueryClient();
  client.cancelQueries();
  client.clear();
}
