import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SpotIllustration from "@/components/landing/SpotIllustration";

/* ═══ HeroFanCards — the communities.google fan. A static centered hand of
   cards: the middle card stands upright, each neighbour steps 8° further
   out and sits lower, so the row droops away from centre exactly like
   edu.google.com/for-educators/communities. The five category cards cycle
   left→right across the seven-card window (Google repeats its five the
   same way), so positions six onward are content duplicates — aria-hidden
   and unfocusable — while the first five cover every category once.

   The wrapper clips the horizontal bleed only; the drooping outer cards
   spill into the spacer below, which scales with the same --fan-drop-scale
   as the arc so every width keeps a communities-sized breath after the
   deepest visible card. ═══ */

const FAN_STEP_DEG = 8;
/* translateY per outward step. Calibrated against the communities hero so
   the rendered bounding-box tops sit ~0 / 15 / 66 / 150 px below the
   centre card at full scale — the rotation expansion (~21 / ~38 / ~50 px)
   is pre-subtracted from the raw 11 / 60 / 172 drops measured there. */
const FAN_DROP = [0, 36, 104, 200];
const FAN_WINDOW = 7;
const FAN_CENTRE = (FAN_WINDOW - 1) / 2;

export default function HeroFanCards({ items, ariaLabel }) {
  const count = items.length;
  /* Duplicates (positions beyond the centre window) are always decorative. */
  const dupIndexes = new Set(Array.from({ length: FAN_WINDOW }, (_, i) => i).filter((i) => i > FAN_CENTRE));
  const wrapperRef = useRef(null);
  const cardRefs = useRef([]);
  /* F-03-D2: the fan clips its horizontal bleed, so a card pushed fully
   * outside the wrapper cannot be scrolled into view — yet the left-hand
   * cards stay tabbable and keyboard focus disappears onto invisible links
   * at every viewport width. The duplicates below already solve this with
   * aria-hidden + tabIndex -1; this measured pass applies the same rule to
   * width-dependent offscreen cards (inert also blocks click) and restores
   * them when a resize brings them back into the window. */
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;
    const update = () => {
      const window_box = wrapper.getBoundingClientRect();
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const box = card.getBoundingClientRect();
        const fullyOutside = box.width > 0 && (box.right < window_box.left + 1 || box.left > window_box.right - 1);
        const suppress = dupIndexes.has(i) || fullyOutside;
        if (suppress) {
          card.setAttribute('inert', '');
          card.setAttribute('aria-hidden', 'true');
          card.setAttribute('tabindex', '-1');
        } else {
          card.removeAttribute('inert');
          card.removeAttribute('aria-hidden');
          card.removeAttribute('tabindex');
        }
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(wrapper);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, [count]);
  return (
    <div role="region" aria-label={ariaLabel} className="[--fan-drop-scale:0.55] sm:[--fan-drop-scale:0.8] xl:[--fan-drop-scale:1]">
      <div ref={wrapperRef} className="flex w-full justify-center overflow-x-clip overflow-y-visible">
        <div className="flex w-max shrink-0 items-start">
          {Array.from({ length: FAN_WINDOW }, (_, i) => {
            const offset = i - FAN_CENTRE;
            /* Start the cycle two cards before its head so items[0] lands on centre. */
            const item = items[(i + count - FAN_CENTRE) % count];
            const dup = i > FAN_CENTRE;
            return (
              <Link
                key={`${item.label}-${i}`}
                ref={(el) => { cardRefs.current[i] = el; }}
                to={item.to}
                aria-hidden={dup || undefined}
                tabIndex={dup ? -1 : undefined}
                className="group relative mr-5 flex h-[332px] w-[272px] shrink-0 flex-col overflow-hidden rounded-[28px] p-6 transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(18,19,23,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4 sm:h-[400px] sm:w-[328px]"
                style={{
                  backgroundColor: item.tint,
                  "--fan-tilt": `${offset * FAN_STEP_DEG}deg`,
                  "--fan-drop": `${FAN_DROP[Math.abs(offset)]}px`,
                  transform: "translateY(calc(var(--fan-drop) * var(--fan-drop-scale, 1))) rotate(var(--fan-tilt))",
                }}
              >
                <span className="text-[24px] font-medium leading-[1.25] text-[#1d1d1f] sm:text-[28px]">{item.label}</span>
                <SpotIllustration subject={item.subject} className="pointer-events-none absolute bottom-0 left-1/2 h-[72%] w-auto -translate-x-1/2 transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none" />
              </Link>
            );
          })}
        </div>
      </div>
      {/* Breath after the deepest visible card before the next section. */}
      <div aria-hidden="true" className="h-[calc(210px*var(--fan-drop-scale))]" />
    </div>
  );
}
