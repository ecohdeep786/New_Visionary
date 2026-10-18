import fs from 'node:fs';import crypto from 'node:crypto';
const snapshot=JSON.parse(fs.readFileSync('docs/visionary/FRONTEND_REVIEW_SNAPSHOT.json','utf8'));
const changed=[];for(const[file,expected]of Object.entries({...snapshot.files,...snapshot.scenarioFiles})){if(!fs.existsSync(file)||crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==expected)changed.push(file);}
if(changed.length){console.error('Candidate changed:',changed);process.exitCode=1;}else console.log('PASS '+(Object.keys(snapshot.files).length+Object.keys(snapshot.scenarioFiles).length)+' candidate/scenario hashes match '+snapshot.name+'.');
