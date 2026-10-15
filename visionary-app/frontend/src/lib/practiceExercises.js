export const cubeExercises = [
  { question: "A cube has sides of 3 units. What is its volume?", options: ["9 cubic units", "18 cubic units", "27 cubic units"], correct_answer: 2, explanation: "Volume is side × side × side, so 3 × 3 × 3 = 27 cubic units." },
  { question: "If every side of a cube doubles, its volume becomes…", options: ["2 times larger", "4 times larger", "8 times larger"], correct_answer: 2, explanation: "All three dimensions double: 2 × 2 × 2 = 8." },
  { question: "A cube has volume 64 cubic units. How long is each side?", options: ["4 units", "8 units", "16 units"], correct_answer: 0, explanation: "4 × 4 × 4 = 64, so each side is 4 units." },
];
export function scoreExercises(questions, answers) {
  return questions.reduce((sum, q, index) => sum + (answers[index] === q.correct_answer ? 1 : 0), 0);
}
