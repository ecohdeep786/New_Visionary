import { useWorkspace } from '@/hooks/useWorkspace';
import { guideCopy } from '@/lib/guideCopy';
import { askIntents, defaultAskContext } from '@/services/guideEntryService';
import { useEffect, useId, useState } from 'react';
export default function GuideEntry({
  role,
  value: saved = defaultAskContext,
  onChange: persist,
  compact = false
}) {
  const {
    data
  } = useWorkspace();
  const locale = data?.preferences.interfaceLocale || 'en';
  const copy = guideCopy(locale);
  const [value, setValue] = useState(saved);
  const materialHelpId = useId();
  useEffect(() => setValue(saved), [saved]);
  const onChange = value => {
    setValue(value);
    persist(value);
  };
  const fields = <div className="guide-entry">
    {!compact && <h2 className="guide-entry-title">{copy("What would you like help with?")}</h2>}
    <fieldset><legend className="guide-entry-label">{copy("Choose an intent")}</legend><div className="guide-entry-options">{askIntents(role).map(intent => <button key={intent.id} type="button" className="guide-entry-option" aria-pressed={value.intent === intent.id} onClick={() => onChange({
          ...value,
          intent: intent.id
        })}>{copy(intent.label)}</button>)}</div></fieldset>
    <fieldset><legend className="guide-entry-label">{copy("Start from")}</legend><div className="guide-entry-options">{[['topic', 'A topic or goal'], ['material', 'Paste material'], ['outside', 'Outside my plan']].map(([id, label]) => <button key={id} type="button" className="guide-entry-option" aria-pressed={value.source === id} onClick={() => onChange({
          ...value,
          source: id
        })}>{copy(label)}</button>)}</div></fieldset>
    {value.source === 'material' && <div><label className="guide-entry-label" htmlFor={`${materialHelpId}-input`}>{copy("Material to keep with this conversation")}</label><textarea id={`${materialHelpId}-input`} className="v-field" rows={3} maxLength={6000} aria-describedby={materialHelpId} value={value.material} onChange={e => onChange({
        ...value,
        material: e.target.value
      })} /><p id={materialHelpId} className="v-muted">{copy("Text only. This demo saves material but does not analyze arbitrary documents.")}</p></div>}
    {(value.source !== 'topic' || value.material) && <div className="guide-entry-context"><span>{copy('{source} · {count} characters', {
          source: copy(value.source === 'material' ? copy("Pasted material") : value.source === 'outside' ? copy("Outside your current plan") : copy("Topic or goal")),
          count: value.material.length
        })}</span><button type="button" className="v-button" onClick={() => onChange({
        ...value,
        source: 'topic',
        material: ''
      })}>{copy("Remove context")}</button></div>}
  </div>;
  return compact ? <details><summary className="v-button">{copy("Intent and context")}</summary>{fields}</details> : fields;
}
