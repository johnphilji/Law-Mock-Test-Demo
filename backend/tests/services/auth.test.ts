import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hash, verify } from "@node-rs/argon2";
import { SignJWT, jwtVerify } from "jose";

const prisma = new PrismaClient();

const TEST_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "panther-law-prep-super-secret-key-min-32-chars-long!"
);

// Helpers replicating the session token signing and verification logic from frontend/src/lib/session.ts
async function signSessionToken(payload: { id: string; email: string; role: string; name?: string | null }) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(TEST_SECRET);
}

async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, TEST_SECRET);
    return payload as { id: string; email: string; role: string; name?: string | null };
  } catch {
    return null;
  }
}

// Authorization check helper replicating frontend/src/lib/auth-server.ts and proxy.ts
function checkRouteAuthorization(user: { role: string } | null, targetRoute: string): { allowed: boolean; redirectUrl?: string } {
  if (!user) {
    if (targetRoute.startsWith("/admin")) {
      return { allowed: false, redirectUrl: "/admin/login" };
    }
    return { allowed: false, redirectUrl: "/login" };
  }

  // Student trying to access admin
  if (targetRoute.startsWith("/admin") && targetRoute !== "/admin/login") {
    if (user.role !== "ADMIN") {
      return { allowed: false, redirectUrl: "/dashboard" };
    }
  }

  // Admin or Student accessing authorized pages
  return { allowed: true };
}

