import type { Locale, Person, Role } from '../domain/workspace.ts';
import { listJourneys } from './journeys.ts';

/** One conservative demo policy for entry and response suggestions; not stage adaptation. */
export function eligibleJourneys(role: Role, ageBand: Person['ageBand'], locale: Locale) {
  const journeys=listJourneys(locale);
  if(role==='professional')return journeys.filter(j=>j.id==='data');
  if(role!=='student')return [];
  return ageBand==='adult'?journeys:journeys.filter(j=>j.id!=='data');
}
