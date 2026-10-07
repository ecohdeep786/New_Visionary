export default function WorkspaceIntro({ eyebrow, title, description, children }) {
  return <header className="v-workspace-intro">
    <div className="v-workspace-intro-copy">
      <p className="v-home-eyebrow">{eyebrow}</p>
      <h1 className="v-title">{title}</h1>
      <p className="v-muted">{description}</p>
      {children && <div className="v-workspace-intro-actions">{children}</div>}
    </div>
  </header>;
}
