/**
 * SpotIllustration — flat editorial scenes in the Apple Support / Google
 * illustration style (see developer.apple.com accessibility art):
 *
 *   - FLAT solid fills only. No gradients, no gloss, no sparkles, no
 *     floating accent dots, no fake 3D.
 *   - Neutral light-grey rounded panel as the scene ground; subjects stand
 *     on a barely-there contact shadow.
 *   - People are people: skin-tone heads, flat hair shapes, solid clothing,
 *     simple legs and shoes — figures doing an activity, never floating.
 *   - Detail comes from thin ink line work (round-capped 2–3px strokes),
 *     the way Apple draws the leash, the laptop, and the wifi arcs.
 *
 * Our own geometry — idea, not copy. Decorative by default (aria-hidden).
 * Same API and viewBoxes as before: 96×96 scenes, loop is 128×96 wide,
 * student/teacher/parent/team are 120×160 portrait.
 */

const C = {
  panel: "#F1F1F4",
  ink: "#1D1D1F",
  blue: "#2E71E5",
  sky: "#A8CFF5",
  teal: "#2BA88F",
  green: "#33A852",
  amber: "#F2B33D",
  orange: "#F4622F",
  red: "#E0483A",
  magenta: "#C941A7",
  indigo: "#6E62D8",
  indigoLight: "#D9D4F5",
  pink: "#E88BB1",
  skin: "#F3C7A2",
  skinMid: "#D69B6E",
  skinDeep: "#9C6644",
  hair: "#4A342A",
  hairDark: "#23201D",
  grey: "#AEAEB2",
  greyLight: "#DCDCE0",
  greyMid: "#C4C4C9",
  white: "#FFFFFF",
  dog: "#E9C491",
};

const panel = (x = 10, y = 10, w = 76, h = 76, rx = 24) => (
  <rect x={x} y={y} width={w} height={h} rx={rx} fill={C.panel} />
);

const ground = (cx = 48, cy = 78, rx = 24, ry = 4) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={C.ink} opacity="0.06" />
);

/* Flat person — head, hair cap, and legs shared by the portrait scenes */
const head = (cx, cy, r, skin) => <circle cx={cx} cy={cy} r={r} fill={skin} />;
const hairCap = (cx, cy, r, tone = C.hair) => (
  <path d={`M${cx - r} ${cy}a${r} ${r} 0 0 1 ${r * 2} 0z`} fill={tone} />
);
const legs = (x1, x2, y, h, w, fill) => (
  <>
    <rect x={x1} y={y} width={w} height={h} rx={w / 2} fill={fill} />
    <rect x={x2} y={y} width={w} height={h} rx={w / 2} fill={fill} />
  </>
);
const shoes = (cx1, cx2, cy) => (
  <>
    <ellipse cx={cx1} cy={cy} rx="6" ry="2.6" fill={C.ink} />
    <ellipse cx={cx2} cy={cy} rx="6" ry="2.6" fill={C.ink} />
  </>
);

const S = {};

/* ── 96×96 scenes ── */

S.learn = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M30 37c6-3 11-3 17-1v26c-6-2-11-2-17 1z" fill={C.white} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M66 37c-6-3-11-3-17-1v26c6-2 11-2 17 1z" fill={C.blue} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M56 36v10l4-3.2 4 3.2V36z" fill={C.amber} />
    <path d="M34 45h9M34 51h7" stroke={C.grey} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M53 47h9M53 53h7" stroke={C.white} strokeWidth="2.2" strokeLinecap="round" />
  </>
) };

S.ask = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M30 28h36a10 10 0 0 1 10 10v10a10 10 0 0 1-10 10H44l-12 9 3-9h-5a10 10 0 0 1-10-10V38a10 10 0 0 1 10-10z" fill={C.blue} />
    <circle cx="40" cy="43" r="2.8" fill={C.white} />
    <circle cx="48" cy="43" r="2.8" fill={C.white} />
    <circle cx="56" cy="43" r="2.8" fill={C.white} />
    <rect x="58" y="52" width="20" height="14" rx="7" fill={C.white} stroke={C.ink} strokeWidth="2" />
    <circle cx="64" cy="59" r="2" fill={C.teal} />
    <circle cx="70" cy="59" r="2" fill={C.teal} />
    <circle cx="76" cy="59" r="2" fill={C.teal} />
  </>
) };

