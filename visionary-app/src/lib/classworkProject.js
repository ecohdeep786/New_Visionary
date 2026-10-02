// A fixed classroom copy excludes private notes, drafts, shares and version history.
export function classworkProjectText(artifact) {
 if (!artifact || artifact.status !== 'completed' || !artifact.title?.trim() || !artifact.body?.trim()) throw new Error('Complete and save the project before submitting a classroom copy.');
 const criteria = artifact.rubric?.criteria || [];
 if (criteria.some(item => !artifact.rubric.responses?.[item.id]?.trim())) throw new Error('Save a written response for every project criterion first.');
 const sections = [`Project: ${artifact.title}`, `Saved project version: ${artifact.updatedAt}`, artifact.body];
 if (criteria.length) {
  sections.push('Project criteria and learner self-review (not verified or scored)');
  if (artifact.rubric.sourceProvider) sections.push(`Criteria source: ${artifact.rubric.sourceProvider} · version ${artifact.rubric.sourceVersion || 'unspecified'}`);
  sections.push(...criteria.map(item => `${item.label}\n${item.prompt}\n${artifact.rubric.responses[item.id]}`));
 }
 const text = sections.join('\n\n');
 if (text.length > 50000) throw new Error('This project copy exceeds the 50,000-character classroom response limit. Shorten the saved project before submitting.');
 return text;
}
