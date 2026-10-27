import React from "react";

const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-apple ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});
export default FadeReveal;
