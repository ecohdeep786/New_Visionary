// A static glimpse of each authored activity. The adjacent choice supplies its
// accessible title and action; these diagrams never imply generated analysis.
export default function JourneyPreview({ journeyId, className = '' }) {
  return <svg className={`journey-preview ${className}`} viewBox="0 0 240 140" aria-hidden="true" focusable="false">
    {journeyId === 'cube' ? <>
      <ellipse cx="94" cy="115" rx="55" ry="8" fill="#dce8f7" />
      <path d="M48 48 94 22 140 48 94 74Z" fill="#c7ddfb" />
      <path d="M48 48 94 74 94 120 48 94Z" fill="#7aabed" />
      <path d="M94 74 140 48 140 94 94 120Z" fill="#4285d6" />
      <g fill="none" stroke="#fff" strokeWidth="1.5" opacity=".7">
        <path d="M63 39 109 65M79 30 125 56M63 57 109 31M79 66 125 40" />
        <path d="M48 63 94 89 140 63M48 79 94 105 140 79M63 57V103M79 66V112M109 65V112M125 56V103" />
      </g>
      <text x="168" y="63" fill="#234d83" fontSize="24" fontWeight="500" textAnchor="middle">3³</text>
      <text x="168" y="87" fill="#4b607c" fontSize="16" textAnchor="middle">= 27</text>
    </> : journeyId === 'fractions' ? <>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(part => <rect key={part} x={25 + part * 24} y="38" width="21" height="34" rx="4" fill={part < 4 ? '#13856e' : '#e0eee8'} />)}
      <path d="M26 98H214M26 94V102M120 94V102M214 94V102" stroke="#64766c" strokeWidth="2" />
      <circle cx="120" cy="98" r="5" fill="#13856e" />
      <text x="120" y="126" fill="#295e4d" fontSize="16" textAnchor="middle">4/8 = 1/2</text>
    </> : journeyId === 'data' ? <>
      <path d="M36 110H208" stroke="#b7c3d4" strokeWidth="2" />
      {[{ value: 20, x: 55 }, { value: 30, x: 105 }, { value: 25, x: 155 }].map(bar => <g key={bar.x}>
        <rect x={bar.x} y={110 - bar.value * 2} width="30" height={bar.value * 2} rx="5" fill={bar.value === 30 ? '#7064bc' : '#bcb3e5'} />
        <text x={bar.x + 15} y={100 - bar.value * 2} textAnchor="middle" fill="#55497f" fontSize="16">{bar.value}</text>
      </g>)}
    </> : null}
  </svg>;
}
