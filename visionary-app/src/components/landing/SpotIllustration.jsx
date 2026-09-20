/**
 * SpotIllustration — flat editorial scenes in the blog.google capture's style.
 * Each scene: a soft TINTED panel (Google four-color tints, not grey) + a bold
 * color-blocked subject with ink details + ground shadow + small accents.
 * Tall scenes (student/teacher/parent/team) are 120×160 for portrait panels;
 * loop is 128×96 for wide featured panels; everything else 96×96 corners.
 * Our own geometry — idea, not copy. Decorative by default (aria-hidden).
 */
const C = {
  blue: "#4285F4",
  blueD: "#1A73E8",
  blueT: "#D2E3FC",
  yellow: "#FBBC04",
  yellowT: "#FCEFBA",
  green: "#34A853",
  greenT: "#CEEAD6",
  red: "#EA4335",
  redT: "#FAD2CF",
  ink: "#202124",
  white: "#FFFFFF",
  shadow: "#E8EAED",
};

const S = {};

/* ── 96×96 card-corner scenes ── */
S.learn = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.blueT} />
    <ellipse cx="48" cy="74" rx="26" ry="4" fill={C.shadow} />
    <path d="M28 42c7-4 13-4 19-1v24c-6-3-12-3-19 1V42z" fill={C.white} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M68 42c-7-4-13-4-19-1v24c6-3 12-3 19 1V42z" fill={C.blue} stroke={C.blueD} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M33 48h9M33 54h9M55 48h8M55 54h8" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
    <path d="M60 34v12l-4-3-4 3V34" fill={C.yellow} stroke={C.ink} strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="24" cy="30" r="3" fill={C.red} />
    <path d="M76 24l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill={C.green} />
  </>
) };

S.ask = { vb: "0 0 96 96", el: (
  <>
    <path d="M12 32c0-9 7-16 16-16h40c9 0 16 7 16 16v26c0 9-7 16-16 16H28c-9 0-16-7-16-16V32z" fill={C.yellowT} />
    <ellipse cx="48" cy="76" rx="28" ry="4" fill={C.shadow} />
    <path d="M26 38a9 9 0 019-9h26a9 9 0 019 9v9a9 9 0 01-9 9H44l-11 10V56h-7a9 9 0 01-9-9v-9z" fill={C.blue} />
    <circle cx="41" cy="42.5" r="2.6" fill={C.white} />
    <circle cx="50" cy="42.5" r="2.6" fill={C.white} />
    <circle cx="59" cy="42.5" r="2.6" fill={C.white} />
    <path d="M60 56a7 7 0 017 7v3a7 7 0 01-7 7h-3v7l-8-7h-5" fill="none" stroke={C.green} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="30" cy="28" r="3" fill={C.red} />
    <path d="M74 26l2 4.5 4.5 2-4.5 2L74 39l-2-4.5-4.5-2 4.5-2L74 26z" fill={C.yellow} />
  </>
) };

S.practice = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.greenT} />
    <ellipse cx="48" cy="76" rx="26" ry="4" fill={C.shadow} />
    <circle cx="46" cy="48" r="20" fill={C.white} stroke={C.blue} strokeWidth="6" />
    <circle cx="46" cy="48" r="9.5" fill={C.blueT} stroke={C.blue} strokeWidth="3" />
    <circle cx="46" cy="48" r="3.2" fill={C.red} />
    <path d="M70 64l9 9" stroke={C.ink} strokeWidth="6" strokeLinecap="round" />
    <path d="M72 24l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" fill={C.yellow} />
    <path d="M24 30c3-4 8-5 12-3" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" />
  </>
) };

