import type {LessonObjectiveSnapshot} from '../domain/lessonObjective.ts';

const text=(value:unknown):value is string=>typeof value==='string'&&Boolean(value.trim());
const record=(value:unknown):value is Record<string,unknown>=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
const fields=(value:Record<string,unknown>,allowed:string[])=>Object.keys(value).every(key=>allowed.includes(key));
export function assertLessonObjective(value:unknown):asserts value is LessonObjectiveSnapshot{
 const fail=()=>{throw new Error('The attached objective or representation is incomplete. Review its source before saving or opening this lesson.');};
 if(!record(value)||!fields(value,['conceptId','title','status','locale','selection','provenance','explanation','representations','criteria']))return fail();
 if(!text(value.conceptId)||!text(value.title)||!text(value.explanation)||!['sample','official'].includes(String(value.status))||!['en','hi','bn'].includes(String(value.locale)))return fail();
 if(!record(value.selection)||!fields(value.selection,['board','classLevel','subject'])||!['board','classLevel','subject'].every(key=>text((value.selection as Record<string,unknown>)[key])))return fail();
 if(!record(value.provenance)||!fields(value.provenance,['provider','sourceId','version'])||!['provider','sourceId','version'].every(key=>text((value.provenance as Record<string,unknown>)[key])))return fail();
 if(!Array.isArray(value.representations)||value.representations.length>12||new Set(value.representations.map(item=>item?.id)).size!==value.representations.length)return fail();
 if(value.criteria!==undefined&&(!Array.isArray(value.criteria)||value.criteria.length<1||value.criteria.length>20||new Set(value.criteria.map(item=>item?.id)).size!==value.criteria.length||value.criteria.some(item=>!record(item)||!fields(item,['id','label','prompt'])||!text(item.id)||!text(item.label)||!text(item.prompt))))return fail();
 for(const item of value.representations){
  if(!record(item)||!fields(item,['id','kind','alternative','assetId','numberLine','series'])||!text(item.id)||!text(item.alternative)||!['text','diagram','cube','number-line','scene'].includes(String(item.kind))||(item.assetId!==undefined&&!text(item.assetId)))return fail();
  if(item.numberLine!==undefined){const line=item.numberLine;if(item.kind!=='number-line'||!record(line)||!fields(line,['minimum','maximum','divisions','initial'])||typeof line.minimum!=='number'||typeof line.maximum!=='number'||!Number.isFinite(line.minimum)||!Number.isFinite(line.maximum)||line.maximum<=line.minimum||Math.abs(line.minimum)>1e9||Math.abs(line.maximum)>1e9||typeof line.divisions!=='number'||!Number.isInteger(line.divisions)||line.divisions<2||line.divisions>16||typeof line.initial!=='number'||!Number.isInteger(line.initial)||line.initial<0||line.initial>line.divisions)return fail();}
  if(item.series!==undefined){const series=item.series;if(item.kind!=='diagram'||!Array.isArray(series)||series.length<2||series.length>12||new Set(series.map(row=>row?.label)).size!==series.length||series.some(row=>!record(row)||!fields(row,['label','value'])||!text(row.label)||row.label.length>100||typeof row.value!=='number'||!Number.isFinite(row.value)||row.value<0||row.value>1e9))return fail();}
 }
}
