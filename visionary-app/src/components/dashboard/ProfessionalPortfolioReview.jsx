import { professionalCopy } from '@/lib/professionalCopy';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { portfolioProjectVersion, portfolioReviewRevision, portfolioReviewCriteria, savePortfolioSelfReview, snapshot } from '@/services/workspaceService';
import { getPortfolioReviewDraft, savePortfolioReviewDraft, clearPortfolioReviewDraft } from '@/services/portfolioReviewDraft';
import { downloadText } from '@/lib/downloadText';
export default function ProfessionalPortfolioReview({
  ctx,
  artifact,
  onPrepare,
  onChange,
  locale = 'en'
}) {
  const t = professionalCopy(locale);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [backupError, setBackupError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [conflict, setConflict] = useState(false);
  const version = portfolioProjectVersion(artifact);
  const latest = artifact.portfolioReviews?.[0];
  const current = latest?.projectVersion === version;
  function savedArtifact() {
    const saved = snapshot(ctx).artifacts.find(item => item.id === artifact.id);
    if (!saved) throw Error('This portfolio project is unavailable in your workspace.');
    return saved;
  }
  function fromSaved(saved) {
    const projectVersion = portfolioProjectVersion(saved);
    const review = saved.portfolioReviews?.[0]?.projectVersion === projectVersion ? saved.portfolioReviews[0] : null;
    return {
      title: saved.title,
      body: review?.reflection || '',
      projectVersion,
      reviewRevision: portfolioReviewRevision(saved),
      ratings: Object.fromEntries(portfolioReviewCriteria.map(rule => [rule.id, review?.criteria.find(item => item.id === rule.id) || {
        id: rule.id,
        rating: '',
        note: ''
      }]))
    };
  }
  function openReview() {
    if (!onPrepare()) return;
    try {
      const saved = savedArtifact();
      let restored = null;
      setError('');
      setBackupError('');
      setBlocked(false);
      setConflict(false);
      try {
        restored = getPortfolioReviewDraft(ctx, artifact.id);
      } catch (failure) {
        setBackupError(failure.message);
        setBlocked(true);
      }
      setDraft(restored || fromSaved(saved));
      setRecovered(Boolean(restored));
      setConflict(Boolean(restored && (restored.projectVersion !== portfolioProjectVersion(saved) || restored.reviewRevision !== portfolioReviewRevision(saved))));
      setOpen(true);
    } catch (failure) {
      setError(failure.message);
    }
  }
  function change(next) {
    setDraft(next);
    setError('');
    if (blocked) return;
    try {
      savePortfolioReviewDraft(ctx, artifact.id, next);
      setBackupError('');
    } catch (failure) {
      setBackupError(failure.message);
    }
  }
  function loadLatest() {
    try {
      const saved = savedArtifact();
      clearPortfolioReviewDraft(ctx, artifact.id);
      setDraft(fromSaved(saved));
      setRecovered(false);
      setConflict(false);
      setError('');
      setBackupError('');
      setBlocked(false);
    } catch (failure) {
      setError(failure.message);
    }
  }
  function exportEdits() {
    try {
      downloadText('portfolio-self-review-edits.json', JSON.stringify(draft, null, 2), 'application/json');
      setError('');
    } catch (failure) {
      setError(failure.message);
    }
  }
  function save() {
    try {
      const saved = savePortfolioSelfReview(ctx, artifact.id, draft.projectVersion, portfolioReviewCriteria.map(rule => draft.ratings[rule.id]), draft.body, draft.reviewRevision);
      let message = 'Portfolio self-review saved. This is your own assessment, not verified skill evidence or a credential.';
      if (!blocked) {
        try {
          clearPortfolioReviewDraft(ctx, artifact.id);
        } catch {
          message += ' Its old editor backup could not be cleared and may appear again.';
        }
      } else message += ' The unreadable editor backup was retained.';
      onChange(saved, message);
      setOpen(false);
      setDraft(null);
    } catch (failure) {
      setError(failure.message);
      if (failure.name === 'PortfolioReviewConflictError') setConflict(true);
    }
  }
  return <section className="v-card" aria-labelledby="portfolio-review-title" lang={locale}>
  <h2 id="portfolio-review-title" className="text-lg font-medium">{t("Portfolio self-review")}</h2>
  <p className="v-muted mt-2">{t("Check how clearly this artifact explains its purpose, evidence and limits. Your ratings stay in this workspace and do not establish mastery.")}</p>
  <p className="v-muted mt-2">{t("Independent reviewer feedback and verified credentials are not connected. A self-review is not an employer endorsement.")}</p>
  {artifact.status !== 'completed' || !artifact.body.trim() ? <p className="v-notice mt-4">{t("Complete the project and add your work before reviewing it.")}</p> : <><p className="v-muted mt-3" role="status">{current ? `${t('Self-reviewed')} ${new Date(latest.reviewedAt).toLocaleDateString(locale)} · ${t('Current saved work')}` : latest ? t("Your last self-review is outdated after project changes.") : t("No self-review saved yet.")}</p><button className="v-button mt-4" onClick={openReview}>{current ? t("Review again") : t("Review this project")}</button></>}
  {!open && error && <p role="alert" lang="en" className="v-notice v-error mt-3">{error}</p>}
  {artifact.portfolioReviews?.length > 0 && <details className="mt-4"><summary className="cursor-pointer text-sm font-medium">{t("Saved self-review history")} ({artifact.portfolioReviews.length})</summary><p className="v-muted mt-3">{t("Up to ten saved self-reviews are retained in this workspace. These are your assessments of the saved work at that time.")}</p><ol className="mt-3 grid gap-3">{artifact.portfolioReviews.map((review, index) => <li key={`${review.reviewedAt}:${index}`} className="v-card"><details><summary className="cursor-pointer text-sm">{t("Self-review")} {artifact.portfolioReviews.length - index} · {new Date(review.reviewedAt).toLocaleDateString(locale)} · {review.projectVersion === version ? t("Matches current project") : t("Earlier project version")}</summary><dl className="mt-3 grid gap-3">{review.criteria.map(row => <div key={row.id}><dt className="text-sm font-medium">{t(portfolioReviewCriteria.find(rule => rule.id === row.id)?.label || row.id)} · {row.rating === 'supported' ? t("Supported by evidence") : row.rating === 'explained' ? t("Explained") : t("Needs more work")}</dt><dd className="v-muted mt-1 whitespace-pre-wrap break-words">{row.note}</dd></div>)}</dl><p className="mt-3 text-sm font-medium">{t("Next improvement")}</p><p className="v-muted mt-1 whitespace-pre-wrap break-words">{review.reflection}</p></details></li>)}</ol></details>}
  <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85dvh] overflow-y-auto bg-white" lang={locale}><DialogTitle>{t("Review your portfolio project")}</DialogTitle><DialogDescription>{t("Rate each criterion and point to evidence in your own work. Closing keeps backed-up edits on this device. This is a self-review; no teacher or model has evaluated it.")}</DialogDescription>
   {draft && <><p className="text-sm font-medium">{draft.title}</p>
    {recovered && <p className="v-notice" role="status">{t("Unsaved self-review recovered. Save it to add a review to this project.")}</p>}
    {backupError && <p className="v-notice v-error" role="alert"><span lang="en">{backupError}</span> {t("Keep this dialog open or export your current edits.")}</p>}
    {conflict && <p className="v-notice" role="status">{t("A newer project or self-review is saved. Your edits remain here. Export them before loading the latest review.")}</p>}
    <div className="flex flex-wrap gap-3"><button className="v-button" onClick={exportEdits}>{t("Export review edits")}</button><button className="v-button" onClick={loadLatest}>{t("Load latest review and discard edits")}</button></div>
    {portfolioReviewCriteria.map(rule => <fieldset className="v-card bg-white" key={rule.id}><legend className="text-sm font-medium">{t(rule.label)}</legend><p className="v-muted mt-2">{t(rule.prompt)}</p><label className="mt-3 block text-sm">{t("Your rating")}<select aria-label={`${t(rule.label)} ${t('rating')}`} className="v-field mt-2" value={draft.ratings[rule.id].rating} onChange={event => change({
                ...draft,
                ratings: {
                  ...draft.ratings,
                  [rule.id]: {
                    ...draft.ratings[rule.id],
                    rating: event.target.value
                  }
                }
              })}><option value="">{t("Choose a rating")}</option><option value="needs-work">{t("Needs more work")}</option><option value="explained">{t("Explained")}</option><option value="supported">{t("Supported by evidence")}</option></select></label><label className="mt-3 block text-sm">{t("Evidence note")}<textarea aria-label={`${t(rule.label)} ${t('evidence note')}`} className="v-field mt-2 min-h-24" maxLength={500} value={draft.ratings[rule.id].note} onChange={event => change({
                ...draft,
                ratings: {
                  ...draft.ratings,
                  [rule.id]: {
                    ...draft.ratings[rule.id],
                    note: event.target.value
                  }
                }
              })} placeholder={t("Point to a specific part of your document.")} /></label></fieldset>)}
    <label className="block text-sm">{t("What will you improve next?")}<textarea className="v-field mt-2 min-h-24" maxLength={1000} value={draft.body} onChange={event => change({
              ...draft,
              body: event.target.value
            })} /></label>
    {error && <p role="alert" lang="en" className="v-notice v-error">{error}</p>}<button className="v-button primary" disabled={conflict} onClick={save}>{t("Save self-review")}</button>
   </>}
  </DialogContent></Dialog>
 </section>;
}
