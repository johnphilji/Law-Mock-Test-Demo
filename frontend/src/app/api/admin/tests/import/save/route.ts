import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

// Allow Vercel Serverless Function up to 60 seconds (Hobby limit is max available)
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { metadata, questions, status = "DRAFT" } = body;

    if (!metadata || !metadata.title) {
      return NextResponse.json({ error: "Exam metadata and title are required" }, { status: 400 });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "At least one question is required to create a mock test" }, { status: 400 });
    }

    // Generate unique slug for test
    const baseSlug = metadata.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Generate unique slug for exam
    const examName = metadata.examType || "Law Entrance";
    const examSlug = examName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "law-entrance";

    // 1. Find or create Exam category outside transaction
    let exam = await prisma.exam.findFirst({
      where: {
        OR: [
          { slug: examSlug },
          { name: { equals: examName, mode: "insensitive" } },
        ],
      },
    });

    if (!exam) {
      exam = await prisma.exam.create({
        data: {
          name: examName,
          slug: examSlug,
          description: `${examName} Law Entrance Preparation`,
          isActive: true,
        },
      });
    }

    // 2. Find or create default Subject for this Exam
    let defaultSubject = await prisma.subject.findFirst({
      where: { examId: exam.id },
    });

    if (!defaultSubject) {
      defaultSubject = await prisma.subject.create({
        data: {
          examId: exam.id,
          name: "Law Core",
          slug: "law-core",
          displayOrder: 1,
          isActive: true,
        },
      });
    }

    // 3. Find or create Test
    const existingTest = await prisma.test.findFirst({
      where: {
        examId: exam.id,
        title: { equals: metadata.title, mode: "insensitive" },
      },
      include: {
        _count: { select: { attempts: true, questions: true } },
      },
    });

    let test;
    if (existingTest) {
      if (existingTest._count.questions >= questions.length) {
        await prisma.test.update({
          where: { id: existingTest.id },
          data: {
            status: status === "PUBLISHED" ? "PUBLISHED" : existingTest.status,
            publishedAt: status === "PUBLISHED" && !existingTest.publishedAt ? new Date() : existingTest.publishedAt,
            durationMinutes: Number(metadata.durationMinutes) || existingTest.durationMinutes,
            totalMarks: Number(metadata.totalMarks) || existingTest.totalMarks,
            negativeMarking: Number(metadata.negativeMarks) || existingTest.negativeMarking,
          },
        });
        return NextResponse.json({
          success: true,
          testId: existingTest.id,
          slug: existingTest.slug,
          title: existingTest.title,
          status: existingTest.status,
          questionCount: existingTest._count.questions,
        });
      }

      if (existingTest._count.attempts === 0) {
        await prisma.testQuestion.deleteMany({ where: { testId: existingTest.id } });
      }
      test = existingTest;
    } else {
      test = await prisma.test.create({
        data: {
          examId: exam.id,
          title: metadata.title,
          slug,
          description: `Comprehensive ${examName} Mock Test containing ${questions.length} questions.`,
          instructions: metadata.instructions?.join("\n") || "Standard Computer-Based Test (CBT) examination rules apply.",
          type: "MOCK",
          status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
          publishedAt: status === "PUBLISHED" ? new Date() : null,
          durationMinutes: Number(metadata.durationMinutes) || 120,
          totalMarks: Number(metadata.totalMarks) || questions.length,
          negativeMarking: Number(metadata.negativeMarks) || 0,
          createdBy: admin.id,
        },
      });
    }

    // 4. Batch question creation in fast chunks of 10 to minimize connection holding time
    const CHUNK_SIZE = 10;
    for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
      const chunk = questions.slice(i, i + CHUNK_SIZE);

      await prisma.$transaction(
        async (tx) => {
          for (let j = 0; j < chunk.length; j++) {
            const qIdx = i + j;
            const q = chunk[j];

            const seenKeys = new Set<string>();
            const rawOptions = (q.options || []).map((opt: any, optIdx: number) => {
              let key = (opt.key || String.fromCharCode(65 + optIdx)).trim().toUpperCase();
              if (!key || seenKeys.has(key)) {
                key = String.fromCharCode(65 + optIdx);
              }
              seenKeys.add(key);

              return {
                optionKey: key,
                optionText: opt.text || "",
                isCorrect: opt.isCorrect ?? (opt.key === q.correctOptionKey || key === q.correctOptionKey),
                displayOrder: optIdx + 1,
              };
            });

            const question = await tx.question.create({
              data: {
                subjectId: defaultSubject.id,
                currentVersion: 1,
                isActive: true,
              },
            });

            const questionVersion = await tx.questionVersion.create({
              data: {
                questionId: question.id,
                version: 1,
                questionText: q.questionText || `Question ${qIdx + 1}`,
                explanation: q.explanation || "",
                questionType: "SINGLE_CHOICE",
                difficulty: "MEDIUM",
                isActive: true,
                createdBy: admin.id,
                options: {
                  create: rawOptions,
                },
              },
            });

            await tx.testQuestion.create({
              data: {
                testId: test.id,
                questionId: question.id,
                questionVersionId: questionVersion.id,
                questionOrder: qIdx + 1,
                marks: Number(metadata.positiveMarks) || 1,
                negativeMarks: Number(metadata.negativeMarks) || 0,
              },
            });
          }
        },
        {
          maxWait: 10000,
          timeout: 25000,
        }
      );
    }

    return NextResponse.json({
      success: true,
      testId: savedTest.id,
      slug: savedTest.slug,
      title: savedTest.title,
      status: savedTest.status,
      questionCount: questions.length,
    });
  } catch (error: any) {
    console.error("Transactional test import save failed:", error);
    if (error?.name === "AuthError") {
      return handleAuthError(error);
    }
    return NextResponse.json(
      { error: error?.message || "Failed to save mock test into database" },
      { status: 500 }
    );
  }
}
