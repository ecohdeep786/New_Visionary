import { askIntents, defaultAskContext } from '@/services/guideEntryService';
import { useEffect, useId, useState } from 'react';

export default function GuideEntry({role,value: saved=defaultAskContext,onChange: persist,compact=false}) {
  const [value,setValue]=useState(saved);
  const materialHelpId=useId();
  useEffect(()=>setValue(saved),[saved]);
  const onChange=value=>{setValue(value);persist(value);};
  const fields=<div className="guide-entry">
    {!compact && <h2 className="guide-entry-title">What would you like help with?</h2>}
    <fieldset><legend className="guide-entry-label">Choose an intent</legend><div className="guide-entry-options">{askIntents(role).map(intent=><button key={intent.id} type="button" className="guide-entry-option" aria-pressed={value.intent===intent.id} onClick={()=>onChange({...value,intent:intent.id})}>{intent.label}</button>)}</div></fieldset>
    <fieldset><legend className="guide-entry-label">Start from</legend><div className="guide-entry-options">{[['topic','A topic or goal'],['material','Paste material'],['outside','Outside my plan']].map(([id,label])=><button key={id} type="button" className="guide-entry-option" aria-pressed={value.source===id} onClick={()=>onChange({...value,source:id})}>{label}</button>)}</div></fieldset>
    {value.source==='material' && <div><label className="guide-entry-label" htmlFor={`${materialHelpId}-input`}>Material to keep with this conversation</label><textarea id={`${materialHelpId}-input`} className="v-field" rows={3} maxLength={6000} aria-describedby={materialHelpId} value={value.material} onChange={e=>onChange({...value,material:e.target.value})}/><p id={materialHelpId} className="v-muted">Text only. This demo saves material but does not analyze arbitrary documents.</p></div>}
    {(value.source!=='topic'||value.material) && <div className="guide-entry-context"><span>{value.source==='material'?'Pasted material':value.source==='outside'?'Outside your current plan':'Topic or goal'} · {value.material.length} saved characters</span><button type="button" className="v-button" onClick={()=>onChange({...value,source:'topic',material:''})}>Remove context</button></div>}
  </div>;
  return compact ? <details><summary className="v-button">Intent and context</summary>{fields}</details> : fields;
}
