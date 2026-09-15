/** Fictional, connected demonstration records. Never used for ordinary sign-in. */
export function seedConnectedFixtures(storage=localStorage,at=new Date()){
 const marker='visionary_connected_demo_v1';if(storage.getItem(marker))return;
 const date=at.toISOString();
 const classes=[
  {id:'demo-class-cube',name:'Space, shape and reasoning',subject:'Geometry',teacher_email:'teacher@visionary.test',teacher_id:'demo-teacher',teacher_name:'Dev',join_code:'DEMO-CUBE',organization_email:'school-admin@visionary.test',color:'#1967d2'},
  {id:'demo-class-fractions',name:'Everyday mathematical thinking',subject:'Mathematics',teacher_email:'school-teacher@visionary.test',teacher_id:'demo-school-teacher',teacher_name:'Nila',join_code:'DEMO-PARTS',organization_email:'school-admin@visionary.test',color:'#137333'},
 ];
 const fixtures={
  Classroom:classes,
  OrganizationInvite:[...['teacher','school-teacher','minor-cbse','bengali'].map(person=>({id:`demo-org-${person}`,organization_email:'school-admin@visionary.test',organization_name:'Visionary Demo School',email:`${person}@visionary.test`,role:person.includes('teacher')?'teacher':'student',status:'active'})),{id:'demo-org-employee',organization_email:'company-admin@visionary.test',organization_name:'Visionary Demo Company',email:'employee@visionary.test',role:'professional',status:'active'}],
  Enrollment:[{id:'demo-enrollment-aarav',class_id:'demo-class-cube',student_email:'minor-cbse@visionary.test',student_id:'demo-minor-cbse',student_name:'Aarav',status:'active'},{id:'demo-enrollment-maya',class_id:'demo-class-fractions',student_email:'bengali@visionary.test',student_id:'demo-bengali',student_name:'Maya',status:'active'}],
  Assignment:[{id:'demo-assignment-cube',class_id:'demo-class-cube',teacher_email:'teacher@visionary.test',teacher_id:'demo-teacher',title:'Explain your storage-box design',description:'Compare cube-shaped boxes with side lengths 3 and 6. Explain capacity using cubic units, then describe one limitation of the model.',subject:'Geometry',topics:['Cube volume'],points:10,status:'published'},
   {id:'demo-assignment-fractions',class_id:'demo-class-fractions',teacher_email:'school-teacher@visionary.test',teacher_id:'demo-school-teacher',title:'Plan equal portions',description:'Use eighths to show one half and three quarters. Explain how the same whole makes comparison fair.',subject:'Mathematics',topics:['Fractions'],points:10,status:'published'}],
  Submission:[{id:'demo-submission-cube',assignment_id:'demo-assignment-cube',class_id:'demo-class-cube',student_email:'minor-cbse@visionary.test',student_id:'demo-minor-cbse',student_name:'Aarav',text:'The smaller box holds 27 cubic units. The larger holds 216, which is eight times as much. Real box walls take up some of the outside dimensions.',status:'submitted',submitted_date:date}],
  Announcement:[{id:'demo-update-fractions',class_id:'demo-class-fractions',teacher_email:'school-teacher@visionary.test',teacher_id:'demo-school-teacher',author_name:'Nila',text:'Use a drawing, words, or numbers to explain your idea. Your reasoning matters more than speed.'}],
 };
 for(const [name,rows] of Object.entries(fixtures)){const key=`visionary_entity_${name}`;const existing=JSON.parse(storage.getItem(key)||'[]');storage.setItem(key,JSON.stringify([...existing,...rows.filter(r=>!existing.some(e=>e.id===r.id)).map(r=>({...r,demo:true,created_date:date,createdAt:at.getTime()}))]));}
 storage.setItem(marker,date);
}
