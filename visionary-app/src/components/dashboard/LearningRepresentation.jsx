import { useId, useRef, useState } from 'react';
import {useWorkspace} from '@/hooks/useWorkspace';
import {learningSurfaceCopy} from '@/lib/learningSurfaceCopy';
import {representationEngagementCopy} from '@/lib/representationEngagementCopy';
import NumberLineRepresentation from './NumberLineRepresentation';
import DataDiagramRepresentation from './DataDiagramRepresentation';

const faces = ['translateZ(55px)', 'rotateY(180deg) translateZ(55px)', 'rotateY(90deg) translateZ(55px)', 'rotateY(-90deg) translateZ(55px)', 'rotateX(90deg) translateZ(55px)', 'rotateX(-90deg) translateZ(55px)'];

function CubePrediction({ size, disabled, labels, cubic, onTrySide }) {
 const [prediction, setPrediction] = useState(null);
 const [revealed, setRevealed] = useState(false);
 const explanationId = useId();
 const next = size < 8 ? size + 1 : size - 1;
 const options = [size ** 3, next ** 2, next ** 3].sort((a, b) => a - b);
 return <details className="v-cube-prediction">
  <summary><span className="v-exploration-label">03 · {labels.predict}</span><span className="v-muted">{labels.optional}</span></summary>
  <fieldset className="mt-4" disabled={disabled}>
   <legend className="text-sm font-medium leading-6">{labels.question(size, next)}</legend>
   <div className="v-cube-prediction-options mt-3" role="group" aria-label={labels.choices}>
    {options.map(volume => <button key={volume} type="button" className="v-button" aria-pressed={prediction === volume} disabled={revealed} onClick={() => setPrediction(volume)}>{labels.choice(volume)}</button>)}
   </div>
   <button type="button" className="v-button mt-3" aria-expanded={revealed} aria-controls={explanationId} onClick={() => setRevealed(!revealed)}>{revealed ? labels.retry : labels.reveal}</button>
   <div id={explanationId} hidden={!revealed} className="v-cube-prediction-feedback mt-4" role="status" aria-live="polite" aria-atomic="true">
    {revealed && <>{prediction !== null && <p className="v-muted">{labels.predicted(prediction)}</p>}<p className="mt-2 text-sm leading-6">{labels.explanation(next)}</p><p className="v-cube-volume mt-3">{next} × {next} × {next} = {next ** 3} {cubic}</p><p className="v-muted mt-2">{labels.comparison(size, next)}</p></>}
   </div>
   {revealed && <button type="button" className="v-button mt-4" onClick={() => onTrySide(next)}>{labels.trySide(next)}</button>}
  </fieldset>
 </details>;
}

export default function LearningRepresentation({ descriptors, value, preferText, disabled, onChange, temporary=false, contentLocale='en' }) {
 const {data:workspace}=useWorkspace();
 const locale=workspace?.preferences.interfaceLocale||'en',labels=learningSurfaceCopy(locale);
 const engagement=representationEngagementCopy(locale);
 const [error, setError] = useState('');
 const sideControl = useRef(null);
 const descriptionControl = useRef(null);
 const cube = descriptors.find(item => item.kind === 'cube');
 const visual=cube||descriptors.find(item=>item.kind==='number-line'&&item.numberLine||item.kind==='diagram'&&item.series);
 const selected = visual || descriptors[0];
 if (!selected) return null;
 const mode = value?.mode || (preferText || !visual ? 'text' : 'model');
 const size = value?.size || 3;
 const rotation = value?.rotation ?? 25;
 function save(patch) {
  try { onChange(patch); setError(''); return true; }
  catch (problem) { setError(problem.message || labels.saveError); return false; }
 }
 return <section className="v-representation" aria-label={labels.representation} lang={locale}>
  <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-medium">{labels.another}</h3><p className="v-muted mt-1">{temporary?labels.temporary:labels.saved}</p></div>{visual && <div className="flex flex-wrap gap-2" role="group" aria-label={labels.mode}><button type="button" className="v-button" aria-pressed={mode === 'model'} disabled={disabled} onClick={() => save({ mode: 'model' })}>{cube?labels.cube:selected.kind==='number-line'?labels.line:labels.chart}</button><button ref={descriptionControl} type="button" className="v-button" aria-pressed={mode === 'text'} disabled={disabled} onClick={() => save({ mode: 'text' })}>{labels.description}</button></div>}</div>
  {error && <p role="alert" className="v-notice v-error mt-3">{error}</p>}
  {cube && mode === 'model' ? <div className="v-cube-exploration mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
   <div className="v-cube-observe"><p className="v-exploration-label mb-3">01 · {engagement.observe}</p><div className="cube-stage" role="img" aria-label={labels.cubeDescription(size,size**3,rotation)}><div className="learning-cube" aria-hidden="true" style={{transform:`rotateX(-18deg) rotateY(${rotation}deg) scale(${0.6 + size / 10})`}}>{faces.map((transform, index) => <span key={transform} style={{transform}}>{index === 0 ? size : ''}</span>)}</div></div><p className="v-muted mt-3">{engagement.observeHint}</p></div>
   <div className="v-cube-controls space-y-4"><p className="v-exploration-label">02 · {engagement.change}</p><p className="v-muted">{engagement.changeHint}</p><p className="v-cube-volume text-lg font-medium tabular-nums" aria-live="polite">{size} × {size} × {size} = {size ** 3} {labels.cubic}</p><label className="block text-sm">{labels.side}: {size} {labels.units}<input ref={sideControl} className="mt-2 w-full accent-[#4285F4]" type="range" min="1" max="8" value={size} disabled={disabled} onChange={event => save({ size: Number(event.target.value) })}/></label><label className="block text-sm">{labels.rotation}: {rotation}°<input className="mt-2 w-full accent-[#4285F4]" type="range" min="0" max="360" value={rotation} disabled={disabled} onChange={event => save({ rotation: Number(event.target.value) })}/></label><button type="button" className="v-button" disabled={disabled} onClick={() => save({ size: 3, rotation: 25 })}>{labels.resetModel}</button></div>
  </div> : mode==='model'&&selected.kind==='number-line'&&selected.numberLine?<NumberLineRepresentation descriptor={selected} point={value?.point} onChange={save} disabled={disabled} locale={locale} contentLocale={contentLocale}/>:mode==='model'&&selected.kind==='diagram'&&selected.series?<DataDiagramRepresentation descriptor={selected} locale={locale} contentLocale={contentLocale}/>:<div className="mt-4">{cube && <div className="mb-4" aria-live="polite"><p className="v-muted">{labels.side}: {size} {labels.units}</p><p className="v-cube-volume mt-2">{size} × {size} × {size} = {size ** 3} {labels.cubic}</p></div>}<p lang={contentLocale} className="whitespace-pre-wrap text-sm leading-7">{selected.alternative}</p>{!visual && selected.kind !== 'text' && <p className="v-muted mt-3">{labels.unsupported}</p>}</div>}
  {cube && <CubePrediction key={`${cube.alternative}:${size}`} size={size} disabled={disabled} labels={engagement} cubic={labels.cubic} onTrySide={side => { if (save({ size: side })) (mode === 'model' ? sideControl : descriptionControl).current?.focus(); }} />}
 </section>;
}
