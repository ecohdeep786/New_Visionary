import { useWorkspace } from '@/hooks/useWorkspace';
import { organizationAuthorCopy } from '@/lib/organizationAuthorCopy';
import CurriculumPracticeEditor, { CurriculumPracticeReview } from './CurriculumPracticeEditor';
import { useState } from 'react';
import { assertCurriculumTemplate, curriculumObjectiveSnapshot } from '@/services/curriculumTemplate';
import LessonObjectivePreview from './LessonObjectivePreview';
const blank = () => ({
  schemaVersion: 1,
  selection: {
    board: '',
    classLevel: '',
    subject: ''
  },
  provenance: {
    provider: '',
    sourceId: '',
    version: ''
  },
  chapters: []
});
const objective = () => ({
  id: crypto.randomUUID(),
  title: '',
  explanation: '',
  prerequisiteIds: [],
  representations: [],
  criteria: []
});
export function CurriculumTemplatePreview({
  value,
  locale = 'en'
}) {
  const {
    data
  } = useWorkspace();
  const interfaceLocale = data?.preferences.interfaceLocale || 'en';
  const copy = organizationAuthorCopy(interfaceLocale);
  if (!value) return null;
  try {
    assertCurriculumTemplate(value, true);
  } catch (error) {
    return <p className="v-notice v-error mt-3" role="alert" lang="en">{error.message}</p>;
  }
  const objectives = value.chapters.flatMap(chapter => chapter.objectives);
  return <section className="mt-5 space-y-4" aria-label={copy("Structured curriculum preview")}><p className="v-muted">{value.selection.board} · {value.selection.classLevel} · {value.selection.subject} · {value.provenance.provider} · {copy("Version")} {value.provenance.version}</p>{value.chapters.map(chapter => <article className="rounded-xl border p-4" key={chapter.id}><h3 className="font-medium">{chapter.title}</h3><p className="v-muted mt-2">{copy("Source section:")}{chapter.sourceSection}</p>{chapter.objectives.map(item => <details className="mt-4" key={item.id}><summary className="cursor-pointer font-medium">{item.title}</summary>{!!item.prerequisiteIds.length && <p className="v-muted mt-3">{copy("Prerequisite objectives:")}{item.prerequisiteIds.map(id => objectives.find(row => row.id === id)?.title).join(' · ')}{copy(". Review this sequence before assigning; it is not a claim of learner readiness.")}</p>}<LessonObjectivePreview objective={curriculumObjectiveSnapshot(value, item.id, locale)} /><CurriculumPracticeReview questions={item.practice || []} /></details>)}</article>)}</section>;
}
export default function CurriculumTemplateEditor({
  value,
  onChange,
  disabled = false,
  locale = 'en'
}) {
  const {
    data
  } = useWorkspace();
  const interfaceLocale = data?.preferences.interfaceLocale || 'en';
  const copy = organizationAuthorCopy(interfaceLocale);
  const [error, setError] = useState('');
  if (!value) return <section className="v-card"><h2 className="text-base font-medium">{copy("Chapters and objectives")}</h2><p className="v-muted mt-2">{copy("Add structured source references, teaching and review criteria for objective-by-objective teacher preparation. Earlier narrative templates remain usable.")}</p>{!disabled && <button type="button" className="v-button mt-3" onClick={() => onChange(blank())}>{copy("Add curriculum structure")}</button>}</section>;
  const shape = value.schemaVersion === 1 && ['selection', 'provenance'].every(key => value[key] && typeof value[key] === 'object') && ['board', 'classLevel', 'subject'].every(key => typeof value.selection[key] === 'string') && ['provider', 'sourceId', 'version'].every(key => typeof value.provenance[key] === 'string') && Array.isArray(value.chapters) && value.chapters.every(chapter => chapter && typeof chapter.id === 'string' && typeof chapter.title === 'string' && typeof chapter.sourceSection === 'string' && Array.isArray(chapter.objectives) && chapter.objectives.every(item => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.explanation === 'string' && Array.isArray(item.prerequisiteIds) && Array.isArray(item.representations) && item.representations.every(view => view && typeof view.id === 'string' && typeof view.kind === 'string' && typeof view.alternative === 'string') && Array.isArray(item.criteria) && item.criteria.every(row => row && typeof row.id === 'string' && typeof row.label === 'string' && typeof row.prompt === 'string')));
  if (!shape) return <p role="alert" className="v-notice v-error">{copy("The recovered curriculum structure cannot be edited safely. Export the current edits before restoring a valid saved copy.")}</p>;
  if (disabled) return <CurriculumTemplatePreview value={value} locale={locale} />;
  const all = value.chapters.flatMap(chapter => chapter.objectives);
  function change(next) {
    setError('');
    onChange(next);
  }
  function chapterChange(id, patch) {
    change({
      ...value,
      chapters: value.chapters.map(row => row.id === id ? {
        ...row,
        ...patch
      } : row)
    });
  }
  function objectiveChange(chapterId, id, patch) {
    const chapter = value.chapters.find(row => row.id === chapterId);
    chapterChange(chapterId, {
      objectives: chapter.objectives.map(row => row.id === id ? {
        ...row,
        ...patch
      } : row)
    });
  }
  function remove(chapter, id) {
    const removed = id ? [id] : chapter.objectives.map(row => row.id);
    if (all.some(row => !removed.includes(row.id) && row.prerequisiteIds.some(key => removed.includes(key)))) {
      setError('Another objective depends on this item. Review and remove that prerequisite before deleting it.');
      return;
    }
    if (id) chapterChange(chapter.id, {
      objectives: chapter.objectives.filter(row => row.id !== id)
    });else change({
      ...value,
      chapters: value.chapters.filter(row => row.id !== chapter.id)
    });
  }
  return <section className="v-card !p-3 sm:!p-5"><h2 className="text-base font-medium">{copy("Chapters and objectives")}</h2><p className="v-muted mt-2">{copy("Author only reviewed source content. Saving preserves unfinished structure; submission requires source metadata, chapter references, complete teaching and at least one criterion per objective. No book conversion or new 3D asset is generated.")}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{[['selection', 'board', 'Curriculum board or framework'], ['selection', 'classLevel', 'Curriculum class or level'], ['selection', 'subject', 'Curriculum subject'], ['provenance', 'provider', 'Curriculum source provider'], ['provenance', 'sourceId', 'Curriculum source identifier'], ['provenance', 'version', 'Curriculum source version']].map(([group, key, label]) => <label key={key} className="text-sm">{copy(label)}<input className="v-field mt-2" maxLength={200} value={value[group][key]} onChange={event => change({
          ...value,
          [group]: {
            ...value[group],
            [key]: event.target.value
          }
        })} /></label>)}</div>
 {value.chapters.map((chapter, index) => <article className="mt-5 rounded-xl border p-4" key={chapter.id}><h3 className="font-medium">{copy('Chapter {number}', {
          number: index + 1
        })}</h3><label className="mt-3 block text-sm">{copy("Chapter title")}<input className="v-field mt-2" maxLength={200} value={chapter.title} onChange={event => chapterChange(chapter.id, {
          title: event.target.value
        })} /></label><label className="mt-3 block text-sm">{copy("Source section or pages")}<input className="v-field mt-2" maxLength={500} value={chapter.sourceSection} onChange={event => chapterChange(chapter.id, {
          sourceSection: event.target.value
        })} /></label>
 {chapter.objectives.map((item, position) => <section className="mt-5 rounded-xl border bg-[#f8fafd] p-3" aria-label={copy("Objective {number} in chapter {chapter}", {
        number: position + 1,
        chapter: index + 1
      })} key={item.id}><h4 className="font-medium">{copy('Objective {number}', {
            number: position + 1
          })}</h4><label className="mt-3 block text-sm">{copy("Objective title")}<input className="v-field mt-2" maxLength={200} value={item.title} onChange={event => objectiveChange(chapter.id, item.id, {
            title: event.target.value
          })} /></label><label className="mt-3 block text-sm">{copy("Authored teaching explanation")}<textarea aria-label={copy("Authored teaching explanation")} className="v-field mt-2" rows={5} maxLength={10000} value={item.explanation} onChange={event => objectiveChange(chapter.id, item.id, {
            explanation: event.target.value
          })} /></label>
 <fieldset className="mt-4"><legend className="text-sm font-medium">{copy("Prerequisite objectives")}</legend>{all.filter(row => row.id !== item.id).length ? all.filter(row => row.id !== item.id).map(row => <label className="mt-2 flex items-start gap-2 text-sm" key={row.id}><input type="checkbox" checked={item.prerequisiteIds.includes(row.id)} onChange={event => objectiveChange(chapter.id, item.id, {
              prerequisiteIds: event.target.checked ? [...item.prerequisiteIds, row.id] : item.prerequisiteIds.filter(id => id !== row.id)
            })} />{row.title || copy("Untitled objective")}</label>) : <p className="v-muted mt-2">{copy("No other objectives yet.")}</p>}</fieldset>
 <section className="mt-4"><h5 className="text-sm font-medium">{copy("Authored representations")}</h5><p className="v-muted mt-2">{copy("Cube and number-line views use existing interactive components. Their explanation and text alternative must match this objective.")}</p>{item.representations.map(view => <div className="mt-3 space-y-2 rounded-xl border p-3" key={view.id}><label className="block text-sm">{copy("Representation type")}<select aria-label={copy("Representation type")} className="v-field mt-2" value={view.kind} onChange={event => {
                const kind = event.target.value;
                objectiveChange(chapter.id, item.id, {
                  representations: item.representations.map(row => row.id === view.id ? {
                    id: row.id,
                    kind,
                    alternative: row.alternative,
                    ...(kind === 'number-line' ? {
                      numberLine: {
                        minimum: 0,
                        maximum: 1,
                        divisions: 8,
                        initial: 0
                      }
                    } : {})
                  } : row)
                });
              }}><option value="text">{copy("Text alternative")}</option><option value="cube">{copy("Interactive cube")}</option><option value="number-line">{copy("Interactive number line")}</option>{!['text', 'cube', 'number-line'].includes(view.kind) && <option value={view.kind}>{view.kind} · {copy("Retained representation")}</option>}</select></label><label className="block text-sm">{copy("Representation text alternative")}<textarea aria-label={copy("Representation text alternative")} maxLength={10000} className="v-field mt-2" rows={2} value={view.alternative} onChange={event => objectiveChange(chapter.id, item.id, {
                representations: item.representations.map(row => row.id === view.id ? {
                  ...row,
                  alternative: event.target.value
                } : row)
              })} /></label>{view.kind === 'number-line' && <div className="grid grid-cols-2 gap-2">{[['minimum', 'Number-line minimum'], ['maximum', 'Number-line maximum'], ['divisions', 'Number-line divisions'], ['initial', 'Initial division']].map(([key, label]) => <label className="text-sm" key={key}>{copy(label)}<input type="number" className="v-field mt-2" value={view.numberLine?.[key] ?? ''} onChange={event => objectiveChange(chapter.id, item.id, {
                  representations: item.representations.map(row => row.id === view.id ? {
                    ...row,
                    numberLine: {
                      ...row.numberLine,
                      [key]: Number(event.target.value)
                    }
                  } : row)
                })} /></label>)}</div>}<button type="button" className="v-button" onClick={() => objectiveChange(chapter.id, item.id, {
              representations: item.representations.filter(row => row.id !== view.id)
            })}>{copy("Remove representation")}</button></div>)}<button type="button" className="v-button mt-3" disabled={item.representations.length >= 12} onClick={() => objectiveChange(chapter.id, item.id, {
            representations: [...item.representations, {
              id: crypto.randomUUID(),
              kind: 'text',
              alternative: 'Add an accessible explanation of this view.'
            }]
          })}>{copy("Add representation")}</button></section>
 <section className="mt-4"><h5 className="text-sm font-medium">{copy("Objective review criteria")}</h5>{item.criteria.map(criterion => <div className="mt-3 space-y-2 rounded-xl border p-3" key={criterion.id}>{[['label', 'Criterion label', 200], ['prompt', 'Criterion review prompt', 2000]].map(([key, label, max]) => {
              const Field = key === 'prompt' ? 'textarea' : 'input';
              return <label className="block text-sm" key={key}>{copy(label)}<Field aria-label={copy(label)} rows={key === 'prompt' ? 3 : undefined} className="v-field mt-2" maxLength={max} value={criterion[key]} onChange={event => objectiveChange(chapter.id, item.id, {
                  criteria: item.criteria.map(row => row.id === criterion.id ? {
                    ...row,
                    [key]: event.target.value
                  } : row)
                })} /></label>;
            })}<button type="button" className="v-button" onClick={() => objectiveChange(chapter.id, item.id, {
              criteria: item.criteria.filter(row => row.id !== criterion.id)
            })}>{copy("Remove criterion")}</button></div>)}<button type="button" className="v-button mt-3" disabled={item.criteria.length >= 20} onClick={() => objectiveChange(chapter.id, item.id, {
            criteria: [...item.criteria, {
              id: crypto.randomUUID(),
              label: '',
              prompt: ''
            }]
          })}>{copy("Add review criterion")}</button></section><CurriculumPracticeEditor questions={item.practice || []} onChange={practice => objectiveChange(chapter.id, item.id, {
          practice
        })} /><button type="button" className="v-button mt-4" onClick={() => remove(chapter, item.id)}>{copy("Remove objective")}</button></section>)}
 <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="v-button" disabled={chapter.objectives.length >= 30 || all.length >= 200} onClick={() => chapterChange(chapter.id, {
          objectives: [...chapter.objectives, objective()]
        })}>{copy("Add objective")}</button><button type="button" className="v-button" onClick={() => remove(chapter)}>{copy("Remove chapter")}</button></div></article>)}<button type="button" className="v-button mt-4" disabled={value.chapters.length >= 30} onClick={() => change({
      ...value,
      chapters: [...value.chapters, {
        id: crypto.randomUUID(),
        title: '',
        sourceSection: '',
        objectives: []
      }]
    })}>{copy("Add chapter")}</button>{error && <p className="v-notice v-error mt-3" role="alert">{copy(error)}</p>}
 </section>;
}
