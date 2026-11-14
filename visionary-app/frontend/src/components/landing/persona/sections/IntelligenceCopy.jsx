import React from "react";
import { color } from "@/components/landing/system/tokens";

const IntelligenceCopy = React.memo(function IntelligenceCopy({ step }) {
  return (
    <div key={step.title} className="hero-fade-up max-w-[460px]">
      <h3 data-type="feature" className="whitespace-pre-line" style={{ color: color.ink }}>
        {step.title}
      </h3>
      <p className="mt-4 font-normal tracking-[0] leading-[25px] text-[17px]" style={{ color: color.ink }}>
        {step.copy}
      </p>
    </div>
  );
});
export default IntelligenceCopy;
