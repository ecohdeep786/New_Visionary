import React from "react";

/* RevealItem wraps one piece of a staggered scroll-reveal chapter so the
   resolve-out stagger targets each element individually. The index drives a
   per-child 60ms delay via the .scroll-reveal.in-view :global(.reveal-item > *)
   rule registered in index.css. Under reduced motion children are visible
   instantly (the CSS rule handles that; this wrapper only annotates). */
let itemCounter = 0;
const RevealItem = React.memo(function RevealItem({ children, className = "", style, idx }) {
  return (
    <div
      className={`reveal-item ${className}`}
      style={{ ["--reveal-idx"]: idx ?? itemCounter, ...style }}
    >
      {children}
    </div>
  );
});
RevealItem.displayName = "RevealItem";
export default RevealItem;
