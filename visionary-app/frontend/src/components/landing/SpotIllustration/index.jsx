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

import scenesPrimary from "./scenes-primary.jsx";
import scenesAcademic from "./scenes-academic.jsx";
import scenesPortraits from "./scenes-portraits.jsx";
import scenesWide from "./scenes-wide.jsx";

/* the one subject map, gathered from the per-group scene modules */
const S = {
  ...scenesPrimary,
  ...scenesAcademic,
  ...scenesPortraits,
  ...scenesWide,
};

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
