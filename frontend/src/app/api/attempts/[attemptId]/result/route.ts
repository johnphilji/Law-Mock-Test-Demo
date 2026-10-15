import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await requireAuth();
    const { attemptId } = await context.params;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: { exam: true },
        },
        snapshot: true,
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied to these results" }, { status: 403 });
    }

    if (attempt.status !== "SUBMITTED") {
      return NextResponse.json({ error: "Exam has not been submitted yet" }, { status: 400 });
    }

    // Now (and only now that the exam is submitted) reveal correct answers and explanations
    const snapshotQuestions = (attempt.snapshot?.questionsSnapshot as any)?.questions || [];
    const answerMap = new Map<string, string | null>();
    for (const ans of attempt.answers) {
      answerMap.set(ans.questionId, ans.selectedOptionKey);
    }

    // Fetch question text and explanations
    const questionsWithReview = await Promise.all(
      snapshotQuestions.map(async (sq: any, idx: number) => {
        const selectedOptionKey = answerMap.get(sq.questionId) ?? null;
        const correctOption = sq.options.find((o: any) => o.isCorrect);
        const correctOptionKey = correctOption ? correctOption.optionKey : "";
        const isCorrect = selectedOptionKey === correctOptionKey;
        const isUnanswered = selectedOptionKey === null;

        // Fetch explanation from question version
        const qv = await prisma.questionVersion.findUnique({
          where: { id: sq.questionVersionId },
          select: { questionText: true, explanation: true },
        });

        return {
          questionId: sq.questionId,
          order: idx + 1,
          questionText: qv?.questionText || "",
          explanation: qv?.explanation || "Explanation not provided.",
          marks: sq.marks,
          negativeMarks: sq.negativeMarks,
          options: sq.options.map((opt: any) => ({
            key: opt.optionKey,
            text: opt.optionText,
            isCorrect: opt.isCorrect,
          })),
          selectedOptionKey,
          correctOptionKey,
          isCorrect,
          isUnanswered,
        };
      })
    );

    return NextResponse.json({
      attemptId: attempt.id,
      testTitle: attempt.test.title,
      examName: attempt.test.exam.name,
      score: Number(attempt.score),
      totalMarks: Number(attempt.totalMarks),
      percentage: Number(attempt.percentage),
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unansweredCount: attempt.unansweredCount,
      timeTakenSeconds: attempt.timeTakenSeconds,
      submittedAt: attempt.submittedAt?.toISOString(),
      questions: questionsWithReview,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
