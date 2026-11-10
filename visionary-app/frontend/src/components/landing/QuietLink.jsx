/* A2 quiet-link law, shared (B2/FAP-47): the single quiet next-step anatomy —
   17px blue + chevron gap, keyable, 44px hit area, focus ring. Dark scenes
   (`dark`) flip to white/85. Door rows and header quiet links host it. */
import { Link } from "react-router-dom";

export default function QuietLink({ to, href, onClick, dark = false, className = "", children }) {
  const cls = `inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4 ${
    dark ? "text-white/85 hover:text-white" : "text-[#0066cc] hover:text-[#0066cc]"
  } ${onClick ? "cursor-pointer" : ""} ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <a href={href} onClick={onClick} className={cls}>{children}</a>;
}
