import { C, cardGradient, shadow, dot, glasses, shoes, headShaded, hairCapShaded, ear, SKIN_DEFAULT, SKIN_DEEP, SKIN_DEEPER } from "./palette.jsx";

const S = {};

/* ── Wide scene (128×96) ── */

S.loop = { vb: "0 0 128 96", el: (
  <g>
    {cardGradient("g-loop", 128, 96, 24)}
    <g id="shadows">{shadow(64, 80, 34, 5)}</g>
    <g id="props">
      <defs>
        <radialGradient id="g-loop-rim" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor={C.metalLight} /><stop offset="100%" stopColor={C.metalDark} />
        </radialGradient>
        <radialGradient id="g-loop-n1" cx="50%" cy="45%" r="70%"><stop offset="0%" stopColor={C.blueLight}/><stop offset="100%" stopColor={C.blue}/></radialGradient>
        <radialGradient id="g-loop-n2" cx="50%" cy="45%" r="70%"><stop offset="0%" stopColor={C.amber}/><stop offset="100%" stopColor={C.orange}/></radialGradient>
        <radialGradient id="g-loop-n3" cx="50%" cy="45%" r="70%"><stop offset="0%" stopColor={C.tealLight}/><stop offset="100%" stopColor={C.teal}/></radialGradient>
        <radialGradient id="g-loop-n4" cx="50%" cy="45%" r="70%"><stop offset="0%" stopColor={C.greenLight}/><stop offset="100%" stopColor={C.green}/></radialGradient>
      </defs>
      <circle cx="64" cy="48" r="25" fill="none" stroke="url(#g-loop-rim)" strokeWidth="2.6" strokeDasharray="1 8" strokeLinecap="round" />
      <circle cx="64" cy="23" r="8" fill="url(#g-loop-n1)" stroke={C.card} strokeWidth="3" />
      <circle cx="89" cy="48" r="8" fill="url(#g-loop-n2)" stroke={C.card} strokeWidth="3" />
      <circle cx="64" cy="73" r="8" fill="url(#g-loop-n3)" stroke={C.card} strokeWidth="3" />
      <circle cx="39" cy="48" r="8" fill="url(#g-loop-n4)" stroke={C.card} strokeWidth="3" />
    </g>
  </g>
) };

/* ═══ Wide showcase scenes (800×450, semantic groups) ═══ */

