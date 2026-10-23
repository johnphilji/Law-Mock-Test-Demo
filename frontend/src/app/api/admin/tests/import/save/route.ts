import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

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

    // Transactional save: creates Exam, Subject, Test, Question, QuestionVersion, and TestQuestion atomically
    // For 100 questions (500+ DB inserts), default 5s Prisma transaction timeout causes "Transaction API error: Transaction already closed" / Internal server error.
    const savedTest = await prisma.$transaction(
      async (tx) => {
        // 1. Find or create the Exam category
        let exam = await tx.exam.findFirst({
          where: {
            OR: [
              { slug: examSlug },
              { name: { equals: examName, mode: "insensitive" } },
            ],
          },
        });

        if (!exam) {
          exam = await tx.exam.create({
            data: {
              name: examName,
              slug: examSlug,
              description: `${examName} Law Entrance Preparation`,
              isActive: true,
            },
          });
        }

        // 2. Find or create default Subject for this Exam
        let defaultSubject = await tx.subject.findFirst({
          where: { examId: exam.id },
        });

        if (!defaultSubject) {
          defaultSubject = await tx.subject.create({
            data: {
              examId: exam.id,
              name: "Law Core",
              slug: "law-core",
              displayOrder: 1,
              isActive: true,
            },
          });
        }

        // 3. Check if a test with the same title already exists in this exam
        const existingTest = await tx.test.findFirst({
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
          // If test exists and already has questions, reuse it without duplicating questions
          if (existingTest._count.questions >= questions.length) {
            await tx.test.update({
              where: { id: existingTest.id },
              data: {
                status: status === "PUBLISHED" ? "PUBLISHED" : existingTest.status,
                publishedAt: status === "PUBLISHED" && !existingTest.publishedAt ? new Date() : existingTest.publishedAt,
                durationMinutes: Number(metadata.durationMinutes) || existingTest.durationMinutes,
                totalMarks: Number(metadata.totalMarks) || existingTest.totalMarks,
                negativeMarking: Number(metadata.negativeMarks) || existingTest.negativeMarking,
              },
            });
            return existingTest;
          }

          // If existing test had 0 attempts, we can clean up old questions and reload
          if (existingTest._count.attempts === 0) {
            await tx.testQuestion.deleteMany({ where: { testId: existingTest.id } });
          }
          test = existingTest;
        } else {
          test = await tx.test.create({
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

        // 4. Create Questions and QuestionVersions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];

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
            questionText: q.questionText || `Question ${i + 1}`,
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
            questionOrder: i + 1,
            marks: Number(metadata.positiveMarks) || 1,
            negativeMarks: Number(metadata.negativeMarks) || 0,
          },
        });
      }

      return test;
    },
    {
      maxWait: 15000, // 15 seconds to acquire connection from pool
      timeout: 60000, // 60 seconds to execute all 100 questions inserts
    });

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
