import { C, cardGradient, shadow, dot } from "./palette.jsx";

const S = {};

/* ── School subjects (96×96) ── */

S.math = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-math", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <linearGradient id="g-math-book" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.white}/><stop offset="100%" stopColor={C.greyLight}/></linearGradient>
      </defs>
      <rect x="30" y="28" width="36" height="40" rx="11" fill="url(#g-math-book)" stroke={C.metalLight} strokeWidth="1.4" />
      <path d="M48 34v12M42 40h12" stroke={C.green} strokeWidth="4" strokeLinecap="round" />
      <path d="M40 54h16M40 60h16" stroke={C.indigo} strokeWidth="4" strokeLinecap="round" />
    </g>
  </g>
) };

S.physics = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-physics", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-ph-core" cx="50%" cy="50%" r="55%"><stop offset="0%" stopColor={C.indigoLight}/><stop offset="100%" stopColor={C.indigo}/></radialGradient>
      </defs>
      <ellipse cx="48" cy="47" rx="20" ry="8" fill="none" stroke="url(#g-ph-core)" strokeWidth="3" transform="rotate(28 48 47)" />
      <ellipse cx="48" cy="47" rx="20" ry="8" fill="none" stroke="url(#g-ph-core)" strokeWidth="3" transform="rotate(-28 48 47)" />
      <circle cx="48" cy="47" r="6.5" fill={C.orange} />
      <circle cx="60" cy="36" r="3.2" fill={C.blue} />
      <circle cx="36" cy="57" r="3.2" fill={C.teal} />
    </g>
  </g>
) };

S.chemistry = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-chemistry", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-ch-flask" cx="48%" cy="42%" r="65%"><stop offset="0%" stopColor={C.white}/><stop offset="100%" stopColor={C.greyLight}/></radialGradient>
        <linearGradient id="g-ch-liquid" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.tealLight}/><stop offset="100%" stopColor={C.teal}/></linearGradient>
      </defs>
      <path d="M42 26h12v13l9.6 19a6.5 6.5 0 0 1-5.8 9.4H38.2A6.5 6.5 0 0 1 32.4 58L42 39z" fill="url(#g-ch-flask)" stroke={C.metalLight} strokeWidth="1.3" />
      <path d="M36.6 51h22.8l4.2 8.4a6 6 0 0 1-5.4 8.6H37.8a6 6 0 0 1-5.4-8.6z" fill="url(#g-ch-liquid)" />
      {dot(43, 59, 2, C.white)}{dot(50, 62, 1.5, C.white)}
      <rect x="40" y="23.5" width="16" height="4.5" rx="2.25" fill={C.teal} />
    </g>
  </g>
) };

S.biology = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-biology", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-bio-leaf" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor={C.greenLight}/><stop offset="100%" stopColor={C.green}/></radialGradient>
      </defs>
      <path d="M49 67c-16-6-21-24-16-36 15 2 28 12 26 27-.8 6-5 9-10 9z" fill="url(#g-bio-leaf)" />
      <path d="M46 64c-2-11-1-19 5-27" fill="none" stroke={C.white} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M49 67c2-9 6-15 13-19" fill="none" stroke={C.charcoal} strokeWidth="3" strokeLinecap="round" />
    </g>
  </g>
) };

S.english = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-english", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-en-book" cx="40%" cy="40%" r="65%"><stop offset="0%" stopColor={C.blueLight}/><stop offset="100%" stopColor={C.blue}/></radialGradient>
      </defs>
      <path d="M32 46c5-2.6 9-2.6 14-.8v20c-5-1.8-9-1.8-14 .8V46z" fill="url(#g-en-book)" />
      <path d="M60 46c-5-2.6-9-2.6-14-.8v20c5-1.8 9-1.8 14 .8V46z" fill={C.white} />
      <circle cx="62" cy="31" r="10" fill={C.white} />
      <path d="M58 39l-3 5 7-3.4z" fill={C.white} />
      {dot(58, 31, 1.7, C.charcoal)}{dot(62, 31, 1.7, C.charcoal)}{dot(66, 31, 1.7, C.charcoal)}
    </g>
  </g>
) };

S.hindi = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-hindi", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-hi-tag" cx="50%" cy="45%" r="60%"><stop offset="0%" stopColor={C.amber}/><stop offset="100%" stopColor={C.orange}/></radialGradient>
      </defs>
      <rect x="27" y="30" width="34" height="24" rx="12" fill="url(#g-hi-tag)" />
      <path d="M35 52l-6 9 13-6.6z" fill={C.amber} />
      <path d="M35 42q4.2-5.4 8.4 0t8.4 0" fill="none" stroke={C.white} strokeWidth="2.8" strokeLinecap="round" />
      {dot(39, 36, 1.8, C.white)}{dot(48, 36, 1.8, C.white)}
      <circle cx="64" cy="56" r="9" fill={C.white} />
      <path d="M60.5 56q3.5-4.4 7 0" fill="none" stroke={C.orange} strokeWidth="2.6" strokeLinecap="round" />
    </g>
  </g>
) };

