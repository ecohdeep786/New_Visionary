import { useState } from 'react';

export default function SubjectContextInput({ data, updateData }) {
  const [text, setText] = useState(() => (data.subjects || []).join(', '));
  return <label className="mb-8 block text-sm font-medium text-[#121317]">Your subjects or learning areas (optional)
    <textarea className="mt-2 w-full rounded-xl border border-[#dadce0] bg-white p-3 font-normal" rows={2} maxLength={1000} value={text} onChange={event => {
      setText(event.target.value);
      updateData('subjects', [...new Set(event.target.value.split(',').map(value => value.trim().slice(0, 100)).filter(Boolean))]);
    }} placeholder="For example, Mathematics, Science, English" />
    <span className="mt-2 block text-xs font-normal text-[#5f6368]">Separate subjects with commas. These are your preferences; available books and chapters are shown in Learn. You can skip this and choose there.</span>
  </label>;
}
