import type { JobState } from './outbox-types';

export class AdmissionError extends Error {
  constructor(readonly code: 'admission_per_user' | 'admission_per_workspace' | 'admission_per_queue'
    | 'admission_fleet' | 'provider_budget' | 'scope_denied' | 'policy_unavailable') {
    super(code);
  }
}

export interface JobEvent {
  cursor: number;
  state: JobState;
  attempt: number;
  createdAt: string;
}

export interface JobObservation {
  status: { state: JobState; attempt: number; cursor: number };
  events: JobEvent[];
  nextCursor: number;
  hasMore: boolean;
  refetchRequired: boolean;
}
