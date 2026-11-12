import {localizedNavigation} from './workspaceStrings.js';
import { Home,BookOpen,PencilRuler,Boxes,Crown,GraduationCap,BarChart3,Users,HeartHandshake,LibraryBig,NotebookPen,Briefcase,FolderClock,Shield,Bell,SlidersHorizontal,MessageCircle } from 'lucide-react';
const item=(key,label,icon)=>({key,label,icon,to:'/dashboard/'+key});
function primaryNavigation(role){switch(role){
 case 'teacher':return [item('home','Home',Home),item('prepare','Prepare',NotebookPen),item('classes','Classes',GraduationCap),item('learners','Learners',Users),item('insights','Insights',BarChart3)];
 case 'parent':return [item('home','Home',Home),item('child','Children',HeartHandshake),item('reports','Reports',BarChart3),item('connections','Connections',Users),item('ask','Ask',MessageCircle)];
 case 'organization':return [item('home','Home',Home),item('people','People',Users),item('cohorts','Cohorts',GraduationCap),item('curriculum','Curriculum',LibraryBig),item('analytics','Insights',BarChart3)];
 case 'professional':return [item('home','Home',Home),item('learn','Learn',BookOpen),item('ask','Ask',MessageCircle),item('practice','Practice',PencilRuler),item('build','Build',Boxes),item('career','Career',Briefcase)];
 default:return [item('home','Home',Home),item('learn','Learn',BookOpen),item('ask','Ask',MessageCircle),item('practice','Practice',PencilRuler),item('build','Build',Boxes)];}}
function secondaryItems(role){const common=[item('progress','Progress',BarChart3),item('notifications','Notifications',Bell),item('personalization','Personalization',SlidersHorizontal),item('privacy','Privacy',Shield),item('subscription','Plans & usage',Crown)];if(role==='teacher')return [item('ask','Ask',MessageCircle),item('growth','Teacher Growth',BookOpen),item('library','Library',LibraryBig),item('build','Build',Boxes),...common];if(role==='organization')return [item('library','Content',LibraryBig),item('audit','Audit',FolderClock),...common.filter(i=>i.key!=='progress').map(i=>i.key==='subscription'?{...i,label:'Seats & billing'}:i)];if(role==='student'||role==='professional')return [item('classes','Classes',GraduationCap),item('connections','Connections',Users),...common];return role==='parent'?common.filter(i=>i.key!=='progress'):common;}
export function canAccessDashboardPath(role,path){const section=path.split('/')[2]||'home';if(['profile','settings','support','ask','guide','connections','learn','practice','build','explore','privacy','personalization','notifications','progress','subscription'].includes(section))return true;if(section==='class')return ['student','professional','teacher'].includes(role);return [...navigationFor(role),...secondaryNavigation(role)].some(i=>i.key===section);}

/* FAP-75: routes whose experience is an organization workspace (People, Cohorts,
 * Curriculum, Analytics). When another identity deep-links one of them, the
 * workspace explains itself and offers its own working paths instead of
 * silently rewriting the address bar to /dashboard/home. */
export function isOrganizationArea(section){return ['people','cohorts','curriculum','analytics'].includes(section);}

/* FAP-87: the role that owns each remaining restricted workspace section, so a
 * deep link from an identity without access keeps its URL and explains itself
 * (the FAP-75 law) instead of silently rewriting the address bar to
 * /dashboard/home. Sections outside this map and outside isOrganizationArea
 * keep the existing fallback. `class` detail routes belong to connected
 * classrooms (student/professional/teacher access). FAP-90: the plural
 * Classes list is a teaching-workspace area too — without a mapping,
 * organization and family identities deep-linking /dashboard/classes fell
 * back to the Navigate-to-home rewrite. */
const areaOwners={prepare:'teacher',learners:'teacher',insights:'teacher',growth:'teacher',library:'teacher',classes:'teacher',child:'parent',reports:'parent',career:'professional',audit:'organization',class:'teacher'};
export function dashboardAreaOwner(section){return areaOwners[section]||null;}

export function navigationFor(role,locale="en"){return localizedNavigation(primaryNavigation(role),locale);}
export function secondaryNavigation(role,locale="en"){return localizedNavigation(secondaryItems(role),locale);}
