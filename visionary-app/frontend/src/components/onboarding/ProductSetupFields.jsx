import { useId, useState } from 'react';
import ChoiceGrid from './ChoiceGrid';
import { BOARDS, CLASSES, INDIAN_STATES, LANGUAGES, COMPETITIVE_TARGETS, TEACHER_CATEGORIES, ORG_TYPES } from './stepConfigs';

function Select({ label, value, onChange, options, placeholder = 'Choose an option' }) {
  const id = useId();
  return <div><label htmlFor={id} className="mb-2 block text-sm font-medium text-[#1d1d1f]">{label}</label>
    <select id={id} value={value || ''} onChange={event => onChange(event.target.value)} className="min-h-14 w-full rounded-xl border border-[#d2d2d7] bg-white px-3 text-sm outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10">
      <option value="">{placeholder}</option>{options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
    </select></div>;
}
function Text({ label, value, onChange, maximum = 120, placeholder = '' }) {
  const id = useId();
  return <div><label htmlFor={id} className="mb-2 block text-sm font-medium text-[#1d1d1f]">{label}</label>
    <input id={id} type="text" maxLength={maximum} value={value || ''} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="min-h-14 w-full rounded-xl border border-[#d2d2d7] px-3 text-sm outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10" /></div>;
}
function Subjects({ value, onChange }) {
  const [text, setText] = useState(() => (value || []).join(', '));
  return <Text label="Subjects or interests (optional)" value={text} maximum={500} placeholder="For example, mathematics, design" onChange={next => { setText(next); onChange([...new Set(next.split(',').map(item => item.trim().slice(0, 100)).filter(Boolean))].slice(0, 20)); }} />;
}
export default function ProductSetupFields({ step, data, updateData, live }) {
  const language = <Select label="Preferred learning language" value={data.preferred_language || data.medium || 'English'} options={LANGUAGES} onChange={value => updateData('preferred_language', value)} />;
  const subjectField = (field = 'subjects') => <Subjects value={data[field]} onChange={value => updateData(field, value)} />;
  return <div className="space-y-6">
    {step.id === 'about' && <>
      <Text label="What should we call you?" value={data.full_name} onChange={value => updateData('full_name', value)} maximum={80} placeholder="Your name" />
      <Select label="Your age range" value={data.age_band} onChange={value => updateData('age_band', value)} options={[{ id: 'adult', label: '18 or older' }, { id: 'minor', label: 'Under 18' }]} />
      {data.age_band === 'minor' && (live || data.identity !== 'student') ? <p role="status" className="rounded-2xl bg-[#f5f5f7] p-4 text-sm leading-6">Under-18 setup needs a verified guardian connection. It is not available yet. Your account and draft are kept; you can return when guardian setup is available.</p> : <p className="text-xs leading-5 text-[#6e6e73]">This is a self-declared age range. It does not verify your identity.</p>}
    </>}
    {step.id === 'focus' && <>
      <ChoiceGrid options={[{ id: 'school', label: 'School', desc: 'Classes and school subjects' }, { id: 'higher_ed', label: 'Higher education', desc: 'College, university or diploma' }, { id: 'competitive', label: 'Exam preparation', desc: 'A specific entrance or competitive exam' }, { id: 'professional', label: 'Independent learning', desc: 'Skills, interests and personal projects' }]} value={data.education_stage} onChange={value => updateData('education_stage', value)} dense />
      {language}
    </>}
    {step.id === 'context' && <>
      {data.education_stage === 'school' && <>
        <Select label="School board" value={data.board} options={BOARDS} onChange={value => { updateData('board', value); if (value !== 'State') updateData('state', null); }} />
        {data.board === 'State' && <Select label="State or union territory" value={data.state} options={INDIAN_STATES} onChange={value => updateData('state', value)} />}
        <Select label="Class" value={data.grade_level} options={CLASSES} onChange={value => updateData('grade_level', value)} />
      </>}
      {data.education_stage === 'competitive' && <Select label="Exam" value={data.target_exam} options={[...COMPETITIVE_TARGETS, { id: 'Other', label: 'Another examination' }]} onChange={value => updateData('target_exam', value)} />}
      {data.education_stage === 'higher_ed' && <Text label="Course or degree (optional)" value={data.degree_program} onChange={value => updateData('degree_program', value)} placeholder="For example, B.Sc. Computer Science" />}
      {data.education_stage === 'professional' && <Text label="An interest or goal (optional)" value={data.career_goal} onChange={value => updateData('career_goal', value)} placeholder="For example, build my first app" maximum={2000} />}
      {subjectField()}
    </>}
    {step.id === 'preferences' && <>
      {data.identity === 'teacher' && <Select label="Your teaching context" value={data.teacher_category} options={TEACHER_CATEGORIES} onChange={value => updateData('teacher_category', value)} />}
      {data.identity === 'organization' && <>
        <Text label="Organization name" value={data.org_name} onChange={value => updateData('org_name', value)} maximum={120} />
        <Select label="Organization type" value={data.org_type} options={ORG_TYPES} onChange={value => updateData('org_type', value)} />
      </>}
      {language}
      {data.identity === 'professional' && <Text label="A skill or goal (optional)" value={data.career_goal} onChange={value => updateData('career_goal', value)} maximum={2000} placeholder="For example, develop my design skills" />}
      {data.identity === 'teacher' && subjectField('teacher_subjects')}
      {data.identity === 'parent' && <p className="rounded-2xl bg-[#f5f5f7] p-4 text-sm leading-6 text-[#6e6e73]">You’ll connect a child’s account after setup. You control your account; an approved connection determines which learning summaries you can see.</p>}
      {data.identity === 'organization' && <p className="text-xs leading-6 text-[#6e6e73]">This saves your starting preferences. Verification, people and shared content are set up separately.</p>}
    </>}
  </div>;
}
