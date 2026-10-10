/** A rejected lazy import needs a fresh document, not another render of the rejection. */
export function needsAssetReload(error) {
  return /Unable to preload CSS|Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk .+ failed/i.test(String(error?.message || ''));
}