S.build = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 32c0-9 7-16 16-16h36c9 0 16 7 16 16v26c0 9-7 16-16 16H30c-9 0-16-7-16-16V32z" fill={C.redT} />
    <ellipse cx="48" cy="76" rx="27" ry="4" fill={C.shadow} />
    <rect x="28" y="54" width="24" height="15" rx="3.5" fill={C.blue} stroke={C.blueD} strokeWidth="2" />
    <rect x="54" y="54" width="22" height="15" rx="3.5" fill={C.green} stroke={C.ink} strokeWidth="2" />
    <rect x="41" y="38" width="24" height="15" rx="3.5" fill={C.yellow} stroke={C.ink} strokeWidth="2" />
    <rect x="28" y="24" width="22" height="13" rx="3.5" fill={C.red} stroke={C.ink} strokeWidth="2" />
    <path d="M34 30l6 4.5-6 4.5" fill="none" stroke={C.white} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="72" cy="28" r="3.4" fill={C.blue} />
  </>
) };

S.updates = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.yellowT} />
    <ellipse cx="48" cy="76" rx="26" ry="4" fill={C.shadow} />
    <path d="M48 27c8.5 0 13 6.5 13 14v8l4.5 7.5H30.5L35 49v-8c0-7.5 4.5-14 13-14z" fill={C.yellow} stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M42.5 60a5.5 5.5 0 0011 0" fill="none" stroke={C.ink} strokeWidth="2.8" strokeLinecap="round" />
    <path d="M48 23v-5" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
    <circle cx="64" cy="31" r="7" fill={C.red} stroke={C.white} strokeWidth="2.4" />
    <path d="M28 38c-2-3-2-7 0-10M68 38c2-3 2-7 0-10" fill="none" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
  </>
) };

S.languages = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.blueT} />
    <ellipse cx="48" cy="76" rx="26" ry="4" fill={C.shadow} />
    <circle cx="44" cy="44" r="18" fill={C.white} stroke={C.blue} strokeWidth="4" />
    <path d="M26 44h36M44 26c-6.5 5.5-6.5 30.5 0 36M44 26c6.5 5.5 6.5 30.5 0 36" fill="none" stroke={C.blue} strokeWidth="3" />
    <rect x="52" y="52" width="26" height="19" rx="5" fill={C.green} stroke={C.ink} strokeWidth="2" />
    <path d="M58 61.5h14M65 56.5v10" stroke={C.white} strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="26" cy="24" r="3" fill={C.yellow} />
  </>
) };

S.research = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.greenT} />
    <ellipse cx="48" cy="76" rx="26" ry="4" fill={C.shadow} />
    <path d="M40 26v14L28 60a7 7 0 006 10.5h28A7 7 0 0068 60L56 40V26" fill={C.white} stroke={C.green} strokeWidth="4" strokeLinejoin="round" />
    <path d="M36 26h24" stroke={C.green} strokeWidth="4.4" strokeLinecap="round" />
    <path d="M33 58h30" stroke={C.greenT} strokeWidth="5" />
    <circle cx="41" cy="62" r="3.4" fill={C.blue} />
    <circle cx="51" cy="66" r="2.6" fill={C.yellow} />
    <circle cx="47" cy="60" r="2" fill={C.red} />
    <circle cx="68" cy="28" r="4" fill={C.blue} />
    <path d="M24 30l6-4" stroke={C.yellow} strokeWidth="3" strokeLinecap="round" />
  </>
) };

S.community = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 32c0-9 7-16 16-16h36c9 0 16 7 16 16v26c0 9-7 16-16 16H30c-9 0-16-7-16-16V32z" fill={C.blueT} />
    <ellipse cx="48" cy="76" rx="28" ry="4" fill={C.shadow} />
    <circle cx="31" cy="42" r="7.5" fill={C.yellow} stroke={C.ink} strokeWidth="1.8" />
    <path d="M20 64c1.5-8 5.5-12 11-12s9.5 4 11 12" fill={C.yellowT} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="65" cy="42" r="7.5" fill={C.blue} stroke={C.ink} strokeWidth="1.8" />
    <path d="M54 64c1.5-8 5.5-12 11-12s9.5 4 11 12" fill={C.blueT} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="48" cy="36" r="9" fill={C.green} stroke={C.ink} strokeWidth="1.8" />
    <path d="M35 62c2-9 7-13 13-13s11 4 13 13" fill={C.greenT} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
    <path d="M70 24c3-2 6-2 8 1" fill="none" stroke={C.red} strokeWidth="2.6" strokeLinecap="round" />
  </>
) };

