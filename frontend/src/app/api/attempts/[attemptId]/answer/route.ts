import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await requireAuth();
    const { attemptId } = await context.params;
    const body = await request.json();
    const { questionId, selectedOptionKey, isMarkedForReview } = body;

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 });
    }

    // 1. Verify attempt exists, belongs to authenticated user, and is active
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        questions: {
          where: { questionId },
          take: 1,
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: "Access denied to this attempt" }, { status: 403 });
    }

    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "This exam attempt is no longer active" }, { status: 400 });
    }

    const now = new Date();
    if (now > attempt.expiresAt) {
      return NextResponse.json({ error: "Exam time has expired" }, { status: 400 });
    }

    const attemptQuestion = attempt.questions[0];
    if (!attemptQuestion) {
      return NextResponse.json({ error: "Question does not belong to this test attempt" }, { status: 400 });
    }

    // 2. Upsert answer safely
    const answer = await prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      update: {
        selectedOptionKey: selectedOptionKey !== undefined ? selectedOptionKey : undefined,
        isMarkedForReview: typeof isMarkedForReview === "boolean" ? isMarkedForReview : false,
        answeredAt: now,
      },
      create: {
        attemptId,
        questionId,
        questionVersionId: attemptQuestion.questionVersionId,
        selectedOptionKey: selectedOptionKey || null,
        isMarkedForReview: typeof isMarkedForReview === "boolean" ? isMarkedForReview : false,
        answeredAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      savedAt: answer.updatedAt.toISOString(),
      questionId: answer.questionId,
      selectedOptionKey: answer.selectedOptionKey,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
