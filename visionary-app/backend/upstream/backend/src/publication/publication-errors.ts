// CONTENT-03 — explicit failure taxonomy. Policy denies are AUTHORITY_*/…;
// lifecycle violations are INVALID_TRANSITION; the atomic pointer uses
// CONCURRENT_REVISION_CONFLICT and idempotent replay.
export type PublicationErrorCode=
  |'AUTHORITY_DENIED'
  |'SELF_APPROVAL_DENIED'
  |'INGESTION_INCOMPLETE'
  |'MALFORMED_IDENTITY'
  |'DUPLICATE_PUBLICATION'
  |'PUBLICATION_NOT_FOUND'
  |'INVALID_TRANSITION'
  |'CONCURRENT_REVISION_CONFLICT'
  |'PUB_NOT_RELEASED';

export class PublicationError extends Error {
  readonly code:PublicationErrorCode;
  constructor(code:PublicationErrorCode,message:string){
    super(message);
    this.name='PublicationError';
    this.code=code;
  }
}
