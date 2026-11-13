import { C, cardGradient, shadow, dot } from "./palette.jsx";

const S = {};

/* ── 96×96 scenes ── */

S.learn = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-learn", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <path d="M30 37c6-3 11-3 17-1v26c-6-2-11-2-17 1z" fill={C.white} />
      <path d="M66 37c-6-3-11-3-17-1v26c6-2 11-2 17 1z" fill={C.blue} />
      <path d="M56 36v10l4-3.2 4 3.2V36z" fill={C.orange} />
      <path d="M34 45h9M34 51h7" stroke={C.metalDark} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M53 47h9M53 53h7" stroke={C.white} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  </g>
) };

S.ask = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-ask", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <path d="M30 28h36a10 10 0 0 1 10 10v10a10 10 0 0 1-10 10H44l-12 9 3-9h-5a10 10 0 0 1-10-10V38a10 10 0 0 1 10-10z" fill={C.blue} />
      {dot(40, 43, 2.8, C.white)}{dot(48, 43, 2.8, C.white)}{dot(56, 43, 2.8, C.white)}
      <rect x="58" y="52" width="20" height="14" rx="7" fill={C.white} />
      {dot(64, 59, 2, C.teal)}{dot(70, 59, 2, C.teal)}{dot(76, 59, 2, C.teal)}
    </g>
  </g>
) };

S.practice = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-practice", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-pr-circle" cx="40%" cy="32%" r="75%">
          <stop offset="0%" stopColor={C.blueLight} />
          <stop offset="100%" stopColor={C.blue} />
        </radialGradient>
      </defs>
      <circle cx="46" cy="47" r="21" fill="url(#g-pr-circle)" />
      <circle cx="46" cy="47" r="13.5" fill={C.white} />
      <circle cx="46" cy="47" r="6.5" fill={C.orange} />
      <path d="M60 61l12 12" stroke={C.charcoal} strokeWidth="7" strokeLinecap="round" />
    </g>
  </g>
) };

S.build = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-build", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <rect x="27" y="26" width="42" height="15" rx="7.5" fill={C.blue} />
      <path d="M35 30.5l6 4-6 4" fill="none" stroke={C.white} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="27" y="46" width="24" height="15" rx="7.5" fill={C.amber} />
      <rect x="56" y="46" width="13" height="15" rx="6.5" fill={C.green} />
    </g>
  </g>
) };

S.updates = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-updates", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-up-bell" cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor={C.amber} />
          <stop offset="100%" stopColor={C.orange} />
        </radialGradient>
      </defs>
      <path d="M48 24c11 0 17 8 17 17v9c0 4 2.4 6.4 4.8 8.6H26.2c2.4-2.2 4.8-4.6 4.8-8.6v-9c0-9 6-17 17-17z" fill="url(#g-up-bell)" />
      <path d="M42 70a6 6 0 0 0 12 0z" fill={C.charcoal} />
      <path d="M27 40c0-9 5-15 12-18M69 40c0-9-5-15-12-18" fill="none" stroke={C.charcoal} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="64" cy="27" r="7" fill={C.orange} stroke={C.card} strokeWidth="2.5" />
    </g>
  </g>
) };

S.languages = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-languages", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-lang-core" cx="45%" cy="40%" r="70%">
          <stop offset="0%" stopColor={C.blueLight} />
          <stop offset="100%" stopColor={C.blue} />
        </radialGradient>
      </defs>
      <circle cx="44" cy="46" r="19" fill="url(#g-lang-core)" />
      <ellipse cx="44" cy="46" rx="8.5" ry="19" fill="none" stroke={C.white} strokeWidth="2.4" />
      <path d="M25.5 46h37M28 37h32M28 55h32" stroke={C.white} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="65" cy="61" r="9" fill={C.green} stroke={C.card} strokeWidth="2.5" />
      <path d="M65 57v8M61 61h8" stroke={C.white} strokeWidth="2.6" strokeLinecap="round" />
    </g>
  </g>
) };

S.research = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-research", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <circle cx="44" cy="43" r="16" fill={C.white} stroke={C.charcoal} strokeWidth="4.5" />
      <path d="M37 45c2.4-3 4.8-3 7 0s4.6 3 7 0" fill="none" stroke={C.teal} strokeWidth="2.6" strokeLinecap="round" />
      {dot(39, 39, 1.8, C.amber)}
      <path d="M56 55l12 12" stroke={C.charcoal} strokeWidth="7" strokeLinecap="round" />
    </g>
  </g>
) };

