import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ testId: string }> }
) {
  try {
    const user = await requireAuth();
    const { testId } = await context.params;

    // 1. Verify test exists and is published (or allow admin to preview)
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        exam: true,
        questions: {
          include: {
            question: {
              include: {
                versions: {
                  orderBy: { version: "desc" },
                  take: 1,
                  include: {
                    options: {
                      orderBy: { displayOrder: "asc" },
                    },
                  },
                },
                subject: true,
              },
            },
          },
          orderBy: { questionOrder: "asc" },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (test.status !== "PUBLISHED" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "This test is not currently available" }, { status: 403 });
    }

    if (!test.questions || test.questions.length === 0) {
      return NextResponse.json({ error: "This test has no questions yet" }, { status: 400 });
    }

    const now = new Date();

    // 2. Access control: Enforce active enrollment or subscription for students
    if (user.role !== "ADMIN") {
      const activeSubscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          status: "ACTIVE",
          expiresAt: { gt: now },
        },
      });

      // Also check if user has an existing attempt (e.g. granted free or prior attempt)
      const priorAttempt = await prisma.attempt.findFirst({
        where: {
          userId: user.id,
          testId: test.id,
        },
      });

      if (!activeSubscription && !priorAttempt) {
        return NextResponse.json(
          { error: "Enrollment required. You must enroll or subscribe to access this mock test." },
          { status: 403 }
        );
      }
    }

    // 3. Check if student already has an active (unexpired) attempt for this test
    const existingAttempt = await prisma.attempt.findFirst({
      where: {
        userId: user.id,
        testId: test.id,
        status: "IN_PROGRESS",
        expiresAt: { gt: now },
      },
      include: {
        snapshot: true,
        answers: true,
      },
    });

    let attempt = existingAttempt;

    // 3. If no active attempt, create a new one with snapshot
    if (!attempt) {
      const durationMs = test.durationMinutes * 60 * 1000;
      const expiresAt = new Date(now.getTime() + durationMs);

      // Build questions snapshot (which stores correct answers safely server-side)
      const snapshotQuestions = test.questions.map((tq) => {
        const v = tq.question.versions[0];
        const opts = v?.options || [];
        return {
          questionId: tq.question.id,
          questionVersionId: v ? v.id : "",
          marks: Number(tq.marks),
          negativeMarks: Number(tq.negativeMarks),
          options: opts.map((opt) => ({
            optionKey: opt.optionKey,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            displayOrder: opt.displayOrder,
          })),
        };
      });

      const testConfig = {
        testId: test.id,
        title: test.title,
        durationMinutes: test.durationMinutes,
        totalMarks: Number(test.totalMarks),
        negativeMarking: Number(test.negativeMarking),
        examName: test.exam.name,
      };

      attempt = await prisma.$transaction(async (tx) => {
        const newAttempt = await tx.attempt.create({
          data: {
            userId: user.id,
            testId: test.id,
            status: "IN_PROGRESS",
            startedAt: now,
            expiresAt,
          },
        });

        await tx.attemptSnapshot.create({
          data: {
            attemptId: newAttempt.id,
            testConfig,
            questionsSnapshot: { questions: snapshotQuestions },
          },
        });

        // Create attempt question linkages
        await tx.attemptQuestion.createMany({
          data: test.questions.map((tq, idx) => ({
            attemptId: newAttempt.id,
            questionId: tq.question.id,
            questionVersionId: tq.question.versions[0]?.id || "",
            displayOrder: tq.questionOrder || idx + 1,
          })),
        });

        return tx.attempt.findUnique({
          where: { id: newAttempt.id },
          include: {
            snapshot: true,
            answers: true,
          },
        });
      });
    }

    if (!attempt) {
      return NextResponse.json({ error: "Failed to initialize exam attempt" }, { status: 500 });
    }

    // 4. SANITIZE questions before sending to client:
    // Strips correct answers, explanations, and internal IDs
    const sanitizedQuestions = test.questions.map((tq, idx) => {
      const v = tq.question.versions[0];
      const opts = v?.options || [];
      return {
        id: tq.question.id,
        order: tq.questionOrder || idx + 1,
        subject: tq.question.subject?.name || "General",
        text: v?.questionText || "",
        marks: Number(tq.marks),
        negativeMarks: Number(tq.negativeMarks),
        options: opts.map((opt) => ({
          key: opt.optionKey,
          text: opt.optionText,
        })),
      };
    });

    // Map existing answers if resuming
    const savedAnswers: Record<string, string> = {};
    if (attempt.answers) {
      for (const ans of attempt.answers) {
        if (ans.selectedOptionKey) {
          savedAnswers[ans.questionId] = ans.selectedOptionKey;
        }
      }
    }

    const remainingSeconds = Math.max(0, Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000));

    return NextResponse.json({
      attemptId: attempt.id,
      testTitle: test.title,
      examName: test.exam.name,
      durationMinutes: test.durationMinutes,
      expiresAt: attempt.expiresAt.toISOString(),
      remainingSeconds,
      questions: sanitizedQuestions,
      savedAnswers,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
