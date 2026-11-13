import { C, cardGradient, shadow, dot, legs, shoes, headShaded, hairCapShaded, ear, SKIN_DEFAULT, SKIN_DEEP, SKIN_DEEPER } from "./palette.jsx";

const S = {};

/* ── Portrait scenes (120×160) — flat people, HIG anatomy ── */

S.student = { vb: "0 0 120 160", el: (
  <g>
    {cardGradient("g-student-card", 120, 160, 24)}
    <g id="shadows">{shadow(60, 146, 30, 5)}</g>
    <g id="character">
      {legs(51, 62, 108, 30, 6, C.trousersLight)}
      {shoes(54, 66, 140)}
      <defs>
        <linearGradient id="g-student-top" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.blueLight} /><stop offset="100%" stopColor={C.blue} />
        </linearGradient>
      </defs>
      <path d="M44 76c0-3.3 2.7-6 6-6h20c3.3 0 6 2.7 6 6v26c0 3.3-2.7 6-6 6H50c-3.3 0-6-2.7-6-6z" fill="url(#g-student-top)" />
      <rect x="56.5" y="62" width="7" height="12" fill={C.skin} />
      {headShaded(60, 56, 14, SKIN_DEFAULT)}
      {hairCapShaded(60, 56, 14, C.hair)}
      {ear(49.5, 57, 3, C.skinShade)}
      {/* glossy eye catch-light */}
      {dot(55, 54, 2.2, C.white)}
    </g>
    <g id="props">
      <defs>
        <linearGradient id="g-student-screen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.metalLight} /><stop offset="100%" stopColor={C.metalDark} />
        </linearGradient>
      </defs>
      <rect x="45" y="96" width="30" height="20" rx="3" fill="url(#g-student-screen)" />
      <path d="M51 103h18M51 109h13" stroke={C.blue} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  </g>
) };

S.teacher = { vb: "0 0 120 160", el: (
  <g>
    {cardGradient("g-teacher-card", 120, 160, 24)}
    <g id="shadows">{shadow(60, 146, 30, 5)}</g>
    <g id="furniture">
      <defs>
        <linearGradient id="g-teacher-board" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.white} /><stop offset="100%" stopColor={C.greyLight} />
        </linearGradient>
      </defs>
      <rect x="26" y="24" width="68" height="44" rx="8" fill="url(#g-teacher-board)" stroke={C.metalLight} strokeWidth="1.2" />
    </g>
    <g id="props">
      <path d="M34 56l11-10 8 6 13-14" fill="none" stroke={C.teal} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <g id="character">
      {legs(51, 62, 108, 28, 6.5, C.trousers)}
      {shoes(54, 66, 140)}
      <defs>
        <linearGradient id="g-teacher-top" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.magentaLight} /><stop offset="100%" stopColor={C.magenta} />
        </linearGradient>
      </defs>
      <path d="M46 78c0-3.3 2.7-6 6-6h16c3.3 0 6 2.7 6 6v28c0 3.3-2.7 6-6 6H52c-3.3 0-6-2.7-6-6z" fill="url(#g-teacher-top)" />
      <path d="M56 80Q48 72 42 64" fill="none" stroke={C.magenta} strokeWidth="7" strokeLinecap="round" />
      {dot(41, 62, 4, C.skin)}
      <rect x="56.5" y="66" width="7" height="12" fill={C.skinMid} />
      {headShaded(60, 58, 14, SKIN_DEFAULT)}
      {hairCapShaded(60, 58, 14, C.hairDark)}
      {ear(49.5, 60, 3, C.skinShade)}
      {dot(55, 56, 2.4, C.white)}
    </g>
  </g>
) };