S.community = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-community", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-c1" cx="40%" cy="35%" r="75%"><stop offset="0%" stopColor={C.amber}/><stop offset="100%" stopColor={C.orange}/></radialGradient>
        <radialGradient id="g-c2" cx="60%" cy="35%" r="75%"><stop offset="0%" stopColor={C.blueLight}/><stop offset="100%" stopColor={C.blue}/></radialGradient>
        <radialGradient id="g-c3" cx="50%" cy="40%" r="75%"><stop offset="0%" stopColor={C.tealLight}/><stop offset="100%" stopColor={C.teal}/></radialGradient>
      </defs>
      <circle cx="35" cy="42" r="10.5" fill="url(#g-c1)" stroke={C.card} strokeWidth="3" />
      <circle cx="61" cy="42" r="10.5" fill="url(#g-c2)" stroke={C.card} strokeWidth="3" />
      <circle cx="48" cy="58" r="10.5" fill="url(#g-c3)" stroke={C.card} strokeWidth="3" />
      <path d="M30 68c3-6 9-9 18-9s15 3 18 9" fill="none" stroke={C.indigoLight} strokeWidth="4" strokeLinecap="round" />
    </g>
  </g>
) };

S.shield = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-shield", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <linearGradient id="g-shield-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.blueLight} />
          <stop offset="100%" stopColor={C.blue} />
        </linearGradient>
      </defs>
      <path d="M48 22l19 7v17c0 13-8.6 20.6-19 25-10.4-4.4-19-12-19-25V29z" fill="url(#g-shield-fill)" />
      <path d="M39.5 46.5l6.5 6.5 12-13" fill="none" stroke={C.white} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </g>
) };

S.lock = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-lock", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-lock-fill" cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor={C.amber} />
          <stop offset="100%" stopColor={C.orange} />
        </radialGradient>
      </defs>
      <path d="M37 46v-8a11 11 0 0 1 22 0v8" fill="none" stroke={C.metalDark} strokeWidth="6.5" strokeLinecap="round" />
      <rect x="29" y="45" width="38" height="27" rx="11" fill="url(#g-lock-fill)" />
      <circle cx="48" cy="56" r="4" fill={C.charcoal} />
      <rect x="46.4" y="57" width="3.2" height="8" rx="1.6" fill={C.charcoal} />
    </g>
  </g>
) };

S.document = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-document", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <linearGradient id="g-doc-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.white} /><stop offset="100%" stopColor={C.greyLight} />
        </linearGradient>
      </defs>
      <rect x="30" y="23" width="36" height="46" rx="9" fill="url(#g-doc-fill)" stroke={C.metalLight} strokeWidth="1.4" />
      <rect x="36" y="33" width="18" height="3.2" rx="1.6" fill={C.blue} />
      <rect x="36" y="41" width="24" height="3.2" rx="1.6" fill={C.metalDark} />
      <rect x="36" y="49" width="21" height="3.2" rx="1.6" fill={C.metalDark} />
      <rect x="36" y="57" width="14" height="3.2" rx="1.6" fill={C.sky} />
    </g>
  </g>
) };

S.cookie = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-cookie", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-cookie" cx="44%" cy="40%" r="80%">
          <stop offset="0%" stopColor={C.dog} /><stop offset="100%" stopColor={C.metalDark} />
        </radialGradient>
      </defs>
      <circle cx="47" cy="48" r="20" fill="url(#g-cookie)" />
      {dot(40, 41, 2.8, C.charcoal)}{dot(53, 44, 2.8, C.charcoal)}
      {dot(43, 55, 2.8, C.charcoal)}{dot(55, 55, 2.4, C.charcoal)}
    </g>
  </g>
) };

S.accessibility = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-accessibility", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="character">
      <defs>
        <radialGradient id="g-a1" cx="50%" cy="48%" r="70%">
          <stop offset="0%" stopColor={C.white} /><stop offset="100%" stopColor={C.greyLight} />
        </radialGradient>
      </defs>
      <circle cx="48" cy="47" r="22" fill="url(#g-a1)" />
      <circle cx="48" cy="47" r="22" fill="none" stroke={C.blue} strokeWidth="5.5" />
      <circle cx="48" cy="37.5" r="4.2" fill={C.charcoal} />
      <path d="M36.5 45.5h23M48 46.5v8M48 54.5l-7.5 10M48 54.5l7.5 10" fill="none" stroke={C.charcoal} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </g>
) };

