/**
 * Scoring Service
 *
 * Calculates exam scores from submitted answers.
 * Score is ALWAYS calculated server-side from the AttemptSnapshot.
 * The client NEVER submits a score — it is calculated and stored here.
 *
 * Amendment #1 compliance:
 * This service only reads from AttemptSnapshot (the immutable record created
 * at attempt start). Even if questions are edited after the attempt began,
 * the original question text, options, and correct answers are preserved
 * in the snapshot and used for scoring.
 */

import type {
  AttemptAnswer as PrismaAttemptAnswer,
  AttemptSnapshot as PrismaSnapshot,
} from "@prisma/client";

// =============================================================================
// TYPES
// =============================================================================

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

// =============================================================================
// SNAPSHOT TYPES (what's stored in AttemptSnapshot.questionsSnapshot)
// =============================================================================

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

// =============================================================================
// SCORING SERVICE
// =============================================================================

/**
 * Calculate the score for an attempt.
 *
 * @param snapshot - The immutable AttemptSnapshot record
 * @param answers  - All AttemptAnswer records for this attempt
 * @returns        ScoringResult with full breakdown
 *
 * IMPORTANT: This reads ONLY from the snapshot, never from live question data.
 * This ensures historical accuracy and prevents score manipulation via question edits.
 */
export function calculateScore(
  snapshot: Pick<PrismaSnapshot, "questionsSnapshot">,
  answers: Pick<
    PrismaAttemptAnswer,
    "questionId" | "questionVersionId" | "selectedOptionKey"
  >[],
): ScoringResult {
  const snapshotData = snapshot.questionsSnapshot as unknown as SnapshotData;

  if (!snapshotData.questions || !Array.isArray(snapshotData.questions)) {
    throw new Error("Invalid snapshot: questions array is missing");
  }

  // Build an answer lookup map for O(1) access.
  const answerMap = new Map<string, string | null>();
  for (const answer of answers) {
    answerMap.set(answer.questionId, answer.selectedOptionKey);
  }

  let score = 0;
  let totalMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  const scoredAnswers: ScoredAnswer[] = [];

  for (const snapshotQuestion of snapshotData.questions) {
    const { questionId, questionVersionId, marks, negativeMarks, options } = snapshotQuestion;

    // Find the correct option from the snapshot.
    const correctOption = options.find((o) => o.isCorrect);
    if (!correctOption) {
      // This should never happen if the test was properly validated before publishing.
      throw new Error(
        `Snapshot integrity error: Question ${questionId} has no correct option`,
      );
    }

    const correctOptionKey = correctOption.optionKey;
    const selectedOptionKey = answerMap.get(questionId) ?? null;
    const isUnanswered = selectedOptionKey === null;
    const isCorrect = !isUnanswered && selectedOptionKey === correctOptionKey;

    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = marks;
      correctCount++;
    } else if (!isUnanswered) {
      // Incorrect answer: apply negative marking.
      // negativeMarks is the penalty amount (e.g., 0.25).
      // We subtract it from the score (not multiply).
      pointsEarned = -negativeMarks;
      incorrectCount++;
    } else {
      unansweredCount++;
    }

    score += pointsEarned;
    totalMarks += marks;

    scoredAnswers.push({
      questionId,
      questionVersionId,
      selectedOptionKey,
      correctOptionKey,
      marks,
      negativeMarks,
      isCorrect,
      isUnanswered,
      pointsEarned,
    });
  }

  // Score cannot be negative (standard AIBE rule).
  score = Math.max(0, score);

  // Round to 2 decimal places to avoid floating-point representation issues.
  score = Math.round(score * 100) / 100;

  const percentage =
    totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;

  return {
    score,
    totalMarks,
    correctCount,
    incorrectCount,
    unansweredCount,
    percentage,
    scoredAnswers,
  };
}
