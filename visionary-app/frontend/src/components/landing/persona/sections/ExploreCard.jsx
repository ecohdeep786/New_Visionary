import React from "react";
import LazyImage from "@/components/landing/LazyImage";
import { Link } from "react-router-dom";
import ChevronIcon from "./ChevronIcon.jsx";
import { color } from "@/components/landing/system/tokens";

const ExploreCard = React.memo(function ExploreCard({ index, category, images }) {
  /* Apple's line-up card — the student page's explore anatomy: white card,
     photograph full-bleed on top, 24px/600 name, 18px grey line, quiet
     blue link, left-aligned, no elevation chrome. */
  return (
    <Link
      to={`/${category.slug}`}
      data-card
      className="stagger-child group block w-[82vw] max-w-[372px] shrink-0 snap-start overflow-hidden rounded-[18px] bg-white transition-transform duration-300 ease-apple hover:-translate-y-1 sm:w-[372px]"
    >
      <div className="media-settle relative aspect-square overflow-hidden">
        <LazyImage src={images[index]} alt={category.alt} decoding="async" className="h-full w-full select-none object-cover transition-transform duration-500 ease-apple group-hover:scale-[1.04]" />
      </div>
      <div className="p-7 lg:p-8">
        <h3 data-type="feature" className="text-balance" style={{ color: color.ink, maxWidth: "18ch" }}>
          {category.chip}
        </h3>
        <p className="mt-2 text-balance font-normal tracking-[0] leading-[1.4] text-[18px]" style={{ color: color.slate, maxWidth: "38ch" }}>
          {category.copy}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-[18px] font-medium tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2">
          Learn more
          <ChevronIcon className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
});
export default ExploreCard;
