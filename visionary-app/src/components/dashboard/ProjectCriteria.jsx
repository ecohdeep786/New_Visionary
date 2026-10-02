export default function ProjectCriteria({ rubric, onChange }) {
 if (!rubric?.criteria?.length) return <section className="v-card"><h2 className="text-lg font-medium">Project criteria</h2><p className="v-muted mt-3">No concept-specific criteria were supplied for this project. Use the milestones and describe your evidence and limitations in the working document. Completion remains unverified.</p></section>;
 const completed = rubric.criteria.filter(item => rubric.responses?.[item.id]?.trim()).length;
 return <section className="v-card" aria-label="Project criteria">
  <h2 className="text-lg font-medium">Apply the concept</h2>
  <p className="v-muted mt-2">{rubric.sourceProvider ? `Criteria source: ${rubric.sourceProvider}${rubric.sourceVersion ? ` · version ${rubric.sourceVersion}` : ''}.` : 'Saved concept criteria.'} Your responses are a self review, not an automatic grade or teacher feedback.</p>
  <p className="v-muted mt-2" role="status">{completed} of {rubric.criteria.length} criteria have a response.</p>
  <div className="mt-4 grid gap-5" lang={rubric.locale}>{rubric.criteria.map(item => <label className="block text-sm" key={item.id}>
   <span className="font-medium">{item.label}</span>
   <span className="v-muted mt-1 block">{item.prompt}</span>
   <textarea className="v-field mt-2 min-h-24" value={rubric.responses?.[item.id] || ''} onChange={event => onChange(item.id, event.target.value)} placeholder="Describe what you made or checked…"/>
  </label>)}</div>
  <p className="v-muted mt-4 text-sm">All criteria need a written response before this connected project can be marked complete. Responses are checked for presence only; their quality has not been evaluated.</p>
 </section>;
}
