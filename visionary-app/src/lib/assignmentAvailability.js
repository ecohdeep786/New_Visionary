/** Local preview availability uses the browser clock; server time is required later. */
export function assignmentAcceptsResponses(assignment,now=Date.now()){
 if(!assignment)return false;
 if(!assignment.status||assignment.status==='published')return true;
 return assignment.status==='scheduled'&&typeof assignment.publish_at==='string'&&Number.isFinite(Date.parse(assignment.publish_at))&&Date.parse(assignment.publish_at)<=now;
}