S.practice = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <circle cx="46" cy="47" r="21" fill={C.blue} />
    <circle cx="46" cy="47" r="13.5" fill={C.white} />
    <circle cx="46" cy="47" r="6.5" fill={C.red} />
    <path d="M60 61l12 12" stroke={C.ink} strokeWidth="7" strokeLinecap="round" />
  </>
) };

S.build = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <rect x="27" y="26" width="42" height="15" rx="7.5" fill={C.blue} />
    <path d="M35 30.5l6 4-6 4" fill="none" stroke={C.white} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="27" y="46" width="24" height="15" rx="7.5" fill={C.amber} />
    <rect x="56" y="46" width="13" height="15" rx="6.5" fill={C.green} />
  </>
) };

S.updates = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M48 24c11 0 17 8 17 17v9c0 4 2.4 6.4 4.8 8.6H26.2c2.4-2.2 4.8-4.6 4.8-8.6v-9c0-9 6-17 17-17z" fill={C.amber} />
    <path d="M42 70a6 6 0 0 0 12 0z" fill={C.ink} />
    <path d="M27 40c0-9 5-15 12-18M69 40c0-9-5-15-12-18" fill="none" stroke={C.ink} strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="64" cy="27" r="7" fill={C.red} stroke={C.white} strokeWidth="2.5" />
  </>
) };

S.languages = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <circle cx="44" cy="46" r="19" fill={C.blue} />
    <ellipse cx="44" cy="46" rx="8.5" ry="19" fill="none" stroke={C.white} strokeWidth="2.4" />
    <path d="M25.5 46h37M28 37h32M28 55h32" stroke={C.white} strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="65" cy="61" r="9" fill={C.green} stroke={C.white} strokeWidth="2.5" />
    <path d="M65 57v8M61 61h8" stroke={C.white} strokeWidth="2.6" strokeLinecap="round" />
  </>
) };

S.research = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <circle cx="44" cy="43" r="16" fill={C.white} stroke={C.ink} strokeWidth="4.5" />
    <path d="M37 45c2.4-3 4.8-3 7 0s4.6 3 7 0" fill="none" stroke={C.teal} strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="39" cy="39" r="1.8" fill={C.amber} />
    <path d="M56 55l12 12" stroke={C.ink} strokeWidth="7" strokeLinecap="round" />
  </>
) };

S.community = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <circle cx="35" cy="42" r="10.5" fill={C.amber} stroke={C.white} strokeWidth="3" />
    <circle cx="61" cy="42" r="10.5" fill={C.blue} stroke={C.white} strokeWidth="3" />
    <circle cx="48" cy="58" r="10.5" fill={C.teal} stroke={C.white} strokeWidth="3" />
    <path d="M30 68c3-6 9-9 18-9s15 3 18 9" fill="none" stroke={C.indigoLight} strokeWidth="4" strokeLinecap="round" />
  </>
) };

S.shield = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M48 22l19 7v17c0 13-8.6 20.6-19 25-10.4-4.4-19-12-19-25V29z" fill={C.blue} />
    <path d="M39.5 46.5l6.5 6.5 12-13" fill="none" stroke={C.white} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
  </>
) };

S.lock = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M37 46v-8a11 11 0 0 1 22 0v8" fill="none" stroke={C.grey} strokeWidth="6.5" strokeLinecap="round" />
    <rect x="29" y="45" width="38" height="27" rx="11" fill={C.amber} />
    <circle cx="48" cy="56" r="4" fill={C.ink} />
    <rect x="46.4" y="57" width="3.2" height="8" rx="1.6" fill={C.ink} />
  </>
) };

S.document = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <rect x="30" y="23" width="36" height="46" rx="9" fill={C.white} stroke={C.ink} strokeWidth="2.2" />
    <rect x="36" y="33" width="18" height="3.2" rx="1.6" fill={C.blue} />
    <rect x="36" y="41" width="24" height="3.2" rx="1.6" fill={C.grey} />
    <rect x="36" y="49" width="21" height="3.2" rx="1.6" fill={C.grey} />
    <rect x="36" y="57" width="14" height="3.2" rx="1.6" fill={C.sky} />
  </>
) };