S.shield = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.blueT} />
    <ellipse cx="48" cy="76" rx="24" ry="4" fill={C.shadow} />
    <path d="M48 24l17 6.5v12.5c0 10.5-6.5 19-17 23.5-10.5-4.5-17-13-17-23.5V30.5L48 24z" fill={C.blue} stroke={C.blueD} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M40.5 46.5l5.5 5.5 10-11" fill="none" stroke={C.white} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M72 24l2.2 5 5 2.2-5 2.2-2.2 5-2.2-5-5-2.2 5-2.2 2.2-5z" fill={C.yellow} />
    <circle cx="26" cy="28" r="3" fill={C.red} />
  </>
) };

S.lock = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.greenT} />
    <ellipse cx="48" cy="76" rx="24" ry="4" fill={C.shadow} />
    <path d="M37 44v-7a11 11 0 0122 0v7" fill="none" stroke={C.yellow} strokeWidth="5.4" />
    <rect x="32" y="44" width="32" height="25" rx="7" fill={C.blue} stroke={C.blueD} strokeWidth="2.4" />
    <circle cx="48" cy="54.5" r="3.6" fill={C.white} />
    <path d="M48 57v6" stroke={C.white} strokeWidth="3.2" strokeLinecap="round" />
    <circle cx="70" cy="30" r="3" fill={C.red} />
  </>
) };

S.document = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.yellowT} />
    <ellipse cx="48" cy="76" rx="24" ry="4" fill={C.shadow} />
    <path d="M33 22h21l11 11v33a4 4 0 01-4 4H33a4 4 0 01-4-4V26a4 4 0 014-4z" fill={C.white} stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M54 22v11h11" fill={C.yellowT} stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M36 48h20M36 55h20M36 62h13" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
    <circle cx="63" cy="63" r="6" fill={C.red} />
    <path d="M60.5 63l2 2 3.5-4" fill="none" stroke={C.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </>
) };

S.cookie = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.yellowT} />
    <ellipse cx="48" cy="76" rx="26" ry="4" fill={C.shadow} />
    <circle cx="48" cy="48" r="20" fill={C.yellow} stroke={C.ink} strokeWidth="2.4" />
    <path d="M60 34a20 20 0 00-14-6" fill="none" stroke={C.white} strokeWidth="4" strokeLinecap="round" />
    <circle cx="41" cy="42" r="3.2" fill={C.ink} />
    <circle cx="55" cy="47" r="2.8" fill={C.ink} />
    <circle cx="45" cy="56" r="2.4" fill={C.ink} />
    <circle cx="58" cy="37" r="2.2" fill={C.ink} />
    <circle cx="51" cy="52" r="1.8" fill={C.ink} />
    <circle cx="70" cy="26" r="3" fill={C.red} />
    <circle cx="25" cy="32" r="2.4" fill={C.blue} />
  </>
) };

S.accessibility = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.blueT} />
    <ellipse cx="48" cy="76" rx="24" ry="4" fill={C.shadow} />
    <circle cx="48" cy="48" r="19" fill={C.white} stroke={C.blue} strokeWidth="4" />
    <circle cx="48" cy="39" r="4" fill={C.ink} />
    <path d="M38 46c6.5 2 13.5 2 20 0" fill="none" stroke={C.ink} strokeWidth="3.4" strokeLinecap="round" />
    <path d="M43 50l-3 12M53 50l3 12M40 56h16" fill="none" stroke={C.ink} strokeWidth="3.4" strokeLinecap="round" />
    <path d="M72 26l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2 2-4.5z" fill={C.green} />
  </>
) };

