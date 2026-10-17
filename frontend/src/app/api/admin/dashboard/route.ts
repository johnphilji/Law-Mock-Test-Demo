import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    await requireAdmin();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      activeStudents,
      publishedExams,
      publishedMockTests,
      draftMockTests,
      totalAttempts,
      completedAttempts,
      activeSubscriptions,
      capturedRevenueAgg,
      todayRevenueAgg,
      refundedRevenueAgg,
      recentStudents,
      recentPayments,
      recentAttempts,
      recentTests,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
      prisma.exam.count({ where: { isActive: true } }),
      prisma.test.count({ where: { status: "PUBLISHED" } }),
      prisma.test.count({ where: { status: "DRAFT" } }),
      prisma.attempt.count(),
      prisma.attempt.count({ where: { status: "SUBMITTED" } }),
      prisma.subscription.count({
        where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
      }),
      prisma.payment.aggregate({
        where: { status: "CAPTURED" },
        _sum: { amountPaise: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "CAPTURED",
          createdAt: { gte: startOfToday },
        },
        _sum: { amountPaise: true },
      }),
      prisma.payment.aggregate({
        where: { status: "REFUNDED" },
        _sum: { amountPaise: true },
      }),
      prisma.user.findMany({
        where: { role: "STUDENT" },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          isEmailVerified: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.attempt.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true },
          },
          test: {
            select: { title: true },
          },
        },
      }),
      prisma.test.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          exam: true,
          _count: { select: { questions: true, attempts: true } },
        },
      }),
    ]);

    const formattedPayments = recentPayments.map((p) => ({
      id: p.id,
      orderId: p.razorpayOrderId,
      userName: p.user?.name ?? "Student",
      userEmail: p.user?.email ?? "",
      amountPaise: p.amountPaise,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }));

    const formattedStudents = recentStudents.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      isEmailVerified: s.isEmailVerified,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
    }));

    const formattedAttempts = recentAttempts.map((a) => ({
      id: a.id,
      userName: a.user?.name ?? "Student",
      userEmail: a.user?.email ?? "",
      testTitle: a.test?.title ?? "Mock Test",
      status: a.status,
      score: a.score !== null ? Number(a.score) : null,
      totalMarks: a.totalMarks !== null ? Number(a.totalMarks) : null,
      percentage: a.percentage !== null ? Number(a.percentage) : null,
      submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
    }));

    const formattedTests = recentTests.map((t) => ({
      id: t.id,
      title: t.title,
      examName: t.exam?.name ?? "General",
      type: t.type,
      totalQuestions: t._count.questions,
      attemptCount: t._count.attempts,
      durationMinutes: t.durationMinutes,
      status: t.status,
    }));

    return NextResponse.json({
      stats: {
        totalStudents,
        activeStudents,
        publishedExams,
        publishedMockTests,
        draftMockTests,
        totalAttempts,
        completedAttempts,
        activeSubscriptions,
        todayRevenuePaise: todayRevenueAgg._sum.amountPaise ?? 0,
        totalRevenuePaise: capturedRevenueAgg._sum.amountPaise ?? 0,
        refundedRevenuePaise: refundedRevenueAgg._sum.amountPaise ?? 0,
      },
      recentPayments: formattedPayments,
      recentStudents: formattedStudents,
      recentAttempts: formattedAttempts,
      recentTests: formattedTests,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
