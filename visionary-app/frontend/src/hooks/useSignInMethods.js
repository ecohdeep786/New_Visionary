import { useEffect, useState } from 'react';
import { appClient } from '@/api/appClient';
import { firebaseConfigFromEnvironment, firebaseEmulatorFromEnvironment } from '@/api/firebase/config';

export default function useSignInMethods() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    if (appClient.auth.source !== 'firebase') return;
    const controller = new AbortController();
    let supported = window.location.protocol === 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
    if (!supported) {
      try { supported = !!firebaseEmulatorFromEnvironment(import.meta.env, firebaseConfigFromEnvironment(import.meta.env)); }
      catch { supported = false; }
    }
    if (supported) fetch('/api/auth/methods', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then(methods => { if (!controller.signal.aborted) setPhone(methods?.phone === true); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return { phone };
}
