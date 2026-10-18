import { useEffect } from 'react';
import { homeCopy } from '@/lib/homeCopy';

export default function HomeFeedback({ message, onDismiss, locale = 'en' }) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => onDismiss(''), 6000);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);
  if (!message) return null;
  return <div className="v-home-feedback" lang={locale}><p role="status">{message}</p><button type="button" onClick={() => onDismiss('')}>{homeCopy(locale)('Dismiss')}</button></div>;
}
