import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeClassAssessment } from '../src/lib/classAssessment.js';

test('assessment distinguishes real zero scores from missing and invalid imported scores', () => {
  const assignments = [{ id: 'a', points: 10, topics: ['Fractions', 'Fractions', '__proto__'] }];
  const rows = [0, null, undefined, '', ' ', false, 'wrong', -1, 11, Infinity, 7].map((grade, index) => ({ id: String(index), student_id: 'learner', assignment_id: 'a', status: 'graded', grade }));
  const summary = summarizeClassAssessment(assignments, rows);
  assert.equal(summary.excluded, 9);
  assert.deepEqual(summary.coverageRows, [['Fractions', 1], ['__proto__', 1]]);
  assert.deepEqual(summary.assessmentRows.map(row => [row.avg, row.count]), [[35, 2], [35, 2]]);
  assert.equal(summary.students[0].concepts.Fractions, 35);
});

test('assessment ignores unrelated, ungraded and malformed topic records without inventing evidence', () => {
  const summary = summarizeClassAssessment([{ id: 'a', points: 0, topics: 'malformed' }, { id: 'b', points: 10, topics: ['Source topic', null, ''] }], [
    { assignment_id: 'missing', student_email: 'x', status: 'graded', grade: 5 },
    { assignment_id: 'a', student_email: 'x', status: 'graded', grade: 0 },
    { assignment_id: 'b', student_email: 'x', status: 'submitted', grade: 5 },
    { assignment_id: 'b', status: 'graded', grade: 5 },
  ]);
  assert.equal(summary.excluded, 3);
  assert.deepEqual(summary.coverageRows, [['Source topic', 1]]);
  assert.deepEqual(summary.assessmentRows, []);
  assert.deepEqual(summary.students, []);
});
