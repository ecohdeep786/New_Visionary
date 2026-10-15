const delay = (milliseconds, signal) => new Promise((resolve, reject) => {
  signal.throwIfAborted();
  const abort = () => { clearTimeout(timer); reject(signal.reason); };
  const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, milliseconds);
  signal.addEventListener('abort', abort, { once: true });
});

// Only safe reads retry automatically. Credential/session/profile writes remain explicit.
export function createAuthTransport({ fetchImpl = (...args) => fetch(...args), timeoutMs = 20000,
  getLocks = () => globalThis.navigator?.locks, pause = delay, basePath = '/api/auth', csrfBasePath = '/api/auth' } = {}) {
  let mutation = Promise.resolve();
  async function http(path, options, csrf, signal, csrfRead = false) {
    signal.throwIfAborted(); options.beforeSend?.();
    const response = await fetchImpl(`${csrfRead ? csrfBasePath : basePath}${path}`, { method: options.method || 'GET', credentials: 'same-origin', cache: 'no-store', signal,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...(options.accountId ? { 'X-Visionary-Account': options.accountId } : {}) },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}) });
    signal.throwIfAborted();
    let result;
    try { result = await response.json(); }
    catch { signal.throwIfAborted(); throw Object.assign(new Error('Account service returned an unreadable response.'), { status: response.ok ? 503 : response.status }); }
    signal.throwIfAborted();
    if (!response.ok) throw Object.assign(new Error(typeof result?.message === 'string' ? result.message : 'Account service is unavailable.'), { status: response.status });
    return result;
  }
  return function request(path, options = {}) {
    const controller = new AbortController(), signal = controller.signal;
    const timer = setTimeout(() => controller.abort(new DOMException('Account request timed out.', 'TimeoutError')), timeoutMs);
    const run = async () => {
      if (!options.method || options.method === 'GET') {
        try { return await http(path, options, null, signal); }
        catch (error) {
          if (signal.aborted || !(error instanceof TypeError || [502, 503, 504].includes(error.status))) throw error;
          await pause(120, signal); return http(path, options, null, signal);
        }
      }
      signal.throwIfAborted(); options.beforeSend?.();
      const csrf = await http('/csrf', { beforeSend: options.beforeSend }, null, signal, true);
      try { return await http(path, options, csrf.token, signal); }
      catch (error) {
        if (error.status !== 403 || error.message !== 'Reload this page before continuing.') throw error;
        const refreshed = await http('/csrf', { beforeSend: options.beforeSend }, null, signal, true);
        return http(path, options, refreshed.token, signal);
      }
    };
    const write = options.method && options.method !== 'GET';
    const serialized = () => getLocks() ? getLocks().request('visionary-auth-cookie', { signal }, run) : run();
    const result = write ? mutation.then(serialized, serialized) : run();
    if (write) mutation = result.catch(() => {});
    return result.finally(() => clearTimeout(timer));
  };
}