S.parent = { vb: "0 0 120 160", el: (
  <g>
    {cardGradient("g-parent-card", 120, 160, 24)}
    <g id="shadows">{shadow(60, 146, 32, 5)}</g>
    <g id="character">
      {legs(38, 48, 112, 28, 6.5, C.trousers)}
      {shoes(41, 52, 142)}
      <defs>
        <linearGradient id="g-parent-top" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.magentaLight} /><stop offset="100%" stopColor={C.magenta} />
        </linearGradient>
        <linearGradient id="g-parent-top2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.blueLight} /><stop offset="100%" stopColor={C.blue} />
        </linearGradient>
      </defs>
      <path d="M34 78c0-3.3 2.7-6 6-6h14c3.3 0 6 2.7 6 6v26c0 3.3-2.7 6-6 6H40c-3.3 0-6-2.7-6-6z" fill="url(#g-parent-top)" />
      <rect x="43.5" y="68" width="7" height="12" fill={C.skinMid} />
      {headShaded(47, 61, 12, SKIN_DEFAULT)}
      {hairCapShaded(47, 61, 12, C.hair)}
      {ear(36.5, 63, 2.6, C.skinShade)}
      {legs(76, 84, 120, 20, 5.5, C.trousers)}
      {shoes(79, 87, 140)}
      <path d="M74 106c0-2.8 2.2-5 5-5h8c2.8 0 5 2.2 5 5v12c0 2.8-2.2 5-5 5h-8c-2.8 0-5-2.2-5-5z" fill="url(#g-parent-top2)" />
      <rect x="79" y="100" width="6" height="8" fill={C.skin} />
      {headShaded(82, 95, 9, SKIN_DEFAULT)}
      {hairCapShaded(82, 95, 9, C.hairDark)}
      {ear(74.5, 96.5, 2, C.skinShade)}
      <path d="M58 88Q68 98 76 102" fill="none" stroke={C.magenta} strokeWidth="6.5" strokeLinecap="round" />
      {dot(77, 103, 3.4, C.skin)}
    </g>
  </g>
) };

S.team = { vb: "0 0 120 160", el: (
  <g>
    {cardGradient("g-team-card", 120, 160, 24)}
    <g id="shadows">{shadow(60, 146, 34, 5.5)}</g>
    <g id="character">
      <defs>
        <linearGradient id="g-team-top1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.tealLight}/><stop offset="100%" stopColor={C.teal}/></linearGradient>
        <linearGradient id="g-team-top2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.blueLight}/><stop offset="100%" stopColor={C.blue}/></linearGradient>
        <linearGradient id="g-team-top3" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.orangeLight}/><stop offset="100%" stopColor={C.orange}/></linearGradient>
      </defs>
      {legs(29, 38, 108, 34, 5.5, C.trousers)}
      {shoes(31.5, 41, 142)}
      <path d="M27 76c0-3 2.4-5.5 5.5-5.5h7c3 0 5.5 2.5 5.5 5.5v30c0 3-2.5 5.5-5.5 5.5h-7c-3 0-5.5-2.5-5.5-5.5z" fill="url(#g-team-top1)" />
      {headShaded(36, 62, 11, SKIN_DEEP)}
      {hairCapShaded(36, 62, 11, C.hairDark)}
      {legs(54, 63, 102, 40, 6, C.trousersLight)}
      {shoes(57, 66, 142)}
      <path d="M50 68c0-3.3 2.7-6 6-6h8c3.3 0 6 2.7 6 6v32c0 3.3-2.7 6-6 6h-8c-3.3 0-6-2.7-6-6z" fill="url(#g-team-top2)" />
      {headShaded(60, 54, 11.5, SKIN_DEFAULT)}
      {hairCapShaded(60, 54, 11.5, C.hair)}
      {legs(80, 89, 108, 34, 5.5, C.trousers)}
      {shoes(82.5, 92, 142)}
      <path d="M78 76c0-3 2.4-5.5 5.5-5.5h7c3 0 5.5 2.5 5.5 5.5v30c0 3-2.5 5.5-5.5 5.5h-7c-3 0-5.5-2.5-5.5-5.5z" fill="url(#g-team-top3)" />
      {headShaded(87, 62, 11, SKIN_DEEPER)}
      {hairCapShaded(87, 62, 11, C.hairDark)}
    </g>
  </g>
) };

export default S;
