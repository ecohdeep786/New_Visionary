/* Summarize apple-deep/metrics.json into compact grouped specs.
   Run: node scripts-tmp/apple-summary.mjs */
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync("scripts-tmp/apple-deep/metrics.json", "utf8"));

const round = (v) => Math.round(parseFloat(v) * 10) / 10;
// eslint-disable-next-line no-control-regex
const clean = (s) => String(s).replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, "");

for (const [page, vps] of Object.entries(data)) {
  console.log(`\n════════ ${page} ════════`);
  for (const [tag, m] of Object.entries(vps)) {
    console.log(`── ${tag} (${m.doc.w}px, scrollH ${m.doc.scrollH})`);
    console.log(`  nav: ${JSON.stringify(m.nav)}`);

    // group headings by size/weight
    const hg = new Map();
    for (const h of m.headings) {
      const k = `${h.size}px/w${h.w}`;
      if (!hg.has(k)) hg.set(k, { ls: h.ls, lh: h.lh, n: 0, samples: [] });
      const g = hg.get(k);
      g.n += 1;
      if (g.samples.length < 4) g.samples.push(h.t);
    }
    console.log("  headings:");
    for (const [k, g] of hg) console.log(`    ${k} · ls:${g.ls}em lh:${g.lh} · n=${g.n} · "${g.samples.join('" | "')}"`);

    // body copy
    const bg = new Map();
    for (const b of m.body) {
      const k = `${b.size}px`;
      if (!bg.has(k)) bg.set(k, { lh: b.lh, w: b.w, n: 0, colors: new Set(), samples: [] });
      const g = bg.get(k);
      g.n += 1; g.colors.add(b.color);
      if (g.samples.length < 2) g.samples.push(b.t);
    }
    console.log("  body:");
    for (const [k, g] of bg) console.log(`    ${k} · lh:${g.lh} w:${g.w} · n=${g.n} · ${[...g.colors].slice(0, 3).join(" / ")} · "${g.samples.join('" | "')}"`);

    // sections: top 14 distinct paddings
    const sg = new Map();
    for (const s of m.sections) {
      const k = `${s.padT}/${s.padB}`;
      if (!sg.has(k)) sg.set(k, { n: 0, h: s.h, bgs: new Set() });
      const g = sg.get(k);
      g.n += 1; g.bgs.add(s.bg);
      if (g.h < s.h) g.h = s.h;
    }
    console.log("  sections (padT/padB, count, max h, bg):");
    for (const [k, g] of [...sg.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 12)) {
      console.log(`    ${k} · n=${g.n} · maxH=${g.h} · ${[...g.bgs].slice(0, 3).join(" / ")}`);
    }

    console.log("  tiles (top 10):");
    for (const t of m.tiles.slice(0, 10)) console.log(`    ${t.display} cols:"${t.cols}" gap:${t.gap} radius:${t.radius} itemPad:${t.itemPad} bg:${t.bg} ×${t.count}`);

    console.log("  buttons:");
    for (const b of m.buttons.slice(0, 14)) console.log(`    "${b.t}" ${b.fs}px/w${b.w} px:${b.px} h:${b.h} r:${b.radius} bg:${b.bg} color:${b.color}${b.border ? ` border:${b.border}` : ""}`);
  }
}