/* COLLAB — two partners meeting at a table over a laptop */
S.collab = { vb: "0 0 800 450", el: (
  <>
    <g id="background">
      {cardGradient("g-collab-card", 800, 450, 24)}
    </g>
    <g id="shadows">
      <ellipse cx="252" cy="388" rx="72" ry="11" fill="#000000" opacity="0.1" />
      <ellipse cx="425" cy="382" rx="120" ry="10" fill="#000000" opacity="0.08" />
      <ellipse cx="612" cy="388" rx="88" ry="11" fill="#000000" opacity="0.1" />
    </g>
    <g id="furniture">
      <defs>
        <linearGradient id="g-collab-top" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.white}/><stop offset="100%" stopColor={C.greyLight}/></linearGradient>
        <linearGradient id="g-collab-metal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.metalLight}/><stop offset="100%" stopColor={C.metalDark}/></linearGradient>
        <linearGradient id="g-collab-side" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.white}/><stop offset="100%" stopColor={C.greyLight}/></linearGradient>
      </defs>
      <rect x="308" y="252" width="230" height="14" rx="7" fill="url(#g-collab-top)" />
      <rect x="326" y="266" width="10" height="104" fill="url(#g-collab-metal)" />
      <rect x="510" y="266" width="10" height="104" fill="url(#g-collab-metal)" />
      <rect x="648" y="204" width="14" height="152" rx="7" fill="url(#g-collab-side)" />
      <rect x="584" y="296" width="96" height="12" rx="6" fill="url(#g-collab-top)" />
      <rect x="596" y="308" width="9" height="62" fill="url(#g-collab-metal)" />
      <rect x="660" y="308" width="9" height="62" fill="url(#g-collab-metal)" />
    </g>
    <g id="props">
      <defs>
        <radialGradient id="g-collab-screen" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor={C.metalLight} /><stop offset="100%" stopColor={C.metalDark} />
        </radialGradient>
        <radialGradient id="g-collab-btn1" cx="50%" cy="40%" r="65%"><stop offset="0%" stopColor={C.blueLight}/><stop offset="100%" stopColor={C.blue}/></radialGradient>
        <linearGradient id="g-collab-line1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.orangeLight}/><stop offset="100%" stopColor={C.orange}/></linearGradient>
        <linearGradient id="g-collab-line2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.magentaLight}/><stop offset="100%" stopColor={C.magenta}/></linearGradient>
        <radialGradient id="g-collab-led" cx="50%" cy="45%" r="60%"><stop offset="0%" stopColor={C.tealLight}/><stop offset="100%" stopColor={C.teal}/></radialGradient>
      </defs>
      <rect x="398" y="193" width="84" height="52" rx="6" fill="url(#g-collab-screen)" stroke={C.metalDark} strokeWidth="1.5" />
      <path d="M418 230a22 22 0 0 1 44 0" fill="none" stroke={C.white} strokeWidth="4" strokeLinecap="round" />
      <path d="M428 218a34 34 0 0 1 24 0" fill="none" stroke={C.white} strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      {dot(440, 238, 3.4, C.white)}
      <rect x="386" y="245" width="108" height="7" rx="3.5" fill={C.metalDark} />
      <rect x="336" y="244" width="48" height="8" rx="3" fill="url(#g-collab-line1)" />
      <rect x="342" y="236" width="42" height="8" rx="3" fill="url(#g-collab-line2)" />
      <rect x="500" y="240" width="16" height="12" rx="3" fill="url(#g-collab-led)" />
    </g>
    <g id="character">
      {/* left — standing, reaching toward the laptop */}
      <defs>
        <linearGradient id="g-collab-pants" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.trousersLight}/><stop offset="100%" stopColor={C.trousers}/></linearGradient>
        <linearGradient id="g-collab-shirt" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.blueLight}/><stop offset="100%" stopColor={C.blue}/></linearGradient>
      </defs>
      <path d="M238 306L234 374" fill="none" stroke="url(#g-collab-pants)" strokeWidth="15" strokeLinecap="round" />
      <path d="M262 306L268 374" fill="none" stroke="url(#g-collab-pants)" strokeWidth="15" strokeLinecap="round" />
      {shoes(220, 256, 374)}
      <path d="M232 310C222 278 224 250 238 236L270 236C284 252 284 282 274 310Z" fill="url(#g-collab-shirt)" />
      <path d="M266 246C296 254 324 250 348 240" fill="none" stroke={C.blue} strokeWidth="13" strokeLinecap="round" />
      {dot(352, 239, 7, C.skinMid)}
      <rect x="246" y="222" width="14" height="18" fill={C.skinMid} />
      {headShaded(253, 196, 28, SKIN_DEFAULT)}
      {ear(238, 198, 5.5, C.skinShade)}
      {hairCapShaded(253, 196, 28, C.hair)}
      {glasses(263, 281, 196)}
      {/* right — seated at the chair, typing */}
      <path d="M600 300L520 296" fill="none" stroke="url(#g-collab-pants)" strokeWidth="16" strokeLinecap="round" />
      <path d="M518 296L512 372" fill="none" stroke="url(#g-collab-pants)" strokeWidth="13" strokeLinecap="round" />
      <path d="M612 304L536 300" fill="none" stroke={C.trousersLight} strokeWidth="14" strokeLinecap="round" />
      <path d="M534 300L530 372" fill="none" stroke={C.trousersLight} strokeWidth="12" strokeLinecap="round" />
      {shoes(496, 514, 374)}
      <defs>
        <linearGradient id="g-collab-shirt2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.magentaLight}/><stop offset="100%" stopColor={C.magenta}/></linearGradient>
      </defs>
      <path d="M566 302C556 268 560 240 578 228L610 228C620 244 618 274 608 302Z" fill="url(#g-collab-shirt2)" />
      <path d="M584 244C566 248 546 250 478 250" fill="none" stroke={C.magenta} strokeWidth="12" strokeLinecap="round" />
      {dot(472, 250, 6.5, C.skinDeep)}
      <rect x="586" y="216" width="13" height="16" fill={C.skinDeep} />
      {headShaded(592, 196, 28, SKIN_DEEP)}
      {ear(605, 198, 5, C.skinShadeDeep)}
      {hairCapShaded(592, 196, 28, C.hairDark)}
      <g fill="none" stroke={C.charcoal} strokeWidth="2.6">
        <circle cx="560" cy="196" r="7" />
        <circle cx="578" cy="196" r="7" />
        <path d="M567 196h4" />
      </g>
    </g>
  </>
) };

