import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const exams = await prisma.exam.findMany({
      include: {
        _count: {
          select: {
            subjects: true,
            tests: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = exams.map((e) => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      description: e.description,
      isActive: e.isActive,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      subjectCount: e._count.subjects,
      testCount: e._count.tests,
    }));

    return NextResponse.json({ exams: data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Exam name and slug are required" }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

    const existing = await prisma.exam.findUnique({
      where: { slug: cleanSlug },
    });

    if (existing) {
      return NextResponse.json({ error: "An exam with this slug already exists" }, { status: 409 });
    }

    const exam = await prisma.exam.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        description: description?.trim() || null,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "ADMIN_CREATE_EXAM",
        entityType: "Exam",
        entityId: exam.id,
        metadata: { name: exam.name, slug: exam.slug },
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, name, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    const exam = await prisma.exam.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "ADMIN_UPDATE_EXAM",
        entityType: "Exam",
        entityId: exam.id,
        metadata: updateData,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, exam });
  } catch (error) {
    return handleAuthError(error);
  }
}
