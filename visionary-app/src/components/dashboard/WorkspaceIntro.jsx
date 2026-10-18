import WorkspaceHelp from './WorkspaceHelp';

export default function WorkspaceIntro({ eyebrow, title, description, instruction = false, children, icon: Icon }) {
  return <header className="v-workspace-intro">
    <div className="v-workspace-intro-copy">
      <p className="v-section-label">{Icon && <Icon size={18} strokeWidth={1.75} aria-hidden="true"/>}{eyebrow}</p>
      <h1 className="v-title">{title}</h1>
      {description && (instruction ? <p className="v-muted">{description}</p> : <WorkspaceHelp title={title}><p className="v-muted">{description}</p></WorkspaceHelp>)}
      {children && <div className="v-workspace-intro-actions">{children}</div>}
    </div>
  </header>;
}
