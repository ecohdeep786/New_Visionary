import { ChevronDown } from 'lucide-react';

/** Supporting detail stays in the DOM; a source failure can open it immediately. */
export default function WorkspaceDisclosure({ title, description, icon: Icon, children, attention = false, className = '' }) {
  return <details className={`v-disclosure ${className}`} open={attention || undefined}>
    <summary>
      {Icon && <span className="v-disclosure-icon" aria-hidden="true"><Icon size={21} /></span>}
      <span className="v-disclosure-copy"><span className="v-disclosure-title">{title}</span>{description && <span className="v-disclosure-description">{description}</span>}</span>
      <ChevronDown className="v-disclosure-chevron" size={19} aria-hidden="true" />
    </summary>
    <div className="v-disclosure-body">{children}</div>
  </details>;
}
