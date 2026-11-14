// This hint carries no account data; receivers recheck the server session.
export function openSessionChannel() {
  try { return typeof BroadcastChannel === 'function' ? new BroadcastChannel('visionary:server-session') : null; }
  catch { return null; }
}

export function notifySessionChange() {
  const channel = openSessionChannel();
  if (!channel) return;
  try { channel.postMessage('changed'); }
  catch { /* Focus and polling also recheck the session. */ }
  finally { channel.close(); }
}