S.compass = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.redT} />
    <ellipse cx="48" cy="76" rx="25" ry="4" fill={C.shadow} />
    <circle cx="48" cy="48" r="20" fill={C.white} stroke={C.blue} strokeWidth="5" />
    <path d="M57 39l-6 13.5L37.5 59l6-13.5L57 39z" fill={C.yellow} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="48" cy="48" r="2.6" fill={C.red} />
    <path d="M26 26h6M26 26v6" stroke={C.green} strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="71" cy="70" r="2.8" fill={C.blue} />
  </>
) };

S.tag = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.greenT} />
    <ellipse cx="48" cy="76" rx="26" ry="4" fill={C.shadow} />
    <path d="M30 32h17l16 16a5.5 5.5 0 010 8l-8 8a5.5 5.5 0 01-8 0L32 48V32z" fill={C.blue} stroke={C.blueD} strokeWidth="2.2" strokeLinejoin="round" />
    <circle cx="41" cy="41" r="4" fill={C.white} stroke={C.ink} strokeWidth="2" />
    <path d="M50 51l8.5 8.5" stroke={C.white} strokeWidth="2.6" strokeLinecap="round" />
    <path d="M62 30h14M62 36h10" stroke={C.yellow} strokeWidth="4" strokeLinecap="round" />
    <circle cx="28" cy="68" r="2.6" fill={C.red} />
  </>
) };

S.download = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.blueT} />
    <ellipse cx="48" cy="76" rx="26" ry="4" fill={C.shadow} />
    <path d="M48 24v22" stroke={C.green} strokeWidth="6.4" strokeLinecap="round" />
    <path d="M38 37.5L48 47.5l10-10" fill="none" stroke={C.green} strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M31 56h34a5 5 0 015 5v3a5 5 0 01-5 5H31a5 5 0 01-5-5v-3a5 5 0 015-5z" fill={C.blue} stroke={C.blueD} strokeWidth="2.2" />
    <path d="M36 62.5h13" stroke={C.white} strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="70" cy="28" r="3.4" fill={C.yellow} />
  </>
) };

S.help = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.yellowT} />
    <ellipse cx="48" cy="76" rx="25" ry="4" fill={C.shadow} />
    <path d="M28 40a10 10 0 0110-10h20a10 10 0 0110 10v8a10 10 0 01-10 10H46l-10 9v-9h-8a10 10 0 01-10-10v-8z" fill={C.blue} />
    <path d="M43 40a5.5 5.5 0 019.5-4c2 2.5 1 5-1.5 7-1.8 1.4-2.8 2.4-2.8 4.6" fill="none" stroke={C.white} strokeWidth="3.6" strokeLinecap="round" />
    <circle cx="48" cy="52.5" r="2.6" fill={C.yellow} />
    <circle cx="72" cy="30" r="3.2" fill={C.green} />
    <circle cx="25" cy="28" r="2.6" fill={C.red} />
  </>
) };

S.briefcase = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.blueT} />
    <ellipse cx="48" cy="76" rx="26" ry="4" fill={C.shadow} />
    <path d="M40 38v-4a7 7 0 017-7h2a7 7 0 017 7v4" fill="none" stroke={C.ink} strokeWidth="4" />
    <rect x="27" y="38" width="42" height="29" rx="7" fill={C.blue} stroke={C.blueD} strokeWidth="2.4" />
    <path d="M27 50h42" stroke={C.blueD} strokeWidth="2.2" />
    <rect x="42" y="46" width="12" height="9" rx="2.5" fill={C.yellow} stroke={C.ink} strokeWidth="2" />
    <path d="M72 28c3-2 6-1 7 2" fill="none" stroke={C.green} strokeWidth="2.8" strokeLinecap="round" />
  </>
) };

