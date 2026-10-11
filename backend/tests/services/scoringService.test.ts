/**
 * Scoring Service — Unit Tests
 *
 * Tests for server-side scoring logic.
 * These tests run against pure functions — no database, no network.
 * All scoring inputs come from the immutable AttemptSnapshot.
 */
import { describe, it, expect } from "vitest";
import { calculateScore } from "@/server/services/scoringService";
import type { AttemptSnapshot, AttemptAnswer } from "@prisma/client";

// =============================================================================
// TEST HELPERS
// =============================================================================

function makeSnapshot(
  questions: Array<{
    questionId: string;
    questionVersionId: string;
    marks: number;
    negativeMarks: number;
    correctOptionKey: string;
  }>,
): Pick<AttemptSnapshot, "questionsSnapshot"> {
  return {
    questionsSnapshot: {
      questions: questions.map((q) => ({
        questionId: q.questionId,
        questionVersionId: q.questionVersionId,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        options: [
          { optionKey: "A", optionText: "Option A", isCorrect: q.correctOptionKey === "A", displayOrder: 0 },
          { optionKey: "B", optionText: "Option B", isCorrect: q.correctOptionKey === "B", displayOrder: 1 },
          { optionKey: "C", optionText: "Option C", isCorrect: q.correctOptionKey === "C", displayOrder: 2 },
          { optionKey: "D", optionText: "Option D", isCorrect: q.correctOptionKey === "D", displayOrder: 3 },
        ],
      })),
    } as unknown as AttemptSnapshot["questionsSnapshot"],
  };
}

function makeAnswer(
  questionId: string,
  questionVersionId: string,
  selectedOptionKey: string | null,
): Pick<AttemptAnswer, "questionId" | "questionVersionId" | "selectedOptionKey"> {
  return { questionId, questionVersionId, selectedOptionKey };
}

// =============================================================================
// TESTS
// =============================================================================

