import { CheckCircle2, Circle, RotateCcw } from 'lucide-react';
import { learningMilestoneCopy } from '@/lib/learningMilestoneCopy';

// These are saved activity markers, not a score or a mastery estimate.
export default function LearningMilestone({ unit, locale = 'en', application = false }) {
 const copy = learningMilestoneCopy(locale);
 const projectLinked = typeof unit.artifactId === 'string' && unit.artifactId.trim().length > 0;
 const recordedApplication = unit.stage === 'completed' && projectLinked;
 const correct = unit.answer?.correct === true;
 const Heading = application ? 'h2' : 'h3';
 const Icon = application ? recordedApplication ? CheckCircle2 : Circle : correct ? CheckCircle2 : RotateCcw;
 const title = application ? !projectLinked ? 'Application details unavailable' : recordedApplication ? 'Your application is recorded' : 'Put the idea to work' : !correct ? 'Your attempt is saved' : unit.stage === 'check' ? 'Understanding check recorded' : 'Practice step recorded';
 const description = application ? !projectLinked ? 'This saved activity has no project link. Return to your learning outline to choose your next step.' : recordedApplication ? 'You saved a completed project for this concept. Revisit what you made and reflect on what you would improve.' : 'Open your project to create something with this idea. Save your work and reflect on what you learned.' : !correct ? 'This answer needs another look. Review the explanation or try a smaller step; your earlier recorded work is kept.' : unit.stage === 'check' ? 'You answered this check correctly. Next, try the idea in guided practice.' : 'You answered this practice step correctly. Use the idea in a project when you are ready.';
 return <div className="v-learning-milestone" lang={locale}>
  <div {...(!application ? { role: 'status', 'aria-atomic': true } : {})}>
   <div className="v-learning-milestone-heading"><Icon size={20} strokeWidth={1.8} aria-hidden="true" /><Heading className="text-lg font-medium">{copy(title)}</Heading></div>
   <p className="v-muted mt-2">{copy(description)}</p>
  </div>
  {application && <>
   <ul className="v-learning-milestone-evidence" aria-label={copy('Recorded steps')}>
    {unit.checkPassed === true && <li className="v-learning-milestone-item" data-recorded="true"><CheckCircle2 size={16} aria-hidden="true" />{copy('Understanding checked')}</li>}
    {unit.practicePassed === true && <li className="v-learning-milestone-item" data-recorded="true"><CheckCircle2 size={16} aria-hidden="true" />{copy('Practice checked')}</li>}
    {projectLinked && <li className="v-learning-milestone-item" data-recorded={recordedApplication}><span aria-hidden="true">{recordedApplication ? <CheckCircle2 size={16} /> : <Circle size={16} />}</span>{copy(recordedApplication ? 'Application recorded' : 'Next: create your project')}</li>}
   </ul>
   {recordedApplication && <p className="v-muted mt-3 text-sm">{copy('A saved application records your work; it is not an assessment of mastery.')}</p>}
  </>}
 </div>;
}
