export default function WorkspaceIntro({ eyebrow, title, description, children, icon: Icon }) {
  return <header className="v-workspace-intro">
    {Icon && <span className="v-page-symbol" aria-hidden="true"><Icon size={24} strokeWidth={1.6}/></span>}
    <div className="v-workspace-intro-copy">
      {eyebrow && <p className="v-section-label">{eyebrow}</p>}
      <h1 className="v-title">{title}</h1>
      {description && <p className="v-muted">{description}</p>}
    </div>
    {children && <div className="v-workspace-intro-actions">{children}</div>}
  </header>;
}