S.history = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-history", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <linearGradient id="g-his-flag" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.amber}/><stop offset="100%" stopColor={C.orange}/></linearGradient>
        <linearGradient id="g-his-pole" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.metalLight}/><stop offset="100%" stopColor={C.metalDark}/></linearGradient>
      </defs>
      <path d="M29 39L48 28l19 11z" fill="url(#g-his-flag)" stroke={C.metalDark} strokeWidth="1" />
      <rect x="33" y="42" width="6" height="17" rx="3" fill={C.white} />
      <rect x="45" y="42" width="6" height="17" rx="3" fill={C.white} />
      <rect x="57" y="42" width="6" height="17" rx="3" fill={C.white} />
      <rect x="29" y="61" width="38" height="7" rx="3.5" fill="url(#g-his-pole)" />
    </g>
  </g>
) };

S.geography = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-geography", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <linearGradient id="g-geo-cont" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.greenLight} /><stop offset="100%" stopColor={C.green} />
        </linearGradient>
        <linearGradient id="g-geo-pin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.blueLight} /><stop offset="100%" stopColor={C.blue} />
        </linearGradient>
      </defs>
      <path d="M25 62l14-21 9 13 7-10 16 18z" fill="url(#g-geo-cont)" stroke={C.metalDark} strokeWidth="1" />
      <path d="M35.5 46.5L39 41l3.6 5.5-3.6 3z" fill={C.white} />
      <path d="M52.6 49l3.4-5 3.8 5.4-3.8 2.6z" fill={C.white} />
      <circle cx="64" cy="33" r="6" fill="url(#g-geo-pin)" />
    </g>
  </g>
) };

S.computerScience = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-cs", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-cs-screen" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor={C.metalLight} /><stop offset="100%" stopColor={C.metalDark} />
        </radialGradient>
        <radialGradient id="g-cs-led1" cx="45%" cy="45%" r="60%"><stop offset="0%" stopColor={C.orangeLight}/><stop offset="100%" stopColor={C.orange}/></radialGradient>
        <radialGradient id="g-cs-led2" cx="50%" cy="45%" r="60%"><stop offset="0%" stopColor={C.amber}/><stop offset="100%" stopColor={C.orange}/></radialGradient>
        <radialGradient id="g-cs-led3" cx="55%" cy="45%" r="60%"><stop offset="0%" stopColor={C.greenLight}/><stop offset="100%" stopColor={C.green}/></radialGradient>
      </defs>
      <rect x="27" y="30" width="42" height="34" rx="9" fill="url(#g-cs-screen)" />
      {dot(33.5, 36.5, 1.8, "url(#g-cs-led1)")}{dot(39, 36.5, 1.8, "url(#g-cs-led2)")}{dot(44.5, 36.5, 1.8, "url(#g-cs-led3)")}
      <path d="M34 45l6 5-6 5" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="45" y="50.5" width="10" height="3.2" rx="1.6" fill={C.amber} />
    </g>
  </g>
) };

S.economics = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-economics", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-eco-dot1" cx="52%" cy="48%" r="70%"><stop offset="0%" stopColor={C.amber}/><stop offset="100%" stopColor={C.orange}/></radialGradient>
        <radialGradient id="g-eco-dot2" cx="52%" cy="48%" r="70%"><stop offset="0%" stopColor={C.amber}/><stop offset="100%" stopColor={C.orange}/></radialGradient>
        <linearGradient id="g-eco-line" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={C.teal}/><stop offset="100%" stopColor={C.blue}/></linearGradient>
        <radialGradient id="g-eco-arrow" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor={C.blueLight}/><stop offset="100%" stopColor={C.blue}/></radialGradient>
      </defs>
      <circle cx="38" cy="58" r="9" fill="url(#g-eco-dot1)" stroke={C.card} strokeWidth="3" />
      <circle cx="54" cy="60" r="9" fill="url(#g-eco-dot2)" stroke={C.card} strokeWidth="3" />
      <path d="M29 41l13 6 14-12" fill="none" stroke="url(#g-eco-line)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 32l7.4 2.6-4.8 6.8z" fill="url(#g-eco-arrow)" />
    </g>
  </g>
) };

export default S;