S.cookie = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <circle cx="47" cy="48" r="20" fill={C.dog} />
    <circle cx="40" cy="41" r="2.8" fill={C.ink} />
    <circle cx="53" cy="44" r="2.8" fill={C.ink} />
    <circle cx="43" cy="55" r="2.8" fill={C.ink} />
    <circle cx="55" cy="55" r="2.4" fill={C.ink} />
  </>
) };

S.accessibility = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <circle cx="48" cy="47" r="22" fill={C.white} stroke={C.blue} strokeWidth="5.5" />
    <circle cx="48" cy="37.5" r="4.2" fill={C.ink} />
    <path d="M36.5 45.5h23M48 46.5v8M48 54.5l-7.5 10M48 54.5l7.5 10" fill="none" stroke={C.ink} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
  </>
) };

S.compass = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <circle cx="48" cy="47" r="20" fill={C.white} stroke={C.ink} strokeWidth="3.5" />
    <path d="M48 33l5.5 14L48 61l-5.5-14z" fill={C.red} />
    <path d="M48 33l-5.5 14L48 61l0-14z" fill={C.ink} />
    <circle cx="48" cy="47" r="2.6" fill={C.white} />
    <path d="M48 24.5v-3M48 72.5v-3M70.5 47h3M22.5 47h3" stroke={C.grey} strokeWidth="2.6" strokeLinecap="round" />
  </>
) };

S.tag = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <g transform="rotate(-24 48 51)">
      <rect x="29" y="40" width="38" height="23" rx="9" fill={C.amber} />
      <circle cx="38.5" cy="51.5" r="3.6" fill={C.white} />
      <path d="M47 51.5h12" stroke={C.white} strokeWidth="3" strokeLinecap="round" />
    </g>
    <path d="M28 46c-5-3-7-9-4-14" fill="none" stroke={C.ink} strokeWidth="2.4" strokeLinecap="round" />
  </>
) };

S.download = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M45 24h6v17h8L48 53 37 41h8z" fill={C.green} />
    <rect x="27" y="60" width="42" height="10" rx="5" fill={C.grey} />
  </>
) };

S.help = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <circle cx="48" cy="47" r="20" fill={C.blue} />
    <path d="M41.5 41a6.6 6.6 0 1 1 9.4 6.2c-2.1 1.2-2.9 2.4-2.9 4.6" fill="none" stroke={C.white} strokeWidth="4.6" strokeLinecap="round" />
    <circle cx="48" cy="59" r="3.1" fill={C.white} />
  </>
) };

S.briefcase = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M41 42v-5a7 7 0 0 1 14 0v5" fill="none" stroke={C.grey} strokeWidth="5.5" strokeLinecap="round" />
    <rect x="27" y="41" width="42" height="28" rx="10" fill={C.indigo} />
    <rect x="42.5" y="51" width="11" height="8.5" rx="3.2" fill={C.amber} />
  </>
) };

S.growth = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <rect x="29" y="50" width="11" height="16" rx="5" fill={C.teal} />
    <rect x="43.5" y="42" width="11" height="24" rx="5" fill={C.blue} />
    <rect x="58" y="32" width="11" height="34" rx="5" fill={C.green} />
    <path d="M27 34c9-7 17-5 24-2" fill="none" stroke={C.ink} strokeWidth="3.4" strokeLinecap="round" />
    <path d="M52 24l7 6-9 3z" fill={C.ink} />
  </>
) };

S.gift = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M48 37c-7-11-19-7-15-1 2.6 4 10 4 15 1z" fill={C.pink} />
    <path d="M48 37c7-11 19-7 15-1-2.6 4-10 4-15 1z" fill={C.pink} />
    <rect x="30" y="45" width="36" height="23" rx="7" fill={C.pink} />
    <rect x="27" y="37" width="42" height="10" rx="5" fill={C.red} />
    <rect x="44.6" y="37" width="6.8" height="31" fill={C.white} />
  </>
) };

S.mail = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <rect x="25" y="33" width="46" height="31" rx="9" fill={C.blue} />
    <path d="M28 38l20 14 20-14" fill="none" stroke={C.white} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
  </>
) };

S.handshake = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M18 64q12-14 28-13" fill="none" stroke={C.blue} strokeWidth="11" strokeLinecap="round" />
    <path d="M78 64q-12-14-28-13" fill="none" stroke={C.amber} strokeWidth="11" strokeLinecap="round" />
    <circle cx="48" cy="51" r="9" fill={C.teal} stroke={C.white} strokeWidth="3.4" />
  </>
) };