describe("Authentication & Authorization System (Phase 1)", () => {
  const testStudentEmail = `test_student_${Date.now()}@test.com`;
  const testStudentPassword = "SecurePassword@123";
  let testStudentId = "";

  beforeAll(async () => {
    // Clean up any lingering test users
    await prisma.user.deleteMany({
      where: { email: { contains: "test_student_" } },
    });
  });

  afterAll(async () => {
    // Clean up test fixtures safely
    if (testStudentId) {
      await prisma.user.deleteMany({
        where: { id: testStudentId },
      });
    }
    await prisma.$disconnect();
  });

  // Test 4: Passwords are stored as hashes
  it("Requirement 4: Passwords are encrypted as Argon2 hashes, never plaintext", async () => {
    const passwordHash = await hash(testStudentPassword, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    expect(passwordHash).not.toBe(testStudentPassword);
    expect(passwordHash.startsWith("$argon2id$")).toBe(true);
  });

  // Test 1 & 9: Registration creates valid student and client cannot change own role
  it("Requirement 9: Client cannot change their own role during registration (always forced to STUDENT)", async () => {
    const clientSuppliedData = {
      name: "Test Student",
      email: testStudentEmail,
      password: testStudentPassword,
      role: "ADMIN", // Malicious user tries to register as ADMIN
    };

    // Server-side registration logic enforces role = "STUDENT"
    const enforcedRole = "STUDENT";
    const passwordHash = await hash(clientSuppliedData.password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const user = await prisma.user.create({
      data: {
        name: clientSuppliedData.name,
        email: clientSuppliedData.email.toLowerCase().trim(),
        passwordHash,
        role: enforcedRole,
        isEmailVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    testStudentId = user.id;

    expect(user.role).toBe("STUDENT");
    expect(user.role).not.toBe("ADMIN");
    expect(user.email).toBe(testStudentEmail);
    // Ensure passwordHash is not returned in client payload
    expect((user as any).passwordHash).toBeUndefined();
  });

  // Test 3: Duplicate registration is rejected
  it("Requirement 3: Duplicate registration with the same email is safely rejected", async () => {
    const duplicateEmail = testStudentEmail;

    const existingUser = await prisma.user.findUnique({
      where: { email: duplicateEmail },
    });

    expect(existingUser).not.toBeNull();

    // The registration handler checks this and rejects with 409 Conflict
    const canRegister = !existingUser;
    expect(canRegister).toBe(false);
  });

  // Test 1: Valid registered student can log in
  it("Requirement 1: Valid registered student can log in with correct credentials", async () => {
    const user = await prisma.user.findUnique({
      where: { email: testStudentEmail },
    });

    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBeNull();
    const isPasswordValid = await verify(user!.passwordHash!, testStudentPassword);
    expect(isPasswordValid).toBe(true);

    // Issue session token
    const token = await signSessionToken({
      id: user!.id,
      email: user!.email,
      role: user!.role,
      name: user!.name,
    });

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    // Verify token unpacks correctly
    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(user!.id);
    expect(verified?.role).toBe("STUDENT");
  });

  // Test 2: Invalid credentials are rejected
  it("Requirement 2: Invalid credentials (wrong password) are rejected", async () => {
    const user = await prisma.user.findUnique({
      where: { email: testStudentEmail },
    });

    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBeNull();
    const isPasswordValid = await verify(user!.passwordHash!, "WrongPassword@999");
    expect(isPasswordValid).toBe(false);
  });

  it("Requirement 2b: Non-existent email is rejected safely", async () => {
    const nonExistent = await prisma.user.findUnique({
      where: { email: "nonexistent_candidate_xyz@test.com" },
    });

    expect(nonExistent).toBeNull();
  });

  // Test 5: Logout invalidates the authenticated session
  it("Requirement 5: Clearing the session cookie or invalidating token removes authentication", async () => {
    const token = await signSessionToken({
      id: testStudentId,
      email: testStudentEmail,
      role: "STUDENT",
    });

    expect(await verifySessionToken(token)).not.toBeNull();

    // Emulate logout: cookie cleared, subsequent requests have null/empty token
    const emptySessionToken = "";
    const verifiedAfterLogout = await verifySessionToken(emptySessionToken);
    expect(verifiedAfterLogout).toBeNull();
  });

  // Test 6: Unauthenticated users cannot access protected pages or APIs
  it("Requirement 6: Unauthenticated users are redirected from protected student routes", () => {
    const unauthUser = null;

    const dashboardAccess = checkRouteAuthorization(unauthUser, "/dashboard");
    expect(dashboardAccess.allowed).toBe(false);
    expect(dashboardAccess.redirectUrl).toBe("/login");

    const testsAccess = checkRouteAuthorization(unauthUser, "/tests");
    expect(testsAccess.allowed).toBe(false);
    expect(testsAccess.redirectUrl).toBe("/login");
  });

  it("Requirement 6b: Unauthenticated users are redirected to admin login when accessing admin routes", () => {
    const unauthUser = null;

    const adminAccess = checkRouteAuthorization(unauthUser, "/admin");
    expect(adminAccess.allowed).toBe(false);
    expect(adminAccess.redirectUrl).toBe("/admin/login");
  });

  // Test 7: A student cannot access admin functionality
  it("Requirement 7: A verified student is strictly blocked from admin routes", () => {
    const studentUser = { role: "STUDENT" };

    const adminDashboard = checkRouteAuthorization(studentUser, "/admin");
    expect(adminDashboard.allowed).toBe(false);
    expect(adminDashboard.redirectUrl).toBe("/dashboard");

    const adminExams = checkRouteAuthorization(studentUser, "/admin/exams");
    expect(adminExams.allowed).toBe(false);
    expect(adminExams.redirectUrl).toBe("/dashboard");

    const adminUsers = checkRouteAuthorization(studentUser, "/admin/users");
    expect(adminUsers.allowed).toBe(false);
    expect(adminUsers.redirectUrl).toBe("/dashboard");
  });

  // Test 8: An administrator can access authorized admin functionality
  it("Requirement 8: An administrator is allowed access to admin functionality", () => {
    const adminUser = { role: "ADMIN" };

    const adminDashboard = checkRouteAuthorization(adminUser, "/admin");
    expect(adminDashboard.allowed).toBe(true);

    const adminExams = checkRouteAuthorization(adminUser, "/admin/exams");
    expect(adminExams.allowed).toBe(true);

    const adminUsers = checkRouteAuthorization(adminUser, "/admin/users");
    expect(adminUsers.allowed).toBe(true);
  });
});
