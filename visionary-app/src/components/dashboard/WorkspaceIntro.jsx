export default function WorkspaceIntro({ eyebrow, title, description, icon: Icon, children }) {
  return <header className="v-workspace-intro">
    <div className="v-workspace-intro-copy">
      <p className="v-home-eyebrow">{eyebrow}</p>
      <h1 className="v-title">{title}</h1>
      <p className="v-muted">{description}</p>
      {children && <div className="v-workspace-intro-actions">{children}</div>}
    </div>
    <div className="v-workspace-intro-art" aria-hidden="true"><span><Icon size={44} strokeWidth={1.6}/></span></div>
  </header>;
}
