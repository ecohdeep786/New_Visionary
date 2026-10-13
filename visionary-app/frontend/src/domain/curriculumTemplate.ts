import type {LessonRepresentation} from './lessonObjective.ts';
export interface CurriculumPracticeQuestion {id:string;prompt:string;options:string[];answerIndex:number}
export interface CurriculumObjective {
 id:string; title:string; explanation:string; prerequisiteIds:string[];
 representations:LessonRepresentation[]; criteria:{id:string;label:string;prompt:string}[];
 practice?:CurriculumPracticeQuestion[];
}
export interface CurriculumTemplate {
 schemaVersion:1;
 selection:{board:string;classLevel:string;subject:string};
 provenance:{provider:string;sourceId:string;version:string};
 chapters:{id:string;title:string;sourceSection:string;objectives:CurriculumObjective[]}[];
}
