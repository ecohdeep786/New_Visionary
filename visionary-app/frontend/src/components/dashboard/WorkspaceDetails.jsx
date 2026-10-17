/** Secondary guidance stays available without competing with the user's task. */
export default function WorkspaceDetails({ title, children, className = '' }) {
  return <details className={`v-details ${className}`}>
    <summary>{title}</summary>
    <div className="v-details-body">{children}</div>
  </details>;
}
