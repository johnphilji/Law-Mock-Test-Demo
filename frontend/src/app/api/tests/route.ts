import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const session = await getCurrentSession();

    // Check if the authenticated user has an active subscription
    let hasActiveSubscription = false;
    let attemptedTestIds = new Set<string>();

    if (session) {
      const activeSub = await prisma.subscription.findFirst({
        where: {
          userId: session.id,
          status: "ACTIVE",
          expiresAt: { gt: new Date() },
        },
      });
      hasActiveSubscription = Boolean(activeSub);

      const attempts = await prisma.attempt.findMany({
        where: { userId: session.id },
        select: { testId: true },
      });
      attemptedTestIds = new Set(attempts.map((a) => a.testId));
    }

    const tests = await prisma.test.findMany({
      where: { status: "PUBLISHED" },
      include: {
        exam: true,
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = tests.map((t: any) => ({
      id: t.id,
      title: t.title,
      examName: t.exam?.name ?? "Exam",
      type: t.type,
      durationMinutes: t.durationMinutes,
      totalQuestions: t._count?.questions ?? 0,
      pricePaise: 4900,
      discountedPricePaise: null,
      isFree: false,
      isPurchased: hasActiveSubscription || attemptedTestIds.has(t.id),
    }));

    return NextResponse.json({
      hasActiveSubscription,
      tests: data,
    });
  } catch (error) {
    console.error("Failed to fetch published tests:", error);
    return NextResponse.json({ tests: [] });
  }
}