S.growth = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.greenT} />
    <ellipse cx="48" cy="76" rx="26" ry="4" fill={C.shadow} />
    <rect x="30" y="56" width="9" height="12" rx="2" fill={C.blueT} stroke={C.blue} strokeWidth="2" />
    <rect x="43" y="47" width="9" height="21" rx="2" fill={C.blue} stroke={C.blueD} strokeWidth="2" />
    <rect x="56" y="36" width="9" height="32" rx="2" fill={C.green} stroke={C.ink} strokeWidth="2" />
    <path d="M32 40l20-13" stroke={C.red} strokeWidth="3.6" strokeLinecap="round" />
    <path d="M46 24h9v9" fill="none" stroke={C.red} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="71" cy="26" r="3" fill={C.yellow} />
  </>
) };

S.gift = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.redT} />
    <ellipse cx="48" cy="76" rx="25" ry="4" fill={C.shadow} />
    <rect x="30" y="46" width="36" height="24" rx="4" fill={C.blue} stroke={C.blueD} strokeWidth="2.2" />
    <rect x="27" y="37" width="42" height="11" rx="3.5" fill={C.blueT} stroke={C.blueD} strokeWidth="2.2" />
    <path d="M48 37v33" stroke={C.yellow} strokeWidth="5.4" />
    <path d="M48 37c-7-2-11-7-8.5-11 3.5-3.5 8.5 2.5 8.5 11zM48 37c7-2 11-7 8.5-11-3.5-3.5-8.5 2.5-8.5 11z" fill={C.red} stroke={C.ink} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M24 26c3-2 6-2 8 0" fill="none" stroke={C.green} strokeWidth="2.6" strokeLinecap="round" />
  </>
) };

S.mail = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.yellowT} />
    <ellipse cx="48" cy="76" rx="26" ry="4" fill={C.shadow} />
    <rect x="28" y="36" width="40" height="28" rx="6" fill={C.white} stroke={C.ink} strokeWidth="2.4" />
    <path d="M30 40l18 13 18-13" fill="none" stroke={C.blue} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="66" cy="34" r="7" fill={C.red} stroke={C.white} strokeWidth="2.2" />
    <path d="M63.5 34h5M66 31.5v5" stroke={C.white} strokeWidth="2" strokeLinecap="round" />
    <circle cx="27" cy="30" r="2.8" fill={C.blue} />
  </>
) };

S.handshake = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.greenT} />
    <ellipse cx="48" cy="76" rx="27" ry="4" fill={C.shadow} />
    <path d="M22 42h8l8-6 10 4 10-4 8 6h8" fill="none" stroke={C.blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30 42l12 12a5 5 0 007 0l1-1a5 5 0 017 0l1 1a5 5 0 007 0l6-6" fill="none" stroke={C.yellow} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M46 24l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2 2-4.5z" fill={C.red} />
  </>
) };

S.safety = { vb: "0 0 96 96", el: (
  <>
    <path d="M14 30c0-9 7-16 16-16h36c9 0 16 7 16 16v28c0 9-7 16-16 16H30c-9 0-16-7-16-16V30z" fill={C.redT} />
    <ellipse cx="48" cy="76" rx="24" ry="4" fill={C.shadow} />
    <path d="M48 24l17 6.5v12.5c0 10.5-6.5 19-17 23.5-10.5-4.5-17-13-17-23.5V30.5L48 24z" fill={C.green} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M48 57c-4.5-3.5-9-6.8-9-11a4.6 4.6 0 019-1.6A4.6 4.6 0 0157 46c0 4.2-4.5 7.5-9 11z" fill={C.red} />
    <path d="M70 26l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2 2-4.5z" fill={C.yellow} />
  </>
) };