S.safety = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M48 23l16 6v14.5c0 11-6.8 17.4-16 21-9.2-3.6-16-10-16-21V29z" fill={C.red} />
    <path d="M48 51c-4.6-3.6-7.4-6.4-7.4-9.6a4.2 4.2 0 0 1 7.4-2.4 4.2 4.2 0 0 1 7.4 2.4c0 3.2-2.8 6-7.4 9.6z" fill={C.white} />
  </>
) };

S.eye = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M25 48q23-19 46 0-23 19-46 0z" fill={C.white} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
    <circle cx="48" cy="48" r="9.5" fill={C.teal} />
    <circle cx="48" cy="48" r="4.2" fill={C.ink} />
    <circle cx="50.5" cy="45.5" r="1.5" fill={C.white} />
  </>
) };

S.flag = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M37 28c9-4 15 2 24-2v17c-9 4-15-2-24 2z" fill={C.green} />
    <rect x="31" y="24" width="4.6" height="46" rx="2.3" fill={C.ink} />
    <ellipse cx="42" cy="72" rx="10" ry="3" fill={C.greyLight} />
  </>
) };

/* ── School subjects (96×96) ── */

S.math = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <rect x="30" y="28" width="36" height="40" rx="11" fill={C.white} stroke={C.ink} strokeWidth="2.2" />
    <path d="M48 34v12M42 40h12" stroke={C.green} strokeWidth="4" strokeLinecap="round" />
    <path d="M40 54h16M40 60h16" stroke={C.indigo} strokeWidth="4" strokeLinecap="round" />
  </>
) };

S.physics = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <ellipse cx="48" cy="47" rx="20" ry="8" fill="none" stroke={C.indigo} strokeWidth="3" transform="rotate(28 48 47)" />
    <ellipse cx="48" cy="47" rx="20" ry="8" fill="none" stroke={C.indigo} strokeWidth="3" transform="rotate(-28 48 47)" />
    <circle cx="48" cy="47" r="6.5" fill={C.red} />
    <circle cx="60" cy="36" r="3.2" fill={C.blue} />
    <circle cx="36" cy="57" r="3.2" fill={C.teal} />
  </>
) };

S.chemistry = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M42 26h12v13l9.6 19a6.5 6.5 0 0 1-5.8 9.4H38.2A6.5 6.5 0 0 1 32.4 58L42 39z" fill={C.white} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M36.6 51h22.8l4.2 8.4a6 6 0 0 1-5.4 8.6H37.8a6 6 0 0 1-5.4-8.6z" fill={C.teal} />
    <circle cx="43" cy="59" r="2" fill={C.white} />
    <circle cx="50" cy="62" r="1.5" fill={C.white} />
    <rect x="40" y="23.5" width="16" height="4.5" rx="2.25" fill={C.teal} />
  </>
) };

S.biology = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M49 67c-16-6-21-24-16-36 15 2 28 12 26 27-.8 6-5 9-10 9z" fill={C.green} />
    <path d="M46 64c-2-11-1-19 5-27" fill="none" stroke={C.white} strokeWidth="2.6" strokeLinecap="round" />
    <path d="M49 67c2-9 6-15 13-19" fill="none" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
  </>
) };

S.english = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M32 46c5-2.6 9-2.6 14-.8v20c-5-1.8-9-1.8-14 .8V46z" fill={C.blue} />
    <path d="M60 46c-5-2.6-9-2.6-14-.8v20c5-1.8 9-1.8 14 .8V46z" fill={C.white} stroke={C.ink} strokeWidth="2" />
    <circle cx="62" cy="31" r="10" fill={C.white} stroke={C.ink} strokeWidth="2" />
    <path d="M58 39l-3 5 7-3.4z" fill={C.white} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="58" cy="31" r="1.7" fill={C.ink} />
    <circle cx="62" cy="31" r="1.7" fill={C.ink} />
    <circle cx="66" cy="31" r="1.7" fill={C.ink} />
  </>
) };

