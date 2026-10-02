import type {Locale} from './workspace.ts';

export interface LessonRepresentation {
 id:string; kind:'text'|'diagram'|'cube'|'number-line'|'scene'; alternative:string; assetId?:string;
 numberLine?:{minimum:number;maximum:number;divisions:number;initial:number};
 series?:{label:string;value:number}[];
}
export interface LessonObjectiveSnapshot {
 conceptId:string; title:string; status:'sample'|'official'|'reviewed'; locale:Locale;
 selection:{board:string;classLevel:string;subject:string};
 provenance:{provider:string;sourceId:string;version:string};
 explanation:string; representations:LessonRepresentation[];
 criteria?:{id:string;label:string;prompt:string}[];
 prerequisites?:{id:string;title:string}[];
 sourceChapter?:{id:string;title:string;sourceSection:string;position:number};
 objectivePosition?:number;
}