/* ── 128×96 wide featured-panel scene (Beliefs) ── */
S.loop = { vb: "0 0 128 96", el: (
  <>
    <path d="M14 26c0-8 6-14 14-14h72c8 0 14 6 14 14v44c0 8-6 14-14 14H28c-8 0-14-6-14-14V26z" fill={C.blueT} />
    <ellipse cx="64" cy="86" rx="46" ry="4" fill={C.shadow} />
    <circle cx="64" cy="47" r="31" fill="none" stroke={C.white} strokeWidth="10" />
    <circle cx="64" cy="47" r="31" fill="none" stroke={C.ink} strokeWidth="2.4" strokeDasharray="5 7" strokeLinecap="round" />
    <circle cx="64" cy="16" r="12" fill={C.yellow} stroke={C.white} strokeWidth="4" />
    <circle cx="95" cy="47" r="12" fill={C.green} stroke={C.white} strokeWidth="4" />
    <circle cx="64" cy="78" r="12" fill={C.red} stroke={C.white} strokeWidth="4" />
    <circle cx="33" cy="47" r="12" fill={C.blue} stroke={C.white} strokeWidth="4" />
    <path d="M84 22l4-3M84 72l4 3M44 72l-4 3M44 22l-4-3" stroke={C.ink} strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="64" cy="16" r="3" fill={C.white} />
    <circle cx="95" cy="47" r="3" fill={C.white} />
    <circle cx="64" cy="78" r="3" fill={C.white} />
    <circle cx="33" cy="47" r="3" fill={C.white} />
  </>
) };

/* ── 120×160 tall scenes (Vision panels) ── */
S.student = { vb: "0 0 120 160", el: (
  <>
    <path d="M12 28c0-9 7-16 16-16h64c9 0 16 7 16 16v104c0 9-7 16-16 16H28c-9 0-16-7-16-16V28z" fill={C.blueT} />
    <ellipse cx="60" cy="140" rx="42" ry="5" fill={C.shadow} />
    <rect x="76" y="26" width="26" height="34" rx="5" fill={C.white} stroke={C.ink} strokeWidth="2.2" />
    <path d="M81 34h16M81 41h16M81 48h10" stroke={C.blue} strokeWidth="2.6" strokeLinecap="round" />
    <rect x="18" y="60" width="22" height="28" rx="4" fill={C.yellowT} stroke={C.yellow} strokeWidth="2.4" />
    <path d="M24 66h10M24 72h10M24 78h6" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
    <circle cx="52" cy="66" r="12" fill={C.yellow} stroke={C.ink} strokeWidth="2.2" />
    <path d="M42 62c2-6 8-9 14-8" fill="none" stroke={C.ink} strokeWidth="3.4" strokeLinecap="round" />
    <path d="M34 112c2-14 9-21 18-21s16 7 18 21" fill={C.blue} stroke={C.blueD} strokeWidth="2.4" strokeLinejoin="round" />
    <rect x="30" y="112" width="64" height="10" rx="4" fill={C.ink} />
    <rect x="42" y="94" width="36" height="20" rx="3" fill={C.white} stroke={C.ink} strokeWidth="2.2" />
    <path d="M47 100h26M47 106h18" stroke={C.green} strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="94" cy="118" r="8" fill={C.green} stroke={C.ink} strokeWidth="2" />
    <path d="M94 114v5M91.5 117h5" stroke={C.white} strokeWidth="1.8" strokeLinecap="round" />
  </>
) };