S.compass = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-compass", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-cp" cx="50%" cy="48%" r="75%">
          <stop offset="0%" stopColor={C.white} /><stop offset="100%" stopColor={C.greyLight} />
        </radialGradient>
        <radialGradient id="g-cp-n" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor={C.orange} /><stop offset="100%" stopColor={C.amber} />
        </radialGradient>
      </defs>
      <circle cx="48" cy="47" r="20" fill="url(#g-cp)" stroke={C.metalDark} strokeWidth="3.5" />
      <path d="M48 33l5.5 14L48 61l-5.5-14z" fill="url(#g-cp-n)" />
      <path d="M48 33l-5.5 14L48 61l0-14z" fill={C.charcoal} />
      {dot(48, 47, 2.6, C.white)}
      <path d="M48 24.5v-3M48 72.5v-3M70.5 47h3M22.5 47h3" stroke={C.metalDark} strokeWidth="2.6" strokeLinecap="round" />
    </g>
  </g>
) };

S.tag = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-tag", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <g transform="rotate(-24 48 51)">
        <defs>
          <linearGradient id="g-tag-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={C.amber} /><stop offset="100%" stopColor={C.orange} />
          </linearGradient>
        </defs>
        <rect x="29" y="40" width="38" height="23" rx="9" fill="url(#g-tag-fill)" />
        {dot(38.5, 51.5, 3.6, C.white)}
        <path d="M47 51.5h12" stroke={C.white} strokeWidth="3" strokeLinecap="round" />
      </g>
      <path d="M28 46c-5-3-7-9-4-14" fill="none" stroke={C.charcoal} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  </g>
) };

S.download = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-download", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <linearGradient id="g-d-arrow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.greenLight} /><stop offset="100%" stopColor={C.green} />
        </linearGradient>
      </defs>
      <path d="M45 24h6v17h8L48 53 37 41h8z" fill="url(#g-d-arrow)" />
      <rect x="27" y="60" width="42" height="10" rx="5" fill={C.metalDark} />
    </g>
  </g>
) };

S.help = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-help", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-help-c" cx="45%" cy="35%" r="75%">
          <stop offset="0%" stopColor={C.blueLight} /><stop offset="100%" stopColor={C.blue} />
        </radialGradient>
      </defs>
      <circle cx="48" cy="47" r="20" fill="url(#g-help-c)" />
      <path d="M41.5 41a6.6 6.6 0 1 1 9.4 6.2c-2.1 1.2-2.9 2.4-2.9 4.6" fill="none" stroke={C.white} strokeWidth="4.6" strokeLinecap="round" />
      {dot(48, 59, 3.1, C.white)}
    </g>
  </g>
) };

S.briefcase = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-briefcase", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <linearGradient id="g-bc-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.indigoLight} /><stop offset="100%" stopColor={C.indigo} />
        </linearGradient>
      </defs>
      <path d="M41 42v-5a7 7 0 0 1 14 0v5" fill="none" stroke={C.metalDark} strokeWidth="5.5" strokeLinecap="round" />
      <rect x="27" y="41" width="42" height="28" rx="10" fill="url(#g-bc-fill)" />
      <rect x="42.5" y="51" width="11" height="8.5" rx="3.2" fill={C.amber} />
    </g>
  </g>
) };

S.growth = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-growth", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <linearGradient id="g-grow-1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.tealLight}/><stop offset="100%" stopColor={C.teal}/></linearGradient>
        <linearGradient id="g-grow-2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.blueLight}/><stop offset="100%" stopColor={C.blue}/></linearGradient>
        <linearGradient id="g-grow-3" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.greenLight}/><stop offset="100%" stopColor={C.green}/></linearGradient>
        <linearGradient id="g-grow-line" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={C.blue}/><stop offset="100%" stopColor={C.green}/></linearGradient>
      </defs>
      <rect x="29" y="50" width="11" height="16" rx="5" fill="url(#g-grow-1)" />
      <rect x="43.5" y="42" width="11" height="24" rx="5" fill="url(#g-grow-2)" />
      <rect x="58" y="32" width="11" height="34" rx="5" fill="url(#g-grow-3)" />
      <path d="M27 34c9-7 17-5 24-2" fill="none" stroke={C.metalDark} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M52 24l7 6-9 3z" fill={C.metalDark} />
    </g>
  </g>
) };

