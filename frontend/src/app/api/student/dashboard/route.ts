import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query real attempts for this student
    const attempts = await prisma.attempt.findMany({
      where: { userId: session.id },
      include: {
        test: {
          include: { 
            exam: true,
            _count: { select: { questions: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Query active subscriptions/enrollments
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: session.id,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    // Query all published mock tests
    const publishedTests = await prisma.test.findMany({
      where: { status: "PUBLISHED" },
      include: { 
        exam: true,
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatTest = (t: any) => ({
      id: t.id,
      title: t.title,
      examName: t.exam?.name ?? "Exam",
      type: t.type,
      durationMinutes: t.durationMinutes,
      totalQuestions: t._count?.questions ?? 0,
      pricePaise: 4900,
      discountedPricePaise: null,
      isFree: false,
    });

    const hasActiveSubscription = subscriptions.length > 0;
    const attemptedTestIds = new Set(attempts.map((a: any) => a.testId));

    let enrolledTests: any[] = [];
    let availableTests: any[] = [];

    if (hasActiveSubscription) {
      // Under an active subscription, all published tests are unlocked and enrolled
      enrolledTests = publishedTests.map(formatTest);
      availableTests = [];
    } else {
      enrolledTests = publishedTests.filter((t: any) => attemptedTestIds.has(t.id)).map(formatTest);
      availableTests = publishedTests.filter((t: any) => !attemptedTestIds.has(t.id)).map(formatTest);
    }

    const enrolledCount = enrolledTests.length;
    
    // Distinguish between distinct mock tests completed vs total attempt sessions
    const completedAttempts = attempts.filter((a: any) => a.status === "SUBMITTED" || a.status === "AUTO_SUBMITTED");
    const distinctTestsAttempted = new Set(completedAttempts.map((a: any) => a.testId)).size;
    const totalAttemptSessions = attempts.length;

    // Percentile & accuracy calculation based strictly on real submitted/completed attempts
    const submittedAttempts = attempts.filter((a: any) => (a.status === "SUBMITTED" || a.status === "AUTO_SUBMITTED") && a.percentage !== null);
    
    let averageAccuracy: number | null = null;
    let allIndiaPercentile: number | null = null;

    if (submittedAttempts.length > 0) {
      const totalPct = submittedAttempts.reduce((acc: number, curr: any) => acc + Number(curr.percentage || 0), 0);
      averageAccuracy = Math.round((totalPct / submittedAttempts.length) * 10) / 10;

      // Real percentile against all candidate attempts across the platform
      const allPlatformAttempts = await prisma.attempt.findMany({
        where: { 
          status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] },
          percentage: { not: null } 
        },
        select: { percentage: true },
      });

      if (allPlatformAttempts.length >= 2) {
        const candidateAvgPct = totalPct / submittedAttempts.length;
        const belowCount = allPlatformAttempts.filter((a) => Number(a.percentage || 0) < candidateAvgPct).length;
        allIndiaPercentile = Math.round((belowCount / allPlatformAttempts.length) * 100);
      } else {
        allIndiaPercentile = null;
      }
    }

    return NextResponse.json({
      stats: {
        testsAttempted: distinctTestsAttempted,
        totalSessions: totalAttemptSessions,
        enrolledCount,
        allIndiaPercentile,
        averageAccuracy,
        strongestSubject: null,
      },
      enrolledTests,
      availableTests,
    });
  } catch (error) {
    console.error("Student dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
