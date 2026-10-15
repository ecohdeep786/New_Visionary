export default function WorkspaceIntro({ eyebrow, title, description, children, icon: Icon }) {
  return <header className="v-workspace-intro">
    <div className="v-workspace-intro-copy">
      <p className="v-section-label">{Icon && <Icon size={18} strokeWidth={1.75} aria-hidden="true"/>}{eyebrow}</p>
      <h1 className="v-title">{title}</h1>
      <p className="v-muted">{description}</p>
      {children && <div className="v-workspace-intro-actions">{children}</div>}
    </div>
  </header>;
}
