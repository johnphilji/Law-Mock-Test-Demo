import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
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
    }));

    return NextResponse.json({ tests: data });
  } catch (error) {
    console.error("Failed to fetch published tests:", error);
    return NextResponse.json({ tests: [] });
  }
}
