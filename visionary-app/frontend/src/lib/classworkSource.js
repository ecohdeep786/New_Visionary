// Shared by source previews and the local submission write boundary.
export function classworkActivityRevision(assignment){return JSON.stringify([assignment.source_version,assignment.title,assignment.description,assignment.checks,assignment.points,assignment.objective_snapshot,...(assignment.source_provenance?.curriculumObjectiveId?[assignment.source_provenance]:[])]);}
