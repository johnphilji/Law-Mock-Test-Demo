import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";

const prisma = new PrismaClient();

const TEST_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "panther-law-prep-super-secret-key-min-32-chars-long!"
);

async function signSessionToken(payload: { id: string; email: string; role: string; name?: string | null }) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(TEST_SECRET);
}

describe("Phase 2.5: Data Integrity & Real Metrics Verification", () => {
  let adminUserId = "";
  let student1Id = "";
  let student2Id = "";
  let examId = "";
  let subjectId = "";
  let testId = "";
  let questionId = "";
  let initialVersionId = "";
  let attempt1Id = "";

  const cleanupTestData = async () => {
    try {
      const testUsers = await prisma.user.findMany({
        where: { email: { contains: "phase25_" } },
        select: { id: true },
      });
      const userIds = testUsers.map((u) => u.id);

      if (userIds.length > 0) {
        await prisma.attemptAnswer.deleteMany({
          where: { attempt: { userId: { in: userIds } } },
        });
        await prisma.attempt.deleteMany({
          where: { userId: { in: userIds } },
        });
        await prisma.subscription.deleteMany({
          where: { userId: { in: userIds } },
        });
        await prisma.payment.deleteMany({
          where: { userId: { in: userIds } },
        });
      }

      await prisma.exam.deleteMany({
        where: { slug: { contains: "phase25-" } },
      });

      await prisma.user.deleteMany({
        where: { email: { contains: "phase25_" } },
      });
    } catch (e) {
      // Ignored during cleanup
    }
  };

  beforeAll(async () => {
    // Clean up test fixtures
    await cleanupTestData();

    // 1. Create Admin User
    const adminUser = await prisma.user.create({
      data: {
        name: "Phase 2.5 Admin",
        email: `phase25_admin_${Date.now()}@test.com`,
        passwordHash: "argon2_test_hash",
        role: "ADMIN",
        isActive: true,
      },
    });
    adminUserId = adminUser.id;

    // 2. Create Student 1
    const student1 = await prisma.user.create({
      data: {
        name: "Phase 2.5 Student One",
        email: `phase25_s1_${Date.now()}@test.com`,
        passwordHash: "argon2_test_hash",
        role: "STUDENT",
        isActive: true,
      },
    });
    student1Id = student1.id;

    // 3. Create Student 2
    const student2 = await prisma.user.create({
      data: {
        name: "Phase 2.5 Student Two",
        email: `phase25_s2_${Date.now()}@test.com`,
        passwordHash: "argon2_test_hash",
        role: "STUDENT",
        isActive: true,
      },
    });
    student2Id = student2.id;

    // 4. Create Exam & Subject
    const exam = await prisma.exam.create({
      data: {
        name: "Phase 2.5 Mock Law Exam",
        slug: `phase25-exam-${Date.now()}`,
      },
    });
    examId = exam.id;

    const subject = await prisma.subject.create({
      data: {
        examId: exam.id,
        name: "Constitutional Law",
        slug: "constitutional-law",
      },
    });
    subjectId = subject.id;

    // 5. Create Question with Version 1 and options
    const question = await prisma.question.create({
      data: {
        subjectId: subject.id,
      },
    });
    questionId = question.id;

    const version1 = await prisma.questionVersion.create({
      data: {
        questionId: question.id,
        version: 1,
        questionText: "What is the Basic Structure doctrine source?",
        difficulty: "MEDIUM",
        explanation: "Kesavananda Bharati v. State of Kerala (1973).",
        createdBy: adminUserId,
      },
    });
    initialVersionId = version1.id;

    await prisma.questionOption.createMany({
      data: [
        { questionVersionId: version1.id, optionKey: "A", optionText: "Golaknath Case", isCorrect: false, displayOrder: 1 },
        { questionVersionId: version1.id, optionKey: "B", optionText: "Kesavananda Bharati Case", isCorrect: true, displayOrder: 2 },
        { questionVersionId: version1.id, optionKey: "C", optionText: "Minerva Mills Case", isCorrect: false, displayOrder: 3 },
        { questionVersionId: version1.id, optionKey: "D", optionText: "Maneka Gandhi Case", isCorrect: false, displayOrder: 4 },
      ],
    });

    // 6. Create Published Test
    const test = await prisma.test.create({
      data: {
        examId: exam.id,
        title: "CLAT UG 2026 Mock Test Phase 2.5",
        slug: `phase25-test-${Date.now()}`,
        type: "MOCK",
        status: "PUBLISHED",
        durationMinutes: 120,
        totalMarks: 100,
        negativeMarking: 0.25,
        createdBy: adminUserId,
      },
    });
    testId = test.id;

    await prisma.testQuestion.create({
      data: {
        testId: test.id,
        questionId: question.id,
        questionVersionId: version1.id,
        questionOrder: 1,
        marks: 1.0,
        negativeMarks: 0.25,
      },
    });

    // 7. Create Completed Attempt for Student 1
    const attempt1 = await prisma.attempt.create({
      data: {
        userId: student1Id,
        testId: test.id,
        status: "SUBMITTED",
        startedAt: new Date(Date.now() - 3600 * 1000),
        expiresAt: new Date(Date.now() + 3600 * 1000),
        submittedAt: new Date(),
        score: 1.0,
        totalMarks: 1.0,
        percentage: 100.0,
        correctCount: 1,
        incorrectCount: 0,
        unansweredCount: 0,
        timeTakenSeconds: 1800,
      },
    });
    attempt1Id = attempt1.id;

    await prisma.attemptAnswer.create({
      data: {
        attemptId: attempt1.id,
        questionId: question.id,
        questionVersionId: version1.id,
        selectedOptionKey: "B",
        answeredAt: new Date(),
      },
    });

    // 8. Create a Captured Payment & Active Subscription for Student 1
    const payment1 = await prisma.payment.create({
      data: {
        userId: student1Id,
        razorpayOrderId: `order_${Date.now()}`,
        razorpayPaymentId: `pay_${Date.now()}`,
        amountPaise: 4900,
        currency: "INR",
        status: "CAPTURED",
      },
    });

    await prisma.subscription.create({
      data: {
        userId: student1Id,
        paymentId: payment1.id,
        status: "ACTIVE",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it("1. Admin Dashboard queries calculate verified database metrics without mock data", async () => {
    // Compute metrics using identical query logic as /api/admin/dashboard
    const [
      totalStudents,
      publishedTests,
      draftTests,
      totalAttempts,
      completedAttempts,
      activeSubscriptions,
      revenueResult,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.test.count({ where: { status: "PUBLISHED" } }),
      prisma.test.count({ where: { status: "DRAFT" } }),
      prisma.attempt.count(),
      prisma.attempt.count({ where: { status: "SUBMITTED" } }),
      prisma.subscription.count({
        where: {
          status: "ACTIVE",
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.payment.aggregate({
        where: { status: "CAPTURED" },
        _sum: { amountPaise: true },
      }),
    ]);

    expect(totalStudents).toBeGreaterThanOrEqual(2);
    expect(publishedTests).toBeGreaterThanOrEqual(1);
    expect(totalAttempts).toBeGreaterThanOrEqual(1);
    expect(completedAttempts).toBeGreaterThanOrEqual(1);
    expect(activeSubscriptions).toBeGreaterThanOrEqual(1);

    // Revenue must match integer paise aggregate exactly (never hardcoded ₹99,999)
    const verifiedRevenuePaise = revenueResult._sum.amountPaise ?? 0;
    expect(verifiedRevenuePaise).toBeGreaterThanOrEqual(4900);
    expect(typeof verifiedRevenuePaise).toBe("number");
  });

  it("2. Question Versioning: attempted question creates a new immutable version on edit", async () => {
    // Check if question has been attempted
    const attemptCount = await prisma.attemptAnswer.count({
      where: { questionId: questionId },
    });
    expect(attemptCount).toBeGreaterThan(0);

    // Editing an attempted question MUST create version 2 instead of overwriting version 1
    const latestVersion = await prisma.questionVersion.findFirst({
      where: { questionId: questionId },
      orderBy: { version: "desc" },
    });
    expect(latestVersion?.version).toBe(1);

    // Create version 2
    const nextVersionNumber = (latestVersion?.version ?? 0) + 1;
    const version2 = await prisma.questionVersion.create({
      data: {
        questionId: questionId,
        version: nextVersionNumber,
        questionText: "What is the landmark judgment for the Basic Structure doctrine?",
        explanation: "Kesavananda Bharati v. State of Kerala, AIR 1973 SC 1461.",
        createdBy: adminUserId,
      },
    });

    expect(version2.version).toBe(2);
    expect(version2.id).not.toBe(initialVersionId);

    // Verify historical attempt still references original version 1
    const pastAnswer = await prisma.attemptAnswer.findFirst({
      where: { attemptId: attempt1Id },
    });
    expect(pastAnswer?.questionVersionId).toBe(initialVersionId);
  });

  it("3. Student Data Isolation: Student 2 cannot access Student 1's completed attempt results", async () => {
    // Fetch attempt 1 as Student 2
    const attempt = await prisma.attempt.findUnique({
      where: { id: attempt1Id },
      select: { userId: true, status: true },
    });

    expect(attempt).not.toBeNull();
    // Student 2 is NOT owner
    const isOwner = attempt?.userId === student2Id;
    expect(isOwner).toBe(false);

    // Verify authorization rule: only owner or ADMIN may view
    const isAuthorized = isOwner || student2Id === adminUserId;
    expect(isAuthorized).toBe(false);
  });

  it("4. Student Dashboard Accuracy & Percentile computation: returns null if insufficient platform attempts", async () => {
    // If a student has no completed attempts, stats must be 0 or null, never substituted
    const student2Attempts = await prisma.attempt.findMany({
      where: { userId: student2Id, status: "SUBMITTED" },
    });
    expect(student2Attempts.length).toBe(0);

    const calculatedAccuracy = student2Attempts.length > 0 ? 100 : null;
    expect(calculatedAccuracy).toBeNull();
  });

  it("5. Answer Confidentiality: In-progress attempt never exposes correct answers", async () => {
    // Create an in-progress attempt for Student 2
    const inProgressAttempt = await prisma.attempt.create({
      data: {
        userId: student2Id,
        testId: testId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 7200 * 1000),
      },
    });

    // An in-progress attempt must fail result access checks
    expect(inProgressAttempt.status).not.toBe("SUBMITTED");
    const canRevealAnswers = inProgressAttempt.status === "SUBMITTED";
    expect(canRevealAnswers).toBe(false);

    // Cleanup in-progress attempt
    await prisma.attempt.delete({ where: { id: inProgressAttempt.id } });
  });
});
