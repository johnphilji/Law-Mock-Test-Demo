import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        subject: true,
        topic: true,
        versions: {
          orderBy: { version: "asc" },
          include: {
            options: { orderBy: { displayOrder: "asc" } },
            _count: { select: { attemptAnswers: true } },
          },
        },
        _count: {
          select: { testQuestions: true, attemptAnswers: true },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const formatted = {
      id: question.id,
      subjectId: question.subjectId,
      subjectName: question.subject?.name ?? "General",
      topicName: question.topic?.name ?? null,
      currentVersion: question.currentVersion,
      isActive: question.isActive,
      usedInTests: question._count.testQuestions,
      usedInAttempts: question._count.attemptAnswers,
      createdAt: question.createdAt.toISOString(),
      versions: question.versions.map((v) => ({
        id: v.id,
        version: v.version,
        questionText: v.questionText,
        difficulty: v.difficulty,
        explanation: v.explanation,
        usedInAttempts: v._count.attemptAnswers,
        options: v.options.map((o) => ({
          id: o.id,
          optionKey: o.optionKey,
          optionText: o.optionText,
          isCorrect: o.isCorrect,
          displayOrder: o.displayOrder,
        })),
      })),
    };

    return NextResponse.json({ question: formatted });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = await req.json();
    const {
      subjectId,
      difficulty = "MEDIUM",
      questionText,
      explanation,
      options,
      isActive = true,
    } = body;

    const existing = await prisma.question.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: "desc" }, take: 1 },
        _count: { select: { attemptAnswers: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const hasAttempts = existing._count.attemptAnswers > 0;

    await prisma.$transaction(async (tx) => {
      if (hasAttempts) {
        // Exam integrity: Question was attempted! Create a new immutable QuestionVersion.
        const nextVersion = existing.currentVersion + 1;

        await tx.question.update({
          where: { id },
          data: {
            currentVersion: nextVersion,
            subjectId: subjectId || existing.subjectId,
            isActive,
          },
        });

        const newVersion = await tx.questionVersion.create({
          data: {
            questionId: id,
            version: nextVersion,
            questionText: questionText.trim(),
            difficulty: difficulty as any,
            explanation: explanation ? explanation.trim() : null,
            createdBy: admin.id,
            isActive: true,
          },
        });

        if (Array.isArray(options) && options.length >= 2) {
          await tx.questionOption.createMany({
            data: options.map((opt: any, idx: number) => ({
              questionVersionId: newVersion.id,
              optionKey: opt.optionKey || String.fromCharCode(65 + idx),
              optionText: (opt.optionText || "").trim(),
              isCorrect: !!opt.isCorrect,
              displayOrder: typeof opt.displayOrder === "number" ? opt.displayOrder : idx,
            })),
          });
        }
      } else {
        // No attempts yet: safe to update current version in-place
        await tx.question.update({
          where: { id },
          data: {
            subjectId: subjectId || existing.subjectId,
            isActive,
          },
        });

        const latestVersion = existing.versions[0];
        if (latestVersion) {
          await tx.questionVersion.update({
            where: { id: latestVersion.id },
            data: {
              questionText: questionText.trim(),
              difficulty: difficulty as any,
              explanation: explanation ? explanation.trim() : null,
            },
          });

          if (Array.isArray(options) && options.length >= 2) {
            // Delete old options and recreate
            await tx.questionOption.deleteMany({
              where: { questionVersionId: latestVersion.id },
            });

            await tx.questionOption.createMany({
              data: options.map((opt: any, idx: number) => ({
                questionVersionId: latestVersion.id,
                optionKey: opt.optionKey || String.fromCharCode(65 + idx),
                optionText: (opt.optionText || "").trim(),
                isCorrect: !!opt.isCorrect,
                displayOrder: typeof opt.displayOrder === "number" ? opt.displayOrder : idx,
              })),
            });
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: hasAttempts ? "ADMIN_VERSION_QUESTION" : "ADMIN_UPDATE_QUESTION",
        entityType: "Question",
        entityId: id,
        metadata: { newVersionCreated: hasAttempts },
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, questionId: id });
  } catch (error) {
    return handleAuthError(error);
  }
}
