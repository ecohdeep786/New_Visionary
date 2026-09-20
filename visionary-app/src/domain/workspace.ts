export type Role = 'student' | 'teacher' | 'parent' | 'professional' | 'organization';
export type Locale = 'en' | 'hi' | 'bn';
export type Status = 'pending' | 'active' | 'declined' | 'expired' | 'revoked';
export interface Person { id: string; email: string; name: string; ageBand: 'adult' | 'minor' | 'unknown'; roles: Role[] }
export interface Workspace { id: string; personId: string; role: Role; name: string; organizationId?: string; lastPath: string }
export interface RequestContext { personId: string; workspaceId: string; role: Role; locale: Locale; signal?: AbortSignal }
export interface Relationship { id: string; from: string; to: string; type: 'guardian' | 'organization' | 'teacher'; scope: string[]; status: Status; expiresAt?: string }
export type Stage = 'diagnosing' | 'explaining' | 'exploring' | 'checking' | 'remediating' | 'practicing' | 'building' | 'reflecting' | 'completed';
export interface Evidence { id: string; objectiveId: string; kind: 'check' | 'practice' | 'application' | 'retrieval'; correct: number; total: number; at: string; delayed: boolean }
export type MasteryStage = 'Not started' | 'Exploring' | 'Practicing' | 'Secure' | 'Mastered' | 'Needs review';
export interface Session { id: string; journeyId: string; conversationId: string; stage: Stage; position: number; locale: Locale; representation: 'interactive' | 'text'; answers: Record<string, string>; canvas: { size: number; rotation: number }; notes: string; confidence?: number; evidence: Evidence[]; updatedAt: string; interrupted: boolean; reviewRound?: number; reviewStartedAt?: string }
export type GuideBlock = { type: 'text'; text: string } | { type: 'activity'; journeyId: string; label: string } | { type: 'action'; label: string; path: string };
export interface Message { id: string; role: 'user' | 'guide'; blocks: GuideBlock[]; at: string }
export interface AskContext { intent: 'understand' | 'solve' | 'check' | 'plan' | 'build'; source: 'topic' | 'material' | 'outside'; material: string }
export interface Conversation { id: string; title: string; messages: Message[]; sessionId?: string; canvasPath?: string; draft: string; updatedAt: string; useForPersonalization: boolean; ask?: AskContext }
export interface Artifact { id: string; title: string; body: string; journeyId?: string; milestones: boolean[]; visibility: 'private' | 'shared'; sharedWith: string[]; versions: { body: string; at: string }[]; status: 'draft' | 'in-progress' | 'completed'; updatedAt: string }
export interface Resource { id: string; title: string; kind: 'lesson' | 'cohort' | 'goal' | 'curriculum' | 'listing'; body: string; status: string; audience: string; updatedAt: string; members?:string[]; classIds?:string[] }
export interface Plan { id: 'Free' | 'Premium' | 'Family'; price: number; profiles: number; provisional: boolean }
export interface Subscription { plan: Plan['id']; state: 'active' | 'pending' | 'failed' | 'cancelled'; renewsAt?: string; invoices: { id: string; plan: string; amount: number; at: string }[]; usage: number; usageDay: string }
export interface WorkspaceData { activeConversationId?: string; conversations: Conversation[]; sessions: Session[]; artifacts: Artifact[]; resources: Resource[]; notifications: { id: string; text: string; read: boolean; path: string }[]; audit: { id: string; action: string; target: string; at: string }[]; preferences: { locale: Locale; interfaceLocale: Locale; bilingual: boolean; lowBandwidth: boolean; notifications: 'off' | 'weekly' | 'daily' | 'urgent'; memory: boolean }; subscription: Subscription; legacyImported: boolean }
export interface FamilyInvitation { id:string; owner:string; member:string; status:'pending'|'active'|'revoked'|'declined'; expiresAt:string }
export interface Database { version: 2; people: Person[]; workspaces: Workspace[]; active: Record<string, string>; data: Record<string, WorkspaceData>; relationships: Relationship[]; familyInvitations?:FamilyInvitation[] }
export interface Question { prompt: string; options: string[]; answer: number; explanation: string }
export interface Journey { id: string; title: string; objective: string; explanation: string; exploration: string; project: string; projectBrief: string; why: string; questions: Question[]; keywords: string[] }
