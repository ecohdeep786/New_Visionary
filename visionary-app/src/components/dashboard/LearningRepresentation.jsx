import { useState } from 'react';

const faces = ['translateZ(55px)', 'rotateY(180deg) translateZ(55px)', 'rotateY(90deg) translateZ(55px)', 'rotateY(-90deg) translateZ(55px)', 'rotateX(90deg) translateZ(55px)', 'rotateX(-90deg) translateZ(55px)'];

export default function LearningRepresentation({ descriptors, value, preferText, disabled, onChange }) {
 const [error, setError] = useState('');
 const cube = descriptors.find(item => item.kind === 'cube');
 const selected = cube || descriptors[0];
 if (!selected) return null;
 const mode = value?.mode || (preferText || !cube ? 'text' : 'model');
 const size = value?.size || 3;
 const rotation = value?.rotation ?? 25;
 function save(patch) {
  try { onChange(patch); setError(''); }
  catch (problem) { setError(problem.message || 'The model view could not be saved. Try again.'); }
 }
 return <section className="v-representation" aria-label="Concept representation">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-medium">See the idea another way</h3><p className="v-muted mt-1">Your model view stays with this learning activity. Exploring it does not count as a correct answer.</p></div>{cube && <div className="flex flex-wrap gap-2" role="group" aria-label="Representation mode"><button type="button" className="v-button" aria-pressed={mode === 'model'} disabled={disabled} onClick={() => save({ mode: 'model' })}>Interactive 3D</button><button type="button" className="v-button" aria-pressed={mode === 'text'} disabled={disabled} onClick={() => save({ mode: 'text' })}>Read description</button></div>}</div>
  {error && <p role="alert" className="v-notice v-error mt-3">{error}</p>}
  {cube && mode === 'model' ? <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
   <div className="cube-stage" role="img" aria-label={`Cube with side ${size} units, volume ${size ** 3} cubic units, rotated ${rotation} degrees`}><div className="learning-cube" aria-hidden="true" style={{transform:`rotateX(-18deg) rotateY(${rotation}deg) scale(${0.6 + size / 10})`}}>{faces.map((transform, index) => <span key={transform} style={{transform}}>{index === 0 ? size : ''}</span>)}</div></div>
   <div className="space-y-4"><p className="text-sm leading-7">A cube grows in three directions. Volume = side × side × side.</p><p className="text-lg font-medium tabular-nums" aria-live="polite">{size} × {size} × {size} = {size ** 3} cubic units</p><label className="block text-sm">Side length: {size} units<input className="mt-2 w-full accent-[#4285F4]" type="range" min="1" max="8" value={size} disabled={disabled} onChange={event => save({ size: Number(event.target.value) })}/></label><label className="block text-sm">Rotation: {rotation}°<input className="mt-2 w-full accent-[#4285F4]" type="range" min="0" max="360" value={rotation} disabled={disabled} onChange={event => save({ rotation: Number(event.target.value) })}/></label><button type="button" className="v-button" disabled={disabled} onClick={() => save({ size: 3, rotation: 25 })}>Reset model</button></div>
  </div> : <div className="mt-4"><p className="whitespace-pre-wrap text-sm leading-7">{selected.alternative}</p>{!cube && selected.kind !== 'text' && <p className="v-muted mt-3">An interactive {selected.kind.replace('-', ' ')} is not available in this local preview. The description remains usable.</p>}</div>}
 </section>;
}
