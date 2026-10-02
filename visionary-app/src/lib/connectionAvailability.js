/** Derived display/access state; never repairs or overwrites the stored record. */
export function connectionStatus(record, at = Date.now()) {
  if (!['pending', 'active'].includes(record.status) || record.expiresAt == null) return record.status;
  const expiry = typeof record.expiresAt === 'string' && record.expiresAt.trim()
    ? Date.parse(record.expiresAt) : NaN;
  if (!Number.isFinite(expiry)) return 'unavailable';
  return expiry <= Number(at) ? 'expired' : record.status;
}