describe("scoringService.calculateScore", () => {
  describe("Basic scoring", () => {
    it("correctly calculates score for all correct answers", () => {
      const snapshot = makeSnapshot([
        { questionId: "q1", questionVersionId: "v1", marks: 1, negativeMarks: 0, correctOptionKey: "A" },
        { questionId: "q2", questionVersionId: "v2", marks: 1, negativeMarks: 0, correctOptionKey: "B" },
        { questionId: "q3", questionVersionId: "v3", marks: 1, negativeMarks: 0, correctOptionKey: "C" },
      ]);

      const answers = [
        makeAnswer("q1", "v1", "A"),
        makeAnswer("q2", "v2", "B"),
        makeAnswer("q3", "v3", "C"),
      ];

      const result = calculateScore(snapshot, answers);

      expect(result.score).toBe(3);
      expect(result.totalMarks).toBe(3);
      expect(result.correctCount).toBe(3);
      expect(result.incorrectCount).toBe(0);
      expect(result.unansweredCount).toBe(0);
      expect(result.percentage).toBe(100);
    });

    it("applies negative marking for wrong answers", () => {
      const snapshot = makeSnapshot([
        { questionId: "q1", questionVersionId: "v1", marks: 1, negativeMarks: 0.25, correctOptionKey: "A" },
        { questionId: "q2", questionVersionId: "v2", marks: 1, negativeMarks: 0.25, correctOptionKey: "B" },
        { questionId: "q3", questionVersionId: "v3", marks: 1, negativeMarks: 0.25, correctOptionKey: "C" },
      ]);

      const answers = [
        makeAnswer("q1", "v1", "A"), // Correct: +1
        makeAnswer("q2", "v2", "C"), // Wrong: -0.25
        makeAnswer("q3", "v3", null), // Unanswered: 0
      ];

      const result = calculateScore(snapshot, answers);

      expect(result.score).toBe(0.75);
      expect(result.correctCount).toBe(1);
      expect(result.incorrectCount).toBe(1);
      expect(result.unansweredCount).toBe(1);
    });

    it("does NOT apply negative marking to unanswered questions", () => {
      const snapshot = makeSnapshot([
        { questionId: "q1", questionVersionId: "v1", marks: 1, negativeMarks: 0.25, correctOptionKey: "A" },
      ]);

      const answers = [makeAnswer("q1", "v1", null)]; // Unanswered

      const result = calculateScore(snapshot, answers);

      expect(result.score).toBe(0);
      expect(result.unansweredCount).toBe(1);
      expect(result.incorrectCount).toBe(0);
    });

    it("handles zero marks test correctly", () => {
      const snapshot = makeSnapshot([
        { questionId: "q1", questionVersionId: "v1", marks: 1, negativeMarks: 0, correctOptionKey: "A" },
      ]);

      const result = calculateScore(snapshot, []);

      expect(result.score).toBe(0);
      expect(result.unansweredCount).toBe(1);
    });
  });

  describe("Score cannot go negative (Amendment: anti-gaming)", () => {
    it("floors score at 0 even with all wrong answers", () => {
      const snapshot = makeSnapshot([
        { questionId: "q1", questionVersionId: "v1", marks: 1, negativeMarks: 0.5, correctOptionKey: "A" },
        { questionId: "q2", questionVersionId: "v2", marks: 1, negativeMarks: 0.5, correctOptionKey: "A" },
        { questionId: "q3", questionVersionId: "v3", marks: 1, negativeMarks: 0.5, correctOptionKey: "A" },
      ]);

      const answers = [
        makeAnswer("q1", "v1", "B"), // Wrong: -0.5
        makeAnswer("q2", "v2", "B"), // Wrong: -0.5
        makeAnswer("q3", "v3", "B"), // Wrong: -0.5
      ];

      const result = calculateScore(snapshot, answers);

      // -1.5 raw score → floored to 0
      expect(result.score).toBe(0);
      expect(result.incorrectCount).toBe(3);
    });
  });

  describe("Floating-point precision", () => {
    it("correctly handles fractional marks without floating-point errors", () => {
      const snapshot = makeSnapshot([
        { questionId: "q1", questionVersionId: "v1", marks: 1, negativeMarks: 0.25, correctOptionKey: "A" },
        { questionId: "q2", questionVersionId: "v2", marks: 1, negativeMarks: 0.25, correctOptionKey: "A" },
        { questionId: "q3", questionVersionId: "v3", marks: 1, negativeMarks: 0.25, correctOptionKey: "A" },
        { questionId: "q4", questionVersionId: "v4", marks: 1, negativeMarks: 0.25, correctOptionKey: "A" },
      ]);

      const answers = [
        makeAnswer("q1", "v1", "A"), // +1
        makeAnswer("q2", "v2", "B"), // -0.25
        makeAnswer("q3", "v3", "B"), // -0.25
        makeAnswer("q4", "v4", "B"), // -0.25
      ];

      const result = calculateScore(snapshot, answers);

      // 1 - 0.25 - 0.25 - 0.25 = 0.25 (floating-point could give 0.25000000001)
      expect(result.score).toBe(0.25);
    });
  });

  describe("Snapshot immutability (Amendment #1)", () => {
    it("scores from snapshot data, not the passed-in answer object's version", () => {
      // Simulate: question was edited after attempt started.
      // The snapshot still has the original correct answer.
      const snapshot = makeSnapshot([
        {
          questionId: "q1",
          questionVersionId: "v1", // Version at attempt creation
          marks: 1,
          negativeMarks: 0,
          correctOptionKey: "A", // Original correct answer: A
        },
      ]);

      // Answer correctly per the snapshot.
      const answers = [makeAnswer("q1", "v1", "A")];
      const result = calculateScore(snapshot, answers);

      expect(result.score).toBe(1);
      expect(result.correctCount).toBe(1);
      expect(result.scoredAnswers[0]?.correctOptionKey).toBe("A");
    });

    it("throws on corrupt snapshot missing correct option", () => {
      // Corrupt snapshot: no option marked as correct.
      const badSnapshot = {
        questionsSnapshot: {
          questions: [
            {
              questionId: "q1",
              questionVersionId: "v1",
              marks: 1,
              negativeMarks: 0,
              options: [
                { optionKey: "A", optionText: "A", isCorrect: false, displayOrder: 0 },
                { optionKey: "B", optionText: "B", isCorrect: false, displayOrder: 1 },
              ],
            },
          ],
        } as unknown as AttemptSnapshot["questionsSnapshot"],
      };

      expect(() =>
        calculateScore(badSnapshot, [makeAnswer("q1", "v1", "A")]),
      ).toThrowError("Snapshot integrity error");
    });

    it("throws on missing questions in snapshot", () => {
      const badSnapshot = {
        questionsSnapshot: {} as unknown as AttemptSnapshot["questionsSnapshot"],
      };

      expect(() => calculateScore(badSnapshot, [])).toThrowError("Invalid snapshot");
    });
  });

  describe("Percentage calculation", () => {
    it("calculates percentage correctly for full marks", () => {
      const snapshot = makeSnapshot([
        { questionId: "q1", questionVersionId: "v1", marks: 4, negativeMarks: 0, correctOptionKey: "A" },
      ]);
      const result = calculateScore(snapshot, [makeAnswer("q1", "v1", "A")]);
      expect(result.percentage).toBe(100);
    });

    it("calculates percentage correctly for partial marks", () => {
      const snapshot = makeSnapshot([
        { questionId: "q1", questionVersionId: "v1", marks: 4, negativeMarks: 0, correctOptionKey: "A" },
        { questionId: "q2", questionVersionId: "v2", marks: 4, negativeMarks: 0, correctOptionKey: "A" },
      ]);
      const answers = [
        makeAnswer("q1", "v1", "A"), // Correct: +4
        makeAnswer("q2", "v2", "B"), // Wrong: 0 (no negative)
      ];
      const result = calculateScore(snapshot, answers);
      expect(result.percentage).toBe(50);
    });

    it("handles zero totalMarks without division by zero", () => {
      const snapshot = makeSnapshot([]);
      const result = calculateScore(snapshot, []);
      expect(result.percentage).toBe(0);
    });
  });

  describe("Configurable marks per question (non-uniform)", () => {
    it("correctly applies different marks for different questions", () => {
      const snapshot = makeSnapshot([
        { questionId: "q1", questionVersionId: "v1", marks: 2, negativeMarks: 0.5, correctOptionKey: "A" },
        { questionId: "q2", questionVersionId: "v2", marks: 1, negativeMarks: 0.25, correctOptionKey: "B" },
      ]);

      const answers = [
        makeAnswer("q1", "v1", "A"), // Correct: +2
        makeAnswer("q2", "v2", "A"), // Wrong: -0.25
      ];

      const result = calculateScore(snapshot, answers);
      expect(result.score).toBe(1.75); // 2 - 0.25
      expect(result.totalMarks).toBe(3); // 2 + 1
    });
  });
});
