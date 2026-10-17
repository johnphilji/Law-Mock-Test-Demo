import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const subjectId = searchParams.get("subjectId");
    const difficulty = searchParams.get("difficulty");
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;

    if (subjectId) where.subjectId = subjectId;

    if (search || difficulty) {
      where.versions = {
        some: {
          isActive: true,
          ...(search ? { questionText: { contains: search, mode: "insensitive" } } : {}),
          ...(difficulty ? { difficulty: difficulty as any } : {}),
        },
      };
    }

    const [total, questions] = await Promise.all([
      prisma.question.count({ where }),
      prisma.question.findMany({
        where,
        include: {
          subject: { select: { id: true, name: true } },
          topic: { select: { id: true, name: true } },
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            include: {
              options: {
                orderBy: { displayOrder: "asc" },
              },
            },
          },
          _count: {
            select: {
              testQuestions: true,
              attemptAnswers: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const formatted = questions.map((q) => {
      const v = q.versions[0];
      return {
        id: q.id,
        subjectId: q.subjectId,
        subjectName: q.subject?.name ?? "General",
        topicName: q.topic?.name ?? null,
        currentVersion: q.currentVersion,
        isActive: q.isActive,
        usedInTests: q._count.testQuestions,
        usedInAttempts: q._count.attemptAnswers,
        createdAt: q.createdAt.toISOString(),
        version: v
          ? {
              id: v.id,
              version: v.version,
              questionText: v.questionText,
              difficulty: v.difficulty,
              explanation: v.explanation,
              options: v.options.map((o) => ({
                id: o.id,
                optionKey: o.optionKey,
                optionText: o.optionText,
                isCorrect: o.isCorrect,
                displayOrder: o.displayOrder,
              })),
            }
          : null,
      };
    });

    return NextResponse.json({
      questions: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const {
      subjectId,
      topicName,
      difficulty = "MEDIUM",
      questionText,
      explanation,
      options,
      isActive = true,
    } = body;

    if (!subjectId || !questionText || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: "Subject, question text, and at least 2 options are required" },
        { status: 400 }
      );
    }

    const hasCorrect = options.some((o: any) => o.isCorrect);
    if (!hasCorrect) {
      return NextResponse.json(
        { error: "At least one option must be marked as correct" },
        { status: 400 }
      );
    }

    // Optional topic linkage
    let topicId: string | null = null;
    if (topicName && topicName.trim()) {
      const cleanSlug = topicName.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
      const existingTopic = await prisma.topic.findFirst({
        where: { subjectId, slug: cleanSlug },
      });
      if (existingTopic) {
        topicId = existingTopic.id;
      } else {
        const newTopic = await prisma.topic.create({
          data: {
            subjectId,
            name: topicName.trim(),
            slug: cleanSlug,
            isActive: true,
          },
        });
        topicId = newTopic.id;
      }
    }

    const question = await prisma.$transaction(async (tx) => {
      const newQuestion = await tx.question.create({
        data: {
          subjectId,
          topicId,
          currentVersion: 1,
          isActive,
        },
      });

      const version = await tx.questionVersion.create({
        data: {
          questionId: newQuestion.id,
          version: 1,
          questionText: questionText.trim(),
          difficulty: difficulty as any,
          explanation: explanation ? explanation.trim() : null,
          createdBy: admin.id,
          isActive: true,
        },
      });

      await tx.questionOption.createMany({
        data: options.map((opt: any, idx: number) => ({
          questionVersionId: version.id,
          optionKey: opt.optionKey || String.fromCharCode(65 + idx),
          optionText: (opt.optionText || "").trim(),
          isCorrect: !!opt.isCorrect,
          displayOrder: typeof opt.displayOrder === "number" ? opt.displayOrder : idx,
        })),
      });

      return newQuestion;
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "ADMIN_CREATE_QUESTION",
        entityType: "Question",
        entityId: question.id,
        metadata: { subjectId, difficulty },
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, questionId: question.id }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
