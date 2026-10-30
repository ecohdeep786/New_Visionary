// AI-18 (KAN-156) — Indian-language speech and pedagogical-meaning
// qualification: the reproducible held-out evaluation-corpus REGISTRY and the
// coverage gate that must guard any enabling of voice.
//
// The checkpoint here is the server-owned qualification contract:
//   - The QUALIFICATION MATRIX keeps interface / input / source / output
//     language and script identity INDEPENDENT, plus modality, device context
//     (noise / low bandwidth) and pedagogical meaning.
//   - The HELD-OUT CORPUS is reproducible and rights-aware: every case carries
//     provenance (source, license, consent) and a SPLIT/L E A K A G E check —
//     a held-out case that shares a training source/content is REJECTED.
//   - EVALUATION EVIDENCE is versioned and per-case: ASR/TTS/model/prompt/route
//     versions, recognition + critical-semantic errors, intelligibility/
//     pronunciation, uncertainty, latency/cancellation, per-task cost.
//   - COUNTS NEVER ESTABLISH COVERAGE: an AI-18 route is "covered" only when
//     there is held-out evaluation evidence AND a QUALIFIED human reviewer
//     accepts it against PREAPPROVED thresholds. The contract refuses to derive
//     coverage from dataset/model language counts.
export interface QualifierOwner {
  uid: string;
  workspaceId: string;
  /** Qualified reviewer or author/recorder — determines what they may do. */
  role: 'author' | 'reviewer';
}

/** Independent language dimensions of the qualification matrix. */
export interface SpeechLanguageMatrix {
  interfaceLanguage: string;
  inputLanguage: string;
  sourceLanguage: string;
  outputLanguage: string;
  script: string;
  modality: 'speech' | 'text' | 'image';
  deviceContext: string; // e.g. 'noisy', 'low-bandwidth', 'clean'
  pedagogicalMeaning: string;
}

/** One rights-cleared, versioned evaluation case (train or held-out). */
export interface EvalCase {
  caseId: string;
  matrix: SpeechLanguageMatrix;
  split: 'train' | 'heldout';
  sourceRef: string;   // provenance: source document/speaker
  license: string;
  consented: boolean;
  contentDigest: string;
}

/** Versioned route under evaluation (ASR/TTS/model/prompt/interface pins). */
export interface EvalRoute {
  routeId: string;
  asrVersion: string;
  ttsVersion: string;
  modelVersion: string;
  promptVersion: string;
  interfaceVersion: string;
}

export type SemanticError = 'none' | 'critical' | 'minor';

/** One per-case evaluation outcome (versioned, reproducible). */
export interface CaseOutcome {
  caseId: string;
  routeId: string;
  recognitionErrorRate: number;  // 0..1
  semanticError: SemanticError;
  intelligibility: number;       // 0..1
  pronunciation: number;         // 0..1
  uncertainty: 'clear' | 'clarified' | 'uncertain';
  latencyMs: number | null;      // null when cancelled/timed out
  cancelled: boolean;
  perTaskCostUsd: number;
  evaluatedBy: string;           // author uid (recording evidence only)
  at: string;
}

/** Preapproved thresholds the route must meet for coverage. */
export interface QualificationThresholds {
  maxSemanticErrorRate: number;   // semanticError==='critical' proportion cap
  maxRecognitionErrorRate: number;
  minIntelligibility: number;
  maxPerTaskCostUsd: number;
  heldoutMinimumCases: number;
}

export interface CoverageVerdict {
  routeId: string;
  covered: boolean;
  /** A reviewer decision, never derived from counts. */
  reviewerDecisionSet: boolean;
  evidence: {
    heldoutCasesEvaluated: number;
    semanticCriticalCount: number;
    avgRecognitionError: number;
    avgIntelligibility: number;
    maxPerTaskCostUsd: number;
  };
  reason: string;
}

export type SpeechQualErrorCode =
  | 'not_owner'
  | 'unqualified_reviewer'       // only a qualified reviewer may decide coverage
  | 'missing_consent'
  | 'missing_license'
  | 'leakage_detected'           // held-out case overlaps a training source/content
  | 'unknown_case'
  | 'unknown_route'
  | 'thresholds_not_defined'
  | 'coverage_not_established';  // counts alone never establish coverage

export class SpeechQualError extends Error {
  constructor(public readonly code: SpeechQualErrorCode) {
    super(code);
  }
}
