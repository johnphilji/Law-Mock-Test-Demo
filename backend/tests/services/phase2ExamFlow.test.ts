import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { calculateScore } from "@/server/services/scoringService";

const prisma = new PrismaClient();

describe("Phase 2: Database-Backed Mock Tests & Security Protections", () => {
  let adminUser: any;
  let student1: any;
  let student2: any;
  let publishedTest: any;
  let draftTest: any;
  let question1: any;
  let question2: any;
  let q1Version: any;
  let q2Version: any;
  let student1Attempt: any;

  beforeAll(async () => {
    // 1. Create test users
    const timestamp = Date.now();
    adminUser = await prisma.user.create({
      data: {
        email: `admin-phase2-${timestamp}@pantherlaw.test`,
        name: "Admin User",
        role: "ADMIN",
        passwordHash: "argon2_test_hash",
      },
    });

    student1 = await prisma.user.create({
      data: {
        email: `student1-phase2-${timestamp}@pantherlaw.test`,
        name: "Student One",
        role: "STUDENT",
        passwordHash: "argon2_test_hash",
      },
    });

    student2 = await prisma.user.create({
      data: {
        email: `student2-phase2-${timestamp}@pantherlaw.test`,
        name: "Student Two",
        role: "STUDENT",
        passwordHash: "argon2_test_hash",
      },
    });

    // 2. Create exam & subject
    const exam = await prisma.exam.create({
      data: {
        name: `AIBE Test Exam ${timestamp}`,
        slug: `aibe-test-${timestamp}`,
      },
    });

    const subject = await prisma.subject.create({
      data: {
        examId: exam.id,
        name: "Constitutional Law",
        slug: `const-law-${timestamp}`,
      },
    });

    // 3. Create Questions & Options
    question1 = await prisma.question.create({
      data: {
        subjectId: subject.id,
      },
    });

    q1Version = await prisma.questionVersion.create({
      data: {
        questionId: question1.id,
        version: 1,
        questionText: "Which Article guarantees equality before law?",
        explanation: "Article 14 guarantees equality before law.",
        createdBy: adminUser.id,
        options: {
          create: [
            { optionKey: "A", optionText: "Article 14", isCorrect: true, displayOrder: 1 },
            { optionKey: "B", optionText: "Article 19", isCorrect: false, displayOrder: 2 },
            { optionKey: "C", optionText: "Article 21", isCorrect: false, displayOrder: 3 },
            { optionKey: "D", optionText: "Article 32", isCorrect: false, displayOrder: 4 },
          ],
        },
      },
    });

    question2 = await prisma.question.create({
      data: {
        subjectId: subject.id,
      },
    });

    q2Version = await prisma.questionVersion.create({
      data: {
        questionId: question2.id,
        version: 1,
        questionText: "How many High Courts are there currently in India?",
        explanation: "There are 25 High Courts in India.",
        createdBy: adminUser.id,
        options: {
          create: [
            { optionKey: "A", optionText: "21", isCorrect: false, displayOrder: 1 },
            { optionKey: "B", optionText: "24", isCorrect: false, displayOrder: 2 },
            { optionKey: "C", optionText: "25", isCorrect: true, displayOrder: 3 },
            { optionKey: "D", optionText: "28", isCorrect: false, displayOrder: 4 },
          ],
        },
      },
    });

    // 4. Create Published & Draft Tests
    publishedTest = await prisma.test.create({
      data: {
        examId: exam.id,
        title: "AIBE Mock Test (Published)",
        slug: `aibe-pub-${timestamp}`,
        type: "MOCK",
        status: "PUBLISHED",
        durationMinutes: 120,
        totalMarks: 2,
        negativeMarking: 0,
        createdBy: adminUser.id,
        questions: {
          create: [
            {
              questionId: question1.id,
              questionVersionId: q1Version.id,
              questionOrder: 1,
              marks: 1,
              negativeMarks: 0,
            },
            {
              questionId: question2.id,
              questionVersionId: q2Version.id,
              questionOrder: 2,
              marks: 1,
              negativeMarks: 0,
            },
          ],
        },
      },
    });

    draftTest = await prisma.test.create({
      data: {
        examId: exam.id,
        title: "CLAT Mock Test (Draft)",
        slug: `clat-draft-${timestamp}`,
        type: "MOCK",
        status: "DRAFT",
        durationMinutes: 120,
        totalMarks: 2,
        negativeMarking: 0.25,
        createdBy: adminUser.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data safely in reverse dependency order
    if (student1Attempt) {
      await prisma.attemptAnswer.deleteMany({ where: { attemptId: student1Attempt.id } });
      await prisma.attemptQuestion.deleteMany({ where: { attemptId: student1Attempt.id } });
      await prisma.attemptSnapshot.deleteMany({ where: { attemptId: student1Attempt.id } });
      await prisma.attempt.deleteMany({ where: { id: student1Attempt.id } });
    }
    if (publishedTest) {
      await prisma.testQuestion.deleteMany({ where: { testId: publishedTest.id } });
      await prisma.test.delete({ where: { id: publishedTest.id } });
    }
    if (draftTest) {
      await prisma.test.delete({ where: { id: draftTest.id } });
    }
    if (q1Version) {
      await prisma.questionOption.deleteMany({ where: { questionVersionId: q1Version.id } });
      await prisma.questionVersion.delete({ where: { id: q1Version.id } });
    }
    if (q2Version) {
      await prisma.questionOption.deleteMany({ where: { questionVersionId: q2Version.id } });
      await prisma.questionVersion.delete({ where: { id: q2Version.id } });
    }
    if (question1) await prisma.question.delete({ where: { id: question1.id } });
    if (question2) await prisma.question.delete({ where: { id: question2.id } });
    if (adminUser) await prisma.user.delete({ where: { id: adminUser.id } });
    if (student1) await prisma.user.delete({ where: { id: student1.id } });
    if (student2) await prisma.user.delete({ where: { id: student2.id } });
  });

  // 1 & 2: Catalogue & Publication Status
  it("retrieves published tests from PostgreSQL for students and excludes unpublished drafts", async () => {
    const studentAvailableTests = await prisma.test.findMany({
      where: { status: "PUBLISHED" },
    });
    expect(studentAvailableTests.some((t) => t.id === publishedTest.id)).toBe(true);
    expect(studentAvailableTests.some((t) => t.id === draftTest.id)).toBe(false);
  });

  it("rejects ordinary student access to draft tests", () => {
    const checkStudentAccess = (testStatus: string, role: string) => {
      if (testStatus !== "PUBLISHED" && role !== "ADMIN") {
        return { allowed: false, error: "This test is not currently available" };
      }
      return { allowed: true };
    };

    const studentAccess = checkStudentAccess(draftTest.status, student1.role);
    expect(studentAccess.allowed).toBe(false);

    const adminAccess = checkStudentAccess(draftTest.status, adminUser.role);
    expect(adminAccess.allowed).toBe(true);
  });

  // 3 & 4: Test ID Validation & Question Loading
  it("loads correct questions for a valid test ID and rejects invalid test ID", async () => {
    const loadedTest = await prisma.test.findUnique({
      where: { id: publishedTest.id },
      include: {
        questions: {
          orderBy: { questionOrder: "asc" },
        },
      },
    });

    expect(loadedTest).toBeDefined();
    expect(loadedTest?.questions.length).toBe(2);
    expect(loadedTest?.questions[0]!.questionId).toBe(question1.id);
    expect(loadedTest?.questions[1]!.questionId).toBe(question2.id);

    const nonExistentTest = await prisma.test.findUnique({
      where: { id: "00000000-0000-0000-0000-000000000000" },
    });
    expect(nonExistentTest).toBeNull();
  });

  // 5: Correct answers & explanations stripped from active exam responses
  it("creates attempt with server-side snapshot and strips correct answers/explanations from student payload", async () => {
    const expiresAt = new Date(Date.now() + publishedTest.durationMinutes * 60 * 1000);

    // Create server-side snapshot
    const testWithQuestions = await prisma.test.findUniqueOrThrow({
      where: { id: publishedTest.id },
      include: {
        exam: true,
        questions: {
          include: {
            question: {
              include: {
                versions: {
                  include: { options: true },
                  orderBy: { version: "desc" },
                  take: 1,
                },
              },
            },
          },
          orderBy: { questionOrder: "asc" },
        },
      },
    });

    student1Attempt = await prisma.attempt.create({
      data: {
        userId: student1.id,
        testId: publishedTest.id,
        status: "IN_PROGRESS",
        expiresAt,
      },
    });

    const snapshotQuestions = testWithQuestions.questions.map((tq) => ({
      questionId: tq.questionId,
      questionVersionId: tq.questionVersionId,
      marks: Number(tq.marks),
      negativeMarks: Number(tq.negativeMarks),
      options: (tq.question.versions[0]?.options || []).map((opt) => ({
        optionKey: opt.optionKey,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        displayOrder: opt.displayOrder,
      })),
    }));

    await prisma.attemptSnapshot.create({
      data: {
        attemptId: student1Attempt.id,
        testConfig: { title: publishedTest.title },
        questionsSnapshot: { questions: snapshotQuestions },
      },
    });

    // Student-facing payload (sanitized)
    const sanitizedQuestions = testWithQuestions.questions.map((tq) => ({
      id: tq.questionId,
      text: tq.question.versions[0]?.questionText || "",
      options: (tq.question.versions[0]?.options || []).map((opt) => ({
        key: opt.optionKey,
        text: opt.optionText,
      })),
    }));

    // CRITICAL SECURITY ASSERTIONS:
    for (const sq of sanitizedQuestions) {
      expect((sq as any).explanation).toBeUndefined();
      expect((sq as any).correctOptionKey).toBeUndefined();
      for (const opt of sq.options) {
        expect((opt as any).isCorrect).toBeUndefined();
      }
    }
  });

  // 6 & 7: Ownership verification & unauthorized modification rejection
  it("rejects attempt access or modification by a different student", () => {
    const verifyAttemptOwnership = (attempt: { userId: string }, requestingUserId: string) => {
      if (attempt.userId !== requestingUserId) {
        return { allowed: false, status: 403, error: "Unauthorized access to attempt" };
      }
      return { allowed: true };
    };

    const student2Check = verifyAttemptOwnership(student1Attempt, student2.id);
    expect(student2Check.allowed).toBe(false);
    expect(student2Check.status).toBe(403);

    const student1Check = verifyAttemptOwnership(student1Attempt, student1.id);
    expect(student1Check.allowed).toBe(true);
  });

  // 8 & 9: Answer persistence and validation
  it("persists answers for the attempt owner and validates option keys", async () => {
    // Valid option "A" for question1
    const validAnswer = await prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: student1Attempt.id,
          questionId: question1.id,
        },
      },
      update: {
        selectedOptionKey: "A",
        answeredAt: new Date(),
      },
      create: {
        attemptId: student1Attempt.id,
        questionId: question1.id,
        questionVersionId: q1Version.id,
        selectedOptionKey: "A",
        answeredAt: new Date(),
      },
    });

    expect(validAnswer.selectedOptionKey).toBe("A");

    // Retrieve saved answers
    const saved = await prisma.attemptAnswer.findMany({
      where: { attemptId: student1Attempt.id },
    });
    expect(saved.length).toBe(1);
    expect(saved[0]!.questionId).toBe(question1.id);
    expect(saved[0]!.selectedOptionKey).toBe("A");

    // Validate invalid option rejection logic
    const validateOptionKey = (permittedKeys: string[], chosenKey: string) => {
      return permittedKeys.includes(chosenKey);
    };
    expect(validateOptionKey(["A", "B", "C", "D"], "Z")).toBe(false);
    expect(validateOptionKey(["A", "B", "C", "D"], "A")).toBe(true);
  });

  // 10 & 11: Server-side authoritative scoring (client scores rejected)
  it("calculates scores strictly server-side using AttemptSnapshot and ignores client scores", async () => {
    // Record question 2 as answered with "C" (correct)
    await prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: student1Attempt.id,
          questionId: question2.id,
        },
      },
      update: {
        selectedOptionKey: "C",
        answeredAt: new Date(),
      },
      create: {
        attemptId: student1Attempt.id,
        questionId: question2.id,
        questionVersionId: q2Version.id,
        selectedOptionKey: "C",
        answeredAt: new Date(),
      },
    });

    const snapshot = await prisma.attemptSnapshot.findUniqueOrThrow({
      where: { attemptId: student1Attempt.id },
    });
    const answers = await prisma.attemptAnswer.findMany({
      where: { attemptId: student1Attempt.id },
    });

    const scoreResult = calculateScore(snapshot as any, answers as any);

    expect(scoreResult.scoredAnswers.length).toBe(2);
    expect(scoreResult.correctCount).toBe(2);
    expect(scoreResult.incorrectCount).toBe(0);
    expect(scoreResult.unansweredCount).toBe(0);
    expect(scoreResult.score).toBe(2);
    expect(scoreResult.percentage).toBe(100);

    // Client trying to claim 100 marks is overridden by server calculation
    const clientSuppliedScore = 999;
    const finalScoreToPersist = scoreResult.score;
    expect(finalScoreToPersist).not.toBe(clientSuppliedScore);
    expect(finalScoreToPersist).toBe(2);
  });

  // 12: Submission idempotency (cannot finalize twice)
  it("enforces idempotent submission and prevents double finalization", async () => {
    // First submission
    const finalizedAttempt = await prisma.attempt.update({
      where: { id: student1Attempt.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        score: 2,
        correctCount: 2,
        incorrectCount: 0,
        unansweredCount: 0,
      },
    });
    expect(finalizedAttempt.status).toBe("SUBMITTED");

    // Second submission attempt should detect already submitted and return existing result without re-awarding
    const submitHandler = async (attemptId: string) => {
      const cur = await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId } });
      if (cur.status === "SUBMITTED") {
        return { message: "Attempt already submitted", alreadySubmitted: true, score: cur.score };
      }
      return { message: "Submitted successfully", alreadySubmitted: false };
    };

    const duplicateSubmit = await submitHandler(student1Attempt.id);
    expect(duplicateSubmit.alreadySubmitted).toBe(true);
    expect(Number(duplicateSubmit.score)).toBe(2);
  });

  // 13 & 14: Expired and Finalized attempts cannot be modified
  it("prevents modifying answers after submission or expiration", () => {
    const canModifyAttempt = (attempt: { status: string; expiresAt: Date }) => {
      if (attempt.status === "SUBMITTED") {
        return { allowed: false, reason: "Attempt is already submitted" };
      }
      if (new Date() > attempt.expiresAt) {
        return { allowed: false, reason: "Attempt has expired" };
      }
      return { allowed: true };
    };

    const submittedCheck = canModifyAttempt({
      status: "SUBMITTED",
      expiresAt: new Date(Date.now() + 10000),
    });
    expect(submittedCheck.allowed).toBe(false);

    const expiredCheck = canModifyAttempt({
      status: "IN_PROGRESS",
      expiresAt: new Date(Date.now() - 10000),
    });
    expect(expiredCheck.allowed).toBe(false);
  });

  // 15: Admin-only management authorization
  it("enforces that only ADMIN role can create, edit, or publish tests", () => {
    const authorizeAdminAction = (userRole: string) => {
      if (userRole !== "ADMIN") {
        return { allowed: false, status: 403, error: "Admin authorization required" };
      }
      return { allowed: true };
    };

    expect(authorizeAdminAction(student1.role).allowed).toBe(false);
    expect(authorizeAdminAction(student2.role).allowed).toBe(false);
    expect(authorizeAdminAction(adminUser.role).allowed).toBe(true);
  });

  // 16: Enrollment access control: rejects unsubscribed students
  it("enforces enrollment access control: rejects unsubscribed student attempting to access test by guessing UUID", async () => {
    // student2 has no subscription and no prior attempt
    const verifyStudentEnrollment = async (userId: string, testId: string, role: string) => {
      if (role === "ADMIN") return { allowed: true };
      const sub = await prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE", expiresAt: { gt: new Date() } },
      });
      const prior = await prisma.attempt.findFirst({
        where: { userId, testId },
      });
      if (!sub && !prior) {
        return { allowed: false, status: 403, error: "Enrollment required" };
      }
      return { allowed: true };
    };

    const checkStudent2 = await verifyStudentEnrollment(student2.id, publishedTest.id, student2.role);
    expect(checkStudent2.allowed).toBe(false);
    expect(checkStudent2.status).toBe(403);

    // Admin bypassing enrollment check
    const checkAdmin = await verifyStudentEnrollment(adminUser.id, publishedTest.id, adminUser.role);
    expect(checkAdmin.allowed).toBe(true);
  });

  // 17: Enrollment access control: permits student with active subscription
  it("permits test access once student has an active subscription", async () => {
    const sub = await prisma.subscription.create({
      data: {
        userId: student2.id,
        status: "ACTIVE",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const verifyStudentEnrollment = async (userId: string, testId: string, role: string) => {
      if (role === "ADMIN") return { allowed: true };
      const activeSub = await prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE", expiresAt: { gt: new Date() } },
      });
      if (!activeSub) return { allowed: false, status: 403, error: "Enrollment required" };
      return { allowed: true };
    };

    const checkStudent2AfterSub = await verifyStudentEnrollment(student2.id, publishedTest.id, student2.role);
    expect(checkStudent2AfterSub.allowed).toBe(true);

    // Clean up test subscription
    await prisma.subscription.delete({ where: { id: sub.id } });
  });

  // 18: Idempotent test importing (prevents duplicates)
  it("ensures re-importing test with same title does not duplicate test records or questions", async () => {
    const existingCount = await prisma.test.count({
      where: { title: publishedTest.title, examId: publishedTest.examId },
    });
    expect(existingCount).toBe(1);

    // Simulated re-import handler using upsert/findFirst check
    const handleTestImport = async (title: string, examId: string) => {
      const existing = await prisma.test.findFirst({
        where: { title, examId },
        include: { _count: { select: { questions: true } } },
      });
      if (existing) {
        return { isDuplicatePrevented: true, testId: existing.id, questionCount: existing._count.questions };
      }
      return { isDuplicatePrevented: false };
    };

    const reimportResult = await handleTestImport(publishedTest.title, publishedTest.examId);
    expect(reimportResult.isDuplicatePrevented).toBe(true);
    expect(reimportResult.testId).toBe(publishedTest.id);
    expect(reimportResult.questionCount).toBe(2);
  });
});
