import { useState } from 'react';
import {useWorkspace} from '@/hooks/useWorkspace';
import {learningSurfaceCopy} from '@/lib/learningSurfaceCopy';
import NumberLineRepresentation from './NumberLineRepresentation';
import DataDiagramRepresentation from './DataDiagramRepresentation';

const faces = ['translateZ(55px)', 'rotateY(180deg) translateZ(55px)', 'rotateY(90deg) translateZ(55px)', 'rotateY(-90deg) translateZ(55px)', 'rotateX(90deg) translateZ(55px)', 'rotateX(-90deg) translateZ(55px)'];

export default function LearningRepresentation({ descriptors, value, preferText, disabled, onChange, temporary=false, contentLocale='en' }) {
 const {data:workspace}=useWorkspace();
 const locale=workspace?.preferences.interfaceLocale||'en',labels=learningSurfaceCopy(locale);
 const [error, setError] = useState('');
 const cube = descriptors.find(item => item.kind === 'cube');
 const visual=cube||descriptors.find(item=>item.kind==='number-line'&&item.numberLine||item.kind==='diagram'&&item.series);
 const selected = visual || descriptors[0];
 if (!selected) return null;
 const mode = value?.mode || (preferText || !visual ? 'text' : 'model');
 const size = value?.size || 3;
 const rotation = value?.rotation ?? 25;
 function save(patch) {
  try { onChange(patch); setError(''); }
  catch (problem) { setError(problem.message || labels.saveError); }
 }
 return <section className="v-representation" aria-label={labels.representation} lang={locale}>
  <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-medium">{labels.another}</h3><p className="v-muted mt-1">{temporary?labels.temporary:labels.saved}</p></div>{visual && <div className="flex flex-wrap gap-2" role="group" aria-label={labels.mode}><button type="button" className="v-button" aria-pressed={mode === 'model'} disabled={disabled} onClick={() => save({ mode: 'model' })}>{cube?labels.cube:selected.kind==='number-line'?labels.line:labels.chart}</button><button type="button" className="v-button" aria-pressed={mode === 'text'} disabled={disabled} onClick={() => save({ mode: 'text' })}>{labels.description}</button></div>}</div>
  {error && <p role="alert" className="v-notice v-error mt-3">{error}</p>}
  {cube && mode === 'model' ? <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
   <div className="cube-stage" role="img" aria-label={labels.cubeDescription(size,size**3,rotation)}><div className="learning-cube" aria-hidden="true" style={{transform:`rotateX(-18deg) rotateY(${rotation}deg) scale(${0.6 + size / 10})`}}>{faces.map((transform, index) => <span key={transform} style={{transform}}>{index === 0 ? size : ''}</span>)}</div></div>
   <div className="space-y-4"><p className="text-sm leading-7">{labels.growth}</p><p className="text-lg font-medium tabular-nums" aria-live="polite">{size} × {size} × {size} = {size ** 3} {labels.cubic}</p><label className="block text-sm">{labels.side}: {size} {labels.units}<input className="mt-2 w-full accent-[#4285F4]" type="range" min="1" max="8" value={size} disabled={disabled} onChange={event => save({ size: Number(event.target.value) })}/></label><label className="block text-sm">{labels.rotation}: {rotation}°<input className="mt-2 w-full accent-[#4285F4]" type="range" min="0" max="360" value={rotation} disabled={disabled} onChange={event => save({ rotation: Number(event.target.value) })}/></label><button type="button" className="v-button" disabled={disabled} onClick={() => save({ size: 3, rotation: 25 })}>{labels.resetModel}</button></div>
  </div> : mode==='model'&&selected.kind==='number-line'&&selected.numberLine?<NumberLineRepresentation descriptor={selected} point={value?.point} onChange={save} disabled={disabled} locale={locale} contentLocale={contentLocale}/>:mode==='model'&&selected.kind==='diagram'&&selected.series?<DataDiagramRepresentation descriptor={selected} locale={locale} contentLocale={contentLocale}/>:<div className="mt-4"><p lang={contentLocale} className="whitespace-pre-wrap text-sm leading-7">{selected.alternative}</p>{!visual && selected.kind !== 'text' && <p className="v-muted mt-3">{labels.unsupported}</p>}</div>}
 </section>;
}