S.gift = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-gift", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <linearGradient id="g-gift-b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.magentaLight}/><stop offset="100%" stopColor={C.magenta}/></linearGradient>
        <linearGradient id="g-gift-r" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.orangeLight}/><stop offset="100%" stopColor={C.orange}/></linearGradient>
      </defs>
      <path d="M48 37c-7-11-19-7-15-1 2.6 4 10 4 15 1z" fill="url(#g-gift-b)" />
      <path d="M48 37c7-11 19-7 15-1-2.6 4-10 4-15 1z" fill="url(#g-gift-b)" />
      <rect x="30" y="45" width="36" height="23" rx="7" fill="url(#g-gift-b)" />
      <rect x="27" y="37" width="42" height="10" rx="5" fill="url(#g-gift-r)" />
      <rect x="44.6" y="37" width="6.8" height="31" fill={C.white} />
    </g>
  </g>
) };

S.mail = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-mail", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <linearGradient id="g-mail-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.blueLight} /><stop offset="100%" stopColor={C.blue} />
        </linearGradient>
      </defs>
      <rect x="25" y="33" width="46" height="31" rx="9" fill="url(#g-mail-fill)" stroke={C.metalLight} strokeWidth="1.2" />
      <path d="M28 38l20 14 20-14" fill="none" stroke={C.white} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </g>
) };

S.handshake = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-handshake", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="character">
      <defs>
        <linearGradient id="g-hs-l" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.blueLight}/><stop offset="100%" stopColor={C.blue}/></linearGradient>
        <linearGradient id="g-hs-r" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.magentaLight}/><stop offset="100%" stopColor={C.magenta}/></linearGradient>
        <radialGradient id="g-hs-c" cx="50%" cy="50%" r="65%"><stop offset="0%" stopColor={C.tealLight}/><stop offset="100%" stopColor={C.teal}/></radialGradient>
      </defs>
      <path d="M18 64q12-14 28-13" fill="none" stroke="url(#g-hs-l)" strokeWidth="11" strokeLinecap="round" />
      <path d="M78 64q-12-14-28-13" fill="none" stroke="url(#g-hs-r)" strokeWidth="11" strokeLinecap="round" />
      <circle cx="48" cy="51" r="9" fill="url(#g-hs-c)" stroke={C.card} strokeWidth="3.4" />
    </g>
  </g>
) };

S.safety = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-safety", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <linearGradient id="g-sf" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.orangeLight} /><stop offset="100%" stopColor={C.orange} />
        </linearGradient>
      </defs>
      <path d="M48 23l16 6v14.5c0 11-6.8 17.4-16 21-9.2-3.6-16-10-16-21V29z" fill="url(#g-sf)" />
      <path d="M48 51c-4.6-3.6-7.4-6.4-7.4-9.6a4.2 4.2 0 0 1 7.4-2.4 4.2 4.2 0 0 1 7.4 2.4c0 3.2-2.8 6-7.4 9.6z" fill={C.white} />
    </g>
  </g>
) };

S.eye = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-eye", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-eye-white" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor={C.white} /><stop offset="100%" stopColor={C.greyLight} />
        </radialGradient>
        <radialGradient id="g-eye-iris" cx="45%" cy="40%" r="75%">
          <stop offset="0%" stopColor={C.tealLight} /><stop offset="100%" stopColor={C.teal} />
        </radialGradient>
      </defs>
      <path d="M25 48q23-19 46 0-23 19-46 0z" fill="url(#g-eye-white)" />
      <circle cx="48" cy="48" r="9.5" fill="url(#g-eye-iris)" />
      <circle cx="48" cy="48" r="4.2" fill={C.charcoal} />
      <circle cx="50.5" cy="45.5" r="1.5" fill={C.white} />
    </g>
  </g>
) };

S.flag = { vb: "0 0 96 96", el: (
  <g>
    {cardGradient("g-flag", 96, 96, 20)}
    <g id="shadows">{shadow(48, 78, 24, 4)}</g>
    <g id="props">
      <defs>
        <linearGradient id="g-flag-fill" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={C.green} /><stop offset="100%" stopColor={C.teal} />
        </linearGradient>
      </defs>
      <path d="M37 28c9-4 15 2 24-2v17c-9 4-15-2-24 2z" fill="url(#g-flag-fill)" />
      <rect x="31" y="24" width="4.6" height="46" rx="2.3" fill={C.charcoal} />
      <ellipse cx="42" cy="72" rx="10" ry="3" fill={C.greyLight} />
    </g>
  </g>
) };

export default S;
