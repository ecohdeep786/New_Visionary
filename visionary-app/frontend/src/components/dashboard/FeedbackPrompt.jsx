import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { appClient } from '@/api/appClient';
import { createFeedbackClient } from '@/services/feedbackClient';
import { feedbackCopy } from '@/lib/feedbackCopy';
import '@/styles/feedback.css';

export default function FeedbackPrompt({ accountId, locale = 'en', surface = 'general' }) {
  const [open, setOpen] = useState(false), [rating, setRating] = useState(''), [comment, setComment] = useState('');
  const [sending, setSending] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState('');
  const attempt = useRef(null), busy = useRef(false), mounted = useRef(true), openedSurface = useRef(surface);
  const trigger = useRef(null), firstRating = useRef(null), returnFocus = useRef(false);
  const id = useId(), t = feedbackCopy(locale);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (open) firstRating.current?.focus(); else if (returnFocus.current) { returnFocus.current = false; trigger.current?.focus(); } }, [open]);
  const client = useMemo(() => createFeedbackClient({ getAccountId: () => appClient.auth.currentProfile?.()?.id === accountId ? accountId : null }), [accountId]);
  if (appClient.auth.source !== 'firebase') return null;
  function close() {
    returnFocus.current = true;
    setOpen(false); setRating(''); setComment(''); setError(''); setSaved(false); attempt.current = null;
  }
  async function submit(event) {
    event.preventDefault();
    if (busy.current || !rating) return;
    busy.current = true; setSending(true); setError('');
    try {
      // Keep the exact command after an ambiguous network failure. Explicit retry
      // gets the existing receipt even when the first response was lost.
      attempt.current ||= { version: 1, commandId: crypto.randomUUID(), surface: openedSurface.current, rating, comment, locale: ['en', 'hi', 'bn'].includes(locale) ? locale : 'en' };
      await client.submit(attempt.current);
      if (mounted.current) { setSaved(true); setComment(''); }
    } catch (cause) {
      if (mounted.current) setError(cause.status === 429 ? t.limited : cause.status === 409 || cause.status === 401 ? t.changed : t.failed);
    } finally { busy.current = false; if (mounted.current) setSending(false); }
  }
  return <aside className="v-feedback" lang={locale} aria-label={t.open}>
    {!open ? <button ref={trigger} type="button" className="v-feedback-trigger" aria-expanded="false" aria-controls={id} onClick={() => { openedSurface.current = surface; setOpen(true); }}><MessageSquare size={16} aria-hidden="true"/>{t.open}</button> :
      <div id={id} className="v-feedback-panel">
        {saved ? <><p role="status">{t.thanks}</p><button type="button" className="v-button" onClick={close}>{t.cancel}</button></> :
          <form onSubmit={submit} aria-busy={sending}>
            <fieldset disabled={sending || !!attempt.current}>
              <legend>{t.title}</legend>
              <div className="v-feedback-ratings">{[['good', t.good, ThumbsUp], ['needs_improvement', t.improve, ThumbsDown]].map(([value, label, Icon]) => <label key={value} className="v-feedback-rating"><input ref={value === 'good' ? firstRating : undefined} type="radio" name={id + '-rating'} value={value} checked={rating === value} onChange={() => setRating(value)} required/><Icon size={16} aria-hidden="true"/>{label}</label>)}</div>
              <label htmlFor={id + '-note'}>{t.note}</label>
              <textarea id={id + '-note'} value={comment} maxLength={1000} rows={3} onChange={event => setComment(event.target.value)} aria-describedby={id + '-privacy'}/>
            </fieldset>
            <p id={id + '-privacy'} className="v-muted">{t.privacy}</p>
            {error && <p className="v-notice v-error" role="alert">{error}</p>}
            <div className="v-feedback-actions"><button className="v-button v-button-primary" type="submit" disabled={!rating || sending}>{sending ? t.sending : attempt.current ? t.retry : t.send}</button><button className="v-button" type="button" disabled={sending} onClick={close}>{t.cancel}</button></div>
          </form>}
      </div>}
  </aside>;
}
