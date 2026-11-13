import React from "react";
import { useInViewOnce } from "@/components/landing/system/hooks";

/* Apple's scroll-reveal chapter: after the hero, sections enter the viewport
   and their type/photography rise in place, one element at a time, on the
   product resolve-out curve (--ease-out-apple in tokens.css — D1 motion law).
   Staggers children via :global(.reveal-item > *) so a heading + sub + image
   each wait their beat — the "scroll, then the text appears" cadence. The
   observer fires once; the global reduced-motion contract snaps the
   transition to instant. */

const ScrollReveal = React.memo(function ScrollReveal({ children, className = "", as: Tag = "div", threshold = 0.2, baseDelay = 0 }) {
  const { ref, entered } = useInViewOnce(threshold);
  return (
    <Tag
      ref={ref}
      className={`scroll-reveal ${entered ? "in-view" : ""} ${className}`}
      style={{
        ["--reveal-base-delay"]: `${baseDelay}ms`,
      }}
    >
      {children}
    </Tag>
  );
});
export default ScrollReveal;
