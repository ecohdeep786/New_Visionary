import React from "react";
import { isExternalSrc } from "./art-helpers.js";
import IntelligenceArt from "./IntelligenceArt.jsx";
import LazyImage from "@/components/landing/LazyImage";

/* The product moment on persona pages is photography, matching the landing
   and Organization anatomy. When a step has no photograph (or an http(s)
   placeholder), the light ring-and-V IntelligenceArt stands in — never a
   dark product-window card. */
const IntelligenceVisual = React.memo(function IntelligenceVisual({ step, index, setStepRef, image }) {
  const showArt = !image || isExternalSrc(image);
  return (
    <figure ref={setStepRef(index)} data-step={index} className="m-0">
      {showArt ? (
        <div className="mx-auto flex aspect-[4/3] w-full max-w-[440px] items-center justify-center lg:aspect-[15/16] lg:mx-0 lg:max-w-none">
          <IntelligenceArt label={step.title} variant={index} className="aspect-[4/3] w-full lg:aspect-[15/16]" />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[60px] lg:mx-0 lg:max-w-none">
          <LazyImage
            src={image}
            alt={step.title}
            decoding="async"
            className="aspect-[4/3] w-full object-cover lg:aspect-[15/16]"
          />
        </div>
      )}
    </figure>
  );
});
export default IntelligenceVisual;
