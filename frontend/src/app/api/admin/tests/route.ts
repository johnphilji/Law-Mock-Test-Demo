import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    await requireAdmin();

    const tests = await prisma.test.findMany({
      include: {
        exam: true,
        questions: true,
        attempts: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const data = tests.map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      examName: t.exam?.name ?? "General",
      type: t.type,
      status: t.status,
      durationMinutes: t.durationMinutes,
      totalQuestions: t.questions.length,
      totalMarks: Number(t.totalMarks),
      negativeMarking: Number(t.negativeMarking),
      attemptCount: t.attempts.length,
      isFree: true,
      pricePaise: 0,
      discountedPricePaise: null,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({ tests: data });
  } catch (error) {
    return handleAuthError(error);
  }
}
