/** A rejected lazy import needs a fresh document, not another render of the rejection. */
export function needsAssetReload(error) {
  return /Unable to preload CSS|Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk .+ failed/i.test(String(error?.message || ''));
}

/** Keep the attempt on this history entry across reloads without browser storage. */
export function recoverRouteAssets(error, browser = window) {
  if (!needsAssetReload(error) || browser.navigator.onLine === false) return false;
  const url = browser.location.href;
  const state = browser.history.state;
  if (state?.visionaryAssetRetry === url) return false;
  try {
    browser.history.replaceState({ ...state, visionaryAssetRetry: url }, '');
    browser.location.reload();
    return true;
  } catch {
    return false;
  }
}