/* STUDY — a student working at a desk with a laptop and earbuds */
S.study = { vb: "0 0 800 450", el: (
  <>
    <g id="background">
      {cardGradient("g-study-card", 800, 450, 24)}
    </g>
    <g id="shadows">
      <ellipse cx="400" cy="392" rx="230" ry="12" fill="#000000" opacity="0.1" />
    </g>
    <g id="furniture">
      <defs>
        <linearGradient id="g-study-top" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.white}/><stop offset="100%" stopColor={C.greyLight}/></linearGradient>
        <linearGradient id="g-study-metal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.metalLight}/><stop offset="100%" stopColor={C.metalDark}/></linearGradient>
      </defs>
      <rect x="230" y="278" width="340" height="14" rx="7" fill="url(#g-study-top)" />
      <rect x="252" y="292" width="11" height="92" fill="url(#g-study-metal)" />
      <rect x="537" y="292" width="11" height="92" fill="url(#g-study-metal)" />
    </g>
    <g id="character">
      <defs>
        <linearGradient id="g-study-shirt" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.blueLight}/><stop offset="100%" stopColor={C.blue}/></linearGradient>
        <linearGradient id="g-study-pants" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.trousersLight}/><stop offset="100%" stopColor={C.trousers}/></linearGradient>
      </defs>
      <path d="M330 240C330 200 356 176 400 176C444 176 470 200 470 240L470 278L330 278Z" fill="url(#g-study-shirt)" />
      <path d="M348 232C344 258 344 268 346 278" fill="none" stroke={C.blue} strokeWidth="13" strokeLinecap="round" />
      <path d="M452 232C456 258 456 268 454 278" fill="none" stroke={C.blue} strokeWidth="13" strokeLinecap="round" />
      {dot(346, 278, 7, C.skin)}
      {dot(454, 278, 7, C.skin)}
      <rect x="386" y="164" width="28" height="18" fill={C.skin} />
      {headShaded(400, 142, 34, SKIN_DEFAULT)}
      {hairCapShaded(400, 142, 34, C.hairDark)}
      {ear(369, 144, 6, C.skinShade)}
      {ear(431, 144, 6, C.skinShade)}
      {/* earbuds — glossy dark stems with a shiny tip */}
      {dot(369, 146, 4, "#11141a")}
      {dot(431, 146, 4, "#11141a")}
      <path d="M369 148C376 178 388 196 400 206M431 148C424 178 412 196 400 206" fill="none" stroke={C.white} strokeWidth="2.4" opacity="0.85" />
    </g>
    <g id="props">
      <defs>
        <radialGradient id="g-study-screen" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={C.metalLight} /><stop offset="100%" stopColor={C.metalDark} />
        </radialGradient>
      </defs>
      <rect x="352" y="196" width="96" height="76" rx="8" fill="url(#g-study-screen)" stroke={C.metalDark} strokeWidth="1.5" />
      {dot(400, 234, 7, C.white)}
      <rect x="344" y="270" width="112" height="8" rx="4" fill={C.metalDark} />
      <rect x="278" y="262" width="54" height="9" rx="3" fill={C.orange} />
      <rect x="284" y="253" width="46" height="9" rx="3" fill={C.magenta} />
      <rect x="490" y="256" width="20" height="15" rx="3" fill={C.teal} />
      <path d="M510 260a7 7 0 0 1 0 10" fill="none" stroke={C.teal} strokeWidth="3.4" strokeLinecap="round" />
    </g>
  </>
) };

