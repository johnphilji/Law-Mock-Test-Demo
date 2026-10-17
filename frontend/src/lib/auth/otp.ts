import crypto from "crypto";
import { prisma } from "@/lib/db/client";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

export interface OtpResult {
  success: boolean;
  message?: string;
  error?: string;
  cooldownRemaining?: number;
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 */
export function generateSixDigitOtp(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Hashes an OTP with SHA-256 before database storage.
 */
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

/**
 * Issue and persist an OTP for email or phone verification.
 * Enforces resend cooldowns and clears previous unconsumed tokens for the target.
 */
export async function createAndSaveOtp(
  identifier: string,
  type: "email" | "phone"
): Promise<{ success: boolean; otp?: string; error?: string; cooldownRemaining?: number }> {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const tokenKey = `${type}:${normalizedIdentifier}`;

  // Check for active token to enforce resend cooldown
  const existing = await prisma.verificationToken.findFirst({
    where: { identifier: tokenKey },
    orderBy: { expires: "desc" },
  });

  const now = new Date();
  if (existing) {
    const elapsedSinceCreation = (OTP_EXPIRY_MINUTES * 60 * 1000) - (existing.expires.getTime() - now.getTime());
    const cooldownRemaining = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - elapsedSinceCreation) / 1000);
    if (cooldownRemaining > 0 && cooldownRemaining <= RESEND_COOLDOWN_SECONDS) {
      return {
        success: false,
        error: `Please wait ${cooldownRemaining} seconds before requesting a new code.`,
        cooldownRemaining,
      };
    }
  }

  // Delete older tokens for this identifier
  await prisma.verificationToken.deleteMany({
    where: { identifier: tokenKey },
  });

  const otp = generateSixDigitOtp();
  const tokenHash = hashOtp(otp);
  const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // VerificationToken has unique token column and compound @@id([identifier, token])
  await prisma.verificationToken.create({
    data: {
      identifier: tokenKey,
      token: tokenHash,
      expires,
    },
  });

  return { success: true, otp };
}

/**
 * Verify a 6-digit OTP against the database record.
 * Deletes token upon successful consumption (one-time use).
 */
export async function verifyOtp(
  identifier: string,
  type: "email" | "phone",
  candidateOtp: string
): Promise<OtpResult> {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const tokenKey = `${type}:${normalizedIdentifier}`;
  const candidateHash = hashOtp(candidateOtp);

  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      identifier: tokenKey,
      token: candidateHash,
    },
  });

  if (!tokenRecord) {
    return {
      success: false,
      error: "Invalid verification code. Please check and re-enter.",
    };
  }

  if (new Date() > tokenRecord.expires) {
    // Delete expired token
    await prisma.verificationToken.deleteMany({
      where: { identifier: tokenKey },
    });
    return {
      success: false,
      error: "Verification code has expired. Please request a new code.",
    };
  }

  // Code is valid: immediately consume the token (single use)
  await prisma.verificationToken.deleteMany({
    where: { identifier: tokenKey },
  });

  return {
    success: true,
    message: "Code verified successfully.",
  };
}
