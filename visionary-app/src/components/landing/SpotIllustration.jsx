import { useId } from "react";

/**
 * SpotIllustration — soft editorial scenes in the Apple marketing style.
 *
 * Design language (the "Apple dialect"):
 *   - Every fill is a smooth vertical gradient (no flat fills, no outlines).
 *   - Shapes are rounded and generous; strokes only as round-capped marks.
 *   - Scenes sit on an ultra-light pastel gradient panel with a large
 *     squircle radius, grounded by a blurred radial shadow.
 *   - Depth comes from gradients + translucent white gloss, never from
 *     hard black lines; accents are tiny gradient dots and 4-point sparks.
 *
 * Our own geometry — idea, not copy. Decorative by default (aria-hidden).
 * Same API and viewBoxes as the previous flat set: 96×96 scenes, loop is
 * 128×96 wide, student/teacher/parent/team are 120×160 portrait.
 */

/* Gradient tokens: [top, bottom] */
const GRADS = {
  blue: ["#6FA8FF", "#2E6BE6"],
  indigo: ["#A5A8FF", "#6366F1"],
  teal: ["#6FDAC8", "#0FB5A0"],
  green: ["#8CE99A", "#2FB566"],
  amber: ["#FFD66E", "#F0A32F"],
  orange: ["#FFB570", "#F27B3C"],
  red: ["#FF9E96", "#EA5548"],
  pink: ["#FFA8C8", "#F2568F"],
  ink: ["#4A4A4E", "#1C1C1E"],
  slate: ["#DADAE0", "#A9A9B2"],
  white: ["#FFFFFF", "#EDF0F7"],
};

/* Panel tints: [top, bottom] */
const PANELS = {
  blueT: ["#EFF5FF", "#DFEAFF"],
  amberT: ["#FFF8E6", "#FFEFCB"],
  greenT: ["#EEFBF1", "#DDF5E4"],
  redT: ["#FFF1EF", "#FFE4E0"],
  purpleT: ["#F4F2FF", "#EAE6FF"],
  tealT: ["#ECFAF7", "#DAF4EE"],
};

