import React from "react";
import { isExternalSrc } from "./art-helpers.js";
import IntelligenceArt from "./IntelligenceArt.jsx";
import LazyImage from "@/components/landing/LazyImage";
import { Link } from "react-router-dom";
import ChevronIcon from "./ChevronIcon.jsx";
import { color } from "@/components/landing/system/tokens";

const TrustCard = React.memo(function TrustCard({ card, image }) {
  const showArt = !image || isExternalSrc(image);
  return (
    <div className="elevation-1 relative w-full max-w-[780px] shrink-0 overflow-hidden rounded-[32px] border bg-white" style={{ borderColor: `${color.ink}1A` }}>
      {showArt ? (
        <IntelligenceArt label={card.title} className="aspect-[8/5] w-full" />
      ) : (
        <LazyImage src={image} alt={card.title} decoding="async" className="aspect-[8/5] w-full object-cover" />
      )}
      {/* white chip guarantees copy contrast on any image */}
      <div className="absolute left-6 top-6 sm:left-8 sm:top-8 sm:max-w-[320px]">
        <div className="rounded-[20px] bg-white/95 p-5">
          <card.Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} style={{ color: color.ink }} />
          <p className="mt-3 font-normal tracking-[0] leading-[22px] text-[16px]" style={{ color: color.ink }}>{card.copy}</p>
          <Link to={card.to} className="mt-3 inline-flex items-center gap-1.5 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]" style={{ color: color.link }}>
            {card.link}
            <ChevronIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
});
export default TrustCard;
