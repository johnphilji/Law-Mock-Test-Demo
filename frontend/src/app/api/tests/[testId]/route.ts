import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await context.params;

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        exam: true,
        _count: { select: { questions: true } },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        examName: test.exam?.name ?? "Exam",
        type: test.type,
        durationMinutes: test.durationMinutes,
        totalQuestions: test._count?.questions ?? 0,
        pricePaise: 4900,
        discountedPricePaise: null,
        isFree: false,
      },
    });
  } catch (error) {
    console.error("Failed to fetch test details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