/* TEACH — a teacher explaining at a board */
S.teach = { vb: "0 0 800 450", el: (
  <>
    <g id="background">
      {cardGradient("g-teach-card", 800, 450, 24)}
    </g>
    <g id="shadows">
      <ellipse cx="330" cy="390" rx="80" ry="11" fill="#000000" opacity="0.1" />
      <ellipse cx="600" cy="392" rx="120" ry="11" fill="#000000" opacity="0.08" />
    </g>
    <g id="furniture">
      <defs>
        <linearGradient id="g-teach-board" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.white}/><stop offset="100%" stopColor={C.greyLight}/></linearGradient>
        <linearGradient id="g-teach-shelf" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.metalLight}/><stop offset="100%" stopColor={C.metalDark}/></linearGradient>
      </defs>
      <rect x="120" y="90" width="360" height="230" rx="14" fill="url(#g-teach-board)" stroke={C.metalLight} strokeWidth="1.2" />
      <rect x="508" y="292" width="200" height="13" rx="6.5" fill="url(#g-teach-shelf)" />
      <rect x="524" y="305" width="10" height="80" fill="url(#g-teach-shelf)" />
      <rect x="684" y="305" width="10" height="80" fill="url(#g-teach-shelf)" />
    </g>
    <g id="props">
      <defs>
        <linearGradient id="g-teach-line" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={C.blue}/><stop offset="100%" stopColor={C.teal}/></linearGradient>
        <radialGradient id="g-teach-disp1" cx="50%" cy="40%" r="65%"><stop offset="0%" stopColor={C.blueLight}/><stop offset="100%" stopColor={C.blue}/></radialGradient>
        <radialGradient id="g-teach-disp2" cx="50%" cy="40%" r="65%"><stop offset="0%" stopColor={C.amber}/><stop offset="100%" stopColor={C.orange}/></radialGradient>
      </defs>
      <path d="M160 240l60-52 46 34 72-62" fill="none" stroke="url(#g-teach-line)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M160 262h180" stroke="url(#g-teach-line)" strokeWidth="7" strokeLinecap="round" />
      <rect x="560" y="262" width="52" height="30" rx="4" fill="url(#g-teach-disp1)" />
      <rect x="620" y="270" width="44" height="22" rx="4" fill="url(#g-teach-disp2)" />
    </g>
    <g id="character">
      <defs>
        <linearGradient id="g-teach-pants" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.trousersLight}/><stop offset="100%" stopColor={C.trousers}/></linearGradient>
        <linearGradient id="g-teach-shirt" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.magentaLight}/><stop offset="100%" stopColor={C.magenta}/></linearGradient>
      </defs>
      <path d="M322 314L318 382" fill="none" stroke="url(#g-teach-pants)" strokeWidth="15" strokeLinecap="round" />
      <path d="M346 314L352 382" fill="none" stroke="url(#g-teach-pants)" strokeWidth="15" strokeLinecap="round" />
      {shoes(304, 338, 382)}
      <path d="M316 318C306 286 308 258 322 244L354 244C368 260 368 290 358 318Z" fill="url(#g-teach-shirt)" />
      <path d="M350 254C372 240 390 232 404 228" fill="none" stroke={C.magenta} strokeWidth="13" strokeLinecap="round" />
      {dot(408, 227, 7, C.skin)}
      <rect x="330" y="230" width="14" height="18" fill={C.skin} />
      {headShaded(337, 204, 29, SKIN_DEFAULT)}
      {ear(322, 206, 5.5, C.skinShade)}
      {hairCapShaded(337, 204, 29, C.hairDark)}
      <g fill="none" stroke={C.charcoal} strokeWidth="2.6">
        <circle cx="347" cy="204" r="7" />
        <circle cx="365" cy="204" r="7" />
        <path d="M354 204h4" />
      </g>
    </g>
  </>
) };

