// CONTENT-02 — the bounded stage implementations. Each stage is a pure
// transformation over explicit inputs (no hidden state, no network except the
// injected embedding adapter) so the same bytes always produce the same
// artifacts: restarts, retries and replays stay idempotent, and every refusal
// is a typed error, never a silent truncation.
import { createHash } from 'node:crypto';
import {
  DEFAULT_INGESTION_BOUNDS,SUPPORTED_CONTENT_TYPES,TRANSFORMATION_VERSIONS,
} from './ingestion-bounds';
import { IngestionError } from './ingestion-errors';
import type {
  ChunkRecord,EmbeddingModelDescriptor,EvaluationReceipt,ParsedDocument,
  PageMarker,SectionSpan,SourceObjectReceipt,SourceProvenance,
} from './ingestion-types';
import type { IngestionBounds } from './ingestion-bounds';

export type ResolvedBounds=IngestionBounds & typeof DEFAULT_INGESTION_BOUNDS;

export function resolveBounds(bounds?:Partial<IngestionBounds>):ResolvedBounds{
  return {...DEFAULT_INGESTION_BOUNDS,...bounds};
}

export function digestOf(value:unknown):string{
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

// ---------------------------------------------------------------------------
// scan — the FILE-01/02 receipt gate. Ingestion never rescans bytes; it only
// accepts a clean, scanned, manifest-verified generation and enforces bounds.
// ---------------------------------------------------------------------------

export interface ScanGateOutput {
  objectRef:string;
  digest:string;
  byteSize:number;
  contentType:string;
  notes:string[];
}

export function scanGate(object:SourceObjectReceipt,bounds:ResolvedBounds):ScanGateOutput{
  const notes:string[]=[];
  if(!object.objectRef||!object.digest)throw new IngestionError('OBJECT_UNVERIFIED','missing object reference or digest','scan');
  if(!object.manifestVerified)throw new IngestionError('OBJECT_UNVERIFIED','object generation reference not verified against its manifest','scan');
  if(!object.scannedAt||object.scanVerdict==='unscanned')throw new IngestionError('SCAN_NOT_CLEAN','object has no completed scan receipt','scan');
  if(object.scanVerdict!=='clean')throw new IngestionError('SCAN_NOT_CLEAN','object scan verdict is '+object.scanVerdict,'scan');
  if(!Number.isSafeInteger(object.byteSize)||object.byteSize<0)throw new IngestionError('INPUT_TOO_LARGE','object byte size is not a bounded number','scan');
  if(object.byteSize>bounds.maxBytes)throw new IngestionError('INPUT_TOO_LARGE','object '+object.byteSize+' bytes exceeds bound '+bounds.maxBytes,'scan');
  if(!SUPPORTED_CONTENT_TYPES.includes(object.contentType))throw new IngestionError('UNSUPPORTED_TYPE','content type '+object.contentType+' is not a supported ingestion input','scan');
  notes.push('scan gate '+TRANSFORMATION_VERSIONS.scan+' accepted verified generation');
  return {objectRef:object.objectRef,digest:object.digest,byteSize:object.byteSize,contentType:object.contentType,notes};
}

// ---------------------------------------------------------------------------
// parse — bounded text extraction. Supports text/plain and text/markdown:
// newline normalization, form-feed page markers and markdown headings become
// page/section structure; everything else is refused or fails loudly.
// ---------------------------------------------------------------------------

const HEADING_RE=/(^|\n)(#{1,6})\s+([^\n]*)/g;

export function parseStage(bytes:Buffer,contentType:string,bounds:ResolvedBounds):ParsedDocument{
  const warnings:string[]=[];
  if(!SUPPORTED_CONTENT_TYPES.includes(contentType))throw new IngestionError('UNSUPPORTED_TYPE','content type '+contentType+' is not a supported ingestion input','parse');
  const text=decodeUtf8(bytes);
  if(text.length>bounds.maxChars)throw new IngestionError('INPUT_TOO_LARGE','decoded document '+text.length+' chars exceeds bound '+bounds.maxChars,'parse');

  const normalized=text.replace(/\r\n?/g,'\n');
  if(normalized!==text)warnings.push('newline normalization applied');

  const pages:PageMarker[]=[{page:1,charStart:0}];
  for(let i=0;i<normalized.length;i++){
    if(normalized.charCodeAt(i)===12){
      pages.push({page:pages.length+1,charStart:i+1});
    }
  }

  const headings:{path:string;level:number;charStart:number}[]=[];
  HEADING_RE.lastIndex=0;
  let match:RegExpExecArray|null;
  while((match=HEADING_RE.exec(normalized))!==null){
    const title=match[3].trim();
    if(!title)continue;
    headings.push({path:title,level:match[2].length,charStart:match.index+match[1].length});
  }
  if(headings.length>bounds.maxSections)throw new IngestionError('SECTION_LIMIT','document declares '+headings.length+' headings exceeding bound '+bounds.maxSections,'parse');

  // Section spans from a heading stack: a heading closes every deeper-or-equal
  // open section, so sibling sections and parent chains resolve correctly.
  const sections:SectionSpan[]=[];
  const open:{path:string;level:number;charStart:number}[]=[];
  for(let i=0;i<headings.length;i++){
    const heading=headings[i];
    while(open.length&&open[open.length-1].level>=heading.level){
      const closed=open.pop()!;
      sections.push({path:closed.path,level:closed.level,charStart:closed.charStart,charEnd:heading.charStart});
    }
    const parent=open.length?open[open.length-1].path:null;
    open.push({path:parent?parent+' > '+heading.path:heading.path,level:heading.level,charStart:heading.charStart});
  }
  for(const closed of open.reverse())sections.push({path:closed.path,level:closed.level,charStart:closed.charStart,charEnd:normalized.length});
  sections.sort((a,b)=>a.charStart-b.charStart||b.level-a.level);
  return {text:normalized,pages,sections,parseWarnings:warnings};
}

function decodeUtf8(bytes:Buffer):string{
  const text=bytes.toString('utf8');
  if(text.includes('\uFFFD'))throw new IngestionError('PARSE_DECODE_FAILED','document is not valid UTF-8 (replacement character present)','parse');
  if(text.startsWith('\uFEFF'))return text.slice(1);
  return text;
}

// ---------------------------------------------------------------------------
// chunk — deterministic paragraph accumulation with hard splits at the bound,
// each chunk carrying char offsets, the containing page and section path.
// ---------------------------------------------------------------------------

export interface ChunkPlan {
  chunks:{text:string;charStart:number;charEnd:number;page:number|null;sectionPath:string|null}[];
  warnings:string[];
}

export function chunkStage(parsed:ParsedDocument,bounds:ResolvedBounds):ChunkPlan{
  const {text}=parsed;
  const sections=[...parsed.sections].sort((a,b)=>a.charStart-b.charStart);
  const pages=[...parsed.pages].sort((a,b)=>a.charStart-b.charStart);

  function pageAt(charStart:number):number|null{
    let page:number|null=null;
    for(const p of pages){if(p.charStart<=charStart)page=p.page;else break;}
    return page;
  }
  function sectionAt(charStart:number):string|null{
    let path:string|null=null;
    for(const s of sections){if(s.charStart<=charStart&&charStart<s.charEnd)path=s.path;}
    return path;
  }

  // Paragraph offsets over the normalized text (blank-line separated).
  const paragraphs:{start:number;end:number}[]=[];
  let currentStart=-1;
  for(let i=0;i<=text.length;i++){
    const atEnd=i===text.length;
    const ch=atEnd?'\n':text[i];
    if(ch==='\n'){
      const next=i+1<text.length?text[i+1]:'\n';
      if(atEnd||next==='\n'){
        if(currentStart>=0){paragraphs.push({start:currentStart,end:i});currentStart=-1;}
        i++; // consume the blank-line pair
      }else if(currentStart<0)currentStart=i;
    }else if(currentStart<0)currentStart=i;
  }
  const nonEmpty=paragraphs.filter((p)=>text.slice(p.start,p.end).trim().length>0);
  if(!nonEmpty.length)return {chunks:[],warnings:['document contains no extractable text']};

  const chunks:ChunkPlan['chunks']=[];
  const warnings:string[]=[];
  let acc:{start:number;end:number}|null=null;
  function flush(){
    if(!acc)return;
    const chunkText=text.slice(acc.start,acc.end);
    if(chunkText.trim().length===0){acc=null;return;}
    chunks.push({text:chunkText,charStart:acc.start,charEnd:acc.end,page:pageAt(acc.start),sectionPath:sectionAt(acc.start)});
    acc=null;
  }
  for(const para of nonEmpty){
    const paraLength=para.end-para.start;
    if(paraLength>bounds.maxChunkChars){
      flush();
      let cursor=para.start;
      while(cursor<para.end){
        let hardEnd=Math.min(cursor+bounds.maxChunkChars,para.end);
        if(hardEnd<para.end){
          const slice=text.slice(cursor,hardEnd);
          const breakAt=Math.max(slice.lastIndexOf(' '),slice.lastIndexOf('\n'));
          if(breakAt>bounds.maxChunkChars/2)hardEnd=cursor+breakAt+1;
        }
        const sliceText=text.slice(cursor,hardEnd);
        if(sliceText.trim().length>0){
          chunks.push({text:sliceText,charStart:cursor,charEnd:hardEnd,page:pageAt(cursor),sectionPath:sectionAt(cursor)});
        }
        cursor=hardEnd;
      }
      warnings.push('oversize paragraph hard-split at bound '+bounds.maxChunkChars);
      continue;
    }
    // A chunk never spans a page or section boundary: its page/section offset
    // would be ambiguous for citation and retrieval gating.
    if(acc&&(pageAt(acc.start)!==pageAt(para.start)||sectionAt(acc.start)!==sectionAt(para.start)))flush();
    if(acc&&para.end-acc.start>bounds.maxChunkChars)flush();
    if(!acc)acc={start:para.start,end:para.end};
    else acc.end=para.end;
  }
  flush();
  if(chunks.length>bounds.maxChunks)throw new IngestionError('CHUNK_LIMIT','document chunks '+chunks.length+' exceed bound '+bounds.maxChunks,'chunk');
  return {chunks,warnings};
}

// ---------------------------------------------------------------------------
// embed — adapter-driven, dimension-checked, batch-bounded.
// ---------------------------------------------------------------------------

export function embedStage(
  texts:readonly string[],
  adapter:{readonly descriptor:EmbeddingModelDescriptor;embedBatch(texts:readonly string[]):Promise<readonly (readonly number[])[]>},
  bounds:ResolvedBounds,
):Promise<readonly (readonly number[])[]>{
  if(!adapter||!adapter.descriptor||!adapter.descriptor.model)throw new IngestionError('EMBEDDER_UNAVAILABLE','no embedding adapter attached','embed');
  if(!Number.isSafeInteger(adapter.descriptor.dimension)||adapter.descriptor.dimension<1)throw new IngestionError('EMBEDDING_DIMENSION_MISMATCH','adapter declares an invalid dimension','embed');
  if(texts.length>bounds.maxChunks)throw new IngestionError('CHUNK_LIMIT','embedding batch exceeds chunk bound','embed');
  return adapter.embedBatch(texts).then((vectors)=>{
    if(vectors.length!==texts.length)throw new IngestionError('EMBEDDING_DIMENSION_MISMATCH','adapter returned '+vectors.length+' vectors for '+texts.length+' texts','embed');
    for(let i=0;i<vectors.length;i++){
      if(!Array.isArray(vectors[i])||vectors[i].length!==adapter.descriptor.dimension){
        throw new IngestionError('EMBEDDING_DIMENSION_MISMATCH','vector '+i+' has length '+(Array.isArray(vectors[i])?vectors[i].length:'non-array')+' but model declares '+adapter.descriptor.dimension,'embed');
      }
      for(const v of vectors[i]){
        if(typeof v!=='number'||!Number.isFinite(v))throw new IngestionError('EMBEDDING_DIMENSION_MISMATCH','vector '+i+' contains a non-finite component','embed');
      }
    }
    return vectors;
  });
}

// ---------------------------------------------------------------------------
// evaluate — deterministic quality gates over the assembled chunk set. Only a
// passed receipt may produce a result; failed evaluation fails the job so an
// incomplete ingestion can never approach publication.
// ---------------------------------------------------------------------------

export function evaluateStage(input:{
  chunks:readonly ChunkRecord[];
  parsed:ParsedDocument;
  model:EmbeddingModelDescriptor;
  bounds:ResolvedBounds;
}):EvaluationReceipt{
  const {chunks,parsed,model,bounds}=input;
  const checks:{id:string;passed:boolean;detail:string}[]=[];
  const failed:string[]=[];
  function check(id:string,passed:boolean,detail:string){
    checks.push({id,passed,detail});
    if(!passed)failed.push(id+': '+detail);
  }

  const chunkCount=chunks.length;
  check('chunks-present',chunkCount>0,'document produced '+chunkCount+' chunks');
  check('chunk-bounds',chunkCount<=bounds.maxChunks,chunkCount+' of '+bounds.maxChunks+' max chunks');

  let offsetsOk=chunkCount>0;
  let previousEnd=-1;
  for(const c of chunks){
    if(!(c.charStart>=0&&c.charEnd>c.charStart&&c.charEnd<=parsed.text.length&&c.charStart>=previousEnd)){offsetsOk=false;break;}
    previousEnd=c.charEnd;
  }
  check('offset-integrity',offsetsOk,'chunk offsets are ordered and inside the parsed document');

  const seen=new Map<string,number>();
  let duplicates=0;
  for(const c of chunks){
    const key=c.text.trim();
    const count=seen.get(key)??0;
    if(count===1)duplicates+=1;
    seen.set(key,count+1);
  }
  const duplicateRatio=chunkCount>0?duplicates/chunkCount:1;
  check('dedup-ratio',duplicateRatio<=bounds.maxDuplicateRatio,(duplicateRatio*100).toFixed(1)+'% duplicate chunks (limit '+(bounds.maxDuplicateRatio*100)+'%)');

  const coverage=chunks.reduce((s,c)=>s+(c.charEnd-c.charStart),0);
  check('coverage',chunkCount===0?false:coverage>=Math.min(bounds.maxChunkChars,1),'extracted '+coverage+' characters');

  const embeddingOk=chunks.every((c)=>c.embeddingModel===model.model&&c.embeddingDimension===model.dimension&&c.embedding!==null&&c.embedding.length===model.dimension);
  check('embedding-consistency',embeddingOk,'all chunks preserve model '+model.model+' dimension '+model.dimension);

  return {passed:failed.length===0,checks,failedReasons:failed};
}

// ---------------------------------------------------------------------------
// result assembly — chunks with provenance, offsets and preserved identity.
// ---------------------------------------------------------------------------

export function assembleChunks(input:{
  plan:ChunkPlan;
  parsed:ParsedDocument;
  vectors:readonly (readonly number[])[];
  model:EmbeddingModelDescriptor;
  provenance:SourceProvenance;
}):ChunkRecord[]{
  const transformationVersions={scan:TRANSFORMATION_VERSIONS.scan,parse:TRANSFORMATION_VERSIONS.parse,chunk:TRANSFORMATION_VERSIONS.chunk,embed:TRANSFORMATION_VERSIONS.embed,evaluate:TRANSFORMATION_VERSIONS.evaluate};
  return input.plan.chunks.map((c,i)=>({
    chunkId:'chk_'+digestOf([input.provenance,input.model,c.charStart,c.charEnd,c.text]).slice(0,24),
    index:i,
    text:c.text,
    charStart:c.charStart,
    charEnd:c.charEnd,
    page:c.page,
    sectionPath:c.sectionPath,
    embedding:input.vectors[i],
    embeddingModel:input.model.model,
    embeddingDimension:input.model.dimension,
    transformationVersions,
    provenance:{...input.provenance},
  }));
}
