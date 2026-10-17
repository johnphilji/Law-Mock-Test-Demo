import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    const where: any = {};
    if (examId) where.examId = examId;

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        exam: { select: { id: true, name: true } },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    const data = subjects.map((s) => ({
      id: s.id,
      examId: s.examId,
      examName: s.exam?.name ?? "General",
      name: s.name,
      slug: s.slug,
      displayOrder: s.displayOrder,
      isActive: s.isActive,
      questionCount: s._count.questions,
    }));

    return NextResponse.json({ subjects: data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { name, slug, examId, displayOrder = 0 } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Subject name and slug are required" }, { status: 400 });
    }

    let targetExamId = examId;
    if (!targetExamId) {
      const defaultExam = await prisma.exam.findFirst();
      if (!defaultExam) {
        return NextResponse.json({ error: "No exam found. Create an exam first." }, { status: 400 });
      }
      targetExamId = defaultExam.id;
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

    const subject = await prisma.subject.create({
      data: {
        examId: targetExamId,
        name: name.trim(),
        slug: cleanSlug,
        displayOrder: Number(displayOrder) || 0,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "ADMIN_CREATE_SUBJECT",
        entityType: "Subject",
        entityId: subject.id,
        metadata: { name: subject.name, slug: subject.slug },
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, subject }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, name, slug, displayOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (slug) updateData.slug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    const subject = await prisma.subject.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "ADMIN_UPDATE_SUBJECT",
        entityType: "Subject",
        entityId: subject.id,
        metadata: updateData,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, subject });
  } catch (error) {
    return handleAuthError(error);
  }
}
