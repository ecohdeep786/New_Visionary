import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { portfolioProjectVersion, portfolioReviewCriteria, savePortfolioSelfReview } from '@/services/workspaceService';

export default function ProfessionalPortfolioReview({ ctx, artifact, onPrepare, onChange }) {
 const [open, setOpen] = useState(false);
 const [ratings, setRatings] = useState({});
 const [reflection, setReflection] = useState('');
 const [error, setError] = useState('');
 const version = portfolioProjectVersion(artifact);
 const latest = artifact.portfolioReviews?.[0];
 const current = latest?.projectVersion === version;
 useEffect(() => {
  if (!open) return;
  const review = current ? latest : null;
  setRatings(Object.fromEntries(portfolioReviewCriteria.map(rule => [rule.id, review?.criteria.find(item => item.id === rule.id) || { id: rule.id, rating: '', note: '' }])));
  setReflection(review?.reflection || '');
  setError('');
 }, [open, artifact.id, version]);
 function openReview() { if (onPrepare()) setOpen(true); }
 function save() {
  try {
   const saved = savePortfolioSelfReview(ctx, artifact.id, version, portfolioReviewCriteria.map(rule => ratings[rule.id] || { id: rule.id, rating: '', note: '' }), reflection);
   onChange(saved, 'Portfolio self-review saved. This is your own assessment, not verified skill evidence or a credential.');
   setOpen(false);
  } catch (failure) { setError(failure.message); }
 }
 return <section className="v-card" aria-labelledby="portfolio-review-title"><h2 id="portfolio-review-title" className="text-lg font-medium">Portfolio self-review</h2><p className="v-muted mt-2">Check how clearly this artifact explains its purpose, evidence and limits. Your ratings stay in this workspace and do not establish mastery.</p>
  {artifact.status !== 'completed' || !artifact.body.trim() ? <p className="v-notice mt-4">Complete the project and add your work before reviewing it.</p> : <><p className="v-muted mt-3" role="status">{current ? `Self-reviewed ${new Date(latest.reviewedAt).toLocaleDateString()} · Current saved work` : latest ? 'Your last self-review is outdated after project changes.' : 'No self-review saved yet.'}</p><button className="v-button mt-4" onClick={openReview}>{current ? 'Review again' : 'Review this project'}</button></>}
  <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85dvh] overflow-y-auto bg-white"><DialogTitle>Review your portfolio project</DialogTitle><DialogDescription>Rate each criterion and point to evidence in your own work. This is a self-review on this device; no teacher or model has evaluated it.</DialogDescription><p className="text-sm font-medium">{artifact.title}</p>{portfolioReviewCriteria.map(rule => <fieldset className="v-card bg-white" key={rule.id}><legend className="text-sm font-medium">{rule.label}</legend><p className="v-muted mt-2">{rule.prompt}</p><label className="mt-3 block text-sm">Your rating<select className="v-field mt-2" value={ratings[rule.id]?.rating || ''} onChange={event => setRatings({ ...ratings, [rule.id]: { ...ratings[rule.id], id: rule.id, rating: event.target.value } })}><option value="">Choose a rating</option><option value="needs-work">Needs more work</option><option value="explained">Explained</option><option value="supported">Supported by evidence</option></select></label><label className="mt-3 block text-sm">Evidence note<textarea className="v-field mt-2 min-h-24" maxLength={500} value={ratings[rule.id]?.note || ''} onChange={event => setRatings({ ...ratings, [rule.id]: { ...ratings[rule.id], id: rule.id, note: event.target.value } })} placeholder="Point to a specific part of your document." /></label></fieldset>)}<label className="block text-sm">What will you improve next?<textarea className="v-field mt-2 min-h-24" maxLength={1000} value={reflection} onChange={event => setReflection(event.target.value)} /></label>{error && <p role="alert" className="v-notice v-error">{error}</p>}<button className="v-button primary" onClick={save}>Save self-review</button></DialogContent></Dialog>
 </section>;
}
