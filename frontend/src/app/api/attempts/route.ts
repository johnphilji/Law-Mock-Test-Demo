import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const attempts = await prisma.attempt.findMany({
      where: {
        userId: user.id,
        status: "SUBMITTED",
      },
      include: {
        test: {
          include: { exam: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    const data = attempts.map((a: any) => ({
      id: a.id,
      testId: a.testId,
      testTitle: a.test.title,
      examName: a.test.exam?.name ?? "Exam",
      score: a.score !== null ? Number(a.score) : 0,
      totalMarks: a.totalMarks !== null ? Number(a.totalMarks) : 0,
      percentage: a.percentage !== null ? Number(a.percentage) : 0,
      correctCount: a.correctCount ?? 0,
      incorrectCount: a.incorrectCount ?? 0,
      unansweredCount: a.unansweredCount ?? 0,
      timeTakenSeconds: a.timeTakenSeconds ?? 0,
      submittedAt: a.submittedAt?.toISOString() ?? a.createdAt.toISOString(),
    }));

    return NextResponse.json({ attempts: data });
  } catch (error) {
    return handleAuthError(error);
  }
}
