import React from "react";
import LazyImage from "@/components/landing/LazyImage";

const JourneyCategoryCard = React.memo(function JourneyCategoryCard({ index, text, className = "", images, onOpen, category, imgAlt }) {
  /* When onOpen is supplied the card behaves like an Apple story card: the
     whole surface is the button that opens the category's story popup. */
  const isInteractive = typeof onOpen === "function";
  const Wrap = isInteractive ? "button" : "div";
  return (
    <Wrap
      type={isInteractive ? "button" : undefined}
      onClick={isInteractive ? () => onOpen(category) : undefined}
      aria-label={isInteractive ? `Open ${text}` : undefined}
      className={`relative block overflow-hidden rounded-[30px] text-left ${isInteractive ? "cursor-pointer border-0 bg-transparent outline-none transition-transform duration-300 ease-apple hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4" : ""} ${className}`}
    >
      <LazyImage
        src={images[index % images.length]}
        alt={imgAlt || text}
        decoding="async"
        className="aspect-[20/19] w-full object-cover"
      />
      {/* scrim — guarantees white type contrast on any photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1d1d1f]/55 via-[#1d1d1f]/20 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <span key={text} data-type="display" className="text-center text-white animate-[heroFadeUp_0.9s_var(--ease-out-apple)]">
          {text}
        </span>
      </div>
    </Wrap>
  );
});
export default JourneyCategoryCard;
