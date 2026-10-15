/**
 * SpotIllustration — premium product illustrations.
 *
 * Spec (premium "Memoji-3D" visual aesthetic, matched to a reference):
 *   - Human figures: smooth semi-realistic faces with full 3D volumetric
 *     shading via radial gradients (roundness), simplified necks/shoulders.
 *   - Faceless-by-default heads are replaced with shaded face volumes:
 *     a glossy hair cap, a subtle ear, and soft-shaded skin that reads as a
 *     rounded head rather than a flat disc. Eyes/mouth are implied by tone.
 *   - Props: clean geometric objects — laptops, tables, chairs, books —
 *     in off-white, soft charcoal, and metallic grays with subtle rim
 *     strokes for depth.
 *   - Soft color model. Gradients only (linear + radial), never flat fills
 *     on characters; crisp flat fills on the geometric "icon" props so they
 *     read at small sizes.
 *   - Background card: #f4f2f5; a subtle card-gradient for wide scenes.
 *     Ground shadows: black ellipses at 0.08–0.12 opacity beneath feet/props.
 *
 * Character palette: a deep teal field, warm peach skin with volumetric
 * gradients, glossy dark hair with a specular catch-light, and a muted
 * clothing set of blue / magenta / orange / teal.
 *
 * Wide showcase scenes (collab/study/teach/teamwork) use viewBox 0 0 800 450
 * with semantic groups: background / shadows / furniture / character / props.
 * Our own geometry — idea, not copy. Decorative by default (aria-hidden).
 *
 * NOTE: radial/linearGradients are declared INSIDE each scene's <g> with a
 * unique id, so multiple illustrations may coexist on a page without id
 * collisions (SVG scoping).
 */

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
