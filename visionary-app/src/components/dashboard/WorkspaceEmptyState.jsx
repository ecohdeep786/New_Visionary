import SpotIllustration from '@/components/landing/SpotIllustration';
import WorkspaceHelp from './WorkspaceHelp';

/** A real empty state: one explanation and an optional next action, with our own art. */
export default function WorkspaceEmptyState({ illustration = 'compass', title, description, details, children, heading: Heading = 'h2' }) {
  return <div className="v-empty-state">
    <SpotIllustration subject={illustration} className="v-empty-illustration v-empty-illustration-square" />
    <Heading>{title}</Heading>
    {description && <p className="v-muted">{description}</p>}
    {children && <div className="v-empty-actions">{children}</div>}
    {details && <WorkspaceHelp title={title}><p className="v-muted">{details}</p></WorkspaceHelp>}
  </div>;
}
