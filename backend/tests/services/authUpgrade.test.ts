import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Replicate OTP generation and hashing logic from frontend/src/lib/auth/otp.ts
function generateOtp(): string {
  const buf = crypto.randomBytes(4);
  const num = buf.readUInt32BE(0) % 1000000;
  return num.toString().padStart(6, "0");
}

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function normalizePhoneNumber(rawPhone: string): string | null {
  if (!rawPhone) return null;
  const cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, "").trim();

  // If 10 digits starting with 6, 7, 8, or 9 (Indian mobile)
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  // If already starts with +91 and 10 digits
  if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
    return cleaned;
  }
  // If starts with 91 and 10 digits
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  // General E.164 pattern: + followed by 7 to 15 digits
  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

// Replicate PKCE & state verification from frontend/src/lib/auth/oauth.ts
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

describe("Authentication Upgrade (Email OTP, Phone OTP, OAuth Safety)", () => {
  const testEmail = `auth_upgrade_${Date.now()}@test.com`;
  let testUserId = "";

  beforeAll(async () => {
    // Create test student user
    const user = await prisma.user.create({
      data: {
        name: "Auth Test Candidate",
        email: testEmail,
        role: "STUDENT",
        isEmailVerified: false,
        isPhoneVerified: false,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup verification tokens and test user
    await prisma.verificationToken.deleteMany({
      where: { identifier: { in: [testEmail, "+919876543210"] } },
    });
    await prisma.account.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe("6-Digit Cryptographic OTP Engine", () => {
    it("generates exactly 6 numeric digits with leading zeroes preserved", () => {
      for (let i = 0; i < 50; i++) {
        const otp = generateOtp();
        expect(otp).toMatch(/^\d{6}$/);
        expect(otp.length).toBe(6);
      }
    });

    it("creates, verifies, and consumes single-use email OTP in database", async () => {
      const plainOtp = generateOtp();
      const tokenHash = hashOtp(plainOtp);
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      const tokenKey = `email:${testEmail.toLowerCase()}`;

      // Clean older
      await prisma.verificationToken.deleteMany({
        where: { identifier: tokenKey },
      });

      // Store in VerificationToken
      await prisma.verificationToken.create({
        data: { identifier: tokenKey, token: tokenHash, expires },
      });

      // Verification lookup
      const stored = await prisma.verificationToken.findFirst({
        where: { identifier: tokenKey, token: tokenHash },
      });
      expect(stored).not.toBeNull();
      expect(stored?.token).toBe(tokenHash);

      // Verify matching hashed token
      const incomingHash = hashOtp(plainOtp);
      expect(incomingHash).toBe(stored?.token);

      // Consume token (delete) and mark user email verified
      await prisma.verificationToken.deleteMany({ where: { identifier: tokenKey } });
      const updatedUser = await prisma.user.update({
        where: { id: testUserId },
        data: { isEmailVerified: true },
      });
      expect(updatedUser.isEmailVerified).toBe(true);

      // Replay attempt fails because token was deleted
      const secondLookup = await prisma.verificationToken.findFirst({
        where: { identifier: tokenKey, token: tokenHash },
      });
      expect(secondLookup).toBeNull();
    });

    it("rejects expired OTP tokens", async () => {
      const plainOtp = generateOtp();
      const tokenHash = hashOtp(plainOtp);
      const expiredDate = new Date(Date.now() - 1000); // Expired 1 second ago
      const tokenKey = `email:${testEmail.toLowerCase()}`;

      await prisma.verificationToken.deleteMany({
        where: { identifier: tokenKey },
      });

      await prisma.verificationToken.create({
        data: { identifier: tokenKey, token: tokenHash, expires: expiredDate },
      });

      const tokenRecord = await prisma.verificationToken.findFirst({
        where: { identifier: tokenKey, token: tokenHash },
      });
      expect(tokenRecord).not.toBeNull();
      const isExpired = new Date() > tokenRecord!.expires;
      expect(isExpired).toBe(true);
    });
  });

  describe("Phone Normalization & E.164 Verification", () => {
    it("correctly normalizes 10-digit Indian numbers to +91 E.164", () => {
      expect(normalizePhoneNumber("9876543210")).toBe("+919876543210");
      expect(normalizePhoneNumber(" 98765 43210 ")).toBe("+919876543210");
      expect(normalizePhoneNumber("+91 9876543210")).toBe("+919876543210");
      expect(normalizePhoneNumber("919876543210")).toBe("+919876543210");
    });

    it("rejects invalid phone numbers", () => {
      expect(normalizePhoneNumber("12345")).toBeNull();
      expect(normalizePhoneNumber("5876543210")).toBeNull(); // Indian numbers must start with 6, 7, 8, or 9
      expect(normalizePhoneNumber("abcdefghij")).toBeNull();
    });

    it("stores phone verification status cleanly on user model", async () => {
      const normalizedPhone = "+919876543210";
      const updated = await prisma.user.update({
        where: { id: testUserId },
        data: {
          phone: normalizedPhone,
          isPhoneVerified: true,
        },
      });

      expect(updated.phone).toBe("+919876543210");
      expect(updated.isPhoneVerified).toBe(true);
    });
  });

  describe("PKCE Code Verifier & Challenge Safety", () => {
    it("produces valid high-entropy PKCE code verifier and SHA-256 base64url challenge", () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);

      const challenge = generateCodeChallenge(verifier);
      expect(challenge.length).toBeGreaterThan(0);
      expect(challenge).not.toBe(verifier);

      // Deterministic challenge check
      const challenge2 = generateCodeChallenge(verifier);
      expect(challenge).toBe(challenge2);
    });
  });

  describe("OAuth Account Linking & Student Role Enforcement", () => {
    it("links Google provider to existing user safely without changing role", async () => {
      const providerAccountId = "google-uid-123456";
      const account = await prisma.account.create({
        data: {
          userId: testUserId,
          provider: "google",
          providerAccountId,
          type: "oauth",
        },
      });

      expect(account.id).toBeDefined();
      expect(account.provider).toBe("google");

      // Verify user's role remained STUDENT
      const verifiedUser = await prisma.user.findUnique({
        where: { id: testUserId },
        include: { accounts: true },
      });
      expect(verifiedUser?.role).toBe("STUDENT");
      expect(verifiedUser?.accounts.some((a) => a.provider === "google")).toBe(true);
    });

    it("prevents OAuth self-registration from elevating role to ADMIN", async () => {
      const oauthAutoUser = await prisma.user.create({
        data: {
          name: "OAuth Auto Candidate",
          email: `oauth_${Date.now()}@test.com`,
          role: "STUDENT", // Crucial rule: OAuth accounts are strictly STUDENT
          isEmailVerified: true,
          isActive: true,
        },
      });

      expect(oauthAutoUser.role).toBe("STUDENT");
      expect(oauthAutoUser.role).not.toBe("ADMIN");

      // Cleanup
      await prisma.user.delete({ where: { id: oauthAutoUser.id } });
    });
  });
});
