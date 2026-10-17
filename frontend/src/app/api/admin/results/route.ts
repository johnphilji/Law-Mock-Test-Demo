import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const [
      totalAttempts,
      submittedAttempts,
      inProgressAttempts,
      expiredAttempts,
      scoreAggregates,
      testBreakdown,
      recentResults,
    ] = await Promise.all([
      prisma.attempt.count(),
      prisma.attempt.count({ where: { status: "SUBMITTED" } }),
      prisma.attempt.count({ where: { status: "IN_PROGRESS" } }),
      prisma.attempt.count({ where: { status: "EXPIRED" } }),
      prisma.attempt.aggregate({
        where: { status: "SUBMITTED", score: { not: null } },
        _avg: { score: true, percentage: true, timeTakenSeconds: true },
        _max: { score: true, percentage: true },
        _min: { score: true, percentage: true },
      }),
      prisma.test.findMany({
        select: {
          id: true,
          title: true,
          type: true,
          exam: { select: { name: true } },
          _count: {
            select: {
              attempts: true,
            },
          },
          attempts: {
            where: { status: "SUBMITTED" },
            select: { score: true, percentage: true },
          },
        },
      }),
      prisma.attempt.findMany({
        where: { status: "SUBMITTED" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          test: { select: { id: true, title: true, exam: { select: { name: true } } } },
        },
        orderBy: { submittedAt: "desc" },
        take: 20,
      }),
    ]);

    const formattedTestBreakdown = testBreakdown.map((t) => {
      const submitted = t.attempts;
      const avgScore = submitted.length > 0
        ? submitted.reduce((acc, curr) => acc + Number(curr.score || 0), 0) / submitted.length
        : null;
      const passCount = submitted.filter((a) => Number(a.percentage || 0) >= 40).length;

      return {
        id: t.id,
        title: t.title,
        examName: t.exam?.name ?? "General",
        type: t.type,
        totalAttempts: t._count.attempts,
        completedAttempts: submitted.length,
        averageScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
        passRate: submitted.length > 0 ? Math.round((passCount / submitted.length) * 100) : null,
      };
    });

    const formattedResults = recentResults.map((r) => ({
      id: r.id,
      studentName: r.user?.name ?? "Student",
      studentEmail: r.user?.email ?? "",
      testTitle: r.test?.title ?? "Mock Test",
      examName: r.test?.exam?.name ?? "General",
      score: r.score !== null ? Number(r.score) : 0,
      totalMarks: r.totalMarks !== null ? Number(r.totalMarks) : 0,
      percentage: r.percentage !== null ? Number(r.percentage) : 0,
      correctCount: r.correctCount ?? 0,
      incorrectCount: r.incorrectCount ?? 0,
      unansweredCount: r.unansweredCount ?? 0,
      timeTakenSeconds: r.timeTakenSeconds ?? 0,
      submittedAt: r.submittedAt ? r.submittedAt.toISOString() : r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      summary: {
        totalAttempts,
        submittedAttempts,
        inProgressAttempts,
        expiredAttempts,
        averageScore: scoreAggregates._avg.score !== null ? Number(scoreAggregates._avg.score.toFixed(2)) : null,
        averagePercentage: scoreAggregates._avg.percentage !== null ? Number(scoreAggregates._avg.percentage.toFixed(1)) : null,
        highestScore: scoreAggregates._max.score !== null ? Number(scoreAggregates._max.score) : null,
        lowestScore: scoreAggregates._min.score !== null ? Number(scoreAggregates._min.score) : null,
        averageTimeMinutes: scoreAggregates._avg.timeTakenSeconds !== null ? Math.round(scoreAggregates._avg.timeTakenSeconds / 60) : null,
      },
      testBreakdown: formattedTestBreakdown,
      recentResults: formattedResults,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