S.hindi = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <rect x="27" y="30" width="34" height="24" rx="12" fill={C.amber} />
    <path d="M35 52l-6 9 13-6.6z" fill={C.amber} />
    <path d="M35 42q4.2-5.4 8.4 0t8.4 0" fill="none" stroke={C.white} strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="39" cy="36" r="1.8" fill={C.white} />
    <circle cx="48" cy="36" r="1.8" fill={C.white} />
    <circle cx="64" cy="56" r="9" fill={C.white} stroke={C.ink} strokeWidth="2" />
    <path d="M60.5 56q3.5-4.4 7 0" fill="none" stroke={C.orange} strokeWidth="2.6" strokeLinecap="round" />
  </>
) };

S.history = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M29 39L48 28l19 11z" fill={C.amber} />
    <rect x="33" y="42" width="6" height="17" rx="3" fill={C.white} />
    <rect x="45" y="42" width="6" height="17" rx="3" fill={C.white} />
    <rect x="57" y="42" width="6" height="17" rx="3" fill={C.white} />
    <rect x="29" y="61" width="38" height="7" rx="3.5" fill={C.amber} />
  </>
) };

S.geography = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <path d="M25 62l14-21 9 13 7-10 16 18z" fill={C.green} />
    <path d="M35.5 46.5L39 41l3.6 5.5-3.6 3z" fill={C.white} />
    <path d="M52.6 49l3.4-5 3.8 5.4-3.8 2.6z" fill={C.white} />
    <circle cx="64" cy="33" r="6" fill={C.amber} />
  </>
) };

S.computerScience = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <rect x="27" y="30" width="42" height="34" rx="9" fill={C.ink} />
    <circle cx="33.5" cy="36.5" r="1.8" fill={C.red} />
    <circle cx="39" cy="36.5" r="1.8" fill={C.amber} />
    <circle cx="44.5" cy="36.5" r="1.8" fill={C.green} />
    <path d="M34 45l6 5-6 5" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="45" y="50.5" width="10" height="3.2" rx="1.6" fill={C.amber} />
  </>
) };

S.economics = { vb: "0 0 96 96", el: (
  <>
    {panel()}
    {ground()}
    <circle cx="38" cy="58" r="9" fill={C.amber} stroke={C.white} strokeWidth="3" />
    <circle cx="54" cy="60" r="9" fill={C.amber} stroke={C.white} strokeWidth="3" />
    <path d="M29 41l13 6 14-12" fill="none" stroke={C.teal} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M50 32l7.4 2.6-4.8 6.8z" fill={C.teal} />
  </>
) };

/* ── Wide scene (128×96) ── */

S.loop = { vb: "0 0 128 96", el: (
  <>
    {panel(10, 10, 108, 76, 26)}
    {ground(64, 80, 34, 5)}
    <circle cx="64" cy="48" r="25" fill="none" stroke={C.ink} strokeWidth="2.6" strokeDasharray="1 8" strokeLinecap="round" opacity="0.7" />
    <circle cx="64" cy="23" r="8" fill={C.blue} stroke={C.white} strokeWidth="3" />
    <circle cx="89" cy="48" r="8" fill={C.amber} stroke={C.white} strokeWidth="3" />
    <circle cx="64" cy="73" r="8" fill={C.teal} stroke={C.white} strokeWidth="3" />
    <circle cx="39" cy="48" r="8" fill={C.green} stroke={C.white} strokeWidth="3" />
  </>
) };

/* ── Portrait scenes (120×160) — flat people doing an activity ── */

S.student = { vb: "0 0 120 160", el: (
  <>
    {panel(10, 10, 100, 140, 30)}
    {ground(60, 146, 30, 5)}
    {legs(51, 62, 106, 30, 7, C.sky)}
    {shoes(54, 66, 140)}
    <path d="M44 76c0-3.3 2.7-6 6-6h20c3.3 0 6 2.7 6 6v26c0 3.3-2.7 6-6 6H50c-3.3 0-6-2.7-6-6z" fill={C.blue} />
    <rect x="56.5" y="62" width="7" height="10" fill={C.skin} />
    {head(60, 54, 12, C.skin)}
    {hairCap(60, 54, 12, C.hair)}
    <rect x="45" y="96" width="30" height="20" rx="3" fill={C.white} stroke={C.ink} strokeWidth="2.2" />
    <path d="M51 103h18M51 109h13" stroke={C.blue} strokeWidth="2.4" strokeLinecap="round" />
  </>
) };

