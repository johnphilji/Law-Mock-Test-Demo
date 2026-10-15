import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";
import { calculateScore } from "@/lib/scoring";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await requireAuth();
    const { attemptId } = await context.params;

    // 1. Fetch attempt and snapshot
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        snapshot: true,
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: "Access denied to this attempt" }, { status: 403 });
    }

    // 2. Idempotent check: if already submitted, return the persisted result
    if (attempt.status === "SUBMITTED") {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        score: Number(attempt.score),
        percentage: Number(attempt.percentage),
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        unansweredCount: attempt.unansweredCount,
        submittedAt: attempt.submittedAt?.toISOString(),
      });
    }

    if (!attempt.snapshot) {
      return NextResponse.json({ error: "Attempt snapshot missing; cannot score attempt" }, { status: 500 });
    }

    // 3. Compute score server-side from immutable AttemptSnapshot
    const scoringResult = calculateScore(
      attempt.snapshot.questionsSnapshot,
      attempt.answers.map((a) => ({
        questionId: a.questionId,
        questionVersionId: a.questionVersionId,
        selectedOptionKey: a.selectedOptionKey,
      }))
    );

    const now = new Date();
    const timeTakenSeconds = Math.max(0, Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000));

    // 4. Update attempt atomically
    const updatedAttempt = await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
        score: scoringResult.score,
        totalMarks: scoringResult.totalMarks,
        correctCount: scoringResult.correctCount,
        incorrectCount: scoringResult.incorrectCount,
        unansweredCount: scoringResult.unansweredCount,
        percentage: scoringResult.percentage,
        timeTakenSeconds,
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: updatedAttempt.id,
      score: Number(updatedAttempt.score),
      totalMarks: Number(updatedAttempt.totalMarks),
      percentage: Number(updatedAttempt.percentage),
      correctCount: updatedAttempt.correctCount,
      incorrectCount: updatedAttempt.incorrectCount,
      unansweredCount: updatedAttempt.unansweredCount,
      timeTakenSeconds: updatedAttempt.timeTakenSeconds,
      submittedAt: updatedAttempt.submittedAt?.toISOString(),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
