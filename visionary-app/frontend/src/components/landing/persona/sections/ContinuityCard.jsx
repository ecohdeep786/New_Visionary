import React from "react";
import LazyImage from "@/components/landing/LazyImage";
import { color } from "@/components/landing/system/tokens";

const ContinuityCard = React.memo(function ContinuityCard({ index, label, caption, text, imgClass = "", className = "", images }) {
  return (
    <div className={className}>
      <p className="mb-6 text-center font-normal tracking-[0] leading-[20px] text-[16px]" style={{ color: color.ink }}>
        {label}
      </p>
      <div className="relative overflow-hidden rounded-[30px]">
        <LazyImage
          key={index}
          src={images[index % images.length]}
          alt={`${label}: ${text}`}
          decoding="async"
          className={`h-[320px] w-full object-cover sm:h-[420px] ${imgClass}`}
        />
  
   <div className="absolute inset-0 bg-gradient-to-t from-[#1d1d1f]/55 via-[#1d1d1f]/20 to-transparent" aria-hidden="true" />
            <div className="absolute inset-0 flex items-center justify-center px-4">
          <span key={text} data-type="display" className="hero-fade-up text-center text-white">
            {text}
          </span>
        </div>
      </div>
      <p className="mt-6 text-center font-normal tracking-[0] leading-[20px] text-[16px]" style={{ color: color.ink }}>
        {caption}
      </p>
    </div>
  );
});
export default ContinuityCard;