S.teacher = { vb: "0 0 120 160", el: (
  <>
    {panel(10, 10, 100, 140, 30)}
    {ground(60, 146, 30, 5)}
    <rect x="26" y="24" width="68" height="44" rx="8" fill={C.white} stroke={C.ink} strokeWidth="2.5" />
    <path d="M34 56l11-10 8 6 13-14" fill="none" stroke={C.teal} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {legs(51, 62, 110, 26, 7, C.greyMid)}
    {shoes(54, 66, 140)}
    <path d="M46 78c0-3.3 2.7-6 6-6h16c3.3 0 6 2.7 6 6v28c0 3.3-2.7 6-6 6H52c-3.3 0-6-2.7-6-6z" fill={C.magenta} />
    <path d="M56 80Q48 72 42 64" fill="none" stroke={C.magenta} strokeWidth="7" strokeLinecap="round" />
    <circle cx="41" cy="62" r="4" fill={C.skin} />
    <rect x="56.5" y="66" width="7" height="10" fill={C.skin} />
    {head(60, 58, 12, C.skin)}
    {hairCap(60, 58, 12, C.hairDark)}
  </>
) };

S.parent = { vb: "0 0 120 160", el: (
  <>
    {panel(10, 10, 100, 140, 30)}
    {ground(60, 146, 32, 5)}
    {legs(38, 48, 112, 28, 6.5, C.greyMid)}
    {shoes(41, 52, 142)}
    <path d="M34 78c0-3.3 2.7-6 6-6h14c3.3 0 6 2.7 6 6v26c0 3.3-2.7 6-6 6H40c-3.3 0-6-2.7-6-6z" fill={C.pink} />
    <rect x="43.5" y="68" width="7" height="10" fill={C.skinMid} />
    {head(47, 60, 11.5, C.skinMid)}
    {hairCap(47, 60, 11.5, C.hair)}
    {legs(76, 84, 118, 20, 5.5, C.greyMid)}
    {shoes(79, 87, 140)}
    <path d="M74 106c0-2.8 2.2-5 5-5h8c2.8 0 5 2.2 5 5v12c0 2.8-2.2 5-5 5h-8c-2.8 0-5-2.2-5-5z" fill={C.blue} />
    <rect x="79" y="100" width="6" height="8" fill={C.skin} />
    {head(82, 94, 8.5, C.skin)}
    {hairCap(82, 94, 8.5, C.hairDark)}
    <path d="M58 88Q68 98 76 102" fill="none" stroke={C.pink} strokeWidth="6.5" strokeLinecap="round" />
    <circle cx="77" cy="103" r="3.4" fill={C.skin} />
  </>
) };

S.team = { vb: "0 0 120 160", el: (
  <>
    {panel(10, 10, 100, 140, 30)}
    {ground(60, 146, 34, 5.5)}
    {/* left figure */}
    {legs(29, 38, 106, 34, 5.5, C.greyMid)}
    {shoes(31.5, 41, 142)}
    <path d="M27 76c0-3 2.4-5.5 5.5-5.5h7c3 0 5.5 2.5 5.5 5.5v30c0 3-2.5 5.5-5.5 5.5h-7c-3 0-5.5-2.5-5.5-5.5z" fill={C.teal} />
    {head(36, 60, 9.5, C.skinDeep)}
    {hairCap(36, 60, 9.5, C.hairDark)}
    {/* center figure */}
    {legs(54, 63, 100, 40, 6, C.sky)}
    {shoes(57, 66, 142)}
    <path d="M50 68c0-3.3 2.7-6 6-6h8c3.3 0 6 2.7 6 6v32c0 3.3-2.7 6-6 6h-8c-3.3 0-6-2.7-6-6z" fill={C.blue} />
    {head(60, 52, 10.5, C.skinMid)}
    {hairCap(60, 52, 10.5, C.hair)}
    {/* right figure */}
    {legs(80, 89, 106, 34, 5.5, C.greyMid)}
    {shoes(82.5, 92, 142)}
    <path d="M78 76c0-3 2.4-5.5 5.5-5.5h7c3 0 5.5 2.5 5.5 5.5v30c0 3-2.5 5.5-5.5 5.5h-7c-3 0-5.5-2.5-5.5-5.5z" fill={C.magenta} />
    {head(87, 60, 9.5, C.skin)}
    {hairCap(87, 60, 9.5, C.hairDark)}
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
