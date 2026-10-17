import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const {
      title,
      examName,
      examId,
      type = "MOCK",
      durationMinutes = 120,
      totalMarks = 100,
      negativeMarking = 0.25,
      status = "DRAFT",
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Resolve or create exam
    let targetExamId = examId;
    if (!targetExamId) {
      const examMatch = await prisma.exam.findFirst({
        where: examName ? { name: { contains: examName, mode: "insensitive" } } : undefined,
      });

      if (examMatch) {
        targetExamId = examMatch.id;
      } else {
        const defaultExam = await prisma.exam.findFirst();
        if (defaultExam) {
          targetExamId = defaultExam.id;
        } else {
          const newExam = await prisma.exam.create({
            data: {
              name: examName || "General Law Mock Examination",
              slug: (examName || "general-law").toLowerCase().replace(/[^a-z0-9-]/g, "-"),
              isActive: true,
            },
          });
          targetExamId = newExam.id;
        }
      }
    }

    const cleanSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50) + "-" + Math.random().toString(36).substring(2, 6);

    const test = await prisma.test.create({
      data: {
        examId: targetExamId,
        title: title.trim(),
        slug: cleanSlug,
        type: type as any,
        status: status as any,
        durationMinutes: Number(durationMinutes) || 120,
        totalMarks: Number(totalMarks) || 100,
        negativeMarking: Number(negativeMarking) || 0,
        createdBy: admin.id,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
      include: {
        exam: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "ADMIN_CREATE_TEST",
        entityType: "Test",
        entityId: test.id,
        metadata: { title: test.title, slug: test.slug, status: test.status },
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, test }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, status, title } = body;

    if (!id) {
      return NextResponse.json({ error: "Test ID is required" }, { status: 400 });
    }

    const data: any = {};
    if (status) {
      data.status = status;
      if (status === "PUBLISHED") data.publishedAt = new Date();
      if (status === "ARCHIVED") data.archivedAt = new Date();
    }
    if (title) data.title = title.trim();

    const test = await prisma.test.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: `ADMIN_UPDATE_TEST_${status || "METADATA"}`,
        entityType: "Test",
        entityId: test.id,
        metadata: data,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, test });
  } catch (error) {
    return handleAuthError(error);
  }
}
