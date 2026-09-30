/** Local mock policy. The backend must enforce the same rules independently. */
export function previewPolicy(user, read) {
  const email=user?.email;
  const role=user?.identity;
  const inScope=c=>Boolean(c&&(user?.organization_id?c.organization_email===user.organization_id:!c.organization_email));
  const activeMember=(organizationEmail, memberRole)=>read('OrganizationInvite').some(i=>i.organization_email===organizationEmail&&i.email===email&&i.role===memberRole&&i.status==='active'&&(!i.expiresAt||new Date(i.expiresAt).getTime()>Date.now()));
  const ownsClass=c=>Boolean(inScope(c)&&(!c.organization_email||activeMember(c.organization_email,'teacher'))&&(c.teacher_email===email||c.teacher_id===user?.id||c.created_by_id===user?.id||c.created_by===email));
  const classroom=id=>read('Classroom').find(c=>c.id===id);
  const teacher=id=>role==='teacher'&&ownsClass(classroom(id));
  const learner=['student','professional'].includes(role);
  const learnerClass=id=>{const c=classroom(id);return inScope(c)&&(!c.organization_email||activeMember(c.organization_email,role));};
  const enrolled=id=>learner&&learnerClass(id)&&read('Enrollment').some(e=>e.class_id===id&&e.student_email===email&&e.status==='active');
  const invited=id=>learner&&learnerClass(id)&&read('Enrollment').some(e=>e.class_id===id&&e.student_email===email&&e.status==='invited');
  const organization=id=>role==='organization'&&classroom(id)?.organization_email===email;
  const endpoints={FamilyLink:['parent_email','child_email'],OrganizationInvite:['organization_email','email'],Connection:['requester_email','recipient_email']};
  function canRead(name,r){
    if(!email)return false;
    if(endpoints[name])return endpoints[name].some(k=>r[k]===email);
    if(name==='Classroom')return teacher(r.id)||enrolled(r.id)||invited(r.id)||organization(r.id);
    if(name==='Enrollment')return (learner&&r.student_email===email)||teacher(r.class_id)||organization(r.class_id);
    if(name==='Submission')return teacher(r.class_id)||(learner&&r.student_email===email&&enrolled(r.class_id));
    if(name==='Assignment')return teacher(r.class_id)||(!['draft','archived'].includes(r.status)&&(enrolled(r.class_id)||organization(r.class_id)));
    if(name==='Announcement')return teacher(r.class_id)||enrolled(r.class_id);
    if(name==='OrganizationCurriculum')return role==='organization'&&r.organization_email===email;
    return r.owner_email===email||r.created_by===email;
  }
  function assertWrite(name,r,operation,patch={}){
    let allowed=false;
    if(endpoints[name]){
      const [from,to]=endpoints[name];
      if(operation==='create')allowed=r[from]===email&&r[to]!==email&&['pending','draft'].includes(r.status)&&
        (name!=='FamilyLink'||role==='parent')&&(name!=='OrganizationInvite'||role==='organization');
      else if(operation==='update')allowed=canRead(name,r)&&Object.keys(patch).every(k=>['status','accepted_at'].includes(k))&&
        (patch.status==='active'||patch.status==='declined'?r[to]===email&&r.status==='pending': ['revoked','cancelled','removed'].includes(patch.status));
      // Membership changes use the scoped invitation service so state and
      // action history are saved together in the local preview record.
      if(name==='OrganizationInvite')allowed=false;
    }else if(name==='Classroom')allowed=role==='teacher'&&(operation==='create'?ownsClass(r):teacher(r.id));
    else if(name==='Assignment'||name==='Announcement')allowed=teacher(r.class_id);
    else if(name==='OrganizationCurriculum')allowed=role==='organization'&&r.organization_email===email;
    else if(name==='Enrollment'){
      const code=classroom(r.class_id)?.join_code;
      allowed=teacher(r.class_id)||(learner&&r.student_email===email&&
        (operation==='create'?Boolean(code&&patch.join_code===code):operation==='update'&&
          Object.keys(patch).every(k=>['status','student_name','student_id','join_code'].includes(k))&&
          (['left','inactive'].includes(patch.status)||patch.status==='active'&&(r.status==='invited'||patch.join_code===code))));
    }else if(name==='Submission'){
      const assignment=read('Assignment').find(a=>a.id===r.assignment_id&&a.class_id===r.class_id);
      allowed=operation==='create'?learner&&r.student_email===email&&enrolled(r.class_id)&&Boolean(assignment)&&!['draft','archived'].includes(assignment.status)&&r.grade==null&&r.status==='submitted':
          operation==='update'&&teacher(r.class_id)&&Object.keys(patch).every(k=>['grade','feedback','status','graded_date'].includes(k))&&
          (!patch.status||['graded','revision_requested'].includes(patch.status))&&
          (patch.status!=='revision_requested'||typeof patch.feedback==='string'&&Boolean(patch.feedback.trim())&&patch.grade==null);
      if(operation==='update'&&learner&&r.student_email===email&&enrolled(r.class_id)&&r.status==='revision_requested'&&assignment&&!['draft','archived'].includes(assignment.status)){
        const history=[...(r.revision_history||[]),{text:r.text,responses:r.responses||[],feedback:r.feedback||'',submitted_date:r.submitted_date,graded_date:r.graded_date,attempt:r.attempt||1}];
        allowed=Object.keys(patch).every(k=>['text','responses','status','grade','feedback','graded_date','submitted_date','attempt','revision_history'].includes(k))&&
          patch.status==='submitted'&&patch.grade===null&&patch.feedback===''&&patch.graded_date===null&&patch.attempt===(r.attempt||1)+1&&
          typeof patch.text==='string'&&Boolean(patch.text.trim())&&patch.text.length<=50000&&
          Array.isArray(patch.responses)&&JSON.stringify(patch.revision_history)===JSON.stringify(history)&&
          (assignment.checks||[]).every(check=>patch.responses.some(answer=>answer?.questionId===check.id&&typeof answer.text==='string'&&Boolean(answer.text.trim())&&answer.text.length<=5000));
      }
      if(allowed&&patch.grade!=null)allowed=Number.isFinite(Number(patch.grade))&&Number(patch.grade)>=0&&Number(patch.grade)<=Number(assignment?.points||100);
    }
    if(name==='Classroom'&&operation==='create'&&r.organization_email)allowed=allowed&&activeMember(r.organization_email,'teacher');
    if(!allowed)throw new Error('This action is not permitted in your active workspace.');
    if(operation==='update'&&['class_id','teacher_email','teacher_id','student_email','organization_email'].some(k=>k in patch&&patch[k]!==r[k]))throw new Error('Record ownership cannot be changed.');
  }
  return {canRead,assertWrite};
}
