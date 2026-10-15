import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalStudents,
      activeStudents,
      publishedExams,
      publishedMockTests,
      activeSubscriptions,
      recentStudents,
      recentPayments,
      recentTests,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
      prisma.exam.count({ where: { isActive: true } }),
      prisma.test.count({ where: { status: "PUBLISHED" } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
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
      prisma.test.findMany({
        where: { status: "PUBLISHED" },
        take: 4,
        orderBy: { createdAt: "desc" },
        include: {
          exam: true,
        },
      }),
    ]);

    const formattedPayments = recentPayments.map((p: any) => ({
      id: p.id,
      userName: p.user?.name ?? "Student",
      userEmail: p.user?.email ?? "",
      amountPaise: p.amountPaise,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }));

    const formattedStudents = recentStudents.map((s: any) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      isEmailVerified: s.isEmailVerified,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
    }));

    const formattedTests = recentTests.map((t: any) => ({
      id: t.id,
      title: t.title,
      examName: t.exam?.name ?? "Exam",
      type: t.type,
      totalQuestions: 0,
      durationMinutes: t.durationMinutes,
      pricePaise: 0,
      discountedPricePaise: null,
      isFree: true,
      status: t.status,
    }));

    return NextResponse.json({
      stats: {
        totalStudents,
        activeStudents,
        publishedExams,
        publishedMockTests,
        activeSubscriptions,
        todayRevenuePaise: 0,
        totalRevenuePaise: 0,
      },
      recentPayments: formattedPayments,
      recentStudents: formattedStudents,
      recentTests: formattedTests,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