function Defs({ uid }) {
  const grad = (key, [a, b]) => (
    <linearGradient key={key} id={`${uid}-${key}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={a} />
      <stop offset="1" stopColor={b} />
    </linearGradient>
  );
  return (
    <>
      {Object.entries(GRADS).map(([k, v]) => grad(k, v))}
      {Object.entries(PANELS).map(([k, v]) => grad(k, v))}
      <radialGradient id={`${uid}-ground`}>
        <stop offset="0" stopColor="#1C1C1E" stopOpacity="0.12" />
        <stop offset="1" stopColor="#1C1C1E" stopOpacity="0" />
      </radialGradient>
    </>
  );
}

/* Scene-building helpers */
const sparklePath = (x, y, s = 1) =>
  `M${x} ${y - 8 * s}L${x + 1.8 * s} ${y - 1.8 * s}L${x + 8 * s} ${y}L${x + 1.8 * s} ${y + 1.8 * s}L${x} ${y + 8 * s}L${x - 1.8 * s} ${y + 1.8 * s}L${x - 8 * s} ${y}L${x - 1.8 * s} ${y - 1.8 * s}Z`;

const panel = (g, tint, x = 10, y = 10, w = 76, h = 76, rx = 26) => (
  <rect x={x} y={y} width={w} height={h} rx={rx} fill={g(tint)} />
);

const ground = (g, cx = 48, cy = 78, rx = 26, ry = 5) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={g("ground")} />
);

const dot = (cx, cy, r, fill, opacity = 1) => (
  <circle cx={cx} cy={cy} r={r} fill={fill} opacity={opacity} />
);

const spark = (x, y, s, fill, opacity = 1) => (
  <path d={sparklePath(x, y, s)} fill={fill} opacity={opacity} />
);

/* Gloss highlight — a soft white bar across the top of a shape */
const gloss = (cx, cy, rx, ry, rotate = 0) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FFFFFF" opacity="0.35" transform={rotate ? `rotate(${rotate} ${cx} ${cy})` : undefined} />
);

const S = {};

/* ── 96×96 scenes ── */

S.learn = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "blueT")}
    {ground(g)}
    <path d="M30 36c6-3 11-3 17-1v28c-6-2-11-2-17 1V36z" fill={g("white")} />
    <path d="M66 36c-6-3-11-3-17-1v28c6-2 11-2 17 1V36z" fill={g("blue")} />
    <path d="M46 35h4v28h-4z" fill={g("slate")} opacity="0.55" />
    <path d="M56 36v10l4-3.2 4 3.2V36z" fill={g("amber")} />
    <path d="M34 44h9M34 50h7" stroke={g("slate")} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M53 46h9M53 52h7" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
    {dot(26, 28, 3, g("red"))}
    {spark(74, 26, 0.7, g("green"))}
  </>
) };

S.ask = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "amberT")}
    {ground(g)}
    <path d="M30 28h36a10 10 0 0 1 10 10v10a10 10 0 0 1-10 10H44l-12 9 3-9h-5a10 10 0 0 1-10-10V38a10 10 0 0 1 10-10z" fill={g("blue")} />
    {dot(40, 43, 2.8, "#FFFFFF")}
    {dot(48, 43, 2.8, "#FFFFFF")}
    {dot(56, 43, 2.8, "#FFFFFF")}
    <rect x="58" y="52" width="20" height="14" rx="7" fill={g("white")} />
    {dot(64, 59, 2, g("teal"))}
    {dot(70, 59, 2, g("teal"))}
    {dot(76, 59, 2, g("teal"))}
    {spark(24, 30, 0.65, g("orange"))}
    {dot(74, 24, 3, g("red"))}
  </>
) };

S.practice = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "greenT")}
    {ground(g)}
    <circle cx="46" cy="47" r="21" fill={g("blue")} />
    <circle cx="46" cy="47" r="13.5" fill={g("white")} />
    <circle cx="46" cy="47" r="6.5" fill={g("red")} />
    <path d="M60 61l12 12" stroke={g("ink")} strokeWidth="7" strokeLinecap="round" />
    {gloss(40, 38, 9, 4, -25)}
    {spark(74, 26, 0.7, g("amber"))}
  </>
) };

S.build = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "redT")}
    {ground(g)}
    <rect x="27" y="26" width="42" height="15" rx="7.5" fill={g("blue")} />
    <path d="M35 30.5l6 4-6 4" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="27" y="46" width="24" height="15" rx="7.5" fill={g("amber")} />
    <rect x="56" y="46" width="13" height="15" rx="6.5" fill={g("green")} />
    {dot(74, 30, 3, g("orange"))}
    {spark(24, 60, 0.6, g("blue"))}
  </>
) };

S.updates = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "amberT")}
    {ground(g)}
    <path d="M48 24c11 0 17 8 17 17v9c0 4 2.4 6.4 4.8 8.6H26.2c2.4-2.2 4.8-4.6 4.8-8.6v-9c0-9 6-17 17-17z" fill={g("amber")} />
    <path d="M42 70a6 6 0 0 0 12 0z" fill={g("ink")} />
    <path d="M27 40c0-9 5-15 12-18" fill="none" stroke={g("slate")} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    <path d="M69 40c0-9-5-15-12-18" fill="none" stroke={g("slate")} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    <circle cx="64" cy="27" r="7" fill={g("red")} />
    {dot(64, 27, 2.2, "#FFFFFF")}
    {gloss(43, 34, 7, 3.2, -20)}
  </>
) };

S.languages = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "blueT")}
    {ground(g)}
    <circle cx="44" cy="46" r="19" fill={g("blue")} />
    <ellipse cx="44" cy="46" rx="8.5" ry="19" fill="none" stroke="#FFFFFF" strokeWidth="2.4" opacity="0.85" />
    <path d="M25.5 46h37M28 37h32M28 55h32" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
    <rect x="56" y="52" width="18" height="18" rx="9" fill={g("green")} />
    <path d="M65 56.5v9M60.5 61h9" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
    {gloss(38, 36, 7, 3, -25)}
    {spark(24, 26, 0.6, g("amber"))}
  </>
) };

S.research = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "tealT")}
    {ground(g)}
    <circle cx="44" cy="43" r="16" fill={g("white")} />
    <circle cx="44" cy="43" r="16" fill="none" stroke={g("teal")} strokeWidth="5.5" />
    <path d="M37 45c2.4-3 4.8-3 7 0s4.6 3 7 0" fill="none" stroke={g("blue")} strokeWidth="2.6" strokeLinecap="round" />
    {dot(39, 39, 1.8, g("amber"))}
    <path d="M56 55l12 12" stroke={g("ink")} strokeWidth="7.5" strokeLinecap="round" />
    {spark(72, 28, 0.7, g("red"))}
  </>
) };

S.community = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "purpleT")}
    {ground(g)}
    <circle cx="35" cy="42" r="10.5" fill={g("amber")} stroke="#FFFFFF" strokeWidth="3" />
    <circle cx="61" cy="42" r="10.5" fill={g("blue")} stroke="#FFFFFF" strokeWidth="3" />
    <circle cx="48" cy="58" r="10.5" fill={g("teal")} stroke="#FFFFFF" strokeWidth="3" />
    <path d="M30 68c3-6 9-9 18-9s15 3 18 9" fill="none" stroke={g("indigo")} strokeWidth="4" strokeLinecap="round" opacity="0.35" />
    {spark(72, 26, 0.65, g("pink"))}
  </>
) };

S.shield = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "blueT")}
    {ground(g)}
    <path d="M48 22l19 7v17c0 13-8.6 20.6-19 25-10.4-4.4-19-12-19-25V29z" fill={g("blue")} />
    <path d="M39.5 46.5l6.5 6.5 12-13" fill="none" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    {gloss(42, 32, 8, 3.4, -30)}
    {spark(73, 26, 0.65, g("amber"))}
  </>
) };

S.lock = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "amberT")}
    {ground(g)}
    <path d="M37 46v-8a11 11 0 0 1 22 0v8" fill="none" stroke={g("slate")} strokeWidth="6.5" strokeLinecap="round" />
    <rect x="29" y="45" width="38" height="27" rx="11" fill={g("amber")} />
    <circle cx="48" cy="56" r="4" fill={g("ink")} />
    <rect x="46.4" y="57" width="3.2" height="8" rx="1.6" fill={g("ink")} />
    {gloss(41, 51, 8, 3, -25)}
    {spark(72, 28, 0.65, g("blue"))}
  </>
) };

S.document = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "blueT")}
    {ground(g)}
    <rect x="30" y="23" width="36" height="46" rx="9" fill={g("white")} />
    <rect x="36" y="33" width="18" height="3.2" rx="1.6" fill={g("blue")} />
    <rect x="36" y="41" width="24" height="3.2" rx="1.6" fill={g("slate")} />
    <rect x="36" y="49" width="21" height="3.2" rx="1.6" fill={g("slate")} />
    <rect x="36" y="57" width="14" height="3.2" rx="1.6" fill={g("blue")} opacity="0.7" />
    <circle cx="63" cy="30" r="5" fill={g("amber")} />
    {spark(25, 62, 0.6, g("teal"))}
  </>
) };

S.cookie = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "amberT")}
    {ground(g)}
    <circle cx="47" cy="48" r="20" fill={g("amber")} />
    {dot(40, 41, 2.8, g("ink"))}
    {dot(53, 44, 2.8, g("ink"))}
    {dot(43, 55, 2.8, g("ink"))}
    {dot(55, 55, 2.4, g("ink"))}
    {gloss(41, 39, 8, 3.4, -30)}
    {dot(72, 30, 3, g("orange"))}
    {dot(25, 58, 2.4, g("red"))}
  </>
) };

S.accessibility = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "blueT")}
    {ground(g)}
    <circle cx="48" cy="47" r="22" fill={g("white")} />
    <circle cx="48" cy="47" r="22" fill="none" stroke={g("blue")} strokeWidth="5.5" />
    <circle cx="48" cy="37.5" r="4.2" fill={g("ink")} />
    <path d="M36.5 45.5h23M48 46.5v8M48 54.5l-7.5 10M48 54.5l7.5 10" fill="none" stroke={g("ink")} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
    {spark(71, 25, 0.6, g("amber"))}
  </>
) };

S.compass = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "tealT")}
    {ground(g)}
    <circle cx="48" cy="47" r="20" fill={g("white")} />
    <circle cx="48" cy="47" r="20" fill="none" stroke={g("teal")} strokeWidth="4.5" />
    <path d="M48 33l5.5 14L48 61l-5.5-14z" fill={g("red")} />
    <path d="M48 33l-5.5 14L48 61l0-14z" fill={g("ink")} opacity="0.85" />
    <circle cx="48" cy="47" r="2.6" fill="#FFFFFF" />
    <path d="M48 24.5v-3M48 72.5v-3M70.5 47h3M22.5 47h3" stroke={g("slate")} strokeWidth="2.6" strokeLinecap="round" />
    {spark(72, 27, 0.6, g("amber"))}
  </>
) };

S.tag = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "amberT")}
    {ground(g)}
    <g transform="rotate(-24 48 51)">
      <rect x="29" y="40" width="38" height="23" rx="9" fill={g("amber")} />
      <circle cx="38.5" cy="51.5" r="3.6" fill="#FFFFFF" />
      <path d="M47 51.5h12" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
    </g>
    <path d="M28 46c-5-3-7-9-4-14" fill="none" stroke={g("slate")} strokeWidth="3" strokeLinecap="round" />
    {spark(70, 28, 0.7, g("red"))}
  </>
) };

S.download = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "greenT")}
    {ground(g)}
    <path d="M45 24h6v17h8L48 53 37 41h8z" fill={g("green")} />
    <rect x="27" y="60" width="42" height="10" rx="5" fill={g("slate")} />
    {spark(72, 30, 0.7, g("blue"))}
    {dot(26, 34, 3, g("amber"))}
  </>
) };

S.help = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "blueT")}
    {ground(g)}
    <circle cx="48" cy="47" r="20" fill={g("blue")} />
    <path d="M41.5 41a6.6 6.6 0 1 1 9.4 6.2c-2.1 1.2-2.9 2.4-2.9 4.6" fill="none" stroke="#FFFFFF" strokeWidth="4.6" strokeLinecap="round" />
    {dot(48, 59, 3.1, "#FFFFFF")}
    {gloss(41, 37, 7, 3, -25)}
    {spark(71, 28, 0.6, g("amber"))}
  </>
) };

S.briefcase = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "purpleT")}
    {ground(g)}
    <path d="M41 42v-5a7 7 0 0 1 14 0v5" fill="none" stroke={g("slate")} strokeWidth="5.5" strokeLinecap="round" />
    <rect x="27" y="41" width="42" height="28" rx="10" fill={g("indigo")} />
    <rect x="42.5" y="51" width="11" height="8.5" rx="3.2" fill={g("amber")} />
    {gloss(39, 47, 9, 3.2, -20)}
    {spark(72, 30, 0.6, g("teal"))}
  </>
) };

S.growth = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "greenT")}
    {ground(g)}
    <rect x="29" y="50" width="11" height="16" rx="5" fill={g("teal")} />
    <rect x="43.5" y="42" width="11" height="24" rx="5" fill={g("blue")} />
    <rect x="58" y="32" width="11" height="34" rx="5" fill={g("green")} />
    <path d="M27 34c9-7 17-5 24-2" fill="none" stroke={g("ink")} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
    <path d="M52 24l7 6-9 3z" fill={g("ink")} opacity="0.8" />
    {spark(72, 26, 0.65, g("amber"))}
  </>
) };

S.gift = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "redT")}
    {ground(g)}
    <path d="M48 37c-7-11-19-7-15-1 2.6 4 10 4 15 1z" fill={g("pink")} />
    <path d="M48 37c7-11 19-7 15-1-2.6 4-10 4-15 1z" fill={g("pink")} />
    <rect x="30" y="45" width="36" height="23" rx="7" fill={g("pink")} />
    <rect x="27" y="37" width="42" height="10" rx="5" fill={g("red")} />
    <rect x="44.6" y="37" width="6.8" height="31" fill="#FFFFFF" opacity="0.85" />
    {spark(26, 32, 0.6, g("amber"))}
    {dot(72, 60, 3, g("teal"))}
  </>
) };

S.mail = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "blueT")}
    {ground(g)}
    <rect x="25" y="33" width="46" height="31" rx="9" fill={g("blue")} />
    <path d="M28 38l20 14 20-14" fill="none" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    {gloss(40, 38, 9, 3, -15)}
    {dot(72, 28, 3.2, g("red"))}
    {spark(24, 60, 0.6, g("amber"))}
  </>
) };

S.handshake = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "blueT")}
    {ground(g)}
    <path d="M18 64q12-14 28-13" fill="none" stroke={g("blue")} strokeWidth="11" strokeLinecap="round" />
    <path d="M78 64q-12-14-28-13" fill="none" stroke={g("amber")} strokeWidth="11" strokeLinecap="round" />
    <circle cx="48" cy="51" r="9" fill={g("teal")} stroke="#FFFFFF" strokeWidth="3.4" />
    {spark(70, 30, 0.7, g("green"))}
    {dot(27, 32, 3, g("red"))}
  </>
) };

S.safety = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "redT")}
    {ground(g)}
    <path d="M48 23l16 6v14.5c0 11-6.8 17.4-16 21-9.2-3.6-16-10-16-21V29z" fill={g("red")} />
    <path d="M48 51c-4.6-3.6-7.4-6.4-7.4-9.6a4.2 4.2 0 0 1 7.4-2.4 4.2 4.2 0 0 1 7.4 2.4c0 3.2-2.8 6-7.4 9.6z" fill="#FFFFFF" />
    {gloss(42, 32, 6.5, 3, -30)}
    {spark(70, 27, 0.65, g("amber"))}
  </>
) };

S.eye = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "tealT")}
    {ground(g)}
    <path d="M25 48q23-19 46 0-23 19-46 0z" fill={g("white")} />
    <circle cx="48" cy="48" r="9.5" fill={g("teal")} />
    <circle cx="48" cy="48" r="4.2" fill={g("ink")} />
    <circle cx="50.5" cy="45.5" r="1.5" fill="#FFFFFF" />
    {spark(71, 28, 0.65, g("blue"))}
    {dot(26, 32, 2.6, g("amber"))}
  </>
) };

S.flag = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "greenT")}
    {ground(g)}
    <path d="M37 28c9-4 15 2 24-2v17c-9 4-15-2-24 2z" fill={g("green")} />
    <rect x="31" y="24" width="4.6" height="46" rx="2.3" fill={g("ink")} />
    <ellipse cx="42" cy="72" rx="10" ry="3" fill={g("slate")} opacity="0.7" />
    {spark(68, 30, 0.65, g("amber"))}
  </>
) };

/* ── School subjects (96×96) ── */

S.math = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "blueT")}
    {ground(g)}
    <rect x="30" y="28" width="36" height="40" rx="11" fill={g("white")} />
    <path d="M48 34v12M42 40h12" stroke={g("green")} strokeWidth="4" strokeLinecap="round" />
    <path d="M40 54h16M40 60h16" stroke={g("indigo")} strokeWidth="4" strokeLinecap="round" />
    {spark(70, 28, 0.65, g("amber"))}
    {dot(26, 60, 2.6, g("red"))}
  </>
) };

S.physics = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "purpleT")}
    {ground(g)}
    <ellipse cx="48" cy="47" rx="20" ry="8" fill="none" stroke={g("indigo")} strokeWidth="3.4" transform="rotate(28 48 47)" opacity="0.9" />
    <ellipse cx="48" cy="47" rx="20" ry="8" fill="none" stroke={g("indigo")} strokeWidth="3.4" transform="rotate(-28 48 47)" opacity="0.9" />
    <circle cx="48" cy="47" r="6.5" fill={g("red")} />
    <circle cx="60" cy="36" r="3.2" fill={g("blue")} />
    <circle cx="36" cy="57" r="3.2" fill={g("teal")} />
    {spark(71, 27, 0.6, g("amber"))}
  </>
) };

S.chemistry = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "tealT")}
    {ground(g)}
    <path d="M42 26h12v13l9.6 19a6.5 6.5 0 0 1-5.8 9.4H38.2A6.5 6.5 0 0 1 32.4 58L42 39z" fill={g("white")} />
    <path d="M36.6 51h22.8l4.2 8.4a6 6 0 0 1-5.4 8.6H37.8a6 6 0 0 1-5.4-8.6z" fill={g("teal")} />
    <circle cx="43" cy="59" r="2" fill="#FFFFFF" opacity="0.9" />
    <circle cx="50" cy="62" r="1.5" fill="#FFFFFF" opacity="0.9" />
    <rect x="40" y="23.5" width="16" height="4.5" rx="2.25" fill={g("teal")} />
    {spark(70, 30, 0.6, g("pink"))}
  </>
) };

S.biology = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "greenT")}
    {ground(g)}
    <path d="M49 67c-16-6-21-24-16-36 15 2 28 12 26 27-.8 6-5 9-10 9z" fill={g("green")} />
    <path d="M46 64c-2-11-1-19 5-27" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" opacity="0.85" />
    <path d="M49 67c2-9 6-15 13-19" fill="none" stroke={g("ink")} strokeWidth="3.4" strokeLinecap="round" opacity="0.75" />
    {dot(29, 32, 2.6, g("red"))}
    {spark(68, 28, 0.65, g("amber"))}
  </>
) };

S.english = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "amberT")}
    {ground(g)}
    <path d="M32 46c5-2.6 9-2.6 14-.8v20c-5-1.8-9-1.8-14 .8V46z" fill={g("blue")} />
    <path d="M60 46c-5-2.6-9-2.6-14-.8v20c5-1.8 9-1.8 14 .8V46z" fill={g("white")} />
    <circle cx="62" cy="31" r="10" fill={g("white")} />
    <path d="M58 39l-3 5 7-3.4" fill={g("white")} />
    {dot(58, 31, 1.7, g("ink"))}
    {dot(62, 31, 1.7, g("ink"))}
    {dot(66, 31, 1.7, g("ink"))}
    {spark(28, 30, 0.6, g("teal"))}
  </>
) };

S.hindi = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "blueT")}
    {ground(g)}
    <rect x="27" y="30" width="34" height="24" rx="12" fill={g("amber")} />
    <path d="M35 52l-6 9 13-6.6z" fill={g("amber")} />
    <path d="M35 42q4.2-5.4 8.4 0t8.4 0" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
    {dot(39, 36, 1.8, "#FFFFFF")}
    {dot(48, 36, 1.8, "#FFFFFF")}
    <circle cx="64" cy="56" r="9" fill={g("white")} />
    <path d="M60.5 56q3.5-4.4 7 0" fill="none" stroke={g("orange")} strokeWidth="2.6" strokeLinecap="round" />
    {spark(70, 28, 0.6, g("red"))}
  </>
) };

S.history = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "amberT")}
    {ground(g)}
    <path d="M29 39L48 28l19 11z" fill={g("amber")} />
    <rect x="33" y="42" width="6" height="17" rx="3" fill={g("white")} />
    <rect x="45" y="42" width="6" height="17" rx="3" fill={g("white")} />
    <rect x="57" y="42" width="6" height="17" rx="3" fill={g("white")} />
    <rect x="29" y="61" width="38" height="7" rx="3.5" fill={g("amber")} />
    {spark(70, 28, 0.6, g("red"))}
    {dot(26, 56, 2.6, g("teal"))}
  </>
) };

S.geography = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "tealT")}
    {ground(g)}
    <path d="M25 62l14-21 9 13 7-10 16 18z" fill={g("green")} />
    <path d="M35.5 46.5L39 41l3.6 5.5-3.6 3z" fill="#FFFFFF" opacity="0.9" />
    <path d="M52.6 49l3.4-5 3.8 5.4-3.8 2.6z" fill="#FFFFFF" opacity="0.9" />
    <circle cx="64" cy="33" r="6" fill={g("amber")} />
    {spark(28, 32, 0.6, g("blue"))}
  </>
) };

S.computerScience = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "blueT")}
    {ground(g)}
    <rect x="27" y="30" width="42" height="34" rx="9" fill={g("ink")} />
    <circle cx="33.5" cy="36.5" r="1.8" fill={g("red")} />
    <circle cx="39" cy="36.5" r="1.8" fill={g("amber")} />
    <circle cx="44.5" cy="36.5" r="1.8" fill={g("green")} />
    <path d="M34 45l6 5-6 5" fill="none" stroke={g("green")} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="45" y="50.5" width="10" height="3.2" rx="1.6" fill={g("amber")} />
    {spark(71, 28, 0.6, g("teal"))}
  </>
) };

S.economics = { vb: "0 0 96 96", el: (g) => (
  <>
    {panel(g, "amberT")}
    {ground(g)}
    <circle cx="38" cy="58" r="9" fill={g("amber")} stroke="#FFFFFF" strokeWidth="3" />
    <circle cx="54" cy="60" r="9" fill={g("amber")} stroke="#FFFFFF" strokeWidth="3" />
    <path d="M29 41l13 6 14-12" fill="none" stroke={g("teal")} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M50 32l7.4 2.6-4.8 6.8z" fill={g("teal")} />
    {spark(70, 28, 0.6, g("blue"))}
  </>
) };

/* ── Wide scene (128×96) ── */

S.loop = { vb: "0 0 128 96", el: (g) => (
  <>
    {panel(g, "blueT", 10, 10, 108, 76, 26)}
    {ground(g, 64, 80, 34, 5)}
    <circle cx="64" cy="48" r="25" fill="none" stroke={g("slate")} strokeWidth="3" strokeDasharray="1 8" strokeLinecap="round" opacity="0.9" />
    <circle cx="64" cy="23" r="8" fill={g("blue")} stroke="#FFFFFF" strokeWidth="3" />
    <circle cx="89" cy="48" r="8" fill={g("amber")} stroke="#FFFFFF" strokeWidth="3" />
    <circle cx="64" cy="73" r="8" fill={g("teal")} stroke="#FFFFFF" strokeWidth="3" />
    <circle cx="39" cy="48" r="8" fill={g("green")} stroke="#FFFFFF" strokeWidth="3" />
    {spark(104, 26, 0.7, g("red"))}
    {dot(24, 30, 3, g("amber"))}
  </>
) };

/* ── Portrait scenes (120×160) ── */

S.student = { vb: "0 0 120 160", el: (g) => (
  <>
    {panel(g, "blueT", 10, 10, 100, 140, 30)}
    {ground(g, 60, 146, 30, 5.5)}
    <circle cx="60" cy="64" r="14" fill={g("amber")} />
    <path d="M46 62a14 14 0 0 1 28 0z" fill={g("ink")} opacity="0.85" />
    <path d="M38 138c0-21 10-31 22-31s22 10 22 31z" fill={g("blue")} />
    <rect x="46" y="102" width="28" height="19" rx="4.5" fill={g("white")} />
    <path d="M51 108h18M51 114h13" stroke={g("blue")} strokeWidth="2.6" strokeLinecap="round" />
    {spark(88, 40, 0.75, g("green"))}
    {dot(32, 48, 3.2, g("red"))}
  </>
) };

S.teacher = { vb: "0 0 120 160", el: (g) => (
  <>
    {panel(g, "amberT", 10, 10, 100, 140, 30)}
    {ground(g, 60, 146, 30, 5.5)}
    <rect x="30" y="28" width="60" height="42" rx="10" fill={g("white")} />
    <path d="M38 58l10-9 8 6 12-13" fill="none" stroke={g("teal")} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="60" cy="90" r="13" fill={g("amber")} />
    <path d="M47 88a13 13 0 0 1 26 0z" fill={g("ink")} opacity="0.85" />
    <path d="M40 138c0-19 9-28 20-28s20 9 20 28z" fill={g("indigo")} />
    {spark(90, 84, 0.7, g("blue"))}
    {dot(30, 82, 3, g("red"))}
  </>
) };

S.parent = { vb: "0 0 120 160", el: (g) => (
  <>
    {panel(g, "redT", 10, 10, 100, 140, 30)}
    {ground(g, 60, 146, 32, 5.5)}
    <circle cx="48" cy="66" r="14" fill={g("amber")} />
    <path d="M34 64a14 14 0 0 1 28 0z" fill={g("ink")} opacity="0.85" />
    <path d="M26 138c0-20 10-30 22-30s22 10 22 30z" fill={g("pink")} />
    <circle cx="80" cy="98" r="10" fill={g("amber")} />
    <path d="M70 96.5a10 10 0 0 1 20 0z" fill={g("ink")} opacity="0.85" />
    <path d="M68 138c0-14 6-21 12-21s12 7 12 21z" fill={g("blue")} />
    {spark(88, 44, 0.75, g("teal"))}
    {dot(30, 44, 3, g("orange"))}
  </>
) };

S.team = { vb: "0 0 120 160", el: (g) => (
  <>
    {panel(g, "tealT", 10, 10, 100, 140, 30)}
    {ground(g, 60, 146, 34, 5.5)}
    <circle cx="38" cy="86" r="11" fill={g("amber")} />
    <path d="M27 138c0-16 5-24 11-24s11 8 11 24z" fill={g("teal")} />
    <circle cx="60" cy="76" r="12" fill={g("ink")} opacity="0.9" />
    <path d="M48 138c0-18 6-27 12-27s12 9 12 27z" fill={g("blue")} />
    <circle cx="82" cy="86" r="11" fill={g("amber")} />
    <path d="M71 138c0-16 5-24 11-24s11 8 11 24z" fill={g("pink")} />
    {spark(90, 48, 0.75, g("green"))}
    {dot(30, 52, 3, g("red"))}
  </>
) };

export default function SpotIllustration({ subject, className = "", title }) {
  const scene = S[subject] ?? S.compass;
  const uid = `spot${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const g = (name) => `url(#${uid}-${name})`;
  return (
    <svg viewBox={scene.vb} role={title ? "img" : "presentation"} aria-hidden={title ? undefined : true}
      className={className} focusable="false" preserveAspectRatio="xMidYMid slice">
      <defs><Defs uid={uid} /></defs>
      {scene.el(g)}
      {title ? <title>{title}</title> : null}
    </svg>
  );
}
