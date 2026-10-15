/**
 * Server-side scoring service for Panther Law Prep examination engine.
 * Computes scores strictly from AttemptSnapshot and submitted answers.
 */

export interface ScoredAnswer {
  questionId: string;
  questionVersionId: string;
  selectedOptionKey: string | null;
  correctOptionKey: string;
  marks: number;
  negativeMarks: number;
  isCorrect: boolean;
  isUnanswered: boolean;
  pointsEarned: number;
}

export interface ScoringResult {
  score: number;
  totalMarks: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  percentage: number;
  scoredAnswers: ScoredAnswer[];
}

interface SnapshotOption {
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
}

interface SnapshotQuestion {
  questionId: string;
  questionVersionId: string;
  marks: number;
  negativeMarks: number;
  options: SnapshotOption[];
}

interface SnapshotData {
  questions: SnapshotQuestion[];
}

export function calculateScore(
  questionsSnapshot: any,
  answers: {
    questionId: string;
    questionVersionId: string;
    selectedOptionKey: string | null;
  }[]
): ScoringResult {
  const snapshotData = questionsSnapshot as SnapshotData;

  if (!snapshotData || !Array.isArray(snapshotData.questions)) {
    throw new Error("Invalid snapshot: questions array is missing");
  }

  const answerMap = new Map<string, string | null>();
  for (const answer of answers) {
    answerMap.set(answer.questionId, answer.selectedOptionKey);
  }

  let totalScore = 0;
  let totalMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const scoredAnswers: ScoredAnswer[] = [];

  for (const q of snapshotData.questions) {
    const marks = Number(q.marks) || 1;
    const negativeMarks = Number(q.negativeMarks) || 0;
    totalMarks += marks;

    const correctOption = q.options.find((o) => o.isCorrect);
    const correctOptionKey = correctOption ? correctOption.optionKey : "";

    const selectedOptionKey = answerMap.get(q.questionId) ?? null;

    if (!selectedOptionKey) {
      unansweredCount++;
      scoredAnswers.push({
        questionId: q.questionId,
        questionVersionId: q.questionVersionId,
        selectedOptionKey: null,
        correctOptionKey,
        marks,
        negativeMarks,
        isCorrect: false,
        isUnanswered: true,
        pointsEarned: 0,
      });
      continue;
    }

    if (selectedOptionKey === correctOptionKey) {
      correctCount++;
      totalScore += marks;
      scoredAnswers.push({
        questionId: q.questionId,
        questionVersionId: q.questionVersionId,
        selectedOptionKey,
        correctOptionKey,
        marks,
        negativeMarks,
        isCorrect: true,
        isUnanswered: false,
        pointsEarned: marks,
      });
    } else {
      incorrectCount++;
      totalScore -= negativeMarks;
      scoredAnswers.push({
        questionId: q.questionId,
        questionVersionId: q.questionVersionId,
        selectedOptionKey,
        correctOptionKey,
        marks,
        negativeMarks,
        isCorrect: false,
        isUnanswered: false,
        pointsEarned: -negativeMarks,
      });
    }
  }

  const percentage = totalMarks > 0 ? Math.round((Math.max(0, totalScore) / totalMarks) * 10000) / 100 : 0;

  return {
    score: Math.round(totalScore * 100) / 100,
    totalMarks: Math.round(totalMarks * 100) / 100,
    correctCount,
    incorrectCount,
    unansweredCount,
    percentage,
    scoredAnswers,
  };
}