S.teacher = { vb: "0 0 120 160", el: (
  <>
    <path d="M12 28c0-9 7-16 16-16h64c9 0 16 7 16 16v104c0 9-7 16-16 16H28c-9 0-16-7-16-16V28z" fill={C.greenT} />
    <ellipse cx="60" cy="140" rx="42" ry="5" fill={C.shadow} />
    <rect x="30" y="22" width="60" height="44" rx="5" fill={C.white} stroke={C.ink} strokeWidth="2.2" />
    <path d="M38 32l10 8-10 8" fill="none" stroke={C.blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="66" cy="40" r="6" fill={C.yellow} />
    <path d="M58 54h24" stroke={C.red} strokeWidth="3" strokeLinecap="round" />
    <circle cx="52" cy="92" r="13" fill={C.blue} stroke={C.ink} strokeWidth="2.2" />
    <path d="M39 88c4-7 10-9 14-8" fill="none" stroke={C.ink} strokeWidth="3.4" strokeLinecap="round" />
    <path d="M32 140c2-16 10-24 20-24s18 8 20 24" fill={C.green} stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M72 100l14 12" stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
    <circle cx="88" cy="110" r="4" fill={C.yellow} stroke={C.ink} strokeWidth="1.8" />
    <rect x="22" y="118" width="20" height="8" rx="3" fill={C.white} stroke={C.ink} strokeWidth="2" />
    <path d="M25 122h14" stroke={C.red} strokeWidth="2" strokeLinecap="round" />
  </>
) };

S.parent = { vb: "0 0 120 160", el: (
  <>
    <path d="M12 28c0-9 7-16 16-16h64c9 0 16 7 16 16v104c0 9-7 16-16 16H28c-9 0-16-7-16-16V28z" fill={C.yellowT} />
    <ellipse cx="60" cy="140" rx="42" ry="5" fill={C.shadow} />
    <path d="M22 34l38-14 38 14v10l-38-13-38 13V34z" fill={C.red} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="42" cy="86" r="13" fill={C.blue} stroke={C.ink} strokeWidth="2.2" />
    <path d="M29 82c4-7 10-9 14-8" fill="none" stroke={C.ink} strokeWidth="3.2" strokeLinecap="round" />
    <path d="M24 140c2-15 9-23 18-23s16 8 18 23" fill={C.blue} stroke={C.blueD} strokeWidth="2.4" strokeLinejoin="round" />
    <circle cx="76" cy="100" r="9" fill={C.green} stroke={C.ink} strokeWidth="2.2" />
    <path d="M68 140c1.5-11 5-16 8-16s6.5 5 8 16" fill={C.greenT} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M58 112c4-4 10-5 14-3" fill="none" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
    <rect x="82" y="118" width="18" height="24" rx="3" fill={C.white} stroke={C.ink} strokeWidth="2" />
    <path d="M86 124h10M86 130h10M86 136h6" stroke={C.yellow} strokeWidth="2.2" strokeLinecap="round" />
  </>
) };

S.team = { vb: "0 0 120 160", el: (
  <>
    <path d="M12 28c0-9 7-16 16-16h64c9 0 16 7 16 16v104c0 9-7 16-16 16H28c-9 0-16-7-16-16V28z" fill={C.redT} />
    <ellipse cx="60" cy="140" rx="42" ry="5" fill={C.shadow} />
    <circle cx="38" cy="66" r="11" fill={C.blue} stroke={C.ink} strokeWidth="2.2" />
    <path d="M28 104c2-12 7-17 10-17s8 5 10 17" fill={C.blue} stroke={C.blueD} strokeWidth="2.2" strokeLinejoin="round" />
    <circle cx="82" cy="66" r="11" fill={C.green} stroke={C.ink} strokeWidth="2.2" />
    <path d="M72 104c2-12 7-17 10-17s8 5 10 17" fill={C.green} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
    <rect x="28" y="108" width="64" height="9" rx="4" fill={C.ink} />
    <rect x="38" y="88" width="44" height="22" rx="3" fill={C.white} stroke={C.ink} strokeWidth="2.2" />
    <path d="M44 95h13M44 102h22" stroke={C.blue} strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="76" cy="98" r="4" fill={C.yellow} stroke={C.ink} strokeWidth="1.8" />
    <path d="M92 40a14 14 0 0110 12M92 40v-6" fill="none" stroke={C.red} strokeWidth="2.6" strokeLinecap="round" />
    <path d="M28 40a14 14 0 00-10 12M28 40v-6" fill="none" stroke={C.blue} strokeWidth="2.6" strokeLinecap="round" />
  </>
) };

export default function SpotIllustration({ subject, className = "", title }) {
  const scene = S[subject] ?? S.compass;
  return (
    <svg viewBox={scene.vb} role={title ? "img" : "presentation"} aria-hidden={title ? undefined : true}
      className={className} focusable="false" preserveAspectRatio="xMidYMid slice">
      {title ? <title>{title}</title> : null}
      {scene.el}
    </svg>
  );
}
