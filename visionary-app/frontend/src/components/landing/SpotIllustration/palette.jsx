const C = {
  /* field / card */
  card: "#f4f2f5",
  cardDark: "#e9e4ea",
  tealField: "#083e59",
  tealField2: "#06354d",
  /* neutrals */
  charcoal: "#1a1a1c",
  metal: "#b8b8bd",
  metalDark: "#8a8a92",
  metalLight: "#d9d9dd",
  white: "#ffffff",
  greyLight: "#dedfe2",
  /* clothing / props (muted premium set) */
  blue: "#2b6cb0",
  blueLight: "#6cb5f0",
  magenta: "#af3a7d",
  magentaLight: "#f06eaa",
  orange: "#e2721b",
  orangeLight: "#f5a269",
  green: "#2f914c",
  greenLight: "#7cd492",
  teal: "#2da89b",
  tealLight: "#89e0d9",
  amber: "#d1ad4b",
  indigo: "#6b5fc9",
  indigoLight: "#b4acf5",
  sky: "#79c7e8",
  trousers: "#4a4a52",
  trousersLight: "#727279",
  /* skin — warm peach with full volumetric range */
  skinHighlight: "#fde9d8",
  skin: "#f4dac4",
  skinMid: "#e2c4a8",
  skinShade: "#cca98e",
  skinDeep: "#ae8566",
  skinShadow: "#8a5e3c",
  skinShadeDeep: "#714a2c",
  /* hair — glossy dark brown with a catch-light */
  hair: "#3e271a",
  hairGloss: "#5c3514",
  hairDark: "#2b190e",
  hairShine: "#7a4e28",
  dog: "#e9c491",
};

/* ── shared primitives ── */
const cardGradient = (id, w = 96, h = 96, rx = 20) => (
  <>
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={C.cardDark} />
        <stop offset="100%" stopColor={C.card} />
      </linearGradient>
    </defs>
    <rect width={w} height={h} rx={rx} fill={`url(#${id})`} />
  </>
);
const shadow = (cx, cy, rx, ry, opacity = 0.1) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#000000" opacity={opacity} />
);

/* A glossy hair cap with a highlight band + an implied ear. */
const hairCapShaded = (cx, cy, r, tone = C.hair) => {
  /* Accept either a single color string or a [light, mid, dark] array. */
  const t = Array.isArray(tone) ? tone : [C.hairShine, tone, C.hairDark];
  return (
  <g>
    <defs>
      <radialGradient id={`h${cx}-${cy}`} cx="50%" cy="100%" r="80%">
        <stop offset="0%" stopColor={t[0]} />
        <stop offset="60%" stopColor={t[1]} />
        <stop offset="100%" stopColor={t[2]} />
      </radialGradient>
    </defs>
    <path
      d={`M${cx - r} ${cy}a${r} ${r} 0 0 1 ${r * 2} 0z`}
      fill={`url(#h${cx}-${cy})`}
    />
    <path
      d={`M${cx - r + 6} ${cy}a${r - 6} ${r - 6} 0 0 1 ${r * 2 - 12} 0z`}
      fill={C.hairShine}
      opacity="0.18"
    />
  </g>
  );
};
const ear = (cx, cy, r, shade) => <circle cx={cx} cy={cy} r={r} fill={shade} />;
const glasses = (cx1, cx2, cy, r = 7) => (
  <g fill="none" stroke={C.charcoal} strokeWidth="2.6">
    <circle cx={cx1} cy={cy} r={r} />
    <circle cx={cx2} cy={cy} r={r} />
    <path d={`M${cx1 + r} ${cy}H${cx2 - r}`} />
  </g>
);
const dot = (cx, cy, r, fill) => <circle cx={cx} cy={cy} r={r} fill={fill} />;
const legs = (x1, x2, y, h, w, fill) => (
  <g>
    <rect x={x1} y={y} width={w} height={h} rx={w / 2} fill={fill} />
    <rect x={x2} y={y} width={w} height={h} rx={w / 2} fill={fill} />
  </g>
);
const shoes = (x1, x2, y, w = 26, h = 9) => (
  <g>
    <rect x={x1} y={y} width={w} height={h} rx={h / 2} fill={C.charcoal} />
    <rect x={x2} y={y} width={w} height={h} rx={h / 2} fill={C.charcoal} />
  </g>
);

/* Skin tone families — each is [highlight, base, shadow] so the radial head
   gradient gives every character a consistent 3D peach volume. */
const SKIN_DEFAULT = [C.skinHighlight, C.skinMid, C.skinShade];
const SKIN_DEEP = [C.skin, C.skinMid, C.skinDeep];
const SKIN_DEEPER = [C.skinMid, C.skinShade, C.skinShadow];

/* Shared face volume used by the portrait and wide scenes below. */
const headShaded = (cx, cy, r, tone = SKIN_DEFAULT) => {
  const id = `skin-${cx}-${cy}-${r}-${tone[1].replace('#', '')}`;
  return <g>
    <defs><radialGradient id={id} cx="35%" cy="28%" r="75%">
      <stop offset="0%" stopColor={tone[0]} />
      <stop offset="65%" stopColor={tone[1]} />
      <stop offset="100%" stopColor={tone[2]} />
    </radialGradient></defs>
    <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
  </g>;
};

export {
  C, cardGradient, shadow, hairCapShaded, ear, glasses,
  dot, legs, shoes, SKIN_DEFAULT, SKIN_DEEP, SKIN_DEEPER, headShaded,
};