/* TEAMWORK — three people around a round table with a laptop */
S.teamwork = { vb: "0 0 800 450", el: (
  <>
    <g id="background">
      {cardGradient("g-teamwork-card", 800, 450, 24)}
    </g>
    <g id="shadows">
      <ellipse cx="400" cy="396" rx="250" ry="13" fill="#000000" opacity="0.09" />
    </g>
    <g id="furniture">
      <defs>
        <radialGradient id="g-tw-table" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor={C.white} /><stop offset="100%" stopColor={C.greyLight} />
        </radialGradient>
        <linearGradient id="g-tw-leg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.metalLight}/><stop offset="100%" stopColor={C.metalDark}/></linearGradient>
        <radialGradient id="g-tw-base" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor={C.metalLight}/><stop offset="100%" stopColor={C.metalDark}/></radialGradient>
      </defs>
      <ellipse cx="400" cy="292" rx="190" ry="26" fill="url(#g-tw-table)" stroke={C.metalLight} strokeWidth="1.3" />
      <rect x="392" y="300" width="16" height="90" fill="url(#g-tw-leg)" />
      <ellipse cx="400" cy="392" rx="60" ry="9" fill="url(#g-tw-base)" />
    </g>
    <g id="props">
      <defs>
        <radialGradient id="g-tw-screen" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={C.metalLight} /><stop offset="100%" stopColor={C.metalDark} />
        </radialGradient>
        <linearGradient id="g-tw-tape" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.amber}/><stop offset="100%" stopColor={C.orange}/></linearGradient>
        <linearGradient id="g-tw-note1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.magentaLight}/><stop offset="100%" stopColor={C.magenta}/></linearGradient>
      </defs>
      <rect x="330" y="252" width="90" height="7" rx="3.5" fill={C.metalDark} />
      <rect x="344" y="204" width="64" height="48" rx="5" fill="url(#g-tw-screen)" stroke={C.metalDark} strokeWidth="1.4" />
      {dot(376, 234, 4.5, C.white)}
      <rect x="452" y="240" width="52" height="10" rx="3" fill="url(#g-tw-tape)" />
      <rect x="458" y="230" width="44" height="10" rx="3" fill="url(#g-tw-note1)" />
    </g>
    <g id="character">
      <defs>
        <linearGradient id="g-tw-pants" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.trousersLight}/><stop offset="100%" stopColor={C.trousers}/></linearGradient>
        <linearGradient id="g-tw-shirt1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.blueLight}/><stop offset="100%" stopColor={C.blue}/></linearGradient>
        <linearGradient id="g-tw-shirt2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.magentaLight}/><stop offset="100%" stopColor={C.magenta}/></linearGradient>
        <linearGradient id="g-tw-shirt3" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.orangeLight}/><stop offset="100%" stopColor={C.orange}/></linearGradient>
      </defs>
      {/* left — seated on stool */}
      <path d="M228 296L224 296" fill="none" stroke="url(#g-tw-pants)" strokeWidth="15" strokeLinecap="round" />
      <path d="M226 296L238 296" fill="none" stroke="url(#g-tw-pants)" strokeWidth="15" strokeLinecap="round" />
      <path d="M240 296L236 380" fill="none" stroke="url(#g-tw-pants)" strokeWidth="13" strokeLinecap="round" />
      <path d="M228 296L206 340 208 380" fill="none" stroke="url(#g-tw-pants)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      {shoes(196, 226, 382)}
      <path d="M212 300C204 268 208 244 224 232L254 232C266 246 266 274 256 300Z" fill="url(#g-tw-shirt1)" />
      <path d="M250 246C270 252 290 254 318 252" fill="none" stroke={C.blue} strokeWidth="12" strokeLinecap="round" />
      {dot(322, 252, 6.5, C.skinMid)}
      {headShaded(236, 202, 27, SKIN_DEFAULT)}
      {ear(224, 204, 5, C.skinShade)}
      {hairCapShaded(236, 202, 27, C.hair)}
      {/* right — seated on stool */}
      <path d="M574 296L562 296" fill="none" stroke="url(#g-tw-pants)" strokeWidth="15" strokeLinecap="round" />
      <path d="M574 296L586 296" fill="none" stroke="url(#g-tw-pants)" strokeWidth="15" strokeLinecap="round" />
      <path d="M572 296L576 380" fill="none" stroke="url(#g-tw-pants)" strokeWidth="13" strokeLinecap="round" />
      <path d="M586 296L606 340 604 380" fill="none" stroke="url(#g-tw-pants)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      {shoes(594, 564, 382)}
      <path d="M546 300C538 268 542 244 558 232L588 232C600 246 600 274 590 300Z" fill="url(#g-tw-shirt2)" />
      <path d="M552 246C532 252 512 254 486 252" fill="none" stroke={C.magenta} strokeWidth="12" strokeLinecap="round" />
      {dot(482, 252, 6.5, C.skin)}
      {headShaded(574, 202, 27, SKIN_DEEP)}
      {ear(586, 204, 5, C.skinShade)}
      {hairCapShaded(574, 202, 27, C.hairDark)}
      {glasses(560, 576, 202, 6)}
      {/* standing behind the table */}
      <path d="M394 318L390 384" fill="none" stroke="url(#g-tw-pants)" strokeWidth="14" strokeLinecap="round" />
      <path d="M414 318L420 384" fill="none" stroke="url(#g-tw-pants)" strokeWidth="14" strokeLinecap="round" />
      {shoes(378, 408, 386)}
      <path d="M386 322C378 292 380 268 392 256L420 256C432 270 432 296 424 322Z" fill="url(#g-tw-shirt3)" />
      <rect x="400" y="244" width="12" height="16" fill={C.skinMid} />
      {headShaded(406, 220, 26, SKIN_DEEPER)}
      {hairCapShaded(406, 220, 26, C.hairDark)}
      {ear(394, 222, 4.6, C.skinShade)}
    </g>
  </>
) };

export default S;
