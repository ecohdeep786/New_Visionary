export interface CatalogueSelection {board:string;classLevel:string;subject:string}
export function learningProfileSelection(profile?:{board?:string;classLevel?:string;subjects?:string[];exam?:string;institution?:string}|null,legacy?:{board?:string;grade_level?:string;subjects?:string[]}):CatalogueSelection;
export function catalogueSelection(saved:CatalogueSelection|undefined,profile:CatalogueSelection):CatalogueSelection;
export function booksForOutline(syllabus:any,requestedBook?:string|null,chapterId?:string|null):{books:any[];selected:any;chapters:any[]};
